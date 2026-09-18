// Bloco contabil (DRE) REAL de FRISEGUR VIGILANCIA E SEGURANCA LTDA, acumulado ate 2026-05-31
// (arquivo D.R.E. fornecido pelo cliente, pasta frisegur/ - convertido de .xls antigo via Excel COM).
// Empresa de servico puro (vigilancia/monitoramento), Simples Nacional - sem CMV (nao ha
// 'custo das mercadorias'), deducoes sao ISS + SIMPLES NACIONAL (nao ICMS/PIS/COFINS avulsos como
// no comercio). 'Despesas Tributarias' (alvara, taxas) do arquivo original foi somada dentro de
// despesas_gerais; 'Despesas/Receitas Financeiras' + 'Outras Receitas Operacionais' (ressarcimento
// de despesas trabalhistas) foram somadas num unico resultado_financeiro liquido. Todos os totais
// abaixo reconciliam exatamente com o 'Resultado Liquido do Exercicio' impresso no arquivo original
// (-34589.12).
export const CONTABIL_FRISEGUR_VIGILANCIA_2026 = {
    "receita_bruta": {"vendas_prazo": 0, "vendas_vista": 867433.0, "total": 867433.0},
    "deducoes": {"icms": 0, "cofins": 0, "pis": 0, "devolucao": 0, "iss": 43336.63, "simples_nacional": 51689.6, "total": 95026.23},
    "receita_liquida": 772406.77,
    "cmv": 0,
    "lucro_bruto": 772406.77,
    "despesas_administrativas": {"HORAS EXTRAS": 24216.31, "VALE TRANSPORTE": 11933.3, "SALÁRIOS E ORDENADOS": 289968.36, "INSALUBRIDADE/PERICULOSIDADE": 12168.46, "PRÓ-LABORE": 27725.0, "ALIMENTAÇÃO EMPREGADOS": 67446.25, "13º SALÁRIO": 35875.97, "CURSOS DE APERFEIÇOAMENTOS": 760.0, "CONT. SINDICAL EMPREGADOS": 862.0, "FÉRIAS": 129159.64, "AVISO PRÉVIO": 3720.32, "INSS": 113983.3, "FGTS": 43383.63, "ADICIONAL NOTURNO": 19737.01, "SERVIÇOS CONTRATADOS": 14567.88, "SERVIÇOS PRESTADOS POR TERCEIROS": 525.0, "total": 796032.43},
    "despesas_gerais": {"ENERGIA ELÉTRICA": 501.14, "ÁGUA E ESGOTO": 1415.27, "INTERNET E AFINS": 519.96, "TELEFONE": 295.3, "SEGUROS": 2012.04, "OUTRAS DESPESAS": 3372.65, "TAXAS MUNICIPAIS": 1098.1, "TAXAS FEDERAIS": 43.8, "ALVARÁ": 677.69, "total": 9935.95},
    "resultado_financeiro": -1027.51,
    "lucro_liquido": -34589.12
  };
