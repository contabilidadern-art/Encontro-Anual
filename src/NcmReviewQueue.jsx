import { memo, useState, useCallback } from 'react';
import { db } from './firebase';
import { collection, query, where, getDocs, setDoc, deleteDoc, doc } from 'firebase/firestore';
import { ANEXO_FINS } from './ncmDiscriminator';

// ── Hook: carrega e gerencia o cache de decisões do Firestore ────────────────
export function useNcmDecisoes(cnpj) {
  const [cache, setCache] = useState(new Map());
  const [loading, setLoading] = useState(false);

  // Consulta ao Firestore desativada (cota diária do projeto excedida).
  // O cache simplesmente começa vazio; decisões tomadas nesta sessão continuam
  // sendo salvas normalmente (saveDecision) e ficam disponíveis via getCached
  // enquanto a página não for recarregada.

  // Salva decisão com trilha de auditoria completa
  const saveDecision = useCallback(async ({
    cnpj: c, ncm, xProd,
    substanceIdx,          // number = substância escolhida; null = rejeição explícita
    fundamentacao,         // "Anexo XIV da LC 214/2025 — INSULINA GLARGINA"
    formaConfirmacao,      // 'automatica_substancia' | 'manual' | 'ncm_direta'
    usuario,               // nome/login do usuário que confirmou
    competenciaVigencia,   // 'YYYY-MM' da competência em que a decisão foi tomada
  }) => {
    if (!c) return;
    const xProdNorm = (xProd || '').slice(0, 80).replace(/[^\w\s]/g, '').trim();
    const id = `${c}_${ncm}_${xProdNorm}`;
    const data = {
      cnpj: c, ncm, xProd: xProdNorm,
      substanceIdx: substanceIdx ?? null,
      fundamentacao: fundamentacao || '',
      formaConfirmacao: formaConfirmacao || 'manual',
      usuario: usuario || 'desconhecido',
      dataDecisao: new Date().toISOString(),
      competenciaVigencia: competenciaVigencia || null,
      ts: Date.now(),
    };
    await setDoc(doc(db, 'ncmDecisoes', id), data);
    setCache(prev => { const next = new Map(prev); next.set(id, data); return next; });
    return id;
  }, []);

  // Recupera decisão; rejeita se o anexo citado na fundamentação foi revogado
  // antes da competência atual.
  const getCached = useCallback((cnpj, ncm, xProd, competenciaAtual) => {
    if (!cnpj) return undefined;
    const xProdNorm = (xProd || '').slice(0, 80).replace(/[^\w\s]/g, '').trim();
    const id = `${cnpj}_${ncm}_${xProdNorm}`;
    const decision = cache.get(id);
    if (!decision) return undefined;

    // Vigência: se a fundamentação menciona um anexo com data de fim e a
    // competência atual ultrapassou essa data, a decisão expirou.
    if (competenciaAtual && decision.fundamentacao) {
      for (const [nomeAnexo, fim] of Object.entries(ANEXO_FINS)) {
        if (fim && decision.fundamentacao.includes(nomeAnexo) && competenciaAtual > fim) {
          return undefined; // cache expirado — forçar nova revisão
        }
      }
    }
    return decision;
  }, [cache]);

  const deleteDecision = useCallback(async (cnpj, ncm, xProd) => {
    if (!cnpj) return;
    const xProdNorm = (xProd || '').slice(0, 80).replace(/[^\w\s]/g, '').trim();
    const id = `${cnpj}_${ncm}_${xProdNorm}`;
    try { await deleteDoc(doc(db, 'ncmDecisoes', id)); } catch (e) { console.error('deleteDecision:', e); }
    setCache(prev => { const next = new Map(prev); next.delete(id); return next; });
  }, []);

  const clearAllDecisions = useCallback(async (cnpj) => {
    if (!cnpj) return;
    const q = query(collection(db, 'ncmDecisoes'), where('cnpj', '==', cnpj));
    const snap = await getDocs(q);
    await Promise.all(snap.docs.map(d => deleteDoc(doc(db, 'ncmDecisoes', d.id))));
    setCache(new Map());
  }, []);

  return { cache, loading, saveDecision, getCached, deleteDecision, clearAllDecisions };
}

