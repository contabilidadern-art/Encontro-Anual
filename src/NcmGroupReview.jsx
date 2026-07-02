import { useState } from 'react';

const fBRL = v => (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const NcmGroupReview = ({ grupos, cnpj, saveDecision, usuario, competenciaVigencia }) => {
  const [saving, setSaving]     = useState(null);       // NCM em salvamento
  const [expanded, setExpanded] = useState(new Set());  // NCMs com lista aberta

  if (!grupos || grupos.length === 0) return null;

  const toggleExpanded = (ncm) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(ncm)) next.delete(ncm); else next.add(ncm);
      return next;
    });
  };

  const aplicarTodos = async (grupo, candidate) => {
    setSaving(grupo.ncm);
    const sub = candidate.sub || {};
    const fundamentacao = sub.anexo ? `${sub.anexo} — ${sub.desc || ''}` : (sub.desc || '');
    try {
      await Promise.all(grupo.items.map(item =>
        saveDecision({
          cnpj,
          ncm:              item.ncm,
          xProd:            item.xProd,
          substanceIdx:     candidate.idx,
          fundamentacao,
          formaConfirmacao: 'manual',
          usuario,
          competenciaVigencia,
        })
      ));
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-2">
      {/* Cabeçalho da seção */}
      <div className="flex items-center gap-2 px-0.5">
        <span className="text-xs font-black text-violet-800 uppercase tracking-wide">Revisão em Lote</span>
        <span className="text-xs bg-violet-600 text-white font-bold px-1.5 py-0.5 rounded-full">{grupos.length}</span>
        <span className="text-xs text-violet-500">NCMs pendentes de enquadramento</span>
      </div>

      {grupos.map(grupo => {
        const isSaving   = saving === grupo.ncm;
        const isExpanded = expanded.has(grupo.ncm);

        // Um candidato representativo por anexo (deduplicado)
        const anexosVistos = new Set();
        const candidatosPorAnexo = grupo.candidates.reduce((acc, c) => {
          const chave = c.sub?.anexo || `idx_${c.idx}`;
          if (!anexosVistos.has(chave)) { anexosVistos.add(chave); acc.push(c); }
          return acc;
        }, []);

        return (
          <div key={grupo.ncm} className="bg-white border border-violet-200 rounded-xl overflow-hidden shadow-sm">

            {/* Cabeçalho do card */}
            <div className="px-4 py-2.5 bg-violet-50 border-b border-violet-100 flex items-center gap-2 flex-wrap">
              <span className="text-sm font-black text-slate-800 font-mono">{grupo.ncm}</span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs font-bold text-slate-600">{grupo.distinctCount} produtos distintos</span>
              <span className="text-xs text-slate-400 ml-auto">R$ {fBRL(grupo.totalFaturamento)}</span>
            </div>

            <div className="px-4 py-3 flex flex-col gap-3">

              {/* "Esta NCM pode ser Anexo XIV ou Anexo IX" */}
              <p className="text-xs text-slate-500 leading-relaxed">
                Esta NCM pode ser:{' '}
                {candidatosPorAnexo.map((c, i) => {
                  const label = c.sub?.anexo
                    ? c.sub.anexo.replace('da LC 214/2025', '').trim()
                    : `Substância ${c.idx}`;
                  return (
                    <span key={c.idx}>
                      {i > 0 && <span className="text-slate-400"> ou </span>}
                      <span className="font-bold text-slate-700">{label}</span>
                    </span>
                  );
                })}
              </p>

              {/* Botões — um por anexo distinto */}
              <div className="flex flex-col gap-1.5">
                {candidatosPorAnexo.map(candidate => {
                  const sub    = candidate.sub || {};
                  const isZero = sub.reducao === 100;
                  const label  = sub.anexo
                    ? sub.anexo.replace('da LC 214/2025', '').trim()
                    : `Substância ${candidate.idx}`;
                  return (
                    <button
                      key={candidate.idx}
                      onClick={() => aplicarTodos(grupo, candidate)}
                      disabled={isSaving}
                      className="w-full px-3 py-2.5 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-colors text-left flex items-center justify-between gap-2"
                    >
                      <span className="truncate">
                        {label}
                        <span className="font-normal opacity-75 ml-1">
                          — aplicar a todos os {grupo.distinctCount} produtos
                        </span>
                      </span>
                      {isZero ? (
                        <span className="shrink-0 text-[10px] bg-emerald-400/30 text-emerald-100 px-1.5 py-0.5 rounded whitespace-nowrap">
                          Alíq. Zero
                        </span>
                      ) : sub.reducao > 0 ? (
                        <span className="shrink-0 text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded whitespace-nowrap">
                          ↓ {sub.reducao}%
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              {/* Lista de produtos (opcional) */}
              <button
                onClick={() => toggleExpanded(grupo.ncm)}
                className="text-[11px] text-violet-500 hover:text-violet-700 font-semibold self-start flex items-center gap-1 transition-colors"
              >
                <span>{isExpanded ? '▾' : '▸'}</span>
                <span>{isExpanded ? 'Ocultar' : 'Ver'} os {grupo.distinctCount} produtos</span>
              </button>

              {isExpanded && (
                <div className="border border-violet-100 rounded-lg overflow-hidden max-h-52 overflow-y-auto">
                  {grupo.items.map(item => (
                    <div
                      key={item.key}
                      className="px-3 py-2 flex items-center justify-between gap-2 border-b border-violet-50 last:border-0 hover:bg-violet-50/40"
                    >
                      <p className="text-xs text-slate-600 truncate min-w-0" title={item.xProd}>
                        {item.xProd}
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        R$ {fBRL(item.faturamento)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default NcmGroupReview;
