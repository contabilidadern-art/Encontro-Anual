// Padrões de texto (regex, case-insensitive) para identificar contas cujo
// nome de conta varia de empresa para empresa dentro de despesas_administrativas
// / despesas_gerais (schema é um dict livre {conta: valor}, sem chave fixa).
// Ajustar/expandir por cliente conforme aparecerem novos nomes de conta —
// não há necessidade de alterar código, só esta lista.

export const PADROES_DEPRECIACAO = [
  /deprecia/i,
  /amortiza/i,
];

export const PADROES_NAO_RECORRENTES = [
  /ressarciment/i,
  /brinde/i,
  /bonifica[cç][aã]o/i,
  /indeniza[cç][aã]o/i,
  /doa[cç][aã]o/i,
  /n[aã]o.?recorrente/i,
  /eventual/i,
  /at[ií]pic/i,
];
