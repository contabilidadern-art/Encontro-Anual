// Cálculos dos indicadores financeiros da aba Contábil — funções puras
// (sem JSX, sem estado) para poderem ser testadas/reaproveitadas fora do
// componente. Recebem os objetos `contabil`/`dp`/`periodo` no formato do
// schema Firestore (ver mockData.js) e devolvem números ou objetos simples.

const round2 = (n) => Math.round(n * 100) / 100;

// Soma as contas de um dict {conta: valor} cujo nome bate com algum dos
// padrões (regex) informados — usado tanto para depreciação/amortização
// quanto para itens não-recorrentes, já que os dois têm o mesmo problema:
// nome de conta é texto livre e varia por empresa (ver config/contasEspeciais.js).
export function somarContasPorPadrao(contas = {}, padroes = []) {
  let total = 0;
  const itens = [];
  for (const [conta, valor] of Object.entries(contas)) {
    if (conta === 'total') continue;
    if (padroes.some((re) => re.test(conta))) {
      total += valor;
      itens.push({ conta, valor });
    }
  }
  return { total: round2(total), itens };
}

export function calcMargemBruta(contabil) {
  if (!contabil?.receita_liquida) return 0;
  return (contabil.lucro_bruto / contabil.receita_liquida) * 100;
}

export function calcMargemLiquida(contabil) {
  if (!contabil?.receita_liquida) return 0;
  return (contabil.lucro_liquido / contabil.receita_liquida) * 100;
}

// EBIT (Resultado Operacional): lucro da operação em si, ANTES do resultado
// financeiro — isola o efeito de juros/rendimentos do desempenho operacional.
// Diferente do EBITDA (calcEbitda abaixo), aqui depreciação/amortização
// continua dentro (é despesa operacional de verdade, só não usa caixa).
export function calcEbit(contabil) {
  if (!contabil) return 0;
  return round2((contabil.lucro_bruto || 0) - (contabil.despesas_administrativas?.total || 0) - (contabil.despesas_gerais?.total || 0));
}

export function calcMargemOperacional(contabil) {
  if (!contabil?.receita_liquida) return 0;
  return (calcEbit(contabil) / contabil.receita_liquida) * 100;
}

// Quantas vezes o Lucro Bruto cobre as Despesas Administrativas — mostra se a
// operação (venda - custo direto) sustenta a estrutura fixa sozinha, sem
// depender de Despesas Gerais/Resultado Financeiro. < 1x = a estrutura
// administrativa por si só já consome mais que o lucro bruto gerado.
export function calcCoberturaDespesasAdm(contabil) {
  const despesasAdm = contabil?.despesas_administrativas?.total;
  if (!despesasAdm) return null;
  return (contabil.lucro_bruto || 0) / despesasAdm;
}

export function calcPctDespesasAdministrativas(contabil) {
  if (!contabil?.receita_liquida) return 0;
  return ((contabil.despesas_administrativas?.total || 0) / contabil.receita_liquida) * 100;
}

export function calcCmvSobreReceita(contabil) {
  if (!contabil?.receita_liquida) return 0;
  return (Math.abs(contabil.cmv || 0) / contabil.receita_liquida) * 100;
}

// Carga tributária: tributos sobre a RECEITA BRUTA (não líquida — devolução
// de vendas fica de fora de propósito, não é tributo). ICMS/PIS/COFINS cobrem
// empresa de comércio no Lucro Presumido/Real; ISS + Simples Nacional cobrem
// empresa de serviço no Simples — cada `contabil` só popula os campos que
// fazem sentido pro seu regime/atividade, os demais ficam em 0.
export function calcCargaTributaria(contabil) {
  if (!contabil?.receita_bruta?.total) return 0;
  const { icms = 0, pis = 0, cofins = 0, iss = 0, simples_nacional: simplesNacional = 0 } = contabil.deducoes || {};
  return ((Math.abs(icms) + Math.abs(pis) + Math.abs(cofins) + Math.abs(iss) + Math.abs(simplesNacional)) / contabil.receita_bruta.total) * 100;
}

