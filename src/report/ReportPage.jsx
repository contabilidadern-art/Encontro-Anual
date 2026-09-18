import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Activity, Receipt, Users, Calculator, ArrowLeft, RefreshCw } from 'lucide-react';
import { usePeriodo, usePeriodosDisponiveis, useMultiplosPeriodos } from './useReportData';
import PeriodoSelector from './components/PeriodoSelector';
import EmpresaSelector from './components/EmpresaSelector';
import { periodoLabel } from './theme';
import { GRUPO_EMPRESAS } from './mockData';
import ReportCapa from './ReportCapa';
import ReportFiscal from './ReportFiscal';
import ReportDP from './ReportDP';
import ReportContabil from './ReportContabil';
import logoRN from '../assets/logo-rn.png';
import logoAkik from '../assets/logo-akik.png';

// CNPJ (só dígitos) -> branding do cliente pra exibir no header, no lugar da
// logo/rótulo padrão da RN Contabilidade. Maridel ainda não mandou logo
// própria — usa a da AKIK também (mesmo grupo, mesmo "Encontro Anual") até
// vir uma logo dela.
const BRANDING_CLIENTE = {
  '02976533000139': { logo: logoAkik, tituloHeader: 'Encontro Anual' }, // AKIK
  '05655885000180': { logo: logoAkik, tituloHeader: 'Encontro Anual' }, // Maridel
};

const TABS_BASE = [
  { id: 'capa', label: 'Resumo Executivo', icon: Activity },
  { id: 'fiscal', label: 'Fiscal', icon: Receipt },
  { id: 'dp', label: 'DP', icon: Users },
  { id: 'contabil', label: 'Contábil', icon: Calculator },
  { id: 'todos', label: 'Fiscal + DP + Contábil', icon: Activity },
];

// CNPJs sem módulo Contábil visível (ainda sem fonte de DRE real levantada
// — AKIK pediu pra esconder em vez de mostrar a aba com dados zerados).
const CNPJ_SEM_CONTABIL = new Set(['02976533000139', '05655885000180']);

function tabsPara(clienteId) {
  if (!CNPJ_SEM_CONTABIL.has(clienteId)) return TABS_BASE;
  return TABS_BASE
    .filter((t) => t.id !== 'contabil')
    .map((t) => (t.id === 'todos' ? { ...t, label: 'Fiscal + DP' } : t));
}

