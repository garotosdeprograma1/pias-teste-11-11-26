'use strict';

const modifiers = require('./modifiers');

const ADMIN_ROLE = 'admin';
const PREMIUM_PLAN = 'premium';
const STREAK_PROTECT_MIN = 3; // dias de streak mínimos para o congelamento valer
const DECAY_PONTOS_POR_HORA = 2;

// ---------- Helpers puros ----------
function xpParaProximoNivel(nivel) {
  return Math.floor(100 * Math.pow(nivel, 1.5));
}

function hojeSP() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

function ontemSP() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

function clamp(valor, min, max) {
  return Math.min(max, Math.max(min, Number(valor) || 0));
}

function aplicarXp(pet, xpGanho, bonusXp = 1) {
  const ganho = Math.round(xpGanho * bonusXp);
  let nivel = pet.nivel;
  let xp = pet.xp + ganho;
  let subiu = false;
  while (xp >= xpParaProximoNivel(nivel)) {
    xp -= xpParaProximoNivel(nivel);
    nivel += 1;
    subiu = true;
  }
  return { nivel, xp, subiu, ganho };
}

function calcularDecaimento(pet, contexto, agora = Date.now()) {
  const ultima = new Date(pet.ultima_atualizacao).getTime();
  if (!Number.isFinite(ultima)) return 0;
  const horas = Math.max(0, (agora - ultima) / (1000 * 60 * 60));
  const pontos = horas * DECAY_PONTOS_POR_HORA * contexto.decaimento_fome;
  return Math.floor(pontos);
}

function isPremium(perfil, conta) {
  if (perfil === ADMIN_ROLE) return true;
  return !!conta && conta.plano === PREMIUM_PLAN;
}

function comidaInfinita(perfil) {
  return perfil === ADMIN_ROLE;
}

// ---------- Registro de regras (Strategy no domínio) ----------
const REGRAS_ALIMENTAR = Object.freeze({
  comum:    { xp: 10, fome: 20, felicidade: 0 },
  rara:     { xp: 25, fome: 40, felicidade: 5 },
  lendaria: { xp: 50, fome: 100, felicidade: 20 },
});

function aplicarRefeicao(pet, contexto, itemDef) {
  const base = REGRAS_ALIMENTAR[itemDef.raridade] || REGRAS_ALIMENTAR.comum;
  const xpBonus = Number(itemDef.xp_bonus) || 0;
  const fomeExtra = Number(itemDef.fome_reducao) || 0;
  const felicidadeExtra = Number(itemDef.felicidade_bonus) || 0;

  const xpResult = aplicarXp(pet, base.xp + xpBonus, contexto.bonus_xp);

  return {
    nivel:      xpResult.nivel,
    xp:         xpResult.xp,
    subiuNivel: xpResult.subiu,
    xpGanho:    xpResult.ganho,
    fome:       clamp(pet.fome - base.fome - fomeExtra, 0, 100),
    felicidade: clamp(pet.felicidade + base.felicidade + felicidadeExtra, 0, 100),
  };
}

function aplicarCheckin(pet, hoje, ontem) {
  if (pet.ultimo_checkin === hoje) {
    return { alterado: false, motivo: 'ja_hoje', streak: pet.streak_atual };
  }
  let streak;
  let congelamentoUsado = false;
  if (pet.ultimo_checkin === ontem) {
    streak = pet.streak_atual + 1;
  } else if (pet.congelamentos > 0 && pet.ultimo_checkin && pet.streak_atual >= STREAK_PROTECT_MIN) {
    // Congelamento preserva o streak: consome 1 e mantém (não zera, não aumenta).
    streak = pet.streak_atual;
    congelamentoUsado = true;
  } else {
    streak = 1;
  }
  return { alterado: true, streak, congelamentoUsado };
}

// ---------- Orquestração com I/O ----------
function promisify(db) {
  return {
    get: (sql, params = []) => new Promise((res, rej) => db.get(sql, params, (e, r) => e ? rej(e) : res(r))),
    all: (sql, params = []) => new Promise((res, rej) => db.all(sql, params, (e, r) => e ? rej(e) : res(r))),
    run: (sql, params = []) => new Promise((res, rej) => db.run(sql, params, function (e) { e ? rej(e) : res({ lastID: this.lastID, changes: this.changes }); })),
  };
}

/**
 * Carrega (ou cria) o pet do usuário e aplica decaimento pendente.
 * Retorna o estado consolidado + itens equipados + contexto modificado.
 */
