// Dados de demonstração para o Report Semestral, no formato exato do schema
// Firestore `clientes/{cnpj}/periodos/{periodoId}` — periodoId agora é
// "AAAA-Sn" (ex: "2026-S1"), não mais só o ano.
//
// Os blocos `dp`, `fiscal` e `balanco` de 2026-S1 são REAIS — `dp` extraído
// de scripts/ingest/parsers.py::parse_folha contra um export real do
// Domínio, `fiscal` de parse_fiscal_sped_semestre contra o SPED Fiscal real
// (ver fiscalSped2026S1.js), e `balanco` de 3 balanços patrimoniais
// assinados (31/12/2024, 31/12/2025, 31/03/2026 — ver
// balancoPatrimonial2026S1.js). Isso é um atalho pra testar a leitura sem
// depender da gravação no Firestore (bloqueada por regra de segurança —
// escrita real ainda precisa de um script com credencial de servidor).
// 2025-S1/2025-S2 e o bloco `contabil` (DRE) de todos os períodos continuam
// mock, gerados a partir de parâmetros simples (faturamento base, headcount
// base) pra ficarem internamente consistentes e comparáveis entre si —
// ainda não são arquivos reais (há 2 DREs reais de 2025 recebidas, mas com
// números a esclarecer com o cliente antes de ligar o parse_dre; ver
// scripts/ingest/parsers.py).

import { DP_NOMINAL_2026_S1 } from './dpNominal2026S1';
import { FISCAL_SPED_2026_S1 } from './fiscalSped2026S1';
import { BALANCO_2026_S1 } from './balancoPatrimonial2026S1';
import { FRISEGUR_SERVICOS_2026 } from './fiscalFrisegurServicos2026';
import { FRISEGUR_VIGILANCIA_2026 } from './fiscalFrisegurVigilancia2026';
import { CONTABIL_FRISEGUR_SERVICOS_2026 } from './contabilFrisegurServicos2026';
import { CONTABIL_FRISEGUR_VIGILANCIA_2026 } from './contabilFrisegurVigilancia2026';
import { DP_FRISEGUR_SERVICOS_2026, DP_NOMINAL_FRISEGUR_SERVICOS_2026 } from './dpFrisegurServicos2026';
import { DP_FRISEGUR_VIGILANCIA_2026, DP_NOMINAL_FRISEGUR_VIGILANCIA_2026 } from './dpFrisegurVigilancia2026';
import { CONTABIL_2025_S1, CONTABIL_2025_S2 } from './dreRodrigoEmilia2025';
import { FISCAL_AKIK_ANUAL } from './fiscalAkik';
import { DP_AKIK_ANUAL, DP_NOMINAL_AKIK_ANUAL } from './dpAkik';
import { FISCAL_MARIDEL_ANUAL } from './fiscalMaridel';
import { DP_MARIDEL_ANUAL, DP_NOMINAL_MARIDEL_ANUAL } from './dpMaridel';

const round2 = (n) => Math.round(n * 100) / 100;

const CLIENTE = { razao_social: 'RODRIGO E EMILIA MERCEARIA LTDA', cnpj: '07809869000120' };
const CLIENTE_FRISEGUR_SERVICOS = { razao_social: 'FRISEGUR SERVICOS E MONITORAMENTO ELETRONICO LTDA', cnpj: '30118621000135' };
const CLIENTE_FRISEGUR_VIGILANCIA = { razao_social: 'FRISEGUR VIGILANCIA E SEGURANCA LTDA', cnpj: '13563628000147' };
const CLIENTE_AKIK = { razao_social: 'AKIK LINGERIE LTDA', cnpj: '02976533000139' };
const CLIENTE_MARIDEL = { razao_social: 'MARIDEL N.F. DA SERRA LINGERIE LTDA', cnpj: '05655885000180' };

