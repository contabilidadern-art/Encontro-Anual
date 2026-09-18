"""Varre uma ou mais pastas (recursivamente, incluindo subpastas) atrás de
arquivos .xml e reúne tudo numa pasta de destino única — passo de "captura"
antes de alimentar um conversor externo de XML -> Excel, ou o importador de
XML do Report Semestral (que aceita um .zip só — mais rápido de selecionar
que milhares de arquivos soltos).

Só lê e copia (nunca move/apaga da origem) — seguro rodar mais de uma vez
sobre a mesma pasta, arquivo já copiado com o mesmo tamanho é pulado.

Uso:
    python scripts/ingest/varrer_xml.py --origem "C:\\XMLs\\ClienteA" "C:\\XMLs\\ClienteB" --destino "C:\\saida" --zip
"""
import argparse
import shutil
import sys
import zipfile
from pathlib import Path


def varrer_xmls(origens: list[str]) -> list[Path]:
    """Retorna todos os .xml encontrados recursivamente nas pastas de origem."""
    encontrados = []
    for origem in origens:
        raiz = Path(origem)
        if not raiz.exists():
            print(f"Aviso: pasta não encontrada, pulando: {raiz}", file=sys.stderr)
            continue
        encontrados.extend(raiz.rglob("*.xml"))
    return encontrados


def capturar(arquivos: list[Path], destino: str) -> tuple[int, int]:
    """Copia os arquivos pra pasta de destino, achatando a estrutura de pastas.

    Em colisão de nome (comum quando várias pastas de origem têm arquivos
    homônimos) com conteúdo diferente, renomeia com sufixo numérico; se o
    arquivo já existe com o mesmo tamanho, assume que é o mesmo XML e pula —
    é o que permite rodar de novo sem duplicar trabalho.
    """
    destino_path = Path(destino)
    destino_path.mkdir(parents=True, exist_ok=True)

    copiados = 0
    pulados = 0
    for arquivo in arquivos:
        alvo = destino_path / arquivo.name
        if alvo.exists():
            if alvo.stat().st_size == arquivo.stat().st_size:
                pulados += 1
                continue
            contador = 1
            while alvo.exists():
                alvo = destino_path / f"{arquivo.stem}__{contador}{arquivo.suffix}"
                contador += 1
        shutil.copy2(arquivo, alvo)
        copiados += 1
    return copiados, pulados


def compactar(destino: str) -> str:
    """Gera um .zip com todo o conteúdo da pasta de destino (mesmo nome + .zip)."""
    destino_path = Path(destino)
    zip_path = destino_path.with_suffix(".zip")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for arquivo in destino_path.glob("*.xml"):
            zf.write(arquivo, arcname=arquivo.name)
    return str(zip_path)


def main():
    parser = argparse.ArgumentParser(description="Varre pastas atrás de XML fiscal e reúne tudo num só lugar.")
    parser.add_argument("--origem", nargs="+", required=True, help="Uma ou mais pastas pra varrer (entra em subpastas automaticamente)")
    parser.add_argument("--destino", required=True, help="Pasta onde os .xml encontrados serão copiados")
    parser.add_argument("--zip", action="store_true", help="Também gera um .zip da pasta de destino ao final (recomendado pro importador do Report)")
    args = parser.parse_args()

    print("Varrendo pastas...")
    arquivos = varrer_xmls(args.origem)
    print(f"{len(arquivos)} arquivo(s) .xml encontrado(s).")

    if not arquivos:
        return

    copiados, pulados = capturar(arquivos, args.destino)
    print(f"{copiados} copiado(s), {pulados} já existente(s) — pulado(s) em {args.destino}")

    if args.zip:
        zip_path = compactar(args.destino)
        print(f"Zip gerado em: {zip_path}")


if __name__ == "__main__":
    main()
