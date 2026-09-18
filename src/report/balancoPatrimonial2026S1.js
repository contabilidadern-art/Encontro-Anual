// Balanço Patrimonial REAL — extraído de 3 balanços assinados (ZapSign) da
// RODRIGO E EMILIA MERCEARIA LTDA: "Balanço 2025.pdf" (31/12/2024 e
// 31/12/2025, comparativo) e "Balanço 1o Trim - 2026.pdf" (31/03/2026).
// Confirmado batendo com os indicadores calculados manualmente (liquidez
// corrente 3,54 / 1,55 / 1,14; endividamento geral 33,9% / 65,8% / 87,6%).
//
// Cada snapshot é o ponto-no-tempo do balanço, não um fluxo mensal — por
// isso vive numa lista própria (ordenada por data) em vez de dentro de
// `fiscal`/`contabil`, que são por competência/semestre.
export const BALANCO_2026_S1 = [
  {
    data: '2024-12-31',
    ativo_circulante: 25104103.95,
    ativo_nao_circulante: 268594.39,
    ativo_total: 25372698.34,
    caixa_equivalentes: 6910282.05,
    estoque: 17171540.25,
    passivo_circulante: 7087162.04,
    passivo_nao_circulante: 1503855.09,
    fornecedores: 4372061.17,
    patrimonio_liquido: 16781681.21,
    resultado_exercicio: -341795.58,
  },
  {
    data: '2025-12-31',
    ativo_circulante: 15555833.00,
    ativo_nao_circulante: 671227.85,
    ativo_total: 16227060.85,
    caixa_equivalentes: 1124026.54,
    estoque: 12986125.10,
    passivo_circulante: 10053123.33,
    passivo_nao_circulante: 626131.20,
    fornecedores: 3999027.76,
    patrimonio_liquido: 5547806.32,
    resultado_exercicio: -10146905.68,
  },
  {
    data: '2026-03-31',
    ativo_circulante: 24028279.12,
    ativo_nao_circulante: 696783.35,
    ativo_total: 24725062.47,
    caixa_equivalentes: 4712875.43,
    estoque: 11458233.27,
    passivo_circulante: 21037197.37,
    passivo_nao_circulante: 626131.20,
    fornecedores: 14032114.57,
    patrimonio_liquido: 3061733.90,
    resultado_exercicio: -12632978.10,
  },
];
