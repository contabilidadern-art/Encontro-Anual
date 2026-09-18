"""Parsers dos exports legados do Domínio (.xls convertido para .xlsx —
ver convert.py) para o schema do Report Semestral (clientes/{cnpj}/periodos/{ano}).

Cada parser recebe o caminho de um .xlsx já convertido e devolve dados em
memória (dict); a gravação no Firestore é feita por um script separado.
"""
import re
from pathlib import Path

import openpyxl


# ─────────────────────────── helpers comuns ────────────────────────────────

def _parse_brl(value) -> float:
    """Converte '1.705,00' / '0,00' / None em float. Formato BR (milhar '.', decimal ',')."""
    if value is None:
        return 0.0
    if isinstance(value, (int, float)):
        return float(value)
    s = str(value).strip()
    if not s:
        return 0.0
    s = s.replace(".", "").replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return 0.0


def _normalize_cnpj(value) -> str:
    return re.sub(r"\D", "", str(value or ""))


def _normalize_competencia(value) -> str:
    """'01/2026' -> '2026-01'."""
    s = str(value or "").strip()
    m = re.match(r"(\d{2})/(\d{4})", s)
    if not m:
        return s
    mes, ano = m.groups()
    return f"{ano}-{mes}"


def _strip_codigo_empresa(razao_social_bruta: str) -> str:
    """'720 - RODRIGO E EMILIA MERCEARIA LTDA' -> 'RODRIGO E EMILIA MERCEARIA LTDA'."""
    return re.sub(r"^\s*\d+\s*-\s*", "", str(razao_social_bruta or "")).strip()


# ─────────────────────────── parse_folha ───────────────────────────────────

# Colunas de valor são fixas neste layout (confirmado em arquivo real) —
# os rótulos do cabeçalho ficam 1-2 colunas deslocados dos valores por causa
# de mesclagem de células, então não dá pra usar a coluna do cabeçalho.
_FOLHA_COLS = {
    "codigo": 1,
    "nome": 5,
    "salario": 15,
    "out_prov": 18,
    "sal_fam": 21,
    "inss": 25,
    "irrf": 28,
    "out_desc": 30,
    "liquido": 32,
    "fgts": 35,
}


