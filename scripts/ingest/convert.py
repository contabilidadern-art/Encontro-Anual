"""Conversão de planilhas legadas .xls (OLE2, frequentemente truncadas pelo
export do Domínio) para .xlsx, via LibreOffice headless.

xlrd/pandas falham direto nesses arquivos (BOF record ausente/corrompido).
O LibreOffice tolera a corrupção e recupera o conteúdo; abrir o .xlsx
resultante com openpyxl depois funciona normalmente.
"""
import subprocess
import shutil
from pathlib import Path


def convert_xls_to_xlsx(xls_path: str, outdir: str | None = None) -> str:
    """Converte um .xls para .xlsx com `soffice --headless --convert-to xlsx`.

    Retorna o caminho do .xlsx gerado. Lança RuntimeError se o soffice não
    estiver no PATH ou se a conversão falhar.
    """
    if shutil.which("soffice") is None:
        raise RuntimeError(
            "soffice (LibreOffice) não encontrado no PATH. Instale o LibreOffice "
            "e garanta que o binário 'soffice' esteja acessível."
        )

    xls_path = Path(xls_path)
    outdir = Path(outdir) if outdir else xls_path.parent

    result = subprocess.run(
        ["soffice", "--headless", "--convert-to", "xlsx", "--outdir", str(outdir), str(xls_path)],
        capture_output=True,
        text=True,
        timeout=120,
    )
    if result.returncode != 0:
        raise RuntimeError(f"Falha ao converter {xls_path}: {result.stderr or result.stdout}")

    xlsx_path = outdir / (xls_path.stem + ".xlsx")
    if not xlsx_path.exists():
        raise RuntimeError(f"Conversão não gerou o arquivo esperado: {xlsx_path}")
    return str(xlsx_path)