// Grupo de empresas navegáveis juntas no seletor do header do Report (ver
// SeletorEmpresa em ReportPage.jsx) — hoje AKIK e Maridel (negociam entre si,
// analisadas no mesmo "Encontro Anual"); mais uma pode entrar depois.
export const GRUPO_EMPRESAS = [CLIENTE_AKIK, CLIENTE_MARIDEL];

function mesesDoSemestre(ano, semestre) {
  const inicio = semestre === 1 ? 1 : 7;
  return Array.from({ length: 6 }, (_, i) => `${ano}-${String(inicio + i).padStart(2, '0')}`);
}

const UF_SHARE = { RJ: 0.80, SP: 0.12, MG: 0.05, ES: 0.03 };
const COMPRAS_UF_SHARE = { RJ: 0.55, SP: 0.30, MG: 0.10, ES: 0.05 };

const TOP_CLIENTES_SHARE = [
  { nome: 'Restaurante Bom Sabor Ltda', share: 0.09 },
  { nome: 'Padaria Estrela Dourada', share: 0.07 },
  { nome: 'Lanchonete Ponto Certo', share: 0.055 },
  { nome: 'Hotel Pousada Vista Verde', share: 0.045 },
  { nome: 'Buffet Sabor & Arte', share: 0.035 },
];

const TOP_FORNECEDORES_SHARE = [
  { nome: 'Atacadão Central Distribuidora', share: 0.18 },
  { nome: 'Nestlé Brasil Ltda', share: 0.11 },
  { nome: 'Coca-Cola FEMSA', share: 0.09 },
  { nome: 'União Distribuidora de Alimentos', share: 0.07 },
  { nome: 'Sadia / BRF Comercial', share: 0.06 },
];

// Distribui o total pelos 6 meses com uma ondulação leve — só pra não ter 6
// valores idênticos num gráfico de evolução; não representa sazonalidade real.
const ONDULACAO = [0.985, 0.965, 1.015, 0.99, 1.03, 1.0];

function buildFiscal(meses, faturamentoTotal) {
  const base = faturamentoTotal / 6;
  const fiscal = {};
  meses.forEach((mes, idx) => {
    const faturamento = round2(base * ONDULACAO[idx]);
    const compras = Math.round(faturamento * 0.63);
    fiscal[mes] = {
      faturamento,
      vendas: faturamento,
      compras,
      vendas_por_uf: Object.fromEntries(Object.entries(UF_SHARE).map(([uf, share]) => [uf, Math.round(faturamento * share)])),
      compras_por_uf: Object.fromEntries(Object.entries(COMPRAS_UF_SHARE).map(([uf, share]) => [uf, Math.round(compras * share)])),
      top_clientes: TOP_CLIENTES_SHARE.map(({ nome, share }) => ({ nome, valor: Math.round(faturamento * share) })),
      top_fornecedores: TOP_FORNECEDORES_SHARE.map(({ nome, share }) => ({ nome, valor: Math.round(compras * share) })),
    };
  });
  return fiscal;
}

function somaCampos(a, b) {
  const out = {};
  for (const k of Object.keys(a)) out[k] = round2((a[k] || 0) + (b[k] || 0));
  return out;
}

function buildDP(meses, { headcountBase, salarioMedio }) {
  const dp = {};
  const variacoes = [0, -2, 3, -1, 2, -1];
  meses.forEach((mes, idx) => {
    const qtdClt = headcountBase + variacoes[idx];
    const salario = round2(qtdClt * salarioMedio);
    const outProv = round2(salario * (0.15 + 0.05 * ONDULACAO[idx]));
    const bruto = round2(salario + outProv);
    const inss = round2(bruto * 0.085);
    const fgts = round2(bruto * 0.08);
    const outDesc = round2(bruto * 0.18);
    const salFam = round2(qtdClt * 3.5);
    const liquido = round2(bruto - inss - outDesc - salFam);
    const clt = { qtd: qtdClt, bruto, liquido, fgts, salario, out_prov: outProv, inss, irrf: 0, out_desc: outDesc, sal_fam: salFam };
    const proLabore = { qtd: 2, bruto: 8000, liquido: 6150, fgts: 0, salario: 8000, out_prov: 0, inss: 850, irrf: 1000, out_desc: 0, sal_fam: 0 };
    dp[mes] = {
      clt,
      pro_labore: proLabore,
      total: somaCampos(clt, proLabore),
      admissoes: idx === 0 ? null : Math.max(1, variacoes[idx] - variacoes[idx - 1] + 2),
      demissoes: idx === 0 ? null : Math.max(1, variacoes[idx - 1] - variacoes[idx] + 2),
    };
  });
  return dp;
}