export function calcEbitda(contabil, padroesDepreciacao) {
  const despesasFinanceiras = contabil.resultado_financeiro < 0 ? Math.abs(contabil.resultado_financeiro) : 0;
  const depreciacao =
    somarContasPorPadrao(contabil.despesas_gerais, padroesDepreciacao).total +
    somarContasPorPadrao(contabil.despesas_administrativas, padroesDepreciacao).total;
  const ebitda = round2((contabil.lucro_liquido || 0) + despesasFinanceiras + depreciacao);
  return { ebitda, despesasFinanceiras, depreciacao };
}

export function calcMargemEbitda(contabil, padroesDepreciacao) {
  if (!contabil?.receita_liquida) return { margem: 0, ebitda: 0, despesasFinanceiras: 0, depreciacao: 0 };
  const { ebitda, despesasFinanceiras, depreciacao } = calcEbitda(contabil, padroesDepreciacao);
  return { margem: (ebitda / contabil.receita_liquida) * 100, ebitda, despesasFinanceiras, depreciacao };
}

// Remove itens não-recorrentes (despesas atípicas) do lucro líquido — como
// são despesas (valores positivos no dict de custos), tirá-las do resultado
// AUMENTA o lucro recorrente.
export function calcResultadoRecorrente(contabil, padroesNaoRecorrentes) {
  const adm = somarContasPorPadrao(contabil.despesas_administrativas, padroesNaoRecorrentes);
  const ger = somarContasPorPadrao(contabil.despesas_gerais, padroesNaoRecorrentes);
  const totalNaoRecorrente = round2(adm.total + ger.total);
  return {
    lucroLiquido: contabil.lucro_liquido || 0,
    lucroRecorrente: round2((contabil.lucro_liquido || 0) + totalNaoRecorrente),
    totalNaoRecorrente,
    itensNaoRecorrentes: [...adm.itens, ...ger.itens],
  };
}

// Quantidade de meses entre duas competências 'YYYY-MM' (inclusive).
export function mesesNoIntervalo(inicio, fim) {
  const [ai, mi] = inicio.split('-').map(Number);
  const [af, mf] = fim.split('-').map(Number);
  return (af - ai) * 12 + (mf - mi) + 1;
}

export function isPeriodoParcialDP(periodo, dp) {
  if (!periodo?.inicio || !periodo?.fim) return false;
  const totalMeses = mesesNoIntervalo(periodo.inicio, periodo.fim);
  return Object.keys(dp || {}).length < totalMeses;
}

// (folha_bruta + fgts) somados sobre todos os meses de DP disponíveis, sobre
// a receita líquida do semestre. Se DP tiver menos meses que o período
// contábil, soma só o que existe — quem chama decide como sinalizar "parcial"
// (ver isPeriodoParcialDP), a função não omite nem estima o que falta.
export function calcPesoFolha(contabil, dp) {
  const meses = Object.keys(dp || {});
  if (!meses.length || !contabil?.receita_liquida) return { pct: 0, mesesPreenchidos: 0 };
  return { pct: (folhaTotalPeriodo(dp) / contabil.receita_liquida) * 100, mesesPreenchidos: meses.length };
}

// Folha total do período (salário+pró-labore + FGTS), somando CLT e
// pró-labore — usado na alavancagem operacional (comparisons.js) além do
// peso da folha sobre receita.
export function folhaTotalPeriodo(dp) {
  const meses = Object.keys(dp || {});
  if (!meses.length) return 0;
  return round2(meses.reduce((s, m) => s + (dp[m].total?.bruto || 0) + (dp[m].clt?.fgts || 0), 0));
}

export function calcHeadcountMedio(dp) {
  const meses = Object.keys(dp || {});
  if (!meses.length) return null;
  return meses.reduce((s, m) => s + (dp[m].total?.qtd || 0), 0) / meses.length;
}

// null quando não há nenhum mês de DP — quem renderiza mostra o card em
// estado "aguardando dados de DP" em vez de dividir por zero/undefined.
export function calcReceitaPorFuncionario(contabil, dp) {
  const headcountMedio = calcHeadcountMedio(dp);
  if (!headcountMedio || !contabil?.receita_liquida) return null;
  return contabil.receita_liquida / headcountMedio;
}

