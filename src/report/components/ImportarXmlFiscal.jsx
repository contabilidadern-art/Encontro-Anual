import { useState, useRef } from 'react';
import { UploadCloud, FolderOpen, FileText, FileJson, Loader2, CheckCircle2, AlertTriangle, X, Trash2 } from 'lucide-react';
import { fBRLCompact, ACCENT } from '../theme';
import { parseFiscalXmlBatch } from '../ingest/xmlFiscalParser';
import { buildFiscalPorCompetencia, filtrarPorPeriodo } from '../ingest/fiscalAggregator';
import { salvarFiscalDoPeriodo, limparFiscalDoPeriodo } from '../useReportData';

const EXT_ACEITAS = ['.xml', '.zip'];
const chaveArquivo = (f) => `${f.webkitRelativePath || f.name}|${f.size}|${f.lastModified}`;

// Lê um FileSystemEntry (API usada pelo drag-and-drop) recursivamente — é
// assim que dá pra soltar VÁRIAS pastas de uma vez (cada uma vira uma entry
// de topo separada no drop), coisa que o <input type="file"> nativo não
// permite (só deixa escolher uma árvore de pasta por diálogo).
//
// Dois cuidados pra não travar a aba numa pasta grande/errada:
// 1) descarta arquivo que não é .xml/.zip ANTES de materializar o File
//    (uma pasta arrastada por engano com milhares de outros arquivos não
//    custa nada além de listar os nomes);
// 2) lê os File de cada lote de subentradas em grupos pequenos em vez de um
//    Promise.all() gigante — milhares de leituras simultâneas é o que trava
//    o navegador.
const TAMANHO_LOTE_LEITURA = 50;

async function lerEntryRecursivo(entry, destino) {
  if (entry.isFile) {
    const nome = entry.name.toLowerCase();
    if (!EXT_ACEITAS.some((ext) => nome.endsWith(ext))) return;
    const file = await new Promise((resolve) => entry.file(resolve, () => resolve(null)));
    if (file) destino.push(file);
    return;
  }
  if (!entry.isDirectory) return;

  const reader = entry.createReader();
  const subEntries = [];
  let lote;
  do {
    // eslint-disable-next-line no-await-in-loop
    lote = await new Promise((resolve) => reader.readEntries(resolve, () => resolve([])));
    subEntries.push(...lote);
  } while (lote.length > 0); // readEntries só devolve um lote por vez, precisa chamar de novo até esvaziar

  for (let i = 0; i < subEntries.length; i += TAMANHO_LOTE_LEITURA) {
    // eslint-disable-next-line no-await-in-loop
    await Promise.all(subEntries.slice(i, i + TAMANHO_LOTE_LEITURA).map((e) => lerEntryRecursivo(e, destino)));
  }
}

async function lerItensSoltos(dataTransferItems) {
  const entries = Array.from(dataTransferItems)
    .map((item) => item.webkitGetAsEntry?.())
    .filter(Boolean);
  const destino = [];
  await Promise.all(entries.map((e) => lerEntryRecursivo(e, destino)));
  return destino;
}

