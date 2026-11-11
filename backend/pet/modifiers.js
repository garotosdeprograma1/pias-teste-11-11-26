'use strict';

/**
 * Estratégias de modificação de atributos.
 * Cada operação recebe o valor corrente e o objeto do modificador
 * e devolve o novo valor, permitindo composição arbitrária.
 */
const OPERACOES = Object.freeze({
  multiplicar: (valor, mod) => valor * Number(mod.valor),
  somar:       (valor, mod) => valor + Number(mod.valor),
  definir:     (_valor, mod) => Number(mod.valor),
  limitar:     (valor, mod) => {
    const [min, max] = Array.isArray(mod.intervalo) ? mod.intervalo : [mod.min, mod.max];
    return Math.min(Number(max), Math.max(Number(min), valor));
  },
});

/**
 * Converte um JSON de efeito em uma função pura contexto → contexto.
 * Exemplo de `efeito_json`:
 *   {
 *     "decaimento_fome":    { "operacao": "multiplicar", "valor": 0.5 },
 *     "chance_comida_rara": { "operacao": "somar",       "valor": 0.10 }
 *   }
 */
function compilarEfeito(efeitoJson) {
  if (!efeitoJson) return () => {};
  let efeito;
  try { efeito = typeof efeitoJson === 'string' ? JSON.parse(efeitoJson) : efeitoJson; }
  catch { return () => {}; }
  if (!efeito || typeof efeito !== 'object') return () => {};

  const entradas = Object.entries(efeito)
    .map(([atributo, mod]) => {
      const operacao = mod && OPERACOES[mod.operacao];
      if (!operacao || !mod) return null;
      return { atributo, operacao, mod };
    })
    .filter(Boolean);

  return (contexto) => {
    const next = { ...contexto };
    for (const { atributo, operacao, mod } of entradas) {
      const atual = Number(next[atributo]);
      next[atributo] = operacao(Number.isFinite(atual) ? atual : 0, mod);
    }
    return next;
  };
}

/**
 * Contexto base. Todo atributo modificável nasce com um valor padrão
 * para que modificadores possam incidir sobre ele com segurança.
 */
function contextoBase() {
  return Object.freeze({
    decaimento_fome:    1.0,  // multiplicador sobre a taxa base (2/h)
    chance_comida_rara: 0.05, // 5% base
    bonus_xp:           1.0,  // multiplicador sobre XP recebido
    bonus_moedas:       1.0,  // multiplicador sobre moedas de missão
  });
}

/**
 * Aplica, em ordem, os efeitos de todos os itens equipados.
 * Retorna um novo contexto imutável.
 */
function aplicarEquipamentos(contexto, itensEquipados) {
  if (!Array.isArray(itensEquipados)) return contexto;
  return itensEquipados.reduce(
    (acc, item) => compilarEfeito(item && item.efeito_json)(acc),
    contexto
  );
}

module.exports = { OPERACOES, compilarEfeito, contextoBase, aplicarEquipamentos };