def parse_folha(path: str) -> dict:
    """Parser de 'Relação da Folha por Empregado'.

    O arquivo vem paginado: cada competência (mês) é impressa em N páginas,
    cada uma reimprimindo o cabeçalho Empresa/CNPJ/Competência. A seção
    'Empregados' (CLT) some nas páginas de continuação — só reaparece no
    início de cada competência — por isso o estado da seção atual persiste
    entre páginas e só reseta quando um novo bloco 'Empresa:' é encontrado.

    Devolve tanto o agregado (dashboard) quanto a lista nominal por
    competência (drill-down/anexo), mais admissões/demissões calculadas
    comparando o conjunto de códigos de empregado CLT entre meses
    consecutivos (código novo = admissão, código que sumiu = demissão).
    """
    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb[wb.sheetnames[0]]

    cliente = {"razao_social": None, "cnpj": None}
    nominal: dict[str, dict[str, list]] = {}  # competencia -> {'clt': [...], 'pro_labore': [...]}

    current_competencia = None
    current_section = None  # 'clt' | 'pro_labore'

    for r in range(1, ws.max_row + 1):
        col1 = ws.cell(row=r, column=1).value
        col2 = ws.cell(row=r, column=2).value

        if isinstance(col1, str) and col1.strip() == "Empresa:":
            if cliente["razao_social"] is None:
                nome_bruto = ws.cell(row=r, column=9).value
                cliente["razao_social"] = _strip_codigo_empresa(nome_bruto)
            continue

        if isinstance(col1, str) and col1.strip() == "CNPJ:":
            if cliente["cnpj"] is None:
                cliente["cnpj"] = _normalize_cnpj(ws.cell(row=r, column=9).value)
            continue

        if isinstance(col1, str) and col1.strip() == "Competência:":
            nova_competencia = _normalize_competencia(ws.cell(row=r, column=9).value)
            # "Competência:" reaparece em toda página (mesmo mês, cabeçalho repetido) —
            # só reseta a seção quando o mês realmente muda, senão a 2ª página em
            # diante perde os empregados (a seção "Empregados" não se repete
            # nas páginas de continuação, só no início da competência).
            if nova_competencia != current_competencia:
                current_section = None
            current_competencia = nova_competencia
            nominal.setdefault(current_competencia, {"clt": [], "pro_labore": []})
            continue

        if isinstance(col2, str) and col2.strip() == "Empregados":
            current_section = "clt"
            continue

        if isinstance(col2, str) and col2.strip() == "Contribuintes":
            current_section = "pro_labore"
            continue

        # Linha de dado de empregado/contribuinte: código numérico + nome preenchido
        codigo_raw = col1
        nome_raw = ws.cell(row=r, column=_FOLHA_COLS["nome"]).value
        if (
            current_competencia is not None
            and current_section is not None
            and isinstance(codigo_raw, str)
            and codigo_raw.strip().isdigit()
            and nome_raw
        ):
            registro = {
                "codigo": codigo_raw.strip(),
                "nome": str(nome_raw).strip(),
                "salario": _parse_brl(ws.cell(row=r, column=_FOLHA_COLS["salario"]).value),
                "out_prov": _parse_brl(ws.cell(row=r, column=_FOLHA_COLS["out_prov"]).value),
                "sal_fam": _parse_brl(ws.cell(row=r, column=_FOLHA_COLS["sal_fam"]).value),
                "inss": _parse_brl(ws.cell(row=r, column=_FOLHA_COLS["inss"]).value),
                "irrf": _parse_brl(ws.cell(row=r, column=_FOLHA_COLS["irrf"]).value),
                "out_desc": _parse_brl(ws.cell(row=r, column=_FOLHA_COLS["out_desc"]).value),
                "liquido": _parse_brl(ws.cell(row=r, column=_FOLHA_COLS["liquido"]).value),
                "fgts": _parse_brl(ws.cell(row=r, column=_FOLHA_COLS["fgts"]).value),
            }
            nominal[current_competencia][current_section].append(registro)

    # ── agregados por competência ───────────────────────────────────────────
    def _agrega(lista):
        # qtd/bruto/liquido/fgts são os campos do schema original; os demais
        # (salario, out_prov, inss, irrf, out_desc, sal_fam) são adição aditiva
        # para dar suporte a composição fixo/variável e descontos no dashboard.
        return {
            "qtd": len(lista),
            "bruto": round(sum(e["salario"] + e["out_prov"] for e in lista), 2),
            "liquido": round(sum(e["liquido"] for e in lista), 2),
            "fgts": round(sum(e["fgts"] for e in lista), 2),
            "salario": round(sum(e["salario"] for e in lista), 2),
            "out_prov": round(sum(e["out_prov"] for e in lista), 2),
            "inss": round(sum(e["inss"] for e in lista), 2),
            "irrf": round(sum(e["irrf"] for e in lista), 2),
            "out_desc": round(sum(e["out_desc"] for e in lista), 2),
            "sal_fam": round(sum(e["sal_fam"] for e in lista), 2),
        }

    competencias_ordenadas = sorted(nominal.keys())
    codigos_clt_anterior = None

    agregado: dict[str, dict] = {}
    for comp in competencias_ordenadas:
        clt = nominal[comp]["clt"]
        pl = nominal[comp]["pro_labore"]

        clt_agg = _agrega(clt)
        pl_agg = _agrega(pl)
        total_agg = {
            k: round(clt_agg[k] + pl_agg[k], 2) if k != "qtd" else clt_agg[k] + pl_agg[k]
            for k in clt_agg
        }

        codigos_clt_atual = {e["codigo"] for e in clt}
        if codigos_clt_anterior is None:
            admissoes = demissoes = None  # primeiro mês da série: sem base de comparação
        else:
            admissoes = len(codigos_clt_atual - codigos_clt_anterior)
            demissoes = len(codigos_clt_anterior - codigos_clt_atual)
        codigos_clt_anterior = codigos_clt_atual

        agregado[comp] = {
            "clt": clt_agg,
            "pro_labore": pl_agg,
            "total": total_agg,
            "admissoes": admissoes,
            "demissoes": demissoes,
        }

    return {"cliente": cliente, "dp": agregado, "dp_nominal": nominal}


