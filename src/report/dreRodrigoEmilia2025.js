// Bloco contabil (DRE) REAL de RODRIGO E EMILIA MERCEARIA LTDA, extraído dos
// dois arquivos D.R.E. fornecidos pelo cliente (pasta raiz do REPORT/,
// convertidos de .xls antigo via Excel COM, mesmo procedimento usado pra
// Frisegur — ver contabilFrisegurServicos2026.js).
//
// ATENÇÃO — os dois arquivos NÃO cobrem exatamente os semestres do Report:
//   - "D.R.E 01-25 a 5-25.xls" = acumulado JAN–MAI/2025 (não Jan-Jun). Usado
//     abaixo como aproximação de 2025-S1 — falta o mês de junho.
//   - "D.R.E 06-25 12-25.xls" = acumulado JAN–DEZ/2025 (ano inteiro, "EM
//     31/12/2025" é sempre cumulativo desde o início do exercício nesse
//     layout — NÃO é só Jun-Dez apesar do nome do arquivo). CONTABIL_2025_S2
//     abaixo foi calculado por SUBTRAÇÃO (ano inteiro − Jan-Mai) linha a
//     linha, reconciliando exatamente com a diferença de lucro líquido
//     impressa nos dois arquivos (confirmado: 4.881.878,79 + (-19.910.663,26)
//     = -15.028.784,47).
//   - Isso significa que 2025-S2 aqui é, na prática, "Jun-Dez" só por
//     subtração — nenhum arquivo original tem esse período isolado.
//
// Como no padrão Frisegur: "Despesas Tributárias" (multas/IRRF) foi somada
// dentro de despesas_gerais; "Despesas/Receitas Financeiras" + "Outras
// Receitas Operacionais" foram somadas num único resultado_financeiro líquido.
//
// ⚠️ CMV: no arquivo anual, o CMV acumulado (R$ 33.995.373,29) é ~5,3x maior
// que o de Jan-Mai sozinho (R$ 6.461.614,97), levando a um "Jun-Dez" com
// prejuízo de ~R$ 19,9 milhões — desproporcional ao resultado de Jan-Mai
// (lucro de R$ 4,9 milhões). Os números batem matematicamente com o impresso
// nos dois arquivos originais, mas o tamanho do salto no CMV é atípico o
// suficiente pra merecer confirmação com o cliente/contador antes de usar
// esse "2025-S2" derivado em qualquer análise que saia do Report pra fora.
export const CONTABIL_2025_S1 = {
  receita_bruta: { vendas_prazo: 9374340.25, vendas_vista: 4999500.19, total: 14373840.44 },
  deducoes: { icms: 1085410.7, cofins: 306870.13, pis: 66623.1, devolucao: 0, total: 1458903.93 },
  receita_liquida: 12914936.51,
  cmv: 6461614.97,
  lucro_bruto: 6453321.54,
  despesas_administrativas: {
    'HORAS EXTRAS': 112394.01,
    'VALE TRANSPORTE': 932,
    'SALÁRIOS E ORDENADOS': 563566.76,
    'PRÓ-LABORE': 83700,
    '13º SALÁRIO': 60329.83,
    'FÉRIAS': 84265.08,
    'INSS': 240058.67,
    'FGTS': 68528.79,
    'CONTRIBUIÇÃO ASSISTENCIAL': 95,
    'ADICIONAL NOTURNO': 15.46,
    'SERVIÇOS PRESTADOS POR TERCEIROS': 4326.24,
    total: 1218211.84,
  },
  despesas_gerais: {
    'ALUGUÉIS DE IMÓVEIS': 70725,
    'ALUGUÉIS DE MÁQUINAS E EQUIPAMENTOS': 1034.09,
    'DEPRECIAÇÕES E AMORTIZAÇÕES': 6663.55,
    'ENERGIA ELÉTRICA': 97179.72,
    'INTERNET E AFINS': 3564.75,
    'COMBUSTÍVEIS E LUBRIFICANTES': 214967,
    'SEGUROS': 6518.8,
    'PEDÁGIO': 4138.72,
    'ASSISTÊNCIA CONTÁBIL': 56407,
    'MULTAS E INFRAÇÕES': 373.73,
    total: 461572.36,
  },
  resultado_financeiro: 108341.45,
  lucro_liquido: 4881878.79,
};

export const CONTABIL_2025_S2 = {
  receita_bruta: { vendas_prazo: 6162570.48, vendas_vista: 2700903.46, total: 8863473.94 },
  deducoes: { icms: 719214.1, cofins: 199300.59, pis: 43269.23, devolucao: 0, total: 961783.92 },
  receita_liquida: 7901690.02,
  cmv: 27533758.32,
  lucro_bruto: -19632068.3,
  despesas_administrativas: {
    'HORAS EXTRAS': 54517.26,
    'VALE TRANSPORTE': -932,
    'SALÁRIOS E ORDENADOS': 271945.8,
    'PRÓ-LABORE': 35938.4,
    '13º SALÁRIO': 24483.84,
    'INDENIZAÇÕES TRABALHISTAS': 1512.97,
    'FÉRIAS': 24906.84,
    'INSS': 106781.32,
    'FGTS': 82444.51,
    'CONTRIBUIÇÃO ASSISTENCIAL': -85,
    'ASSISTÊNCIA MÉDICA E SOCIAL': 2458.4,
    'ADICIONAL NOTURNO': 9.9,
    'SERVIÇOS PRESTADOS POR TERCEIROS': 12868.92,
    total: 616851.16,
  },
  // total positivo = despesas gerais do 2º semestre foram um CRÉDITO líquido
  // (dominado por um estorno/reclassificação em COMBUSTÍVEIS E LUBRIFICANTES:
  // o acumulado anual ficou MENOR que o de Jan-Mai sozinho). Reconcilia
  // matematicamente, mas vale confirmar com o cliente.
  despesas_gerais: {
    'ALUGUÉIS DE IMÓVEIS': 28290,
    'ALUGUÉIS DE MÁQUINAS E EQUIPAMENTOS': 1028.49,
    'DEPRECIAÇÕES E AMORTIZAÇÕES': 32589.97,
    'ENERGIA ELÉTRICA': 14335.2,
    'INTERNET E AFINS': 1426.09,
    'COMBUSTÍVEIS E LUBRIFICANTES': -161180,
    'SEGUROS': 9187.76,
    'PEDÁGIO': 2003.12,
    'USO E CONSUMO': 200,
    'ASSISTÊNCIA CONTÁBIL': 24688,
    'MULTAS E INFRAÇÕES': -373.73,
    'IRRF': 77.07,
    total: -47728.03,
  },
  resultado_financeiro: 290528.17,
  lucro_liquido: -19910663.26,
};
