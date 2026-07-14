import { memo, useState, useEffect, useCallback } from 'react';
import { db } from './firebase';
import { collection, query, where, getDocs, setDoc, deleteDoc, doc } from 'firebase/firestore';

// ── Hook: carrega e gerencia o cache de decisões de NBS no Firestore ────────
// Espelha useNcmDecisoes (NcmReviewQueue.jsx), mas com chave mais simples: NBS
// é um código oficial estável (não texto livre ambíguo como o nome do produto
// nos NCMs de medicamento), então não precisa de discriminador por substância
// nem de xProd na chave do documento.
export function useNbsDecisoes(cnpj) {
  const [cache, setCache] = useState(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!cnpj) return;
    setLoading(true);
    const q = query(collection(db, 'nbsDecisoes'), where('cnpj', '==', cnpj));
    getDocs(q)
      .then(snap => {
        const m = new Map();
        snap.forEach(d => { m.set(d.id, d.data()); });
        setCache(m);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [cnpj]);

  const saveDecision = useCallback(async ({
    cnpj: c, nbs,
    reducao,               // number = % de redução confirmado; 0 = sem redução (revisado)
    tipo, anexo, desc,     // fundamentação legal informada pelo contador
    usuario,
    competenciaVigencia,
  }) => {
    if (!c || !nbs) return;
    const id = `${c}_${nbs}`;
    const data = {
      cnpj: c, nbs,
      reducao: reducao ?? 0,
      tipo: tipo || (reducao === 100 ? 'Alíquota Zero' : reducao > 0 ? `Red. ${reducao}%` : 'Sem redução'),
      anexo: anexo || '—',
      desc: desc || '',
      usuario: usuario || 'desconhecido',
      dataDecisao: new Date().toISOString(),
      competenciaVigencia: competenciaVigencia || null,
      ts: Date.now(),
    };
    await setDoc(doc(db, 'nbsDecisoes', id), data);
    setCache(prev => { const next = new Map(prev); next.set(id, data); return next; });
    return id;
  }, []);

  const getCached = useCallback((cnpjArg, nbs) => {
    if (!cnpjArg || !nbs) return undefined;
    return cache.get(`${cnpjArg}_${nbs}`);
  }, [cache]);

  const deleteDecision = useCallback(async (cnpjArg, nbs) => {
    if (!cnpjArg || !nbs) return;
    const id = `${cnpjArg}_${nbs}`;
    try { await deleteDoc(doc(db, 'nbsDecisoes', id)); } catch (e) { console.error('deleteDecision NBS:', e); }
    setCache(prev => { const next = new Map(prev); next.delete(id); return next; });
  }, []);

  const clearAllDecisions = useCallback(async (cnpjArg) => {
    if (!cnpjArg) return;
    const q = query(collection(db, 'nbsDecisoes'), where('cnpj', '==', cnpjArg));
    const snap = await getDocs(q);
    await Promise.all(snap.docs.map(d => deleteDoc(doc(db, 'nbsDecisoes', d.id))));
    setCache(new Map());
  }, []);

  return { cache, loading, saveDecision, getCached, deleteDecision, clearAllDecisions };
}

// ── Componente fila de revisão de NBS ────────────────────────────────────────
const NbsReviewQueue = memo(({ items, cnpj, saveDecision, usuario, competenciaVigencia }) => {
  const [drafts, setDrafts] = useState({}); // key -> { reducao, anexo }
  const fBRL = v => (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (!items || items.length === 0) return null;

  const setDraft = (key, field, value) => setDrafts(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));

  const handleConfirm = async (item) => {
    const draft = drafts[item.key] || {};
    const reducao = Number(draft.reducao);
    if (isNaN(reducao) || reducao < 0 || reducao > 100) return;
    await saveDecision({
      cnpj, nbs: item.nbs,
      reducao,
      anexo: draft.anexo || '—',
      desc: item.xProd,
      usuario,
      competenciaVigencia,
    });
    setDrafts(prev => { const n = { ...prev }; delete n[item.key]; return n; });
  };

  const handleSemReducao = async (item) => {
    await saveDecision({
      cnpj, nbs: item.nbs,
      reducao: 0,
      tipo: 'Sem redução',
      anexo: 'Confirmado manualmente — não se enquadra em nenhum Anexo',
      desc: item.xProd,
      usuario,
      competenciaVigencia,
    });
  };

  return (
    <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-amber-100 border-b border-amber-200 flex items-center gap-2">
        <span className="text-sm font-black text-amber-800">Fila de Revisão — NBS não mapeado</span>
        <span className="text-xs bg-amber-600 text-white font-bold px-1.5 py-0.5 rounded-full">{items.length}</span>
        <span className="text-xs text-amber-600 ml-1">Serviços com código NBS fora da tabela — confirme o percentual de redução ou descarte</span>
      </div>
      <div className="divide-y divide-amber-200">
        {items.map(item => (
          <div key={item.key} className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black bg-slate-800 text-white px-2 py-0.5 rounded font-mono">NBS {item.nbs}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-amber-100 text-amber-800 border-amber-300">CONFERIR</span>
                  {competenciaVigencia && competenciaVigencia !== 'TODAS' && (
                    <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      Competência: {competenciaVigencia}
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-slate-700 mt-1 truncate" title={item.xProd}>{item.xProd}</p>
                <p className="text-xs text-slate-500">R$ {fBRL(item.faturamento)} · {item.count} {item.count === 1 ? 'nota' : 'notas'}</p>

                <div className="mt-2 flex flex-wrap gap-2 items-center">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">% Redução:</label>
                  <input
                    type="number" min="0" max="100" step="1"
                    value={drafts[item.key]?.reducao ?? ''}
                    onChange={e => setDraft(item.key, 'reducao', e.target.value)}
                    placeholder="0-100"
                    className="w-20 text-xs text-slate-700 bg-white border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                  />
                  <input
                    type="text"
                    value={drafts[item.key]?.anexo ?? ''}
                    onChange={e => setDraft(item.key, 'anexo', e.target.value)}
                    placeholder="Fundamento legal (ex: Anexo VIII LC 214/2025)"
                    className="flex-1 min-w-[180px] text-xs text-slate-700 bg-white border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 shrink-0">
                <button
                  onClick={() => handleConfirm(item)}
                  disabled={drafts[item.key]?.reducao === undefined || drafts[item.key]?.reducao === ''}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-colors"
                >
                  ✓ Confirmar
                </button>
                <button
                  onClick={() => handleSemReducao(item)}
                  className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  ✕ Sem redução
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default NbsReviewQueue;