function somarDPCampo(dp, secao, campo) {
  return round2(Object.values(dp).reduce((s, m) => s + (m[secao]?.[campo] || 0), 0));
}

// `taxas` — cada período mock precisa da SUA PRÓPRIA combinação de percentuais
// (não uma constante fixa reaproveitada em todo período), senão toda linha da
// DRE que deriva de "% da receita bruta" cresce exatamente na mesma taxa que
// o faturamento entre dois períodos — mascarando qualquer teste de variação %
// linha-a-linha (foi exatamente isso que aconteceu antes desta função aceitar
// `taxas`). Os valores default abaixo só existem pra não quebrar chamadas
// antigas; todo período em MOCK_PERIODOS passa o seu próprio conjunto.
function buildContabil(faturamentoTotal, folhaBrutaTotal, fgtsTotal, taxas = {}) {
  const {
    pctVendaVista = 0.70,
    pctIcms = 0.07,
    pctCofins = 0.03,
    pctPis = 0.0065,
    pctDevolucao = 0.01,
    pctCmv = 0.63,
    pctOverheadAdm = 0.0175,
    pctOverheadGerais = 0.012,
    pctResultadoFinanceiro = -0.0024,
  } = taxas;

  const receitaBrutaTotal = faturamentoTotal;
  const vendasVista = round2(receitaBrutaTotal * pctVendaVista);
  const vendasPrazo = round2(receitaBrutaTotal - vendasVista);
  const icms = round2(receitaBrutaTotal * pctIcms);
  const cofins = round2(receitaBrutaTotal * pctCofins);
  const pis = round2(receitaBrutaTotal * pctPis);
  const devolucao = round2(receitaBrutaTotal * pctDevolucao);
  const deducoesTotal = round2(icms + cofins + pis + devolucao);
  const receitaLiquida = round2(receitaBrutaTotal - deducoesTotal);
  const cmv = round2(receitaBrutaTotal * pctCmv);
  const lucroBruto = round2(receitaLiquida - cmv);

  const overheadFixo = round2(receitaBrutaTotal * pctOverheadAdm); // aluguel + energia + água + telefone
  const despesasAdministrativas = {
    'Salários e Ordenados': folhaBrutaTotal,
    FGTS: fgtsTotal,
    Aluguel: round2(overheadFixo * 0.60),
    'Energia Elétrica': round2(overheadFixo * 0.24),
    'Água e Esgoto': round2(overheadFixo * 0.08),
    'Telefone e Internet': round2(overheadFixo * 0.08),
  };
  despesasAdministrativas.total = round2(Object.values(despesasAdministrativas).reduce((s, v) => s + v, 0));

  const despesasGeraisBase = round2(receitaBrutaTotal * pctOverheadGerais);
  const despesasGerais = {
    'Manutenção e Conservação': round2(despesasGeraisBase * 0.25),
    'Materiais de Escritório': round2(despesasGeraisBase * 0.13),
    'Marketing e Publicidade': round2(despesasGeraisBase * 0.31),
    'Honorários Contábeis': round2(despesasGeraisBase * 0.30),
    'Depreciação e Amortização de Equipamentos': round2(receitaBrutaTotal * 0.0026),
    'Brindes e Bonificações a Clientes': round2(receitaBrutaTotal * 0.001),
  };
  despesasGerais.total = round2(Object.values(despesasGerais).reduce((s, v) => s + v, 0));

  const resultadoFinanceiro = round2(receitaBrutaTotal * pctResultadoFinanceiro);
  const lucroLiquido = round2(lucroBruto - despesasAdministrativas.total - despesasGerais.total + resultadoFinanceiro);

  return {
    receita_bruta: { vendas_prazo: vendasPrazo, vendas_vista: vendasVista, total: receitaBrutaTotal },
    deducoes: { icms, cofins, pis, devolucao, total: deducoesTotal },
    receita_liquida: receitaLiquida,
    cmv,
    lucro_bruto: lucroBruto,
    despesas_administrativas: despesasAdministrativas,
    despesas_gerais: despesasGerais,
    resultado_financeiro: resultadoFinanceiro,
    lucro_liquido: lucroLiquido,
  };
}

