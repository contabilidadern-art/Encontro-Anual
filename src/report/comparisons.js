// Funções puras da análise comparativa entre períodos (aba Contábil).
// Diferente de indicators.js (métricas de 1 período), estas recebem dois ou
// mais documentos de período já resolvidos (mesmo shape de mockData.js) —
// quem busca os dados (useReportData.js) decide se vêm do Firestore ou mock.

import { calcReceitaPorFuncionario, folhaTotalPeriodo } from './indicators';

// ── navegação entre períodos "AAAA-Sn" ──────────────────────────────────
export function parsePeriodoId(periodoId) {
  const [anoStr, semStr] = (periodoId || '').split('-S');
  const ano = Number(anoStr);
  const semestre = Number(semStr);
  return Number.isFinite(ano) && Number.isFinite(semestre) ? { ano, semestre } : null;
}

// '2026-S1' -> '2025-S1' (mesmo semestre, ano anterior) — comparação YoY "limpa".
export function periodoAnoAnterior(periodoId) {
  const p = parsePeriodoId(periodoId);
  return p ? `${p.ano - 1}-S${p.semestre}` : null;
}

// Período cronologicamente anterior dentre os disponíveis (independe do
// semestre — pode ser o S2 do ano anterior). null se `periodoAtual` for o
// mais antigo disponível.
export function periodoAnteriorSequencial(periodosDisponiveis, periodoAtual) {
  const ordenados = [...periodosDisponiveis].sort();
  const idx = ordenados.indexOf(periodoAtual);
  return idx > 0 ? ordenados[idx - 1] : null;
}

// ── variação percentual genérica ────────────────────────────────────────
// "—" (null) em vez de erro/Infinity quando não dá pra calcular.
export function calcVariacaoPct(atual, anterior) {
  if (atual == null || anterior == null || anterior === 0) return null;
  return ((atual - anterior) / Math.abs(anterior)) * 100;
}

// ── crescimento nominal vs real (deflacionado pelo IPCA acumulado) ──────
export function calcCrescimentoReal(crescimentoNominalPct, ipcaAcumuladoPct) {
  if (crescimentoNominalPct == null || ipcaAcumuladoPct == null) return null;
  return ((1 + crescimentoNominalPct / 100) / (1 + ipcaAcumuladoPct / 100) - 1) * 100;
}

// ── alavancagem operacional ──────────────────────────────────────────────
// Compara a variação da receita líquida com a variação da folha total
// (salário+pró-labore+encargos+FGTS) e das despesas gerais, entre dois
// períodos quaisquer (chamador decide se é o par YoY ou o sequencial).
// alertaFolha/alertaDespGerais = true quando o custo cresce mais rápido que
// a receita — sinal de perda de eficiência operacional.
export function calcAlavancagemOperacional(periodoAtual, periodoComparado) {
  if (!periodoAtual?.contabil || !periodoComparado?.contabil) return null;

  const crescimentoReceita = calcVariacaoPct(periodoAtual.contabil.receita_liquida, periodoComparado.contabil.receita_liquida);
  const crescimentoFolha = calcVariacaoPct(folhaTotalPeriodo(periodoAtual.dp), folhaTotalPeriodo(periodoComparado.dp));
  const crescimentoDespGerais = calcVariacaoPct(
    periodoAtual.contabil.despesas_gerais?.total,
    periodoComparado.contabil.despesas_gerais?.total
  );

  return {
    crescimentoReceita,
    crescimentoFolha,
    crescimentoDespGerais,
    alertaFolha: crescimentoReceita != null && crescimentoFolha != null && crescimentoFolha > crescimentoReceita,
    alertaDespGerais: crescimentoReceita != null && crescimentoDespGerais != null && crescimentoDespGerais > crescimentoReceita,
  };
}

// ── produtividade comparada — série por período (cronológica) ──────────
export function calcProdutividadeSerie(periodosOrdenadosAsc, periodosData) {
  return periodosOrdenadosAsc
    .filter((id) => periodosData[id])
    .map((id) => {
      const p = periodosData[id];
      const receitaPorFuncionario = calcReceitaPorFuncionario(p.contabil, p.dp);
      const folha = folhaTotalPeriodo(p.dp);
      const custoFolhaPorReceitaPct = p.contabil?.receita_liquida ? (folha / p.contabil.receita_liquida) * 100 : null;
      return { periodoId: id, receitaPorFuncionario, custoFolhaPorReceitaPct };
    });
}

// ── índice de sazonalidade ───────────────────────────────────────────────
// Só calcula quando S1 e S2 do MESMO ano estão disponíveis. Card informativo
// (não é alerta) — "historicamente o 2º semestre fatura X% a mais/menos".
export function calcSazonalidade(periodosData, ano) {
  const s1 = periodosData[`${ano}-S1`];
  const s2 = periodosData[`${ano}-S2`];
  if (!s1?.contabil?.receita_liquida || !s2?.contabil?.receita_liquida) return null;
  const indice = s2.contabil.receita_liquida / s1.contabil.receita_liquida;
  return { indice, variacaoPct: (indice - 1) * 100, ano };
}