# ─────────────────────────── parse_extrato_mensal ──────────────────────────

# Layout do "Extrato Mensal" (Domínio) é diferente do "Relação da Folha por
# Empregado" usado em parse_folha: em vez de um valor já agregado por
# empregado numa coluna fixa, cada rubrica (salário, hora extra, INSS, vale
# etc.) vem numa linha própria — proventos à esquerda, descontos à direita —
# e é preciso classificar cada rubrica pelo NOME pra chegar nos mesmos 6
# campos que parse_folha produz (salario/out_prov/sal_fam/inss/irrf/out_desc).
# Colunas fixas confirmadas contra o arquivo real da Frisegur:
_EXTRATO_COLS = {
    "empr_codigo": 6, "empr_nome": 10,
    "vinculo_tipo": 10,
    "competencia": 16,
    "prov_nome": 9, "prov_valor": 22,
    "desc_nome": 36, "desc_valor": 58,
    "nd_proventos": 12, "nd_descontos": 20, "nd_liquido": 60,
    "nf_fgts": 44,
}

# INSS do próprio empregado (retido do salário/férias/13º/rescisão) — exclui
# "INSS EMPREGADOR" de propósito, que é a contribuição PATRONAL (não reduz o
# líquido do empregado; contá-la aqui infla o indicador de encargos).
_EXTRATO_RUBRICAS_INSS = {"I.N.S.S.", "INSS FERIAS", "INSS DIFERENCA FERIAS", "INSS 13 SAL.RESCISAO", "INSS SOBRE RESCISAO"}
_EXTRATO_RUBRICAS_SALARIO = {"SALARIO MENSAL", "PRO-LABORE", "AJUSTE SALARIO MENSAL", "SALDO DE SALARIO DIAS", "DIFERENCA DE SALARIO"}
_EXTRATO_RUBRICAS_SAL_FAM = {"SALARIO FAMILIA"}
_EXTRATO_PAGINA_HEADERS = {"EMPRESA:", "CNPJ:", "CÁLCULO:", "COMPLEMENTO DE CÁLCULO:", "EXTRATO MENSAL", "FOLHA MENSAL"}