// ── Componente fila de revisão ───────────────────────────────────────────────
const NcmReviewQueue = memo(({ items, cnpj, saveDecision, usuario, competenciaVigencia }) => {
  const [selected, setSelected] = useState({});
  const fBRL = v => (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (!items || items.length === 0) return null;

  const handleConfirm = async (item) => {
    const idx = selected[item.key];
    if (idx === undefined || idx === null) return;
    const candidate = item.candidates.find(c => c.idx === idx);
    const sub = candidate?.sub || {};
    const fundamentacao = sub.anexo ? `${sub.anexo} — ${sub.desc || ''}` : (sub.desc || '');
    await saveDecision({
      cnpj, ncm: item.ncm, xProd: item.xProd,
      substanceIdx: idx,
      fundamentacao,
      formaConfirmacao: 'manual',
      usuario,
      competenciaVigencia,
    });
    setSelected(prev => { const n = { ...prev }; delete n[item.key]; return n; });
  };

  const handleReject = async (item) => {
    await saveDecision({
      cnpj, ncm: item.ncm, xProd: item.xProd,
      substanceIdx: null,
      fundamentacao: 'Descartado manualmente — produto não enquadrado no Anexo',
      formaConfirmacao: 'manual',
      usuario,
      competenciaVigencia,
    });
  };

  return (
    <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-amber-100 border-b border-amber-200 flex items-center gap-2">
        <span className="text-sm font-black text-amber-800">Fila de Revisão — Enquadramento Pendente</span>
        <span className="text-xs bg-amber-600 text-white font-bold px-1.5 py-0.5 rounded-full">{items.length}</span>
        <span className="text-xs text-amber-600 ml-1">NCMs com 2+ substâncias possíveis — confirme o princípio ativo ou descarte o benefício</span>
      </div>
      <div className="divide-y divide-amber-200">
        {items.map(item => (
          <div key={item.key} className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black bg-slate-800 text-white px-2 py-0.5 rounded font-mono">{item.ncm}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-amber-100 text-amber-800 border-amber-300">
                    CONFERIR
                  </span>
                  {competenciaVigencia && competenciaVigencia !== 'TODAS' && (
                    <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      Competência: {competenciaVigencia}
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-slate-700 mt-1 truncate" title={item.xProd}>{item.xProd}</p>
                <p className="text-xs text-slate-500">R$ {fBRL(item.faturamento)} · {item.count} {item.count === 1 ? 'item' : 'itens'}</p>

                {item.candidates && item.candidates.length > 0 && (
                  <div className="mt-2">
                    <p className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">
                      Selecione o princípio ativo (Fundamento Legal):
                    </p>
                    <select
                      value={selected[item.key] ?? ''}
                      onChange={e => {
                        const v = e.target.value;
                        setSelected(prev => ({ ...prev, [item.key]: v === '' ? undefined : Number(v) }));
                      }}
                      className="w-full text-xs text-slate-700 bg-white border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                    >
                      <option value="">— Selecione a substância / enquadramento —</option>
                      {item.candidates.map(({ idx, sub, s }) => (
                        <option key={idx} value={idx}>
                          {sub.desc || ''}
                          {sub.anexo ? ` [${sub.anexo}]` : ''}
                          {s > 0 ? ` — ${(s * 100).toFixed(0)}% match` : ''}
                        </option>
                      ))}
                    </select>
                    {selected[item.key] !== undefined && (() => {
                      const cand = item.candidates.find(c => c.idx === selected[item.key]);
                      return cand?.sub?.anexo ? (
                        <p className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-1 mt-1">
                          Fundamento: {cand.sub.anexo}{cand.sub.desc ? ` — ${cand.sub.desc}` : ''}
                        </p>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5 shrink-0">
                <button
                  onClick={() => handleConfirm(item)}
                  disabled={selected[item.key] === undefined}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-colors"
                >
                  ✓ Confirmar
                </button>
                <button
                  onClick={() => handleReject(item)}
                  className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  ✕ Fora do Anexo
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default NcmReviewQueue;