function buildPeriodoMock({ ano, semestre, faturamentoTotal, headcountBase, salarioMedio, ipcaAcumulado, taxas }) {
  const meses = mesesDoSemestre(ano, semestre);
  const dp = buildDP(meses, { headcountBase, salarioMedio });
  const folhaBrutaTotal = somarDPCampo(dp, 'total', 'bruto');
  const fgtsTotal = somarDPCampo(dp, 'clt', 'fgts');
  return {
    cliente: CLIENTE,
    periodo: { inicio: meses[0], fim: meses[5] },
    // TODO: ipca_acumulado é input manual por enquanto — integrar a API do
    // IBGE (SIDRA) pra buscar automaticamente pelo intervalo do período.
    ipca_acumulado: ipcaAcumulado,
    contabil: buildContabil(faturamentoTotal, folhaBrutaTotal, fgtsTotal, taxas),
    dp,
    fiscal: buildFiscal(meses, faturamentoTotal),
  };
}

// ── 2026-S1: dp REAL (parse_folha contra export real do Domínio) ───────────
// validado campo a campo contra as linhas "Total:" do arquivo original.
const DP_REAL_2026_S1 = {
  '2026-01': {
    clt: { qtd: 81, bruto: 158418.86, liquido: 107575.79, fgts: 13238.15, salario: 116708.33, out_prov: 41710.53, inss: 10879.21, irrf: 0.00, out_desc: 40261.04, sal_fam: 297.18 },
    pro_labore: { qtd: 2, bruto: 17880.00, liquido: 13428.62, fgts: 0.00, salario: 17880.00, out_prov: 0.00, inss: 1864.62, irrf: 2586.76, out_desc: 0.00, sal_fam: 0.00 },
    total: { qtd: 83, bruto: 176298.86, liquido: 121004.41, fgts: 13238.15, salario: 134588.33, out_prov: 41710.53, inss: 12743.83, irrf: 2586.76, out_desc: 40261.04, sal_fam: 297.18 },
    admissoes: null, demissoes: null,
  },
  '2026-02': {
    clt: { qtd: 80, bruto: 166605.98, liquido: 110175.10, fgts: 19590.81, salario: 119208.99, out_prov: 47396.99, inss: 11876.71, irrf: 0.00, out_desc: 45020.19, sal_fam: 466.02 },
    pro_labore: { qtd: 2, bruto: 17880.00, liquido: 13428.62, fgts: 0.00, salario: 17880.00, out_prov: 0.00, inss: 1864.62, irrf: 2586.76, out_desc: 0.00, sal_fam: 0.00 },
    total: { qtd: 82, bruto: 184485.98, liquido: 123603.72, fgts: 19590.81, salario: 137088.99, out_prov: 47396.99, inss: 13741.33, irrf: 2586.76, out_desc: 45020.19, sal_fam: 466.02 },
    admissoes: 7, demissoes: 8,
  },
  '2026-03': {
    clt: { qtd: 86, bruto: 171651.97, liquido: 102472.25, fgts: 18460.51, salario: 118981.66, out_prov: 52670.31, inss: 11763.80, irrf: 0.00, out_desc: 57888.70, sal_fam: 472.78 },
    pro_labore: { qtd: 2, bruto: 17880.00, liquido: 13212.57, fgts: 0.00, salario: 17880.00, out_prov: 0.00, inss: 1864.62, irrf: 2504.81, out_desc: 298.00, sal_fam: 0.00 },
    total: { qtd: 88, bruto: 189531.97, liquido: 115684.82, fgts: 18460.51, salario: 136861.66, out_prov: 52670.31, inss: 13628.42, irrf: 2504.81, out_desc: 58186.70, sal_fam: 472.78 },
    admissoes: 9, demissoes: 3,
  },
  '2026-04': {
    clt: { qtd: 89, bruto: 171363.21, liquido: 117997.19, fgts: 12756.17, salario: 124594.81, out_prov: 46768.40, inss: 12229.33, irrf: 0.00, out_desc: 42057.48, sal_fam: 920.79 },
    pro_labore: { qtd: 2, bruto: 17880.00, liquido: 13428.62, fgts: 0.00, salario: 17880.00, out_prov: 0.00, inss: 1864.62, irrf: 2586.76, out_desc: 0.00, sal_fam: 0.00 },
    total: { qtd: 91, bruto: 189243.21, liquido: 131425.81, fgts: 12756.17, salario: 142474.81, out_prov: 46768.40, inss: 14093.95, irrf: 2586.76, out_desc: 42057.48, sal_fam: 920.79 },
    admissoes: 11, demissoes: 8,
  },
  '2026-05': {
    clt: { qtd: 87, bruto: 186251.53, liquido: 117692.14, fgts: 15301.75, salario: 132715.98, out_prov: 53535.55, inss: 12946.84, irrf: 0.00, out_desc: 56242.92, sal_fam: 630.37 },
    pro_labore: { qtd: 2, bruto: 17880.00, liquido: 13428.62, fgts: 0.00, salario: 17880.00, out_prov: 0.00, inss: 1864.62, irrf: 2586.76, out_desc: 0.00, sal_fam: 0.00 },
    total: { qtd: 89, bruto: 204131.53, liquido: 131120.76, fgts: 15301.75, salario: 150595.98, out_prov: 53535.55, inss: 14811.46, irrf: 2586.76, out_desc: 56242.92, sal_fam: 630.37 },
    admissoes: 5, demissoes: 7,
  },
  '2026-06': {
    clt: { qtd: 88, bruto: 172986.18, liquido: 119608.24, fgts: 12906.50, salario: 127991.86, out_prov: 44994.32, inss: 12085.82, irrf: 0.00, out_desc: 42138.61, sal_fam: 846.49 },
    pro_labore: { qtd: 2, bruto: 17880.00, liquido: 13428.62, fgts: 0.00, salario: 17880.00, out_prov: 0.00, inss: 1864.62, irrf: 2586.76, out_desc: 0.00, sal_fam: 0.00 },
    total: { qtd: 90, bruto: 190866.18, liquido: 133036.86, fgts: 12906.50, salario: 145871.86, out_prov: 44994.32, inss: 13950.44, irrf: 2586.76, out_desc: 42138.61, sal_fam: 846.49 },
    admissoes: 9, demissoes: 8,
  },
};

