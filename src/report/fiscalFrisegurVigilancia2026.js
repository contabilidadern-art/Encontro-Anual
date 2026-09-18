// Bloco fiscal 2026 REAL - extraido de NFS-e (padrao nacional) emitidas pela FRISEGUR VIGILANCIA E SEGURANCA LTDA
// (CNPJ 13563628000147), pasta frisegur/frisegur/*.zip. Servico puro (vigilancia/monitoramento) - sem
// compras/fornecedores rastreados (so ha NFS-e de saida coletadas); vendas_por_uf calculada pelo
// municipio do tomador. Competencia extraida do texto 'PERIODO:MES/ANO' da descricao do servico,
// com fallback pro mes de dCompet quando ausente.
export const FRISEGUR_VIGILANCIA_2026 = {
  "2026-01": {
    "faturamento": 62593.31,
    "vendas": 62593.31,
    "compras": 0,
    "vendas_por_uf": {
        "RJ": 32609.07,
        "SP": 29984.24
      },
    "compras_por_uf": {},
    "top_clientes": [
        { "nome": "CONSORCIO - FLUMINENSE", "valor": 29984.24 },
        { "nome": "CONCESSIONARIA ROTA 116 S/A", "valor": 17384.21 },
        { "nome": "LMG ENGENHARIA LTDA", "valor": 14146.86 },
        { "nome": "FRIBURGO SHOPPING CENTER", "valor": 1078.0 }
      ],
    "top_fornecedores": []
  },
  "2026-02": {
    "faturamento": 110411.6,
    "vendas": 110411.6,
    "compras": 0,
    "vendas_por_uf": {
        "RJ": 110411.6
      },
    "compras_por_uf": {},
    "top_clientes": [
        { "nome": "CONCESSIONARIA ROTA 116 S/A", "valor": 107865.6 },
        { "nome": "GSM SOLARION 02 SA", "valor": 1818.0 },
        { "nome": "MITROPLAST ADMINISTRADORA DE IMOVEIS PROPRIOS LTDA", "valor": 500.0 },
        { "nome": "RCPN DO 6 DISTRITO DA COMARCA DE NOVA FRIBURGO", "valor": 228.0 }
      ],
    "top_fornecedores": []
  },
  "2026-04": {
    "faturamento": 78899.52,
    "vendas": 78899.52,
    "compras": 0,
    "vendas_por_uf": {
        "RJ": 48915.28,
        "SP": 29984.24
      },
    "compras_por_uf": {},
    "top_clientes": [
        { "nome": "CONCESSIONARIA ROTA 116 S/A", "valor": 34768.42 },
        { "nome": "CONSORCIO - FLUMINENSE", "valor": 29984.24 },
        { "nome": "LMG ENGENHARIA LTDA", "valor": 14146.86 }
      ],
    "top_fornecedores": []
  },
  "2026-05": {
    "faturamento": 287074.31,
    "vendas": 287074.31,
    "compras": 0,
    "vendas_por_uf": {
        "RJ": 257090.07,
        "SP": 29984.24
      },
    "compras_por_uf": {},
    "top_clientes": [
        { "nome": "CONCESSIONARIA ROTA 116 S/A", "valor": 239096.21 },
        { "nome": "CONSORCIO - FLUMINENSE", "valor": 29984.24 },
        { "nome": "LMG ENGENHARIA LTDA", "valor": 14146.86 },
        { "nome": "GSM SOLARION 02 SA", "valor": 1937.0 },
        { "nome": "FRIBURGO SHOPPING CENTER", "valor": 1149.0 },
        { "nome": "MITROPLAST ADMINISTRADORA DE IMOVEIS PROPRIOS LTDA", "valor": 533.0 },
        { "nome": "RCPN DO 6 DISTRITO DA COMARCA DE NOVA FRIBURGO", "valor": 228.0 }
      ],
    "top_fornecedores": []
  },
  "2026-06": {
    "faturamento": 111127.0,
    "vendas": 111127.0,
    "compras": 0,
    "vendas_por_uf": {
        "RJ": 111127.0
      },
    "compras_por_uf": {},
    "top_clientes": [
        { "nome": "CONCESSIONARIA ROTA 116 S/A", "valor": 107280.0 },
        { "nome": "GSM SOLARION 02 SA", "valor": 1937.0 },
        { "nome": "FRIBURGO SHOPPING CENTER", "valor": 1149.0 },
        { "nome": "MITROPLAST ADMINISTRADORA DE IMOVEIS PROPRIOS LTDA", "valor": 533.0 },
        { "nome": "RCPN DO 6 DISTRITO DA COMARCA DE NOVA FRIBURGO", "valor": 228.0 }
      ],
    "top_fornecedores": []
  }
};