def parse_extrato_mensal(path: str) -> dict:
    """Parser de 'Extrato Mensal' (Folha Mensal) — devolve o mesmo formato de
    parse_folha ({"cliente", "dp", "dp_nominal"}), só que agregando rubrica a
    rubrica em vez de ler colunas já somadas por empregado. Vínculo "Diretor"
    vira `pro_labore` (equivalente ao "Contribuintes" do outro layout);
    "Celetista" vira `clt`. IRRF fica 0 quando não há rubrica de I.R.R.F. no
    arquivo (não há erro nisso — pode ser que ninguém tenha atingido a faixa
    de retenção no período)."""
    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb[wb.sheetnames[0]]
    c = _EXTRATO_COLS

    cliente = {"razao_social": None, "cnpj": None}
    nominal: dict[str, dict[str, list]] = {}

    current_competencia = None
    emp = None  # registro do empregado em construção

    def _reset_emp(codigo, nome):
        return {
            "codigo": str(codigo).strip(), "nome": str(nome).strip(), "vinculo": None,
            "salario": 0.0, "out_prov": 0.0, "sal_fam": 0.0,
            "inss": 0.0, "irrf": 0.0, "out_desc": 0.0,
            "liquido": 0.0, "fgts": 0.0,
        }

    for r in range(1, ws.max_row + 1):
        col1 = ws.cell(row=r, column=1).value
        col1_norm = col1.strip().upper() if isinstance(col1, str) else None

        if col1_norm == "EMPRESA:":
            if cliente["razao_social"] is None:
                cliente["razao_social"] = _strip_codigo_empresa(ws.cell(row=r, column=16).value)
            continue
        if col1_norm == "CNPJ:":
            if cliente["cnpj"] is None:
                cliente["cnpj"] = _normalize_cnpj(ws.cell(row=r, column=16).value)
            continue
        if col1_norm in _EXTRATO_PAGINA_HEADERS:
            continue

        if col1_norm == "COMPETÊNCIA:":
            valor = ws.cell(row=r, column=c["competencia"]).value
            current_competencia = f"{valor.year}-{valor.month:02d}" if valor else None
            if current_competencia:
                nominal.setdefault(current_competencia, {"clt": [], "pro_labore": []})
            continue

        if col1_norm in ("EMPR.:", "CONTR:"):
            emp = _reset_emp(ws.cell(row=r, column=c["empr_codigo"]).value, ws.cell(row=r, column=c["empr_nome"]).value)
            continue

        if col1_norm == "VÍNCULO:":
            if emp is not None:
                emp["vinculo"] = ws.cell(row=r, column=c["vinculo_tipo"]).value
            continue

        if col1_norm == "ND:":
            if emp is not None:
                emp["liquido"] = _parse_brl(ws.cell(row=r, column=c["nd_liquido"]).value)
            continue

        if col1_norm == "NF:":
            if emp is not None and current_competencia:
                emp["fgts"] = _parse_brl(ws.cell(row=r, column=c["nf_fgts"]).value)
                secao = "pro_labore" if (emp["vinculo"] or "").strip() == "Diretor" else "clt"
                nominal[current_competencia][secao].append({k: v for k, v in emp.items() if k != "vinculo"})
                emp = None
            continue

        if emp is None:
            continue  # linha solta fora de qualquer bloco de empregado (ex: nota de rescisão)

        prov_nome = ws.cell(row=r, column=c["prov_nome"]).value
        prov_valor = ws.cell(row=r, column=c["prov_valor"]).value
        if isinstance(prov_nome, str) and prov_nome.strip() and isinstance(prov_valor, str) and prov_valor.strip():
            nome_n = prov_nome.strip().upper()
            valor = _parse_brl(prov_valor)
            if nome_n in _EXTRATO_RUBRICAS_SALARIO:
                emp["salario"] += valor
            elif nome_n in _EXTRATO_RUBRICAS_SAL_FAM:
                emp["sal_fam"] += valor
            else:
                emp["out_prov"] += valor

        desc_nome = ws.cell(row=r, column=c["desc_nome"]).value
        desc_valor = ws.cell(row=r, column=c["desc_valor"]).value
        if isinstance(desc_nome, str) and desc_nome.strip() and isinstance(desc_valor, str) and desc_valor.strip():
            nome_n = desc_nome.strip().upper()
            valor = _parse_brl(desc_valor)
            if nome_n in _EXTRATO_RUBRICAS_INSS:
                emp["inss"] += valor
            elif "I.R.R.F" in nome_n or nome_n == "IRRF":
                emp["irrf"] += valor
            else:
                emp["out_desc"] += valor

    def _agrega(lista):
        return {
            "qtd": len(lista),
            "bruto": round(sum(e["salario"] + e["out_prov"] for e in lista), 2),
            "liquido": round(sum(e["liquido"] for e in lista), 2),
            "fgts": round(sum(e["fgts"] for e in lista), 2),
            "salario": round(sum(e["salario"] for e in lista), 2),
            "out_prov": round(sum(e["out_prov"] for e in lista), 2),
            "inss": round(sum(e["inss"] for e in lista), 2),
            "irrf": round(sum(e["irrf"] for e in lista), 2),
            "out_desc": round(sum(e["out_desc"] for e in lista), 2),
            "sal_fam": round(sum(e["sal_fam"] for e in lista), 2),
        }

    competencias_ordenadas = sorted(nominal.keys())
    codigos_clt_anterior = None
    agregado: dict[str, dict] = {}
    for comp in competencias_ordenadas:
        clt = nominal[comp]["clt"]
        pl = nominal[comp]["pro_labore"]
        clt_agg = _agrega(clt)
        pl_agg = _agrega(pl)
        total_agg = {
            k: round(clt_agg[k] + pl_agg[k], 2) if k != "qtd" else clt_agg[k] + pl_agg[k]
            for k in clt_agg
        }
        codigos_clt_atual = {e["codigo"] for e in clt}
        if codigos_clt_anterior is None:
            admissoes = demissoes = None
        else:
            admissoes = len(codigos_clt_atual - codigos_clt_anterior)
            demissoes = len(codigos_clt_anterior - codigos_clt_atual)
        codigos_clt_anterior = codigos_clt_atual
        agregado[comp] = {"clt": clt_agg, "pro_labore": pl_agg, "total": total_agg, "admissoes": admissoes, "demissoes": demissoes}

    return {"cliente": cliente, "dp": agregado, "dp_nominal": nominal}


