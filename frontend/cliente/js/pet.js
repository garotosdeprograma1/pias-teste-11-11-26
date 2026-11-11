/* ====================================================================
   DaFix — Módulo Pet / Streak
   - Carrega estado via /api/pet
   - Renderiza abas (missões, loja, inventário, ranking)
   - Delega ações: check-in, alimentar, comprar, equipar, desequipar
   ==================================================================== */
(() => {
  'use strict';

  const account = window.DafixAccount;
  const session = account && account.readSession();
  if (!session || session.perfil !== 'cliente') return;

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  const state = {
    pet: null,
    equipados: [],
    inventario: [],
    missoes: [],
    loja: [],
    ranking: [],
    aba: 'missoes',
    carregado: false,
  };

  const DATA = window.DafixData;

  // ---------- Helpers de render ----------
  function paintField(name, value) {
    $$(`[data-pet-field="${name}"]`).forEach(el => { el.textContent = value; });
  }

  function paintBar(name, value, max = 100) {
    $$(`[data-pet-bar="${name}"]`).forEach(el => {
      el.style.width = Math.max(0, Math.min(100, (value / max) * 100)) + '%';
    });
  }

  function paintEquipamentos() {
    const alvo = $('[data-pet-equip]');
    if (!alvo) return;
    alvo.innerHTML = '';
    state.equipados.forEach(item => {
      const el = document.createElement('div');
      el.className = `pet-equip-${item.slot}`;
      el.textContent = item.nome;
      el.title = item.descricao || item.nome;
      alvo.appendChild(el);
    });
  }

  function renderEstado() {
    if (!state.pet) return;
    const p = state.pet;
    paintField('nome', p.nome);
    paintField('nivel', p.nivel);
    paintField('xp', p.xp);
    paintField('xpMax', p.xpParaProximoNivel);
    paintField('fome', p.fome);
    paintField('felicidade', p.felicidade);
    paintField('streak_atual', p.streak_atual);
    paintField('moedas', p.moedas);
    paintBar('xp', p.xp, p.xpParaProximoNivel);
    paintBar('fome', p.fome);
    paintBar('felicidade', p.felicidade);
    paintEquipamentos();
  }

  function renderMissoes() {
    const alvo = $('[data-pet-panel="missoes"]');
    if (!alvo) return;
    if (!state.missoes.length) {
      alvo.innerHTML = '<p class="data-empty">Nenhuma missão disponível.</p>';
      return;
    }
    alvo.innerHTML = state.missoes.map(m => {
      const feita = m.concluida;
      const bloqueada = m.bloqueada;
      const premium = m.tipo === 'premium';
      return `
        <div class="pet-mission ${premium ? 'pet-mission--premium' : ''} ${feita ? 'pet-mission--done' : ''}">
          <div class="pet-mission__body">
            <div class="pet-mission__title">
              ${escape(m.nome)}
              ${premium ? '<span class="pet-mission__tag">PREMIUM</span>' : ''}
            </div>
            <p class="pet-mission__desc">${escape(m.descricao || '')}</p>
            <div class="pet-mission__rewards">
              <span>🪙 <strong>${m.recompensa_moedas}</strong></span>
              <span>✨ <strong>${m.recompensa_xp}</strong> XP</span>
              ${m.comida_item_slug ? '<span>🍖 <strong>1</strong> item</span>' : ''}
            </div>
          </div>
          <button class="btn btn--sm ${feita ? 'btn--ghost' : 'btn--primary'}"
                  data-pet-missao="${escape(m.slug)}"
                  ${feita || bloqueada ? 'disabled' : ''}>
            ${feita ? 'Concluída' : bloqueada ? 'Bloqueada' : 'Concluir'}
          </button>
        </div>
      `;
    }).join('');
  }

  function renderLoja() {
    const alvo = $('[data-pet-panel="loja"]');
    if (!alvo) return;
    if (!state.loja.length) {
      alvo.innerHTML = '<p class="data-empty">Loja vazia.</p>';
      return;
    }
    alvo.innerHTML = `<div class="pet-shop-grid">${state.loja.map(item => `
      <div class="pet-shop-item ${item.bloqueado ? 'pet-shop-item--locked' : ''}">
        <div class="pet-shop-item__rarity pet-shop-item__rarity--${item.raridade}">${item.raridade}</div>
        <div class="pet-shop-item__name">${escape(item.nome)}</div>
        <div class="pet-shop-item__desc">${escape(item.descricao || '')}</div>
        <div class="pet-shop-item__footer">
          <span class="pet-shop-item__price">🪙 ${item.preco_moedas}</span>
          <button class="btn btn--sm btn--primary"
                  data-pet-comprar="${item.id}"
                  ${item.bloqueado ? 'disabled' : ''}>
            ${item.bloqueado ? 'Premium' : 'Comprar'}
          </button>
        </div>
      </div>
    `).join('')}</div>`;
  }

  function renderInventario() {
    const alvo = $('[data-pet-panel="inventario"]');
    if (!alvo) return;
    if (!state.inventario.length) {
      alvo.innerHTML = '<p class="data-empty">Seu inventário está vazio. Visite o Pet Shop!</p>';
      return;
    }
    alvo.innerHTML = `<div class="pet-inv-list">${state.inventario.map(item => {
      const equipado = state.equipados.find(e => e.id === item.id);
      const slot = item.tipo === 'comida' ? null : (item.tipo === 'roupa' ? 'roupa' : 'acessorio');
      return `
        <div class="pet-inv-item">
          <div class="pet-inv-item__body">
            <div class="pet-inv-item__name">${escape(item.nome)}</div>
            <div class="pet-inv-item__qtd">
              ${item.tipo === 'comida' ? `Quantidade: ${item.quantidade}` : `Tipo: ${item.tipo}`}
            </div>
          </div>
          ${equipado ? '<span class="pet-inv-item__slot">Equipado</span>' : ''}
          ${slot ? `
            <button class="btn btn--sm ${equipado ? 'btn--ghost' : 'btn--primary'}"
                    data-pet-${equipado ? 'desequipar' : 'equipar'}="${equipado ? slot : item.id}">
              ${equipado ? 'Remover' : 'Equipar'}
            </button>
          ` : ''}
        </div>
      `;
    }).join('')}</div>`;
  }

  function renderRanking() {
    const alvo = $('[data-pet-panel="ranking"]');
    if (!alvo) return;
    if (!state.ranking.length) {
      alvo.innerHTML = '<p class="data-empty">Nenhum pet no ranking ainda.</p>';
      return;
    }
    alvo.innerHTML = `<div class="pet-rank-list">${state.ranking.map((row, i) => `
      <div class="pet-rank-row">
        <span class="pet-rank-row__pos pet-rank-row__pos--${i + 1}">${i + 1}</span>
        <div class="pet-rank-row__name">
          ${escape(row.pet_nome)}
          <span class="pet-rank-row__meta"> · ${escape(row.dono || '')}</span>
        </div>
        <div class="pet-rank-row__stats">
          <span>Nv. <strong>${row.nivel}</strong></span>
          <span>🔥 <strong>${row.streak_atual}</strong></span>
        </div>
      </div>
    `).join('')}</div>`;
  }

  function escape(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  // ---------- Ações ----------
  async function carregarTudo() {
    try {
      const [estado, loja, ranking] = await Promise.all([
        DATA.request('/api/pet'),
        DATA.request('/api/pet/loja'),
        DATA.request('/api/pet/ranking'),
      ]);
      state.pet = estado.pet;
      state.equipados = estado.equipados;
      state.inventario = estado.inventario;
      state.missoes = estado.missoes;
      state.loja = loja.itens;
      state.ranking = ranking.ranking;
      state.carregado = true;
      renderEstado();
      renderMissoes();
      renderLoja();
      renderInventario();
      renderRanking();
    } catch (error) {
      const hint = $('[data-pet-hint]');
      if (hint) hint.textContent = error.message;
    }
  }

  async function executarAcao(url, body, mensagemOk) {
    const hint = $('[data-pet-hint]');
    try {
      const result = await DATA.request(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (hint) hint.textContent = mensagemOk || 'Feito!';
      await carregarTudo();
      return result;
    } catch (error) {
      if (hint) hint.textContent = error.message;
    }
  }

  // ---------- Event delegation ----------
  document.addEventListener('click', async (event) => {
    const alvo = document.getElementById('view-pet');
    if (!alvo || !alvo.classList.contains('is-active')) return;

    const checkin = event.target.closest('[data-pet-action="checkin"]');
    if (checkin) { await executarAcao('/api/pet/checkin', null, 'Check-in feito!'); return; }

    const alimentar = event.target.closest('[data-pet-action="alimentar"]');
    if (alimentar) { await executarAcao('/api/pet/alimentar', null, 'Pet alimentado!'); return; }

    const missaoBtn = event.target.closest('[data-pet-missao]');
    if (missaoBtn) {
      await executarAcao('/api/pet/missoes/concluir', { slug: missaoBtn.dataset.petMissao }, 'Missão concluída!');
      return;
    }

    const comprar = event.target.closest('[data-pet-comprar]');
    if (comprar) {
      await executarAcao('/api/pet/comprar', { item_id: Number(comprar.dataset.petComprar) }, 'Compra realizada!');
      return;
    }

    const equipar = event.target.closest('[data-pet-equipar]');
    if (equipar) {
      await executarAcao('/api/pet/equipar', { item_id: Number(equipar.dataset.petEquipar) }, 'Item equipado!');
      return;
    }

    const desequipar = event.target.closest('[data-pet-desequipar]');
    if (desequipar) {
      await executarAcao('/api/pet/desequipar', { slot: desequipar.dataset.petDesequipar }, 'Item removido.');
      return;
    }

    const aba = event.target.closest('[data-pet-tab]');
    if (aba) {
      state.aba = aba.dataset.petTab;
      $$('[data-pet-tab]').forEach(b => {
        const ativo = b.dataset.petTab === state.aba;
        b.classList.toggle('is-active', ativo);
        b.setAttribute('aria-selected', String(ativo));
      });
      $$('[data-pet-panel]').forEach(p => {
        p.classList.toggle('is-active', p.dataset.petPanel === state.aba);
      });
      return;
    }
  });

  // ---------- Ciclo de vida ----------
  function observarView() {
    const alvo = document.getElementById('view-pet');
    if (!alvo) return;
    const observer = new MutationObserver(() => {
      if (alvo.classList.contains('is-active')) {
        if (!state.carregado) carregarTudo();
        else renderEstado();
      }
    });
    observer.observe(alvo, { attributes: true, attributeFilter: ['class'] });
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!$('#view-pet')) return;
    observarView();
    // Se a view já estiver ativa no carregamento (deep link), dispara.
    const alvo = document.getElementById('view-pet');
    if (alvo && alvo.classList.contains('is-active')) carregarTudo();
  });
})();