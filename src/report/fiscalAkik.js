// Bloco fiscal de AKIK LINGERIE LTDA, periodo mai/2025-jun/2026.
//
// faturamento/vendas: Relatorio de Faturamento oficial do Dominio (o cliente
// mandou print, periodo 01/05/2025 a 31/05/2026 — bate com o que a
// contabilidade usa) para mai/25 a mai/26. jun/26 ainda nao tem esse
// relatorio, entao fica com o valor do SPED Fiscal mesmo (ver abaixo),
// sinalizado como a fonte menos definitiva dos 14 meses.
//
// Descartei o faturamento que eu tinha calculado somando <vNF> dos XML de
// NFe SAIDA direto (tanto pra mai-nov/25 quanto pra conferir jan-mai/26
// contra o SPED): batia so em dez/25 (R$430.680,20 nos dois metodos), nos
// outros meses ficava sistematicamente ~R$35-92 mil ACIMA do relatorio do
// Dominio — parte disso era duplicata real (os 2 lotes de XML se
// sobrepunham em set/25, dobrando o mes), parte era nota cancelada/devolucao
// contada como venda, mas mesmo corrigindo isso sobrava diferenca (provavel
// remessa/amostra/bonificacao que entra no XML mas nao no faturamento
// oficial). Como o Dominio e a fonte que a contabilidade usa de verdade,
// ganhou dele.
//
// compras/compras_por_uf/top_fornecedores: SPED Fiscal (dez/25, jan-jun/26)
// ou soma de <vNF> dos XML de NFe ENTRADA reais (mai-nov/25 — sem esse
// problema de duplicata/cancelamento que o lote de SAIDA teve).
//
// vendas_por_uf/top_clientes: aproximados, tirados dos mesmos XML de NFe
// SAIDA (deduplicados, sem as notas canceladas/devolucao) — o TOTAL desses
// dois campos pode nao bater exatamente com faturamento (que agora vem do
// Dominio), sao so uma quebra aproximada de composicao geografica/cliente.
export const FISCAL_AKIK_ANUAL = {
  "2025-05": {
    "faturamento": 861239.0,
    "vendas": 861239.0,
    "compras": 309516.8,
    "vendas_por_uf": {
      "RJ": 898860.3,
      "SP": 51195.52,
      "RS": 701.56
    },
    "compras_por_uf": {
      "SC": 27849.87,
      "RS": 22818.6,
      "RJ": 168132.93,
      "CE": 918.4,
      "ES": 1919.55,
      "SP": 87729.42,
      "MG": 148.03
    },
    "top_clientes": [
      {
        "nome": "Lojas Renner S.A.",
        "valor": 769664.0
      },
      {
        "nome": "ROMANCE COMERCIO DE CONFECCOES LTDA",
        "valor": 53005.0
      },
      {
        "nome": "Mainetti do Brasil Servicos LTDA",
        "valor": 51120.0
      },
      {
        "nome": "CRISDU MODA INTIMA LTDA",
        "valor": 38570.0
      },
      {
        "nome": "MARIDEL N.F DA SERRA LINGERIE LTDA",
        "valor": 28908.0
      },
      {
        "nome": "D F Fernandes Confeccoes Ltda",
        "valor": 8713.3
      },
      {
        "nome": "LOJAS RENNER SA",
        "valor": 701.56
      },
      {
        "nome": "Fitas Elasticas Estrela LTDA",
        "valor": 75.52
      }
    ],
    "top_fornecedores": [
      {
        "nome": "MARIDEL N.F. DA SERRA LINGERIE LTDA",
        "valor": 110720.1
      },
      {
        "nome": "MAINETTI DO BRASIL SERVICOS LTDA",
        "valor": 37440.0
      },
      {
        "nome": "Malhas e Confeccoes Caricia Ltda",
        "valor": 24303.52
      },
      {
        "nome": "Artplast de Friburgo Ind. Com. de Plasticos Ltda.",
        "valor": 18873.99
      },
      {
        "nome": "BZK TEXTIL LTDA",
        "valor": 17497.77
      },
      {
        "nome": "FITAS ELASTICAS ESTRELA LTDA",
        "valor": 17476.77
      },
      {
        "nome": "CRISDU MODA INTIMA LTDA - EPP",
        "valor": 14689.0
      },
      {
        "nome": "CRISDU MODA INTIMA LTDA",
        "valor": 13987.43
      },
      {
        "nome": "Coretex Indústria Têxtil Ltda",
        "valor": 10225.44
      },
      {
        "nome": "SENSORMATIC DO BRASIL ELETRONICA LTDA",
        "valor": 8882.48
      }
    ]
  },
  "2025-06": {
    "faturamento": 831766.4,
    "vendas": 831766.4,
    "compras": 541734.02,
    "vendas_por_uf": {
      "RJ": 873738.12,
      "SP": 44220.86
    },
    "compras_por_uf": {
      "RJ": 218173.06,
      "SP": 177506.82,
      "SC": 69136.33,
      "RS": 827.21,
      "CE": 76001.6,
      "PR": 89.0
    },
    "top_clientes": [
      {
        "nome": "Lojas Renner S.A.",
        "valor": 627271.4
      },
      {
        "nome": "CRISDU MODA INTIMA LTDA",
        "valor": 158832.5
      },
      {
        "nome": "ROMANCE COMERCIO DE CONFECCOES LTDA",
        "valor": 45662.5
      },
      {
        "nome": "Mainetti do Brasil Servicos LTDA",
        "valor": 37440.0
      },
      {
        "nome": "MARIDEL N.F DA SERRA LINGERIE LTDA",
        "valor": 28908.0
      },
      {
        "nome": "D F Fernandes Confeccoes Ltda",
        "valor": 13063.72
      },
      {
        "nome": "Fitas Elasticas Estrela LTDA",
        "valor": 5038.35
      },
      {
        "nome": "Rosset  Cia LTDA",
        "valor": 1742.51
      }
    ],
    "top_fornecedores": [
      {
        "nome": "ROSSET &amp; CIA LTDA",
        "valor": 88457.45
      },
      {
        "nome": "DELFA IND E COM DE ACESSORIOS DO VESTUARIO LTDA",
        "valor": 76001.6
      },
      {
        "nome": "Artplast de Friburgo Ind. Com. de Plasticos Ltda.",
        "valor": 74149.78
      },
      {
        "nome": "D.F.Fernandes Confeccoes LTDA",
        "valor": 59092.74
      },
      {
        "nome": "MARIDEL N.F. DA SERRA LINGERIE LTDA",
        "valor": 44195.4
      },
      {
        "nome": "FITAS ELASTICAS ESTRELA LTDA",
        "valor": 31508.06
      },
      {
        "nome": "MAINETTI DO BRASIL SERVICOS LTDA",
        "valor": 25920.0
      },
      {
        "nome": "ZANOTTI INDUSTRIA E COMERCIO LTDA",
        "valor": 21427.1
      },
      {
        "nome": "SENSORMATIC DO BRASIL ELETRONICA LTDA",
        "valor": 21254.31
      },
      {
        "nome": "Malhas e Confeccoes Caricia Ltda",
        "valor": 17561.1
      }
    ]
  },
  "2025-07": {
    "faturamento": 836726.8,
    "vendas": 836726.8,
    "compras": 843941.97,
    "vendas_por_uf": {
      "RJ": 902965.31,
      "SP": 25920.0,
      "RS": 349.54
    },
    "compras_por_uf": {
      "SP": 275194.81,
      "RJ": 260276.52,
      "SC": 56849.14,
      "CE": 249092.4,
      "RS": 930.34,
      "ES": 1598.76
    },
    "top_clientes": [
      {
        "nome": "Lojas Renner S.A.",
        "valor": 639326.8
      },
      {
        "nome": "CRISDU MODA INTIMA LTDA",
        "valor": 161212.5
      },
      {
        "nome": "D F Fernandes Confeccoes Ltda",
        "valor": 37330.51
      },
      {
        "nome": "ROMANCE COMERCIO DE CONFECCOES LTDA",
        "valor": 36187.5
      },
      {
        "nome": "MARIDEL N.F DA SERRA LINGERIE LTDA",
        "valor": 28908.0
      },
      {
        "nome": "Mainetti do Brasil Servicos LTDA",
        "valor": 25920.0
      },
      {
        "nome": "LOJAS RENNER SA",
        "valor": 349.54
      }
    ],
    "top_fornecedores": [
      {
        "nome": "DELFA IND E COM DE ACESSORIOS DO VESTUARIO LTDA",
        "valor": 249092.4
      },
      {
        "nome": "ROSSET &amp; CIA LTDA",
        "valor": 115233.95
      },
      {
        "nome": "Artplast de Friburgo Ind. Com. de Plasticos Ltda.",
        "valor": 70779.94
      },
      {
        "nome": "FITAS ELASTICAS ESTRELA LTDA",
        "valor": 60607.06
      },
      {
        "nome": "D.F.Fernandes Confeccoes LTDA",
        "valor": 58403.07
      },
      {
        "nome": "MARIDEL N.F. DA SERRA LINGERIE LTDA",
        "valor": 48909.6
      },
      {
        "nome": "Malhas e Confeccoes Caricia Ltda",
        "valor": 48822.31
      },
      {
        "nome": "MAINETTI DO BRASIL SERVICOS LTDA",
        "valor": 32400.0
      },
      {
        "nome": "CRISDU MODA INTIMA LTDA",
        "valor": 27749.83
      },
      {
        "nome": "TERLIZZI  ARTEFATOS PARA LINGERIE LTDA",
        "valor": 23620.38
      }
    ]
  },
  "2025-08": {
    "faturamento": 958119.8,
    "vendas": 958119.8,
    "compras": 820770.39,
    "vendas_por_uf": {
      "RJ": 997674.75,
      "CE": 4113.2,
      "SP": 12960.0,
      "RS": 624.76
    },
    "compras_por_uf": {
      "SP": 274244.83,
      "RS": 36515.1,
      "RJ": 295500.02,
      "CE": 170153.6,
      "SC": 43671.44,
      "ES": 685.4
    },
    "top_clientes": [
      {
        "nome": "Lojas Renner S.A.",
        "valor": 837369.8
      },
      {
        "nome": "ROMANCE COMERCIO DE CONFECCOES LTDA",
        "valor": 76210.0
      },
      {
        "nome": "CRISDU MODA INTIMA LTDA",
        "valor": 44540.0
      },
      {
        "nome": "MARIDEL N.F DA SERRA LINGERIE LTDA",
        "valor": 28908.0
      },
      {
        "nome": "Mainetti do Brasil Servicos LTDA",
        "valor": 12960.0
      },
      {
        "nome": "D F Fernandes Confeccoes Ltda",
        "valor": 10646.95
      },
      {
        "nome": "Delfa Ind e Com de Acessorios do Vestuario LTDA",
        "valor": 4113.2
      },
      {
        "nome": "LOJAS RENNER SA",
        "valor": 624.76
      }
    ],
    "top_fornecedores": [
      {
        "nome": "DELFA IND E COM DE ACESSORIOS DO VESTUARIO LTDA",
        "valor": 170153.6
      },
      {
        "nome": "ROSSET &amp; CIA LTDA",
        "valor": 157888.21
      },
      {
        "nome": "D.F.Fernandes Confeccoes LTDA",
        "valor": 108658.89
      },
      {
        "nome": "Artplast de Friburgo Ind. Com. de Plasticos Ltda.",
        "valor": 70448.08
      },
      {
        "nome": "Malhas e Confeccoes Caricia Ltda",
        "valor": 63998.06
      },
      {
        "nome": "MARIDEL N.F. DA SERRA LINGERIE LTDA",
        "valor": 46807.8
      },
      {
        "nome": "MAINETTI DO BRASIL SERVICOS LTDA",
        "valor": 42480.0
      },
      {
        "nome": "CRISDU MODA INTIMA LTDA - EPP",
        "valor": 35317.7
      },
      {
        "nome": "CRISDU MODA INTIMA LTDA",
        "valor": 35036.57
      },
      {
        "nome": "SENSORMATIC DO BRASIL ELETRONICA LTDA",
        "valor": 33482.96
      }
    ]
  },
  "2025-09": {
    "faturamento": 1406987.65,
    "vendas": 1406987.65,
    "compras": 329502.22,
    "vendas_por_uf": {
      "RS": 417.6,
      "RJ": 2813975.3,
      "SP": 87249.6
    },
    "compras_por_uf": {
      "RJ": 48936.51,
      "RS": 61103.87,
      "SP": 44783.9,
      "SC": 47026.39,
      "CE": 15660.0,
      "MG": 111991.55
    },
    "top_clientes": [
      {
        "nome": "Lojas Renner S.A.",
        "valor": 2692055.3
      },
      {
        "nome": "Mainetti do Brasil Servicos LTDA",
        "valor": 84960.0
      },
      {
        "nome": "CRISDU MODA INTIMA LTDA",
        "valor": 81280.0
      },
      {
        "nome": "ROMANCE COMERCIO DE CONFECCOES LTDA",
        "valor": 40640.0
      },
      {
        "nome": "Cavemac Industrial e Comercial de Maquinas Imp. e Exp. LTDA",
        "valor": 2289.6
      },
      {
        "nome": "LOJAS RENNER SA",
        "valor": 417.6
      }
    ],
    "top_fornecedores": [
      {
        "nome": "Stellantis Automoveis Brasil Ltda.",
        "valor": 111991.55
      },
      {
        "nome": "CRISDU MODA INTIMA LTDA - EPP",
        "valor": 53050.5
      },
      {
        "nome": "CRISDU MODA INTIMA LTDA",
        "valor": 46052.99
      },
      {
        "nome": "MAINETTI DO BRASIL SERVICOS LTDA",
        "valor": 31680.0
      },
      {
        "nome": "Malhas e Confeccoes Caricia Ltda",
        "valor": 19855.09
      },
      {
        "nome": "DELFA IND E COM DE ACESSORIOS DO VESTUARIO LTDA",
        "valor": 15660.0
      },
      {
        "nome": "Artplast de Friburgo Ind. Com. de Plasticos Ltda.",
        "valor": 13575.54
      },
      {
        "nome": "New Paper Industria e Comercio de Embalagens LTDA",
        "valor": 7785.15
      },
      {
        "nome": "SENSORMATIC DO BRASIL ELETRONICA LTDA",
        "valor": 5280.33
      },
      {
        "nome": "RODRIGO E EMILIA MERCEARIA LTDA",
        "valor": 4198.4
      }
    ]
  },
  "2025-10": {
    "faturamento": 1055215.0,
    "vendas": 1055215.0,
    "compras": 365331.34,
    "vendas_por_uf": {
      "RJ": 1055215.0,
      "RS": 126.65,
      "SP": 43352.0,
      "SC": 804.1
    },
    "compras_por_uf": {
      "ES": 22642.01,
      "RJ": 190694.98,
      "SC": 39757.0,
      "SP": 111237.46,
      "CE": 1.0,
      "RS": 998.89
    },
    "top_clientes": [
      {
        "nome": "Lojas Renner S.A.",
        "valor": 973935.0
      },
      {
        "nome": "ROMANCE COMERCIO DE CONFECCOES LTDA",
        "valor": 48843.0
      },
      {
        "nome": "Mainetti do Brasil Servicos LTDA",
        "valor": 43352.0
      },
      {
        "nome": "CRISDU MODA INTIMA LTDA",
        "valor": 32437.0
      },
      {
        "nome": "COLOR TIM COM. E TINGIMENTOS DE AVIAMENTOS LTDA",
        "valor": 804.1
      },
      {
        "nome": "LOJAS RENNER SA",
        "valor": 126.65
      }
    ],
    "top_fornecedores": [
      {
        "nome": "WW DA SERRA VEICULOS LTDA",
        "valor": 126990.0
      },
      {
        "nome": "MAINETTI DO BRASIL SERVICOS LTDA",
        "valor": 38840.0
      },
      {
        "nome": "ROSSET &amp; CIA LTDA",
        "valor": 36376.52
      },
      {
        "nome": "Artplast de Friburgo Ind. Com. de Plasticos Ltda.",
        "valor": 30717.57
      },
      {
        "nome": "EXCIM Importacao e Exportacao Ltda.",
        "valor": 22642.01
      },
      {
        "nome": "Malhas e Confeccoes Caricia Ltda",
        "valor": 21040.92
      },
      {
        "nome": "SENSORMATIC DO BRASIL ELETRONICA LTDA",
        "valor": 19597.17
      },
      {
        "nome": "Coretex Indústria Têxtil Ltda",
        "valor": 13667.86
      },
      {
        "nome": "LUNELLI TEXTIL LTDA",
        "valor": 8152.07
      },
      {
        "nome": "ZANOTTI INDUSTRIA E COMERCIO LTDA",
        "valor": 6215.17
      }
    ]
  },
  "2025-11": {
    "faturamento": 930122.6,
    "vendas": 930122.6,
    "compras": 423202.37,
    "vendas_por_uf": {
      "RS": 708.35,
      "RJ": 930122.6,
      "SP": 30048.0,
      "SC": 3805.37
    },
    "compras_por_uf": {
      "RJ": 193389.01,
      "SP": 89841.16,
      "SC": 85618.3,
      "CE": 47304.0,
      "BA": 189.9,
      "RS": 6860.0
    },
    "top_clientes": [
      {
        "nome": "Lojas Renner S.A.",
        "valor": 848842.6
      },
      {
        "nome": "CRISDU MODA INTIMA LTDA",
        "valor": 40640.0
      },
      {
        "nome": "ROMANCE COMERCIO DE CONFECCOES LTDA",
        "valor": 40640.0
      },
      {
        "nome": "Mainetti do Brasil Servicos LTDA",
        "valor": 30048.0
      },
      {
        "nome": "Zanotti Industria e Comercio LTDA",
        "valor": 3805.37
      },
      {
        "nome": "LOJAS RENNER SA",
        "valor": 708.35
      }
    ],
    "top_fornecedores": [
      {
        "nome": "CASAL COM AUTO SERVICOS ALCANTARA LTDA",
        "valor": 125500.0
      },
      {
        "nome": "COLOR TIM",
        "valor": 49309.22
      },
      {
        "nome": "DELFA IND E COM DE ACESSORIOS DO VESTUARIO LTDA",
        "valor": 47304.0
      },
      {
        "nome": "Artplast de Friburgo Ind. Com. de Plasticos Ltda.",
        "valor": 44680.55
      },
      {
        "nome": "ROSSET &amp; CIA LTDA",
        "valor": 40109.33
      },
      {
        "nome": "FITAS ELASTICAS ESTRELA LTDA",
        "valor": 20686.84
      },
      {
        "nome": "MAINETTI DO BRASIL SERVICOS LTDA",
        "valor": 15840.0
      },
      {
        "nome": "MENEGOTTI TEXTIL LTDA",
        "valor": 10514.03
      },
      {
        "nome": "Malhas e Confeccoes Caricia Ltda",
        "valor": 9069.86
      },
      {
        "nome": "TERLIZZI  ARTEFATOS PARA LINGERIE LTDA",
        "valor": 8571.09
      }
    ]
  },
  "2025-12": {
    "faturamento": 428520.2,
    "vendas": 428520.2,
    "compras": 196535.55,
    "vendas_por_uf": {
      "RJ": 428520.2,
      "SP": 2160.0
    },
    "compras_por_uf": {
      "RJ": 134330.97,
      "SP": 56919.82,
      "SC": 5284.76
    },
    "top_clientes": [
      {
        "nome": "LOJAS RENNER SA",
        "valor": 387880.2
      },
      {
        "nome": "ROMANCE COMERCIO DE CONFECCOES LTDA",
        "valor": 40640.0
      },
      {
        "nome": "MAINETTI DO BRASIL SERVICOS LTDA",
        "valor": 2160.0
      }
    ],
    "top_fornecedores": [
      {
        "nome": "CASAL COM AUTO SERVICOS ALCANTARA LTDA",
        "valor": 125500.0
      },
      {
        "nome": "FITAS ELÁSTICAS ESTRELA LTDA",
        "valor": 46122.24
      },
      {
        "nome": "RODRIGO E EMILIA MERCEARIA LTDA ME",
        "valor": 4899.22
      },
      {
        "nome": "SENSORMATIC DO BRASIL ELETRONICA LTDA",
        "valor": 4430.98
      },
      {
        "nome": "MAINETTI DO BRASIL SERVICOS LTDA",
        "valor": 4320.0
      },
      {
        "nome": "CORETEX INDUSTRIA TEXTIL LTDA",
        "valor": 2743.86
      },
      {
        "nome": "ZANOTTI S.A.",
        "valor": 2322.0
      },
      {
        "nome": "GRAVAR 193 CARIMBOS E ETIQUETAS LTDA",
        "valor": 2082.0
      },
      {
        "nome": "PHDF PECAS E ACESSORIOS LTDA",
        "valor": 1590.0
      },
      {
        "nome": "MC HOLSCHAUER PECAS EPP",
        "valor": 1018.9
      }
    ]
  },
  "2026-01": {
    "faturamento": 350082.02,
    "vendas": 350082.02,
    "compras": 579282.3,
    "vendas_por_uf": {
      "RS": 389.5,
      "RJ": 350082.02,
      "SP": 30240.0,
      "SC": 1532.32
    },
    "compras_por_uf": {
      "RJ": 187204.22,
      "CE": 131861.6,
      "SP": 147582.45,
      "SC": 71388.44,
      "RS": 41229.59,
      "ES": 16.0
    },
    "top_clientes": [
      {
        "nome": "LOJAS RENNER SA",
        "valor": 309947.4
      },
      {
        "nome": "MAINETTI DO BRASIL SERVICOS LTDA",
        "valor": 30240.0
      },
      {
        "nome": "ROMANCE COMERCIO DE CONFECCOES LTDA",
        "valor": 20320.0
      },
      {
        "nome": "CRISDU MODA INTIMA LTDA - FL6",
        "valor": 20204.12
      },
      {
        "nome": "CRISDU MODA INTIMA LTDA",
        "valor": 1532.32
      }
    ],
    "top_fornecedores": [
      {
        "nome": "DELFA IND E COM DE ACESS VESTUÁRIO LTDA",
        "valor": 131861.6
      },
      {
        "nome": "ARTPLAST DE FRIBURGO IND E COM DE PLASTICOS LTDA",
        "valor": 124737.36
      },
      {
        "nome": "CRISDU MODA INTIMA LTDA",
        "valor": 62290.65
      },
      {
        "nome": "ROSSET & CIA LTDA",
        "valor": 49025.86
      },
      {
        "nome": "MALHAS E CONFECÇÕES CARÍCIA LTDA",
        "valor": 43919.88
      },
      {
        "nome": "MAINETTI DO BRASIL SERVICOS LTDA",
        "valor": 26640.0
      },
      {
        "nome": "SENSORMATIC DO BRASIL ELETRONICA LTDA",
        "valor": 23936.43
      },
      {
        "nome": "LUNELLI TEXTIL LTDA",
        "valor": 22971.97
      },
      {
        "nome": "FITAS ELÁSTICAS ESTRELA LTDA",
        "valor": 21594.87
      },
      {
        "nome": "ZANOTTI S.A.",
        "valor": 18456.31
      }
    ]
  },
  "2026-02": {
    "faturamento": 829955.9,
    "vendas": 829955.9,
    "compras": 493339.18,
    "vendas_por_uf": {
      "RS": 482.76,
      "RJ": 829955.9,
      "SP": 21088.0
    },
    "compras_por_uf": {
      "RJ": 141700.75,
      "CE": 47789.2,
      "SP": 172650.74,
      "SC": 80274.69,
      "ES": 13940.02,
      "RS": 6828.28,
      "MG": 30155.5
    },
    "top_clientes": [
      {
        "nome": "LOJAS RENNER SA",
        "valor": 830438.66
      },
      {
        "nome": "MAINETTI DO BRASIL SERVICOS LTDA",
        "valor": 21088.0
      }
    ],
    "top_fornecedores": [
      {
        "nome": "ARTPLAST DE FRIBURGO IND E COM DE PLASTICOS LTDA",
        "valor": 118071.74
      },
      {
        "nome": "MAINETTI DO BRASIL SERVICOS LTDA",
        "valor": 52048.0
      },
      {
        "nome": "DELFA IND E COM DE ACESS VESTUÁRIO LTDA",
        "valor": 47789.2
      },
      {
        "nome": "FITAS ELÁSTICAS ESTRELA LTDA",
        "valor": 40352.87
      },
      {
        "nome": "ZANOTTI S.A.",
        "valor": 36950.03
      },
      {
        "nome": "ROSSET & CIA LTDA",
        "valor": 32036.64
      },
      {
        "nome": "J. ROBERTO COMÉRCIO DE MÁQUINAS E ACESSÓRIOS LTDA",
        "valor": 30100.0
      },
      {
        "nome": "SENSORMATIC DO BRASIL ELETRONICA LTDA",
        "valor": 16592.02
      },
      {
        "nome": "MALHAS MENEGOTTI INDUSTRIA TEXTIL LTDA.",
        "valor": 16395.28
      },
      {
        "nome": "TEXTIL DE RENDAS ACACIA LTDA",
        "valor": 15660.0
      }
    ]
  },
  "2026-03": {
    "faturamento": 1062371.7,
    "vendas": 1062371.7,
    "compras": 341179.1,
    "vendas_por_uf": {
      "RS": 701.32,
      "RJ": 1062371.7,
      "SP": 45360.0,
      "SC": 1200.0
    },
    "compras_por_uf": {
      "RJ": 81854.57,
      "CE": 17783.2,
      "SP": 188426.01,
      "SC": 28798.83,
      "RS": 24267.5,
      "DF": 48.99
    },
    "top_clientes": [
      {
        "nome": "LOJAS RENNER SA",
        "valor": 981793.02
      },
      {
        "nome": "ROMANCE COMERCIO DE CONFECCOES LTDA",
        "valor": 60960.0
      },
      {
        "nome": "MAINETTI DO BRASIL SERVICOS LTDA",
        "valor": 45360.0
      },
      {
        "nome": "CRISDU MODA INTIMA LTDA - FL6",
        "valor": 20320.0
      },
      {
        "nome": "CRISDU MODA INTIMA LTDA",
        "valor": 1200.0
      }
    ],
    "top_fornecedores": [
      {
        "nome": "ROSSET & CIA LTDA",
        "valor": 141057.57
      },
      {
        "nome": "CRISDU MODA INTIMA LTDA",
        "valor": 45540.08
      },
      {
        "nome": "ARTPLAST DE FRIBURGO IND E COM DE PLASTICOS LTDA",
        "valor": 35389.8
      },
      {
        "nome": "SENSORMATIC DO BRASIL ELETRONICA LTDA",
        "valor": 21215.65
      },
      {
        "nome": "DELFA IND E COM DE ACESS VESTUÁRIO LTDA",
        "valor": 17783.2
      },
      {
        "nome": "CANOMA COMERCIO E DISTRIBUICAO LTDA",
        "valor": 13813.31
      },
      {
        "nome": "MAINETTI DO BRASIL SERVICOS LTDA",
        "valor": 12240.0
      },
      {
        "nome": "LACOS CARMEM LTDA",
        "valor": 8400.5
      },
      {
        "nome": "SERRA SILK CONF E COM DE ROUPAS",
        "valor": 5479.3
      },
      {
        "nome": "RODRIGO E EMILIA MERCEARIA LTDA ME",
        "valor": 5032.54
      }
    ]
  },
  "2026-04": {
    "faturamento": 977183.73,
    "vendas": 977183.73,
    "compras": 717357.68,
    "vendas_por_uf": {
      "RS": 206.5,
      "RJ": 958061.55,
      "SC": 5844.56,
      "SP": 30240.0,
      "MG": 30100.0
    },
    "compras_por_uf": {
      "RJ": 360977.79,
      "CE": 66506.2,
      "SP": 177382.21,
      "MG": 8360.12,
      "SC": 85969.65,
      "ES": 9684.43,
      "RS": 8477.28
    },
    "top_clientes": [
      {
        "nome": "LOJAS RENNER SA",
        "valor": 897308.05
      },
      {
        "nome": "CRISDU MODA INTIMA LTDA - FL6",
        "valor": 40640.0
      },
      {
        "nome": "MAINETTI DO BRASIL SERVICOS LTDA",
        "valor": 30240.0
      },
      {
        "nome": "J. ROBERTO COMERCIO DE MAQUINAS E ACESSORIOS LTDA",
        "valor": 30100.0
      },
      {
        "nome": "ROMANCE COMERCIO DE CONFECCOES LTDA",
        "valor": 20320.0
      },
      {
        "nome": "ZANOTTI S.A.",
        "valor": 3292.8
      },
      {
        "nome": "COLOR TIM COMERCIO E TINGIMENTO DE AVIAM",
        "valor": 2551.76
      }
    ],
    "top_fornecedores": [
      {
        "nome": "WW DA SERRA VEICULOS LTDA",
        "valor": 255480.0
      },
      {
        "nome": "ROSSET & CIA LTDA",
        "valor": 72425.96
      },
      {
        "nome": "DELFA IND E COM DE ACESS VESTUÁRIO LTDA",
        "valor": 66506.2
      },
      {
        "nome": "MAINETTI DO BRASIL SERVICOS LTDA",
        "valor": 54000.0
      },
      {
        "nome": "ARTPLAST DE FRIBURGO IND E COM DE PLASTICOS LTDA",
        "valor": 46109.91
      },
      {
        "nome": "FITAS ELÁSTICAS ESTRELA LTDA",
        "valor": 29436.5
      },
      {
        "nome": "WILLIAM MAQUINAS DE FRIBURGO LTDA",
        "valor": 28545.0
      },
      {
        "nome": "ZANOTTI S.A.",
        "valor": 24298.33
      },
      {
        "nome": "LUNELLI TEXTIL LTDA",
        "valor": 19796.91
      },
      {
        "nome": "MALHAS MENEGOTTI INDUSTRIA TEXTIL LTDA.",
        "valor": 18473.61
      }
    ]
  },
  "2026-05": {
    "faturamento": 826454.37,
    "vendas": 826454.37,
    "compras": 507778.1,
    "vendas_por_uf": {
      "RS": 643.69,
      "RJ": 818792.2,
      "SP": 10800.0
    },
    "compras_por_uf": {
      "RJ": 118746.8,
      "CE": 45022.4,
      "SP": 191135.36,
      "MG": 8851.5,
      "SC": 89557.02,
      "RS": 50871.15,
      "ES": 3443.97,
      "GO": 149.9
    },
    "top_clientes": [
      {
        "nome": "LOJAS RENNER SA",
        "valor": 778795.89
      },
      {
        "nome": "CRISDU MODA INTIMA LTDA - FL6",
        "valor": 40640.0
      },
      {
        "nome": "MAINETTI DO BRASIL SERVICOS LTDA",
        "valor": 10800.0
      }
    ],
    "top_fornecedores": [
      {
        "nome": "CRISDU MODA INTIMA LTDA",
        "valor": 88636.8
      },
      {
        "nome": "ROSSET & CIA LTDA",
        "valor": 74501.09
      },
      {
        "nome": "ARTPLAST DE FRIBURGO IND E COM DE PLASTICOS LTDA",
        "valor": 63601.41
      },
      {
        "nome": "DELFA IND E COM DE ACESS VESTUÁRIO LTDA",
        "valor": 45022.4
      },
      {
        "nome": "MAINETTI DO BRASIL SERVICOS LTDA",
        "valor": 38272.0
      },
      {
        "nome": "SENSORMATIC DO BRASIL ELETRONICA LTDA",
        "valor": 34912.62
      },
      {
        "nome": "FITAS ELÁSTICAS ESTRELA LTDA",
        "valor": 32166.21
      },
      {
        "nome": "ZANOTTI S.A.",
        "valor": 18121.86
      },
      {
        "nome": "COLOR TIM COM E TINGIMENTO DE AVIAMENTOS",
        "valor": 15504.49
      },
      {
        "nome": "LUNELLI TEXTIL LTDA",
        "valor": 12453.15
      }
    ]
  },
  "2026-06": {
    "faturamento": 1052604.55,
    "vendas": 1052604.55,
    "compras": 500605.36,
    "vendas_por_uf": {
      "RS": 387.97,
      "RJ": 989195.01,
      "SC": 2429.57,
      "SP": 60592.0
    },
    "compras_por_uf": {
      "RJ": 202329.4,
      "SP": 156006.15,
      "MG": 15653.16,
      "SC": 32695.99,
      "ES": 4564.64,
      "RS": 4200.0,
      "GO": 85156.02
    },
    "top_clientes": [
      {
        "nome": "LOJAS RENNER SA",
        "valor": 948942.97
      },
      {
        "nome": "MAINETTI DO BRASIL SERVICOS LTDA",
        "valor": 60592.0
      },
      {
        "nome": "CRISDU MODA INTIMA LTDA - FL6",
        "valor": 40640.01
      },
      {
        "nome": "ZANOTTI S.A.",
        "valor": 2429.57
      }
    ],
    "top_fornecedores": [
      {
        "nome": "WW DA SERRA VEICULOS LTDA",
        "valor": 133490.0
      },
      {
        "nome": "ROSSET & CIA LTDA",
        "valor": 93582.32
      },
      {
        "nome": "LYON TEXTIL LTDA",
        "valor": 85156.02
      },
      {
        "nome": "MAINETTI DO BRASIL SERVICOS LTDA",
        "valor": 42480.0
      },
      {
        "nome": "ARTPLAST DE FRIBURGO IND E COM DE PLASTICOS LTDA",
        "valor": 37418.75
      },
      {
        "nome": "TECELAGEM DE FITAS BRITANNIA LTDA",
        "valor": 15653.16
      },
      {
        "nome": "ZANOTTI S.A.",
        "valor": 14254.96
      },
      {
        "nome": "MALHAS MENEGOTTI INDUSTRIA TEXTIL LTDA.",
        "valor": 12578.29
      },
      {
        "nome": "JESCRI DE FRIBURGO MODA INTIMA LTDA",
        "valor": 7953.2
      },
      {
        "nome": "IND ARTEF METAIS TERLIZZI LTDA",
        "valor": 6714.49
      }
    ]
  }
};