const CONTABIL_2026_S1 = {
  receita_bruta: { vendas_prazo: 1758000.00, vendas_vista: 4102000.00, total: 5860000.00 },
  deducoes: { icms: 410200.00, cofins: 175800.00, pis: 38090.00, devolucao: 58600.00, total: 682690.00 },
  receita_liquida: 5177310.00,
  cmv: 3691800.00,
  lucro_bruto: 1485510.00,
  despesas_administrativas: {
    'Salários e Ordenados': 1134557.73,
    'FGTS': 92253.89,
    'Aluguel': 72000.00,
    'Energia Elétrica': 28500.00,
    'Água e Esgoto': 9600.00,
    'Telefone e Internet': 8400.00,
    total: 1345311.62,
  },
  despesas_gerais: {
    'Manutenção e Conservação': 18000.00,
    'Materiais de Escritório': 9200.00,
    'Marketing e Publicidade': 22000.00,
    'Honorários Contábeis': 21600.00,
    'Depreciação e Amortização de Equipamentos': 15000.00,
    'Brindes e Bonificações a Clientes': 6000.00,
    total: 91800.00,
  },
  resultado_financeiro: -14300.00,
  // lucro_bruto - despesas_administrativas.total - despesas_gerais.total + resultado_financeiro
  lucro_liquido: 34098.38,
};

