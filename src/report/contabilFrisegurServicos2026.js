// Bloco contabil (DRE) REAL de FRISEGUR SERVICOS E MONITORAMENTO ELETRONICO LTDA, acumulado ate 2026-05-31
// (arquivo D.R.E. fornecido pelo cliente, pasta frisegur/ - convertido de .xls antigo via Excel COM).
// Empresa de servico puro (vigilancia/monitoramento), Simples Nacional - sem CMV (nao ha
// 'custo das mercadorias'), deducoes sao ISS + SIMPLES NACIONAL (nao ICMS/PIS/COFINS avulsos como
// no comercio). 'Despesas Tributarias' (alvara, taxas) do arquivo original foi somada dentro de
// despesas_gerais; 'Despesas/Receitas Financeiras' + 'Outras Receitas Operacionais' (ressarcimento
// de despesas trabalhistas) foram somadas num unico resultado_financeiro liquido. Todos os totais
// abaixo reconciliam exatamente com o 'Resultado Liquido do Exercicio' impresso no arquivo original
// (-190029.15).
export const CONTABIL_FRISEGUR_SERVICOS_2026 = {
    "receita_bruta": {"vendas_prazo": 0, "vendas_vista": 711578.09, "total": 711578.09},
    "deducoes": {"icms": 0, "cofins": 0, "pis": 0, "devolucao": 0, "iss": 33099.07, "simples_nacional": 48710.7, "total": 81809.77},
    "receita_liquida": 629768.32,
    "cmv": 0,
    "lucro_bruto": 629768.32,
    "despesas_administrativas": {"HORAS EXTRAS": 20907.07, "VALE TRANSPORTE": 24583.56, "SALÁRIOS E ORDENADOS": 402781.0, "PRÓ-LABORE": 8105.0, "AJUDA DE CUSTO": 78128.43, "13º SALÁRIO": 40236.79, "FÉRIAS": 59620.41, "AVISO PRÉVIO": 11527.78, "INSS": 117264.71, "FGTS": 51011.76, "ADICIONAL NOTURNO": 15973.48, "SERVIÇOS CONTRATADOS": 1491.65, "SERVIÇOS PRESTADOS POR TERCEIROS": 1655.0, "total": 833286.64},
    "despesas_gerais": {"ASSOCIACOES": 40.0, "SEGUROS": 4200.12, "OUTRAS DESPESAS": 537.0, "ALVARÁ": 677.69, "total": 5454.81},
    "resultado_financeiro": 18943.98,
    "lucro_liquido": -190029.15
  };
