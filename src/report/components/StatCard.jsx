import { useState } from 'react';
import { ArrowUp, ArrowDown, Minus, ChevronDown, ChevronUp } from 'lucide-react';

// Mesmo padrão de tile usado no restante do app (bg-white p-4 rounded-xl border shadow-sm).
//
// `nivel` (opcional): 'saudavel' | 'neutro' | 'atencao' — semáforo por faixa de
// referência (ver config/benchmarks.js). Tinge a borda esquerda e o ícone;
// sem `nivel`, o card fica exatamente como antes.
// `empty` (opcional): estado "aguardando dado" — mesmo espírito visual do
// dashed-border já usado em outras telas do app, só que no tamanho de um card.
// `tendencia` (opcional): { direcao: 'melhora'|'piora'|'estavel', textoAnterior } —
// seta de DIREÇÃO da mudança (ver config/benchmarks.js::direcaoTendencia),
// independente do nível absoluto do semáforo — não some o valor atual, só
// acrescenta uma linha com a comparação.
// `explicacao` (opcional): { texto, referencia } — quando presente, o card
// vira clicável e expande uma explicação do que o número significa e o que
// é bom/ruim, com estado próprio (cada card abre/fecha independente).
const NIVEL_COR = {
  saudavel: '#10b981',
  neutro: '#94a3b8',
  atencao: '#f59e0b',
};

const TENDENCIA_COR = {
  melhora: '#10b981',
  piora: '#ef4444',
  estavel: '#94a3b8',
};

const TENDENCIA_ICONE = {
  melhora: ArrowUp,
  piora: ArrowDown,
  estavel: Minus,
};

function Tendencia({ tendencia }) {
  if (!tendencia?.direcao) return null;
  const cor = TENDENCIA_COR[tendencia.direcao];
  const Icone = TENDENCIA_ICONE[tendencia.direcao];
  return (
    <div className="flex items-center gap-1 mt-1.5 pt-1.5 border-t border-slate-200">
      <Icone className="w-3 h-3" style={{ color: cor }} />
      {tendencia.textoAnterior && <span className="text-[10px] font-semibold text-slate-500">{tendencia.textoAnterior}</span>}
    </div>
  );
}

export default function StatCard({ label, value, sub, icon: Icon, accent = '#D9C14A', nivel, empty = false, tendencia, explicacao }) {
  const [aberto, setAberto] = useState(false);

  if (empty) {
    return (
      <div className="bg-white p-5 rounded-xl border border-dashed border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">{label}</span>
          {Icon && (
            <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center">
              <Icon className="w-3.5 h-3.5 text-slate-600" />
            </div>
          )}
        </div>
        <p className="text-2xl font-black text-slate-600 leading-tight">—</p>
        <p className="text-xs text-slate-600 font-medium mt-1">{sub || 'Aguardando dado'}</p>
      </div>
    );
  }

  const corNivel = nivel && NIVEL_COR[nivel];
  const corDestaque = corNivel || accent;
  const clicavel = !!explicacao;

  return (
    <div
      className={`relative bg-white p-5 rounded-xl border border-slate-200 overflow-hidden ${
        clicavel ? 'cursor-pointer hover:border-slate-300' : 'hover:border-slate-300'
      } transition-colors`}
      onClick={clicavel ? () => setAberto((v) => !v) : undefined}
    >
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: corDestaque }} />
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{label}</span>
        {Icon && (
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${corDestaque}22` }}>
            <Icon className="w-[15px] h-[15px]" style={{ color: corDestaque }} />
          </div>
        )}
      </div>
      <p className="text-[26px] font-black text-slate-900 tracking-tight leading-none">{value}</p>
      {sub && <p className="text-xs text-slate-500 font-medium mt-2">{sub}</p>}
      <Tendencia tendencia={tendencia} />
      {clicavel && (
        <>
          <div className="flex items-center gap-1 mt-3 pt-3 border-t border-slate-200 text-[10px] font-bold text-slate-500">
            {aberto ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {aberto ? 'Ver menos' : 'O que significa?'}
          </div>
          {aberto && (
            <div className="mt-2 text-xs text-slate-700 leading-relaxed space-y-1.5">
              <p>{explicacao.texto}</p>
              {explicacao.referencia && <p className="text-slate-600 italic">{explicacao.referencia}</p>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