export default function ReportPage() {
  const { clienteId, periodoId: periodoIdUrl } = useParams();
  const navigate = useNavigate();
  const TABS = tabsPara(clienteId);
  const [searchParams, setSearchParams] = useSearchParams();
  const tabUrl = searchParams.get('tab');
  const [tab, setTabState] = useState(TABS.some((t) => t.id === tabUrl) ? tabUrl : 'todos');
  const setTab = (id) => {
    setTabState(id);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', id);
      return next;
    }, { replace: true });
  };

  const { periodos, loading: loadingPeriodos } = usePeriodosDisponiveis(clienteId);
  const periodoId = periodoIdUrl || periodos[0];
  const { data, loading: loadingPeriodo, isMock, recarregar } = usePeriodo(clienteId, periodoId);
  // Usado só pela análise comparativa da aba Contábil (YoY, sequencial,
  // produtividade, sazonalidade) — as outras abas não precisam disso.
  const { periodosData } = useMultiplosPeriodos(clienteId, periodos);

  // URL sem período especificado: assim que soubermos qual é o mais recente
  // disponível, refletimos na URL (replace — não empilha histórico) pra ficar
  // compartilhável. Se a URL já veio com um período, não mexe nela.
  useEffect(() => {
    if (!periodoIdUrl && periodos.length > 0) {
      navigate(`/report/${clienteId}/${periodos[0]}`, { replace: true });
    }
  }, [periodoIdUrl, periodos, clienteId, navigate]);

  const handlePeriodoChange = (novoPeriodo) => {
    navigate(`/report/${clienteId}/${novoPeriodo}`);
  };

  // Troca de empresa (ex: seletor AKIK/Maridel) — sem período na URL, porque
  // a empresa nova pode ter um conjunto de períodos disponíveis diferente;
  // o efeito acima resolve pro mais recente dela assim que carregar.
  const handleEmpresaChange = (novoCnpj) => {
    navigate(`/report/${novoCnpj}?tab=${tab}`);
  };

  const periodoLabelAtual = periodoId ? periodoLabel(periodoId) : '';
  const branding = BRANDING_CLIENTE[clienteId] || { logo: logoRN, tituloHeader: 'Report Semestral' };

  // Se periodoId nunca existir (cliente sem nenhum período, real ou mock),
  // usePeriodo nunca sai do loading=true (seu efeito interno dá return antes
  // de setLoading(false) — ver useReportData.js). Por isso só contamos
  // loadingPeriodo quando já existe um período pra buscar; do contrário essa
  // tela ficava girando pra sempre em vez de cair no "nenhum dado encontrado".
  const loading = loadingPeriodos || (!!periodoId && loadingPeriodo);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f2] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-slate-600 animate-spin" />
          <p className="text-sm font-bold text-slate-600">Carregando report semestral...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#f5f5f2] flex items-center justify-center">
        <p className="text-slate-500 font-bold">Nenhum dado encontrado para este cliente/período.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f2] font-sans text-slate-800 pb-12">
      <div className="bg-white sticky top-0 z-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-24 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={branding.logo} alt={data.cliente?.razao_social || clienteId} className="h-20 w-auto rounded" />
            <div className="w-px h-10 bg-slate-200 hidden md:block" />
            <div className="hidden md:block">
              <span className="text-gray-500 text-lg font-black">{branding.tituloHeader}</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-gray-500 text-[10px]">{data.cliente?.razao_social || clienteId}</span>
              </div>
            </div>
          </div>
          <button onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-400 hover:text-slate-900 font-bold text-xs px-3 py-2 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4" /> Voltar à carteira
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6 flex flex-col md:flex-row gap-5 items-start">

        {/* ── módulos na lateral (substitui as abas horizontais) ──────── */}
        <aside className="w-full md:w-56 md:shrink-0 md:sticky md:top-[124px]">
          <nav className="flex flex-row md:flex-col gap-0.5 bg-white border border-slate-200 rounded-xl p-1.5 overflow-x-auto">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${
                  tab === id ? 'bg-[#D9C14A]/10 text-slate-900 shadow-[inset_3px_0_0_#D9C14A]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}>
                <Icon className={`w-4 h-4 shrink-0 ${tab === id ? 'text-[#D9C14A]' : 'text-slate-600'}`} /> {label}
              </button>
            ))}
          </nav>
          <div className="hidden md:block mt-3 p-3.5 bg-white border border-slate-200 rounded-xl text-[11px] text-slate-600 leading-relaxed">
            <b className="block text-slate-700 mb-0.5">Período</b>
            {periodoLabelAtual}. Use o seletor ao lado do conteúdo pra trocar.
          </div>
        </aside>

        <div className="flex-1 min-w-0 space-y-4">
          {isMock && (
            <div className="bg-amber-400/10 border-l-4 border-amber-400 px-4 py-2 rounded text-xs font-bold text-amber-400">
              Exibindo dados de demonstração — ainda não há documento salvo para este cliente/período no Firestore.
            </div>
          )}

          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Módulo ativo</p>
              <h1 className="text-xl font-black text-slate-900 mt-0.5">{TABS.find((t) => t.id === tab)?.label}</h1>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {GRUPO_EMPRESAS.some((e) => e.cnpj === clienteId) && (
                <EmpresaSelector empresas={GRUPO_EMPRESAS} cnpjSelecionado={clienteId} onChange={handleEmpresaChange} />
              )}
              <PeriodoSelector periodos={periodos} periodoSelecionado={periodoId} onChange={handlePeriodoChange} />
            </div>
          </div>

          <div className="bg-[#f5f5f2] rounded-xl p-3 sm:p-6">
            {tab === 'capa' && <ReportCapa data={data} />}
            {tab === 'fiscal' && <ReportFiscal data={data} clienteId={clienteId} periodoId={periodoId} onImportado={recarregar} />}
            {tab === 'dp' && <ReportDP data={data} />}
            {tab === 'contabil' && <ReportContabil data={data} periodosData={periodosData} periodoAtualId={periodoId} />}
            {tab === 'todos' && (
              <div className="space-y-10">
                <section>
                  <h2 className="text-lg font-black text-[#D9C14A] mb-4 flex items-center gap-2"><Receipt className="w-5 h-5" /> Fiscal</h2>
                  <ReportFiscal data={data} clienteId={clienteId} periodoId={periodoId} onImportado={recarregar} />
                </section>
                <div className="h-px bg-slate-100" />
                <section>
                  <h2 className="text-lg font-black text-[#D9C14A] mb-4 flex items-center gap-2"><Users className="w-5 h-5" /> DP</h2>
                  <ReportDP data={data} />
                </section>
                {!CNPJ_SEM_CONTABIL.has(clienteId) && (
                  <>
                    <div className="h-px bg-slate-100" />
                    <section>
                      <h2 className="text-lg font-black text-[#D9C14A] mb-4 flex items-center gap-2"><Calculator className="w-5 h-5" /> Contábil</h2>
                      <ReportContabil data={data} periodosData={periodosData} periodoAtualId={periodoId} />
                    </section>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