# ─────────────────────────── parse_dre ─────────────────────────────────────

# Nomes de seção e de conta variam entre empresas/regimes — por isso o match
# é por texto (normalizado, maiúsculo, sem acento), não por posição de coluna.
# ATENÇÃO: implementado a partir da estrutura descrita (linhas 0-1 Empresa/CNPJ,
# linha 3 data, seções a partir da linha 6), ainda SEM um arquivo real de DRE
# para validar. Revisar contra uma planilha real assim que disponível —
# principalmente os nomes de conta em _DESPESA_KEYWORDS e o matching de seção.

def _normalize_texto(s) -> str:
    s = str(s or "").strip().upper()
    for a, b in (("Á", "A"), ("À", "A"), ("Â", "A"), ("Ã", "A"), ("É", "E"), ("Ê", "E"),
                 ("Í", "I"), ("Ó", "O"), ("Ô", "O"), ("Õ", "O"), ("Ú", "U"), ("Ç", "C")):
        s = s.replace(a, b)
    return s


_SECOES = {
    "RECEITA OPERACIONAL": "receita_bruta",
    "DEDUCOES": "deducoes",
    "CUSTO DAS MERCADORIAS": "cmv",
    "DESPESAS ADMINISTRATIVAS": "despesas_administrativas",
    "DESPESAS GERAIS": "despesas_gerais",
    "RESULTADO FINANCEIRO": "resultado_financeiro",
}

_CONTA_KEYWORDS = {
    # dentro de receita_bruta
    "VENDA": {"A PRAZO": "vendas_prazo", "A VISTA": "vendas_vista", "À VISTA": "vendas_vista"},
    # dentro de deducoes
    "ICMS": "icms",
    "COFINS": "cofins",
    "PIS": "pis",
    "DEVOLUCAO": "devolucao",
}