// Taxas de 2026-S1 ficam implícitas em CONTABIL_2026_S1 (7% ICMS, 3% COFINS,
// 0,65% PIS, 1% devolução, 63% CMV, 70% vista, ~1,75%/1,57% overhead) — as
// duas linhas abaixo usam combinações DIFERENTES entre si e diferentes dessas,
// pra nenhuma comparação entre períodos sair com a mesma % em cascata.
const TAXAS_2025_S1 = { pctVendaVista: 0.68, pctIcms: 0.069, pctCofins: 0.0305, pctPis: 0.0063, pctDevolucao: 0.012, pctCmv: 0.635, pctOverheadAdm: 0.0170, pctOverheadGerais: 0.0115, pctResultadoFinanceiro: -0.0022 };
const TAXAS_2025_S2 = { pctVendaVista: 0.72, pctIcms: 0.071, pctCofins: 0.0295, pctPis: 0.0068, pctDevolucao: 0.008, pctCmv: 0.625, pctOverheadAdm: 0.0180, pctOverheadGerais: 0.0125, pctResultadoFinanceiro: -0.0026 };

// ── mapa de clientes → períodos disponíveis (mock/fallback) ────────────────
// Indexado por CNPJ: cada cliente só cai no fallback mock do SEU PRÓPRIO CNPJ
// — antes disso, qualquer CNPJ sem documento no Firestore caía sempre nos
// dados da Rodrigo e Emilia (o único cliente com mock), o que é enganoso pra
// qualquer outro cliente real aberto no Report.
export const MOCK_PERIODOS = {
  [CLIENTE.cnpj]: {
    // contabil REAL (ver dreRodrigoEmilia2025.js — extraído das 2 D.R.E.
    // fornecidas pelo cliente; dp/fiscal continuam mock, sem arquivo real
    // pra 2025 ainda). 2025-S1 = aproximação de Jan-Mai (falta junho);
    // 2025-S2 = Jun-Dez calculado por subtração (ano inteiro − Jan-Mai) —
    // ver comentário no topo do arquivo pra ressalva sobre o salto de CMV.
    '2025-S1': { ...buildPeriodoMock({ ano: 2025, semestre: 1, faturamentoTotal: 5150000, headcountBase: 72, salarioMedio: 1650, ipcaAcumulado: 2.5, taxas: TAXAS_2025_S1 }), contabil: CONTABIL_2025_S1 },
    '2025-S2': { ...buildPeriodoMock({ ano: 2025, semestre: 2, faturamentoTotal: 5540000, headcountBase: 76, salarioMedio: 1680, ipcaAcumulado: 2.8, taxas: TAXAS_2025_S2 }), contabil: CONTABIL_2025_S2 },
    '2026-S1': {
      cliente: CLIENTE,
      periodo: { inicio: '2026-01', fim: '2026-06' },
      ipca_acumulado: 2.3,
      contabil: CONTABIL_2026_S1,
      dp: DP_REAL_2026_S1,
      dp_nominal: DP_NOMINAL_2026_S1,
      fiscal: FISCAL_SPED_2026_S1,
      balanco: BALANCO_2026_S1,
    },
  },
  // FRISEGUR — dados 2026 REAIS: `fiscal` extraído de NFS-e (padrão nacional,
  // ver fiscalFrisegurServicos2026.js / fiscalFrisegurVigilancia2026.js);
  // `contabil` extraído da D.R.E. real fornecida pelo cliente, acumulada até
  // 31/05/2026 (ver contabilFrisegurServicos2026.js / contabilFrisegurVigilancia2026.js
  // — lucro_liquido reconciliado exatamente contra o "Resultado Líquido do
  // Exercício" impresso no arquivo original); `dp` extraído do Extrato Mensal
  // real via parse_extrato_mensal, mesmo formato do parse_folha da Rodrigo e
  // Emilia (ver dpFrisegurServicos2026.js / dpFrisegurVigilancia2026.js —
  // reconciliado empregado a empregado contra os totais impressos no arquivo).
  [CLIENTE_FRISEGUR_SERVICOS.cnpj]: {
    '2026-S1': {
      cliente: CLIENTE_FRISEGUR_SERVICOS,
      periodo: { inicio: '2026-01', fim: '2026-06' },
      contabil: CONTABIL_FRISEGUR_SERVICOS_2026,
      dp: DP_FRISEGUR_SERVICOS_2026,
      dp_nominal: DP_NOMINAL_FRISEGUR_SERVICOS_2026,
      fiscal: FRISEGUR_SERVICOS_2026,
    },
  },
  [CLIENTE_FRISEGUR_VIGILANCIA.cnpj]: {
    '2026-S1': {
      cliente: CLIENTE_FRISEGUR_VIGILANCIA,
      periodo: { inicio: '2026-01', fim: '2026-06' },
      contabil: CONTABIL_FRISEGUR_VIGILANCIA_2026,
      dp: DP_FRISEGUR_VIGILANCIA_2026,
      dp_nominal: DP_NOMINAL_FRISEGUR_VIGILANCIA_2026,
      fiscal: FRISEGUR_VIGILANCIA_2026,
    },
  },
  // AKIK LINGERIE LTDA — período ANUAL (não semestral, a pedido do cliente),
  // mai/2025 a mai/2026. `dp` REAL e completo (Extrato Mensal, ver
  // dpAkik.js, 13/13 meses). `fiscal` REAL e completo nos 13 meses (ver
  // fiscalAkik.js) — 2025-12 e 2026-01 a 2026-06 vieram do SPED Fiscal;
  // 2025-05 a 2025-11 (SPED desses meses veio com bloco C vazio) vieram de
  // dois lotes de XML de NFe que o cliente mandou (entrada + emitente/saída).
  // `contabil` (DRE) ainda sem fonte real levantada pra esse cliente.
  [CLIENTE_AKIK.cnpj]: {
    '2025-2026': {
      cliente: CLIENTE_AKIK,
      periodo: { inicio: '2025-05', fim: '2026-05' },
      dp: DP_AKIK_ANUAL,
      dp_nominal: DP_NOMINAL_AKIK_ANUAL,
      fiscal: FISCAL_AKIK_ANUAL,
    },
  },
  // MARIDEL N.F. DA SERRA LINGERIE LTDA — mesmo período anual da AKIK
  // (mai/25-mai/26). `fiscal` mês a mês real (ver fiscalMaridel.js):
  // faturamento do Relatório de Faturamento oficial do Domínio (13/13
  // meses); compras do Acompanhamento de Entradas mês a mês (11/13 meses —
  // faltam mai/jun-25). Sem vendas_por_uf/top_clientes/compras_por_uf/
  // top_fornecedores ainda (só tinha isso vindo de um relatório de base ICMS
  // que não reconciliava com o faturamento oficial). `dp` REAL e completo
  // (Extrato Mensal, ver dpMaridel.js, 13/13 meses). `contabil` ainda sem
  // fonte nenhuma levantada.
  [CLIENTE_MARIDEL.cnpj]: {
    '2025-2026': {
      cliente: CLIENTE_MARIDEL,
      periodo: { inicio: '2025-05', fim: '2026-05' },
      dp: DP_MARIDEL_ANUAL,
      dp_nominal: DP_NOMINAL_MARIDEL_ANUAL,
      fiscal: FISCAL_MARIDEL_ANUAL,
    },
  },
};

export const PERIODOS_ORDENADOS = Object.fromEntries(
  Object.entries(MOCK_PERIODOS).map(([cnpj, periodos]) => [cnpj, Object.keys(periodos).sort().reverse()])
);