// Ponto de Equilíbrio (receita bruta mínima pra não ter prejuízo) e Margem
// de Segurança (quão acima/abaixo do break-even a empresa está operando).
// Aproximação de custo fixo/variável a partir do schema atual (sem balanço
// patrimonial): custo variável = CMV + Deduções (escalam com a venda); custo
// fixo = Despesas Administrativas + Despesas Gerais (estrutura, folha,
// aluguel — relativamente fixos no curto prazo). Resultado Financeiro fica
// de fora de propósito: break-even é uma métrica operacional.
// margemContribuicaoPct <= 0 (ou receita bruta ausente) -> null, não dá pra
// calcular break-even quando a empresa perde dinheiro em cada venda adicional.
export function calcPontoEquilibrio(contabil) {
  const receitaBrutaTotal = contabil?.receita_bruta?.total;
  if (!receitaBrutaTotal) return null;

  const custosFixos = round2((contabil.despesas_administrativas?.total || 0) + (contabil.despesas_gerais?.total || 0));
  const margemContribuicaoPct = (contabil.lucro_bruto || 0) / receitaBrutaTotal;
  if (margemContribuicaoPct <= 0) return null;

  const pontoEquilibrio = round2(custosFixos / margemContribuicaoPct);
  const margemSeguranca = ((receitaBrutaTotal - pontoEquilibrio) / receitaBrutaTotal) * 100;

  return { pontoEquilibrio, margemContribuicaoPct: margemContribuicaoPct * 100, margemSeguranca, custosFixos };
}

// ── indicadores do Balanço Patrimonial ──────────────────────────────────
// `balanco` no formato { data, ativo_circulante, ativo_nao_circulante,
// ativo_total, caixa_equivalentes, estoque, passivo_circulante,
// passivo_nao_circulante, fornecedores, patrimonio_liquido,
// resultado_exercicio } — ver balancoPatrimonial2026S1.js.

// Liquidez: capacidade de pagar as dívidas de curto prazo. Corrente = todo o
// ativo circulante; Seca = tira o estoque (nem sempre vira caixa rápido);
// Imediata = só o que já é caixa/equivalente, sem esperar recebimento.
export function calcLiquidez(balanco) {
  if (!balanco?.passivo_circulante) return null;
  const { ativo_circulante = 0, passivo_circulante, estoque = 0, caixa_equivalentes = 0 } = balanco;
  return {
    liquidezCorrente: ativo_circulante / passivo_circulante,
    liquidezSeca: (ativo_circulante - estoque) / passivo_circulante,
    liquidezImediata: caixa_equivalentes / passivo_circulante,
    capitalCirculanteLiquido: round2(ativo_circulante - passivo_circulante),
  };
}

// Endividamento e estrutura de capital: quanto do ativo é financiado por
// terceiros (vs capital próprio), e quanto dessa dívida é de curto prazo
// (mais urgente) vs longo prazo.
export function calcEndividamento(balanco) {
  if (!balanco?.ativo_total) return null;
  const { passivo_circulante = 0, passivo_nao_circulante = 0, ativo_total, patrimonio_liquido = 0 } = balanco;
  const passivoTotal = round2(passivo_circulante + passivo_nao_circulante);
  return {
    passivoTotal,
    endividamentoGeral: (passivoTotal / ativo_total) * 100,
    composicaoEndividamento: passivoTotal ? (passivo_circulante / passivoTotal) * 100 : 0,
    participacaoCapitalProprio: (patrimonio_liquido / ativo_total) * 100,
    grauAlavancagem: patrimonio_liquido ? passivoTotal / patrimonio_liquido : null,
  };
}

// Mesma classificação fixo/variável usada no break-even (calcPontoEquilibrio),
// exposta como indicador próprio — quanto da estrutura de custo é fixo
// (não some se a venda cair) vs. variável (escala com a venda). Útil pra
// simular cenário ("se a receita cair 10%, quanto do custo cai junto?").
export function calcCustosFixosVariaveis(contabil) {
  const receitaBrutaTotal = contabil?.receita_bruta?.total;
  if (!receitaBrutaTotal) return null;

  const custosFixos = round2((contabil.despesas_administrativas?.total || 0) + (contabil.despesas_gerais?.total || 0));
  const custosVariaveis = round2(Math.abs(contabil.cmv || 0) + (contabil.deducoes?.total || 0));
  const total = custosFixos + custosVariaveis;
  if (!total) return null;

  return {
    custosFixos,
    custosVariaveis,
    pctFixos: (custosFixos / total) * 100,
    pctVariaveis: (custosVariaveis / total) * 100,
  };
}