def parse_dre(path: str) -> dict:
    """Parser de 'D.R.E.' (Demonstração do Resultado do Exercício).

    Layout sem cabeçalho de coluna fixo: linha 0-1 tem Empresa/CNPJ, linha 3
    tem a data "DEMONSTRAÇÃO DO RESULTADO DO EXERCÍCIO EM DD/MM/AAAA", e a
    partir da linha 6 vêm seções (ex: "RECEITA OPERACIONAL", "DEDUÇÕES",
    "CUSTO DAS MERCADORIAS...") seguidas de linhas de conta. Cada linha de
    conta tem o rótulo numa coluna e o valor do período na coluna de "Saldo"
    (a coluna de "Total" acumulado é ignorada — o período do report é o
    próprio semestre, não precisa de acumulado adicional).

    TODO: validar contra um arquivo real. A localização da coluna "Saldo" é
    detectada dinamicamente (procura o texto "Saldo" no cabeçalho da seção),
    mas sem exemplo real não há como confirmar variações de layout entre
    regimes/empresas.
    """
    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb[wb.sheetnames[0]]

    cliente = {"razao_social": None, "cnpj": None}
    for r in range(1, 3):
        for c in range(1, ws.max_column + 1):
            v = ws.cell(row=r, column=c).value
            if not v:
                continue
            texto = _normalize_texto(v)
            if "CNPJ" in texto:
                cliente["cnpj"] = _normalize_cnpj(ws.cell(row=r, column=c + 1).value or v)
            elif cliente["razao_social"] is None and texto not in ("EMPRESA", "EMPRESA:"):
                cliente["razao_social"] = str(v).strip()

    resultado = {
        "receita_bruta": {"vendas_prazo": 0.0, "vendas_vista": 0.0, "total": 0.0},
        "deducoes": {"icms": 0.0, "cofins": 0.0, "pis": 0.0, "devolucao": 0.0, "total": 0.0},
        "receita_liquida": 0.0,
        "cmv": 0.0,
        "lucro_bruto": 0.0,
        "despesas_administrativas": {"total": 0.0},
        "despesas_gerais": {"total": 0.0},
        "resultado_financeiro": 0.0,
        "lucro_liquido": 0.0,
    }

    col_saldo = None
    secao_atual = None

    for r in range(6, ws.max_row + 1):
        linha_textos = [(c, ws.cell(row=r, column=c).value) for c in range(1, ws.max_column + 1)]
        rotulo_col, rotulo = next(((c, v) for c, v in linha_textos if isinstance(v, str) and v.strip()), (None, None))
        if rotulo is None:
            continue
        rotulo_norm = _normalize_texto(rotulo)

        # cabeçalho de coluna "Saldo" / "Total" — recalcula a posição a cada seção,
        # pois o layout pode mudar de bloco para bloco
        if "SALDO" in rotulo_norm:
            for c, v in linha_textos:
                if isinstance(v, str) and "SALDO" in _normalize_texto(v):
                    col_saldo = c
            continue

        secao_match = next((chave for chave in _SECOES if chave in rotulo_norm), None)
        if secao_match:
            secao_atual = _SECOES[secao_match]
            continue

        if col_saldo is None or secao_atual is None:
            continue

        valor = _parse_brl(ws.cell(row=r, column=col_saldo).value)
        if valor == 0.0 and not any(isinstance(v, (int, float, str)) and _parse_brl(v) for _, v in linha_textos):
            continue

        if secao_atual == "receita_bruta":
            if "TOTAL" in rotulo_norm:
                resultado["receita_bruta"]["total"] = valor
            else:
                sub = next((v for k, v in _CONTA_KEYWORDS["VENDA"].items() if k in rotulo_norm), None)
                if sub:
                    resultado["receita_bruta"][sub] = valor
        elif secao_atual == "deducoes":
            if "TOTAL" in rotulo_norm:
                resultado["deducoes"]["total"] = valor
            else:
                chave = next((v for k, v in _CONTA_KEYWORDS.items() if isinstance(v, str) and k in rotulo_norm), None)
                if chave:
                    resultado["deducoes"][chave] = valor
        elif secao_atual == "cmv":
            resultado["cmv"] = valor
        elif secao_atual in ("despesas_administrativas", "despesas_gerais"):
            if "TOTAL" in rotulo_norm:
                resultado[secao_atual]["total"] = valor
            else:
                resultado[secao_atual][str(rotulo).strip()] = valor
        elif secao_atual == "resultado_financeiro":
            resultado["resultado_financeiro"] = valor

        if "RECEITA LIQUIDA" in rotulo_norm or "RECEITA LÍQUIDA" in rotulo:
            resultado["receita_liquida"] = valor
        elif "LUCRO BRUTO" in rotulo_norm:
            resultado["lucro_bruto"] = valor
        elif "LUCRO LIQUIDO" in rotulo_norm:
            resultado["lucro_liquido"] = valor

    return {"cliente": cliente, "contabil": resultado}


# ─────────────────────────── parse_fiscal_sped ──────────────────────────────
#
# Fonte trocada de export do Domínio pra SPED Fiscal (EFD ICMS/IPI) — é
# obrigação mensal que a empresa já gera, vem com C100 (nota, já com o total
# e o indicador entrada/saída) e 0150 (cadastro do participante, com
# município pra descobrir a UF), então dá pra montar faturamento/vendas por
# UF/top clientes-fornecedores sem abrir um XML sequer. Validado contra o
# arquivo real de MARÇO/2026 da RODRIGO E EMILIA MERCEARIA LTDA.
#
# Only ATENÇÃO: o arquivo tem um bloco de assinatura digital (binário)
# colado depois do registro |9999|— por isso paramos de ler no |9999| em vez
# de ler o arquivo até o fim.

