'use strict';

const ITENS = [
  // ---------- Comidas ----------
  {
    slug: 'racao_comum', tipo: 'comida', nome: 'Ração Comum',
    descricao: 'Alimenta o pet e concede XP básico.', raridade: 'comum',
    preco_moedas: 10, premium_only: 0, xp_bonus: 0, fome_reducao: 0, felicidade_bonus: 0,
    sprite: 'racao_comum', efeito_json: null,
  },
  {
    slug: 'racao_rara', tipo: 'comida', nome: 'Ração Rara',
    descricao: 'Refeição premium. Mais XP e felicidade.', raridade: 'rara',
    preco_moedas: 40, premium_only: 1, xp_bonus: 10, fome_reducao: 10, felicidade_bonus: 5,
    sprite: 'racao_rara', efeito_json: null,
  },
  {
    slug: 'racao_lendaria', tipo: 'comida', nome: 'Ração Lendária',
    descricao: 'Banquete completo. Recupera toda a fome.', raridade: 'lendaria',
    preco_moedas: 120, premium_only: 1, xp_bonus: 30, fome_reducao: 40, felicidade_bonus: 20,
    sprite: 'racao_lendaria', efeito_json: null,
  },
  // ---------- Roupas / Acessórios ----------
  {
    slug: 'pijama_confortavel', tipo: 'roupa', nome: 'Pijama Confortável',
    descricao: 'Reduz pela metade o ritmo de decaimento da fome.', raridade: 'comum',
    preco_moedas: 80, premium_only: 0, sprite: 'pijama',
    efeito_json: JSON.stringify({
      decaimento_fome: { operacao: 'multiplicar', valor: 0.5 },
    }),
  },
  {
    slug: 'roupa_detetive', tipo: 'roupa', nome: 'Roupa de Detetive',
    descricao: '+10% de chance de encontrar comida rara ao concluir tarefas.', raridade: 'rara',
    preco_moedas: 150, premium_only: 0, sprite: 'detetive',
    efeito_json: JSON.stringify({
      chance_comida_rara: { operacao: 'somar', valor: 0.10 },
    }),
  },
  {
    slug: 'uniforme_premium', tipo: 'roupa', nome: 'Uniforme de Funcionário Premium',
    descricao: 'Concede +50% de XP para o seu pet.', raridade: 'rara',
    preco_moedas: 200, premium_only: 1, sprite: 'uniforme_premium',
    efeito_json: JSON.stringify({
      bonus_xp: { operacao: 'multiplicar', valor: 1.5 },
    }),
  },
  {
    slug: 'oculos_estilosos', tipo: 'acessorio', nome: 'Óculos Estilosos',
    descricao: '+10% de moedas nas missões.', raridade: 'rara',
    preco_moedas: 120, premium_only: 1, sprite: 'oculos',
    efeito_json: JSON.stringify({
      bonus_moedas: { operacao: 'multiplicar', valor: 1.1 },
    }),
  },
  {
    slug: 'coroa_lendaria', tipo: 'acessorio', nome: 'Coroa Lendária',
    descricao: 'Item de prestígio. Não tem efeito mecânico.', raridade: 'lendaria',
    preco_moedas: 500, premium_only: 1, sprite: 'coroa', efeito_json: null,
  },
];

const MISSOES = [
  {
    slug: 'checkin_diario', nome: 'Check-in diário',
    descricao: 'Faça check-in hoje para manter o streak.',
    tipo: 'diaria', recompensa_moedas: 20, recompensa_xp: 10, comida_item_slug: 'racao_comum',
  },
  {
    slug: 'alimentar_pet', nome: 'Alimente seu pet',
    descricao: 'Dê uma refeição ao seu pet hoje.',
    tipo: 'diaria', recompensa_moedas: 5, recompensa_xp: 5, comida_item_slug: null,
  },
  {
    slug: 'concluir_pedido', nome: 'Conclua um pedido',
    descricao: 'Tenha um pedido marcado como concluído hoje.',
    tipo: 'diaria', recompensa_moedas: 30, recompensa_xp: 15, comida_item_slug: 'racao_comum',
  },
  {
    slug: 'premium_uniforme', nome: 'Missão Premium: Elegância Corporativa',
    descricao: 'Recompensa exclusiva para assinantes premium.',
    tipo: 'premium', recompensa_moedas: 100, recompensa_xp: 50, comida_item_slug: 'racao_rara',
  },
];

async function run(db) {
  const insertOrIgnore = (sql, params) => new Promise((resolve, reject) => {
    db.run(sql, params, error => error ? reject(error) : resolve());
  });

  for (const item of ITENS) {
    await insertOrIgnore(
      `INSERT OR IGNORE INTO pet_item_def
        (slug, tipo, nome, descricao, raridade, preco_moedas, premium_only, efeito_json,
         xp_bonus, fome_reducao, felicidade_bonus, sprite)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [item.slug, item.tipo, item.nome, item.descricao, item.raridade,
       item.preco_moedas, item.premium_only, item.efeito_json,
       item.xp_bonus || 0, item.fome_reducao || 0, item.felicidade_bonus || 0, item.sprite || null]
    );
  }
  for (const missao of MISSOES) {
    await insertOrIgnore(
      `INSERT OR IGNORE INTO pet_missao_def
        (slug, nome, descricao, tipo, recompensa_comida, recompensa_moedas,
         recompensa_xp, comida_item_slug)
       VALUES (?, ?, ?, ?, 0, ?, ?, ?)`,
      [missao.slug, missao.nome, missao.descricao, missao.tipo,
       missao.recompensa_moedas, missao.recompensa_xp, missao.comida_item_slug]
    );
  }
}

module.exports = { run, ITENS, MISSOES };