// Importa XML/ZIP de NF-e, NFC-e e NFS-e, agrega por competência (mesma
// leitura da aba "Visão Geral" do módulo de Precificação) e grava o bloco
// `fiscal` do período direto no Firestore — sem depender do export do
// Domínio, que não tem layout fiscal disponível.
//
// A seleção de arquivos é cumulativa: cada clique em "Selecionar pasta" (que
// já varre subpastas — é assim que o navegador entrega uma árvore inteira de
// uma vez) ou "Selecionar arquivos/.zip" ADICIONA à fila em vez de substituir,
// então dá pra juntar várias pastas de origens diferentes antes de processar.
export default function ImportarXmlFiscal({ clienteId, periodoId, onImportado }) {
  const [aberto, setAberto] = useState(false);
  const [fila, setFila] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | lendo | pronto | salvando
  const [progresso, setProgresso] = useState({ done: 0, total: 0 });
  const [preview, setPreview] = useState(null); // { fiscalFiltrado, foraDoSemestre, blocked, empresaNomeDetectado }
  const [erro, setErro] = useState(null);
  const [arrastandoSobre, setArrastandoSobre] = useState(false);
  const [confirmandoLimpeza, setConfirmandoLimpeza] = useState(false);
  const [limpando, setLimpando] = useState(false);
  const inputPastaRef = useRef(null);
  const inputArquivosRef = useRef(null);

  const handleLimparFiscal = async () => {
    if (!confirmandoLimpeza) { setConfirmandoLimpeza(true); return; }
    setLimpando(true);
    setErro(null);
    try {
      await limparFiscalDoPeriodo(clienteId, periodoId);
      setConfirmandoLimpeza(false);
      onImportado?.();
    } catch (e) {
      console.error('Erro ao limpar fiscal no Firestore:', e);
      setErro(`Erro ao limpar: ${e.code ? `[${e.code}] ` : ''}${e.message || e}`);
    } finally {
      setLimpando(false);
    }
  };

  const resetarTudo = () => {
    setFila([]);
    setStatus('idle');
    setProgresso({ done: 0, total: 0 });
    setPreview(null);
    setErro(null);
    if (inputPastaRef.current) inputPastaRef.current.value = '';
    if (inputArquivosRef.current) inputArquivosRef.current.value = '';
  };

  const adicionarNaFila = (fileList) => {
    const novos = Array.from(fileList || []).filter((f) => {
      const nome = f.name.toLowerCase();
      return EXT_ACEITAS.some((ext) => nome.endsWith(ext));
    });
    setFila((atual) => {
      const chavesExistentes = new Set(atual.map(chaveArquivo));
      const semDuplicata = novos.filter((f) => !chavesExistentes.has(chaveArquivo(f)));
      return [...atual, ...semDuplicata];
    });
    if (inputPastaRef.current) inputPastaRef.current.value = '';
    if (inputArquivosRef.current) inputArquivosRef.current.value = '';
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setArrastandoSobre(false);
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0 && e.dataTransfer.items[0].webkitGetAsEntry) {
      adicionarNaFila(await lerItensSoltos(e.dataTransfer.items));
    } else {
      adicionarNaFila(e.dataTransfer.files); // navegador sem suporte a entries — pega os arquivos soltos direto (sem recursão em subpasta)
    }
  };

  // Importa um JSON já pré-agregado no formato `{ cliente, fiscal }` — o que
  // scripts/ingest/parsers.py (parse_fiscal_sped_semestre) gera a partir do
  // SPED Fiscal. Reaproveita a mesma tela de prévia/confirmação do XML,
  // só pula direto pra depois do `buildFiscalPorCompetencia`.
  const processarJson = (dados) => {
    if (!dados || typeof dados.fiscal !== 'object') {
      throw new Error('JSON não tem o formato esperado ({ cliente, fiscal }).');
    }
    const fiscalFiltrado = filtrarPorPeriodo(dados.fiscal, periodoId);
    const foraDoSemestre = Object.keys(dados.fiscal).length - Object.keys(fiscalFiltrado).length;
    setPreview({
      fiscalFiltrado, foraDoSemestre, blocked: 0,
      total: Object.keys(dados.fiscal).length,
      empresaNomeDetectado: dados.cliente?.razao_social || null,
    });
    setStatus('pronto');
  };

  const importarJson = async (file) => {
    if (!file) return;
    setStatus('lendo');
    setErro(null);
    try {
      processarJson(JSON.parse(await file.text()));
    } catch (e) {
      console.error('Erro ao importar JSON fiscal:', e);
      setErro('Erro ao ler o JSON — confira se é o formato { cliente, fiscal } gerado pelo parser. Detalhe no console.');
      setStatus('idle');
    }
  };

  // Alternativa ao diálogo de arquivo do Windows (que em alguns ambientes
  // abre numa pasta que não é a esperada e "parece vazia") — busca o JSON
  // direto via URL, já servido pelo próprio Vite em /public.
  const importarJsonDeUrl = async (url) => {
    setStatus('lendo');
    setErro(null);
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      processarJson(await resp.json());
    } catch (e) {
      console.error('Erro ao buscar JSON fiscal de', url, e);
      setErro(`Não consegui carregar ${url} — confira se o arquivo está em public/dados/. Detalhe no console.`);
      setStatus('idle');
    }
  };

  const processarFila = async () => {
    if (fila.length === 0) return;
    setStatus('lendo');
    setErro(null);
    try {
      const { saidas, entradas, blocked, total, empresaNomeDetectado } = await parseFiscalXmlBatch(
        fila, clienteId, (done, tot) => setProgresso({ done, total: tot })
      );
      if (total === 0) {
        setErro('Nenhum XML encontrado nos arquivos selecionados.');
        setStatus('idle');
        return;
      }
      const fiscalCompleto = buildFiscalPorCompetencia(saidas, entradas);
      const fiscalFiltrado = filtrarPorPeriodo(fiscalCompleto, periodoId);
      const foraDoSemestre = Object.keys(fiscalCompleto).length - Object.keys(fiscalFiltrado).length;
      setPreview({ fiscalFiltrado, foraDoSemestre, blocked, total, empresaNomeDetectado });
      setStatus('pronto');
    } catch (e) {
      console.error('Erro ao importar XMLs fiscais:', e);
      setErro('Erro ao processar os arquivos. Confira o console para detalhes.');
      setStatus('idle');
    }
  };

  const confirmarSalvamento = async () => {
    if (!preview) return;
    setStatus('salvando');
    try {
      const clienteInfo = preview.empresaNomeDetectado ? { cnpj: clienteId, razao_social: preview.empresaNomeDetectado } : null;
      await salvarFiscalDoPeriodo(clienteId, periodoId, preview.fiscalFiltrado, clienteInfo);
      setAberto(false);
      resetarTudo();
      onImportado?.();
    } catch (e) {
      console.error('Erro ao salvar fiscal no Firestore:', e);
      setErro(`Erro ao salvar no Firestore: ${e.code ? `[${e.code}] ` : ''}${e.message || e}`);
      setStatus('pronto');
    }
  };

  const mesesEncontrados = preview ? Object.keys(preview.fiscalFiltrado).sort() : [];
  const faturamentoPreview = mesesEncontrados.reduce((s, m) => s + (preview.fiscalFiltrado[m].faturamento || 0), 0);
  const comprasPreview = mesesEncontrados.reduce((s, m) => s + (preview.fiscalFiltrado[m].compras || 0), 0);

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold text-slate-900 transition-colors"
        style={{ backgroundColor: ACCENT }}
      >
        <UploadCloud className="w-4 h-4" /> Importar XML (NF-e / NFC-e / NFS-e)
      </button>
    );
  }

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="font-bold text-slate-700 flex items-center gap-2 text-xs uppercase tracking-wider">
          <UploadCloud className="w-4 h-4" style={{ color: ACCENT }} /> Importar XML fiscal
        </h3>
        <div className="flex items-center gap-3">
          <button
            onClick={handleLimparFiscal}
            disabled={limpando}
            className={`inline-flex items-center gap-1.5 text-xs font-bold ${confirmandoLimpeza ? 'text-red-400' : 'text-slate-600 hover:text-red-400'}`}
          >
            <Trash2 className="w-3.5 h-3.5 shrink-0" />
            {limpando ? 'Limpando…' : confirmandoLimpeza ? 'Confirma? Clica de novo' : 'Limpar dados fiscais deste período'}
          </button>
          <button onClick={() => { setAberto(false); resetarTudo(); }} className="text-slate-600 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {status === 'idle' && (
        <div className="space-y-4">
          <div className="rounded-lg border-2 p-4 space-y-3" style={{ borderColor: ACCENT, backgroundColor: `${ACCENT}14` }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div>
                <p className="text-sm font-bold text-slate-900">Já tem um JSON pronto (ex: gerado do SPED Fiscal)?</p>
                <p className="text-xs text-slate-500 mt-0.5">Use um destes — o de baixo é só pra .xml/.zip crus, um .json ali não faz nada.</p>
              </div>
              <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-[#141414] cursor-pointer transition-colors shrink-0" style={{ backgroundColor: ACCENT }}>
                <FileJson className="w-4 h-4" /> Escolher arquivo
                <input type="file" accept=".json,application/json" className="hidden" onChange={(e) => importarJson(e.target.files[0])} />
              </label>
            </div>
            <div className="border-t border-[#D9C14A]/30 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <p className="text-xs text-slate-500">
                Se o diálogo de arquivo do Windows não estiver mostrando a pasta certa, carrega direto (sem diálogo nenhum):
              </p>
              <button
                onClick={() => importarJsonDeUrl('/dados/fiscal_sped_2026_S1.json')}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold border-2 shrink-0"
                style={{ borderColor: ACCENT, color: ACCENT }}
              >
                <FileJson className="w-4 h-4" /> Carregar fiscal_sped_2026_S1.json direto
              </button>
            </div>
          </div>

          <p className="text-sm text-slate-500">
            Ou: arraste uma ou mais pastas do Explorer pra área abaixo (dá pra selecionar várias com Ctrl e soltar juntas —
            subpastas entram automaticamente), ou use os botões pra escolher pelo diálogo do navegador.
            Pode repetir quantas vezes precisar — os arquivos vão se acumulando na fila. Meses fora do semestre atual são ignorados ao processar.
          </p>
          <p className="text-xs text-slate-600">
            Tem muito arquivo (milhares)? Prefira mandar um .zip — seleciona mais rápido que arrastar uma pasta cheia de XML solto.
          </p>

          <div
            onDragOver={(e) => { e.preventDefault(); setArrastandoSobre(true); }}
            onDragLeave={() => setArrastandoSobre(false)}
            onDrop={handleDrop}
            className={`rounded-lg border-2 border-dashed p-5 text-center transition-colors ${
              arrastandoSobre ? 'border-[#D9C14A] bg-[#D9C14A]/10' : 'border-slate-200 bg-slate-50'
            }`}
          >
            <UploadCloud className={`w-6 h-6 mx-auto mb-2 ${arrastandoSobre ? 'text-[#D9C14A]' : 'text-slate-600'}`} />
            <p className="text-xs font-bold text-slate-500 mb-3">Solte as pastas ou arquivos aqui</p>
            <div className="flex flex-wrap justify-center gap-2">
              <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors">
                <FolderOpen className="w-4 h-4" /> Selecionar pasta
                <input
                  type="file" multiple className="hidden"
                  ref={(el) => { inputPastaRef.current = el; if (el) { el.webkitdirectory = true; el.directory = true; } }}
                  onChange={(e) => adicionarNaFila(e.target.files)}
                />
              </label>
              <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors">
                <FileText className="w-4 h-4" /> Selecionar arquivos / .zip
                <input
                  ref={inputArquivosRef} type="file" multiple accept=".xml,.zip" className="hidden"
                  onChange={(e) => adicionarNaFila(e.target.files)}
                />
              </label>
            </div>
          </div>

          {fila.length > 0 && (
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5">
              <span className="text-sm font-bold text-slate-800">{fila.length} arquivo(s) na fila</span>
              <div className="flex gap-2">
                <button onClick={() => setFila([])} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" /> Limpar
                </button>
                <button onClick={processarFila} className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-900" style={{ backgroundColor: ACCENT }}>
                  Processar fila
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {status === 'lendo' && (
        <div className="flex items-center gap-3 text-sm text-slate-500 py-4">
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: ACCENT }} />
          Lendo {progresso.total ? `${progresso.done}/${progresso.total}` : ''} arquivos…
        </div>
      )}

      {status === 'pronto' && preview && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
            <CheckCircle2 className="w-4 h-4" /> {preview.total} arquivo(s) lido(s)
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-slate-50 rounded-lg p-3">
              <span className="text-[10px] font-bold text-slate-600 uppercase">Meses no semestre</span>
              <p className="font-black text-slate-900">{mesesEncontrados.length ? mesesEncontrados.join(', ') : 'nenhum'}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <span className="text-[10px] font-bold text-slate-600 uppercase">Faturamento / Compras</span>
              <p className="font-black text-slate-900">{fBRLCompact(faturamentoPreview)} / {fBRLCompact(comprasPreview)}</p>
            </div>
          </div>
          {preview.blocked > 0 && (
            <p className="text-xs text-amber-400 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> {preview.blocked} arquivo(s) ignorado(s) por não pertencer ao CNPJ deste cliente.</p>
          )}
          {preview.foraDoSemestre > 0 && (
            <p className="text-xs text-slate-500 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> {preview.foraDoSemestre} mês(es) lido(s) mas fora do semestre selecionado — não serão salvos.</p>
          )}
          {mesesEncontrados.length === 0 ? (
            <div className="flex gap-2 pt-1">
              <p className="text-sm text-slate-500">Nenhum dado cai no semestre selecionado — nada para salvar.</p>
              <button onClick={resetarTudo} className="px-4 py-2 rounded-lg text-xs font-bold text-slate-500 border border-slate-200 shrink-0">Recomeçar</button>
            </div>
          ) : (
            <div className="flex gap-2 pt-1">
              <button onClick={confirmarSalvamento} className="px-4 py-2 rounded-lg text-xs font-bold text-[#141414]" style={{ backgroundColor: ACCENT }}>
                Salvar no Report ({mesesEncontrados.length} mês/meses)
              </button>
              <button onClick={resetarTudo} className="px-4 py-2 rounded-lg text-xs font-bold text-slate-500 border border-slate-200">Cancelar</button>
            </div>
          )}
        </div>
      )}

      {status === 'salvando' && (
        <div className="flex items-center gap-3 text-sm text-slate-500 py-4">
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: ACCENT }} /> Salvando no Firestore…
        </div>
      )}

      {erro && <p className="text-xs text-red-400 mt-2 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> {erro}</p>}
    </div>
  );
}