_IBGE_UF_MAP = {
    "11": "RO", "12": "AC", "13": "AM", "14": "RR", "15": "PA", "16": "AP", "17": "TO",
    "21": "MA", "22": "PI", "23": "CE", "24": "RN", "25": "PB", "26": "PE", "27": "AL",
    "28": "SE", "29": "BA", "31": "MG", "32": "ES", "33": "RJ", "35": "SP", "41": "PR",
    "42": "SC", "43": "RS", "50": "MS", "51": "MT", "52": "GO", "53": "DF",
}

_TOP_N_SPED = 10


def _parse_valor_sped(value: str) -> float:
    """Campo de valor do SPED: só vírgula decimal, sem separador de milhar
    (ex: '10092,07', diferente do '1.705,00' das planilhas do Domínio)."""
    if not value:
        return 0.0
    try:
        return float(value.replace(",", "."))
    except ValueError:
        return 0.0


def _ler_registros_sped(path: str):
    """Gera as linhas do SPED já quebradas em campos (sem os '|' das pontas),
    parando no registro |9999| — o que vem depois é o bloco de assinatura
    digital, não faz parte do texto do SPED."""
    with open(path, encoding="latin-1", errors="replace") as f:
        for linha in f:
            linha = linha.strip()
            if not linha.startswith("|"):
                continue
            campos = linha.split("|")[1:-1]  # descarta os '' antes do 1º e depois do último '|'
            if not campos:
                continue
            if campos[0] == "9999":
                break
            yield campos


def parse_fiscal_sped(path: str) -> dict:
    """Parser de um arquivo SPED Fiscal (EFD ICMS/IPI) mensal — devolve o
    bloco fiscal de UMA competência (schema igual ao usado pelo Report
    Semestral, ver `fiscalAggregator.js` no front):

        {
          "cliente": {"razao_social": str, "cnpj": str},
          "competencia": "AAAA-MM",
          "fiscal": {
            "faturamento": float, "vendas": float, "compras": float,
            "vendas_por_uf": {"SP": float, ...},
            "top_clientes": [{"nome": str, "valor": float}, ...],
            "top_fornecedores": [{"nome": str, "valor": float}, ...],
          },
        }

    Junta C100 (cabeçalho da nota — indicador entrada/saída, participante,
    valor total) com 0150 (cadastro do participante — nome e município, pra
    derivar a UF) — não precisa descer a C170/C190 (item a item) pra esse
    agregado; nota sem participante (venda de balcão/NFC-e a consumidor
    final) cai no balaio "Consumidor Final", igual o importador de XML já
    faz, e assume a UF do próprio estabelecimento (registro 0000).
    """
    cliente = {"razao_social": None, "cnpj": None}
    uf_estabelecimento = None
    competencia = None
    participantes: dict[str, dict] = {}
    saidas: list[tuple[str, float]] = []   # (nome_participante, valor)
    entradas: list[tuple[str, float]] = []

    for campos in _ler_registros_sped(path):
        reg = campos[0]

        if reg == "0000":
            cliente["razao_social"] = campos[5] or None
            cliente["cnpj"] = _normalize_cnpj(campos[6])
            uf_estabelecimento = campos[8] or None
            dt_ini = campos[3]  # DDMMAAAA
            if len(dt_ini) == 8:
                competencia = f"{dt_ini[4:8]}-{dt_ini[2:4]}"

        elif reg == "0150":
            cod_part, nome, cod_mun = campos[1], campos[2], campos[7]
            uf = _IBGE_UF_MAP.get(cod_mun[:2]) if cod_mun else None
            participantes[cod_part] = {"nome": nome or cod_part, "uf": uf or uf_estabelecimento}

        elif reg == "C100":
            ind_oper, cod_part, vl_doc = campos[1], campos[3], _parse_valor_sped(campos[11])
            if vl_doc <= 0:
                continue
            part = participantes.get(cod_part)
            nome = part["nome"] if part else "Consumidor Final"
            uf = part["uf"] if part else uf_estabelecimento
            (saidas if ind_oper == "1" else entradas).append((nome, vl_doc, uf))

    def _agrega_top(lista):
        totais: dict[str, float] = {}
        for nome, valor, _uf in lista:
            totais[nome] = totais.get(nome, 0.0) + valor
        ranking = sorted(totais.items(), key=lambda kv: kv[1], reverse=True)[:_TOP_N_SPED]
        return [{"nome": nome, "valor": round(valor, 2)} for nome, valor in ranking]

    def _agrega_uf(lista):
        totais: dict[str, float] = {}
        for _nome, valor, uf in lista:
            if not uf:
                continue
            totais[uf] = totais.get(uf, 0.0) + valor
        return {uf: round(valor, 2) for uf, valor in totais.items()}

    faturamento = round(sum(v for _, v, _ in saidas), 2)
    compras = round(sum(v for _, v, _ in entradas), 2)

    return {
        "cliente": cliente,
        "competencia": competencia,
        "fiscal": {
            "faturamento": faturamento,
            "vendas": faturamento,
            "compras": compras,
            "vendas_por_uf": _agrega_uf(saidas),
            "compras_por_uf": _agrega_uf(entradas),
            "top_clientes": _agrega_top(saidas),
            "top_fornecedores": _agrega_top(entradas),
        },
    }