async function carregarPetCompleto(db, session) {
  const p = promisify(db);
  const { perfil, usuario } = session;

  let pet = await p.get(
    'SELECT * FROM pet WHERE user_perfil = ? AND user_id = ?',
    [perfil, usuario.id]
  );
  if (!pet) {
    const agora = new Date().toISOString();
    await p.run(
      `INSERT INTO pet (user_perfil, user_id, nome, ultima_atualizacao, criado_em)
       VALUES (?, ?, ?, ?, ?)`,
      [perfil, usuario.id, 'Bichinho', agora, agora]
    );
    pet = await p.get(
      'SELECT * FROM pet WHERE user_perfil = ? AND user_id = ?',
      [perfil, usuario.id]
    );
  }

  const equipados = await p.all(
    `SELECT e.slot, i.* FROM pet_equipado e
     JOIN pet_item_def i ON i.id = e.item_id
     WHERE e.pet_id = ?`,
    [pet.id]
  );

  const contexto = modifiers.aplicarEquipamentos(modifiers.contextoBase(), equipados);

  // Decaimento baseado no tempo desde a última atualização
  const perdaFome = calcularDecaimento(pet, contexto);
  let fomeAtualizada = pet.fome;
  let felicidadeAtualizada = pet.felicidade;
  if (perdaFome > 0) {
    fomeAtualizada = clamp(pet.fome - perdaFome, 0, 100);
    // Fome alta (>80) reduz felicidade passivamente
    const felicidadePendente = Math.floor(perdaFome / 4);
    felicidadeAtualizada = clamp(pet.felicidade - felicidadePendente, 0, 100);
  }

  const agoraISO = new Date().toISOString();
  if (perdaFome > 0 || pet.fome !== fomeAtualizada || pet.felicidade !== felicidadeAtualizada) {
    await p.run(
      'UPDATE pet SET fome = ?, felicidade = ?, ultima_atualizacao = ? WHERE id = ?',
      [fomeAtualizada, felicidadeAtualizada, agoraISO, pet.id]
    );
    pet.fome = fomeAtualizada;
    pet.felicidade = felicidadeAtualizada;
    pet.ultima_atualizacao = agoraISO;
  }

  return { pet, equipados, contexto, promisify: p };
}

async function alimentar(db, session, itemId) {
  const { pet, contexto, promisify: p } = await carregarPetCompleto(db, session);

  const item = itemId
    ? await p.get('SELECT * FROM pet_item_def WHERE id = ? AND tipo = ?', [itemId, 'comida'])
    : await p.get("SELECT * FROM pet_item_def WHERE slug = 'racao_comum'");

  if (!item) throw Object.assign(new Error('Comida não encontrada.'), { status: 404 });

  const ehAdmin = comidaInfinita(session.perfil);

  if (!ehAdmin) {
    const inv = await p.get(
      'SELECT quantidade FROM pet_inventario WHERE pet_id = ? AND item_id = ?',
      [pet.id, item.id]
    );
    if (!inv || inv.quantidade <= 0) {
      throw Object.assign(new Error('Você não tem esse item no inventário.'), { status: 409 });
    }
    await p.run(
      'UPDATE pet_inventario SET quantidade = quantidade - 1 WHERE pet_id = ? AND item_id = ?',
      [pet.id, item.id]
    );
    await p.run(
      'DELETE FROM pet_inventario WHERE pet_id = ? AND item_id = ? AND quantidade <= 0',
      [pet.id, item.id]
    );
  }

  const aplicado = aplicarRefeicao(pet, contexto, item);
  await p.run(
    `UPDATE pet SET nivel = ?, xp = ?, fome = ?, felicidade = ?, ultima_atualizacao = ?
     WHERE id = ?`,
    [aplicado.nivel, aplicado.xp, aplicado.fome, aplicado.felicidade, new Date().toISOString(), pet.id]
  );

  return {
    pet: { ...pet, nivel: aplicado.nivel, xp: aplicado.xp, fome: aplicado.fome, felicidade: aplicado.felicidade },
    efeito: {
      xpGanho: aplicado.xpGanho,
      subiuNivel: aplicado.subiuNivel,
      comidaInfinita: ehAdmin,
      itemUsado: item.nome,
    },
  };
}

async function checkin(db, session) {
  const { pet, promisify: p } = await carregarPetCompleto(db, session);
  const hoje = hojeSP();
  const ontem = ontemSP();

  const resultado = aplicarCheckin(pet, hoje, ontem);
  if (!resultado.alterado) {
    return { jaFeito: true, pet, motivo: resultado.motivo };
  }

  const record = Math.max(pet.streak_record, resultado.streak);
  const agoraISO = new Date().toISOString();
  const congelamentosRestantes = resultado.congelamentoUsado
    ? pet.congelamentos - 1
    : pet.congelamentos;

  await p.run(
    `UPDATE pet SET streak_atual = ?, streak_record = ?, ultimo_checkin = ?, 
      congelamentos = ?, ultima_atualizacao = ? WHERE id = ?`,
    [resultado.streak, record, hoje, congelamentosRestantes, agoraISO, pet.id]
  );

  return {
    jaFeito: false,
    pet: {
      ...pet,
      streak_atual: resultado.streak,
      streak_record: record,
      ultimo_checkin: hoje,
      congelamentos: congelamentosRestantes,
      ultima_atualizacao: agoraISO,
    },
    congelamentoUsado: resultado.congelamentoUsado,
  };
}

module.exports = {
  ADMIN_ROLE,
  PREMIUM_PLAN,
  xpParaProximoNivel,
  hojeSP,
  ontemSP,
  isPremium,
  comidaInfinita,
  contextoBase: modifiers.contextoBase,
  carregarPetCompleto,
  alimentar,
  checkin,
  aplicarRefeicao,
  aplicarCheckin,
  calcularDecaimento,
};