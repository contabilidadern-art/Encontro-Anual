// Faixas de referência para o semáforo dos cards de indicador. A chave
// "default" é o segmento genérico usado hoje. Quando o cruzamento com a
// classificação CNAE (já usada em outras partes do projeto, ver
// src/cnaeMap.js) existir, cada grupo CNAE ganha sua própria chave aqui —
// TODO, não implementado ainda — sem precisar mudar a assinatura de
// classificar() nem os componentes que a chamam.
//
// Faixas são cumulativas por "max" (primeira faixa cujo valor <= max vence).
// O sentido de "bom"/"ruim" é definido por qual nível cada faixa recebe, não
// pela função — por isso pesoFolha/cargaTributaria (quanto menor, melhor)
// usam a mesma estrutura que margemLiquida/margemBruta (quanto maior, melhor).
export const BENCHMARKS = {
  default: {
    margemLiquida:   [{ max: 2, nivel: 'atencao' }, { max: 8, nivel: 'neutro' }, { max: Infinity, nivel: 'saudavel' }],
    margemBruta:     [{ max: 15, nivel: 'atencao' }, { max: 30, nivel: 'neutro' }, { max: Infinity, nivel: 'saudavel' }],
    margemOperacional: [{ max: 3, nivel: 'atencao' }, { max: 10, nivel: 'neutro' }, { max: Infinity, nivel: 'saudavel' }],
    margemEbitda:    [{ max: 5, nivel: 'atencao' }, { max: 12, nivel: 'neutro' }, { max: Infinity, nivel: 'saudavel' }],
    pesoFolha:       [{ max: 25, nivel: 'saudavel' }, { max: 35, nivel: 'neutro' }, { max: Infinity, nivel: 'atencao' }],
    cargaTributaria: [{ max: 12, nivel: 'saudavel' }, { max: 20, nivel: 'neutro' }, { max: Infinity, nivel: 'atencao' }],
    margemSeguranca: [{ max: 10, nivel: 'atencao' }, { max: 25, nivel: 'neutro' }, { max: Infinity, nivel: 'saudavel' }],
    despesasAdm:     [{ max: 20, nivel: 'saudavel' }, { max: 30, nivel: 'neutro' }, { max: Infinity, nivel: 'atencao' }],
    // Balanço patrimonial — liquidez corrente < 1,5 é o gatilho de alerta
    // (abaixo de 1,0 nem cobre o passivo circulante); endividamento geral
    // > 70% do ativo financiado por terceiros é o gatilho de alerta oposto.
    liquidezCorrente: [{ max: 1.5, nivel: 'atencao' }, { max: 2, nivel: 'neutro' }, { max: Infinity, nivel: 'saudavel' }],
    endividamentoGeral: [{ max: 50, nivel: 'saudavel' }, { max: 70, nivel: 'neutro' }, { max: Infinity, nivel: 'atencao' }],
  },
};

export function classificar(indicador, valor, segmento = 'default') {
  const faixas = (BENCHMARKS[segmento] || BENCHMARKS.default)[indicador];
  if (!faixas || valor == null || Number.isNaN(valor)) return null;
  const faixa = faixas.find((f) => valor <= f.max);
  return faixa ? faixa.nivel : faixas[faixas.length - 1].nivel;
}

// Sentido em que cada indicador "melhora" — usado pelas setas de tendência
// (direcaoTendencia), que são sobre DIREÇÃO da mudança, não sobre nível
// absoluto (uma margem "saudável" que está caindo ainda merece seta vermelha).
export const SENTIDO_BOM = {
  margemBruta: 'maior',
  margemLiquida: 'maior',
  margemOperacional: 'maior',
  margemEbitda: 'maior',
  coberturaDespesasAdm: 'maior',
  pesoFolha: 'menor',
  cargaTributaria: 'menor',
  despesasAdm: 'menor',
  margemSeguranca: 'maior',
  liquidezCorrente: 'maior',
  endividamentoGeral: 'menor',
};

export function direcaoTendencia(indicador, atual, anterior, limiar = 0.3) {
  if (atual == null || anterior == null || Number.isNaN(atual) || Number.isNaN(anterior)) return null;
  const delta = atual - anterior;
  if (Math.abs(delta) < limiar) return 'estavel';
  const sentido = SENTIDO_BOM[indicador] || 'maior';
  const subiu = delta > 0;
  return (sentido === 'maior' ? subiu : !subiu) ? 'melhora' : 'piora';
}
