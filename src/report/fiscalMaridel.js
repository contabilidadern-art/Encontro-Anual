// Bloco fiscal de MARIDEL N.F. DA SERRA LINGERIE LTDA, periodo mai/2025-mai/2026.
//
// faturamento/vendas: Relatorio de Faturamento oficial do Dominio (print do
// cliente, periodo 01/05/2025 a 31/05/2026, coluna "Saidas R$" — bate com o
// "Totais" impresso: R$511.294,23). Substitui uma estimativa anterior
// (R$865.259,50) que eu tinha tirado de outro relatorio (Acompanhamento de
// Saidas, base ICMS) — aquele era o tipo errado de relatorio pra faturamento,
// ficou bem mais alto que o real.
//
// compras: "Acompanhamento de Entradas" (mesmo relatorio Dominio, um print
// por mes) — usei a linha "Total Geral" ICMS (coluna "Valor Contabil") de
// cada mes como proxy de compras. Nao tenho os prints de mai/25 e jun/25
// ainda, entao esses dois meses ficam com compras null (nao zero).
//
// vendas_por_uf/compras_por_uf: o cliente mandou o "Acompanhamento de
// Entradas/Saidas" agregado do periodo INTEIRO quebrado por Estado — só
// aparece "Estado: RJ" nos dois (entrada e saida), batendo exatamente com o
// Total Geral, ou seja 100% das operacoes sao no RJ. Apliquei essa
// concentracao (RJ = 100%) em cima dos valores mensais REAIS que já tenho
// (faturamento oficial / compras por CFOP) em vez de usar os totais desse
// relatorio agregado direto, que ja sei que nao reconciliam com o
// faturamento oficial (ver acima). Ou seja: o "100% RJ" é confirmado: os
// valores em si (R$ por mês) vêm de outra fonte.
//
// top_clientes/top_fornecedores: NAO disponiveis nesse nivel de detalhe
// pros valores mensais reconciliados — os prints de "Acompanhamento" trazem
// por CFOP/Estado, nao por cliente/fornecedor, e o detalhamento por cliente
// que eu tinha (AKIK, D.F. Fernandes, Familia Juntos Holding) foi tirado do
// relatorio de base ICMS errado, entao fica de fora.
//
// dp/dp_nominal/contabil (DRE): dp já é real (ver dpMaridel.js); contabil
// ainda sem fonte nenhuma levantada.
const RJ = (v) => (v == null ? {} : { RJ: v });

export const FISCAL_MARIDEL_ANUAL = {
  "2025-05": { faturamento: 38450.00, vendas: 38450.00, compras: null, vendas_por_uf: RJ(38450.00), compras_por_uf: RJ(null) },
  "2025-06": { faturamento: 26150.57, vendas: 26150.57, compras: null, vendas_por_uf: RJ(26150.57), compras_por_uf: RJ(null) },
  "2025-07": { faturamento: 39995.70, vendas: 39995.70, compras: 40227.02, vendas_por_uf: RJ(39995.70), compras_por_uf: RJ(40227.02) },
  "2025-08": { faturamento: 30899.80, vendas: 30899.80, compras: 34567.51, vendas_por_uf: RJ(30899.80), compras_por_uf: RJ(34567.51) },
  "2025-09": { faturamento: 33510.00, vendas: 33510.00, compras: 33959.39, vendas_por_uf: RJ(33510.00), compras_por_uf: RJ(33959.39) },
  "2025-10": { faturamento: 66903.60, vendas: 66903.60, compras: 34211.76, vendas_por_uf: RJ(66903.60), compras_por_uf: RJ(34211.76) },
  "2025-11": { faturamento: 30628.06, vendas: 30628.06, compras: 17580.88, vendas_por_uf: RJ(30628.06), compras_por_uf: RJ(17580.88) },
  "2025-12": { faturamento: 33451.80, vendas: 33451.80, compras: 16980.88, vendas_por_uf: RJ(33451.80), compras_por_uf: RJ(16980.88) },
  "2026-01": { faturamento: 66903.60, vendas: 66903.60, compras: 16980.88, vendas_por_uf: RJ(66903.60), compras_por_uf: RJ(16980.88) },
  "2026-02": { faturamento: 33451.80, vendas: 33451.80, compras: 16980.88, vendas_por_uf: RJ(33451.80), compras_por_uf: RJ(16980.88) },
  "2026-03": { faturamento: 44045.70, vendas: 44045.70, compras: 18498.04, vendas_por_uf: RJ(44045.70), compras_por_uf: RJ(18498.04) },
  "2026-04": { faturamento: 33451.80, vendas: 33451.80, compras: 17955.62, vendas_por_uf: RJ(33451.80), compras_por_uf: RJ(17955.62) },
  "2026-05": { faturamento: 33451.80, vendas: 33451.80, compras: 36109.13, vendas_por_uf: RJ(33451.80), compras_por_uf: RJ(36109.13) },
};