def _localizar_arquivo_sped(pasta_mes: Path) -> Path:
    """Acha o arquivo de dados do SPED Fiscal dentro da pasta do mês.

    Cada pasta de mês real tem, além do próprio arquivo (sem extensão ou
    '.txt', dependendo de como foi exportado), um '.REC' — o recibo de
    transmissão/aceite da SEFAZ — com o mesmo nome-base. Usar esse par como
    critério evita pegar sobras tipo 'sped_fiscal.txt' (cópia solta sem
    recibo correspondente, vista em algumas pastas). Quando há mais de um
    par (mês com retificadora — arquivo substituto que corrige o original),
    fica com o mais recente, que é o que vale.
    """
    candidatos = []
    for rec in pasta_mes.glob("*.REC"):
        base = rec.with_suffix("")
        # nome literal + ".txt" (NÃO with_suffix — o nome-base pode ter um
        # ponto no meio, tipo "...substituto-mai.2026", e with_suffix trataria
        # o "2026" como extensão e cortaria ele em vez de só acrescentar ".txt")
        candidato_txt = base.with_name(base.name + ".txt")
        for candidato in (base, candidato_txt):
            if candidato.exists() and candidato != rec:
                candidatos.append(candidato)
    if not candidatos:
        raise FileNotFoundError(f"Nenhum arquivo SPED com recibo (.REC) encontrado em {pasta_mes}")
    return max(candidatos, key=lambda p: p.stat().st_mtime)


def parse_fiscal_sped_semestre(pasta_sped_fiscal: str, pastas_meses: list[str]) -> dict:
    """Processa vários meses de uma vez — `pasta_sped_fiscal` é a pasta que
    contém uma subpasta por mês (ex: 'Sped Fiscal/', com 'JANEIRO/',
    'FEVEREIRO/' etc. dentro), `pastas_meses` é a lista de nomes de subpasta
    a processar, na ordem do semestre (ex: ['JANEIRO', ..., 'JUNHO']).

    Devolve `{"cliente": {...}, "fiscal": {"2026-01": {...}, "2026-02": {...}, ...}}`
    — já no formato que `fiscalAggregator.js`/`ReportFiscal.jsx` esperam.
    """
    raiz = Path(pasta_sped_fiscal)
    cliente = {"razao_social": None, "cnpj": None}
    fiscal_por_mes: dict[str, dict] = {}

    for nome_pasta in pastas_meses:
        pasta_mes = raiz / nome_pasta
        if not pasta_mes.is_dir():
            print(f"Aviso: pasta do mês não encontrada, pulando: {pasta_mes}")
            continue
        arquivo = _localizar_arquivo_sped(pasta_mes)
        resultado = parse_fiscal_sped(str(arquivo))
        if resultado["cliente"]["cnpj"]:
            cliente = resultado["cliente"]
        if resultado["competencia"]:
            fiscal_por_mes[resultado["competencia"]] = resultado["fiscal"]
        else:
            print(f"Aviso: não achei a competência no registro 0000 de {arquivo}")

    return {"cliente": cliente, "fiscal": fiscal_por_mes}
