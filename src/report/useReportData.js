import { useEffect, useState, useCallback } from 'react';
import { doc, getDoc, collection, getDocs, setDoc, updateDoc, deleteField, FieldPath } from 'firebase/firestore';
import { db } from '../firebase';
import { MOCK_PERIODOS, PERIODOS_ORDENADOS } from './mockData';

// Carrega clientes/{cnpj}/periodos/{periodoId} — um período específico
// ("2026-S1" etc). Enquanto a ingestão real não estiver ligada para um
// cliente, cai no mock — assim a tela funciona hoje e passa a usar dado real
// assim que o documento existir, sem mudar código.
export function usePeriodo(cnpj, periodoId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);
  const [error, setError] = useState(null);
  const [recarregarKey, setRecarregarKey] = useState(0);

  useEffect(() => {
    if (!cnpj || !periodoId) return;
    let cancelado = false;
    setLoading(true);
    setError(null);

    getDoc(doc(db, 'clientes', cnpj, 'periodos', periodoId))
      .then((snap) => {
        if (cancelado) return;
        if (snap.exists()) {
          setData(snap.data());
          setIsMock(false);
        } else {
          setData(MOCK_PERIODOS[cnpj]?.[periodoId] || null);
          setIsMock(true);
        }
      })
      .catch((e) => {
        if (cancelado) return;
        console.error('usePeriodo:', e);
        setError(e);
        setData(MOCK_PERIODOS[cnpj]?.[periodoId] || null);
        setIsMock(true);
      })
      .finally(() => { if (!cancelado) setLoading(false); });

    return () => { cancelado = true; };
  }, [cnpj, periodoId, recarregarKey]);

  const recarregar = useCallback(() => setRecarregarKey((k) => k + 1), []);

  return { data, loading, isMock, error, recarregar };
}

// Grava o bloco `fiscal` de um período, mesclando por competência (mês) sem
// apagar meses já importados antes que não fazem parte deste lote.
//
// IMPORTANTE: `setDoc(ref, {'fiscal.2026-01': ...}, {merge:true})` NÃO
// aninha — ao contrário de `updateDoc`, o `setDoc` trata toda chave do
// objeto (incluindo as de primeiro nível) como nome literal de campo, sem
// tratar "." como separador de caminho. Isso já foi tentado aqui e criou
// campos soltos tipo `fiscal.2026-01` (com o ponto no nome) em vez de
// aninhar dentro do mapa `fiscal` — por isso a leitura (`data.fiscal`)
// continuava vazia mesmo com a gravação "funcionando" sem erro. A correção é
// ler o documento, mesclar em JS e regravar o mapa `fiscal` inteiro; também
// limpa qualquer campo `fiscal.AAAA-MM` legado de uma gravação anterior com
// o bug (usando FieldPath — só assim o ponto é tratado como parte do nome,
// não como separador, pra conseguir mirar o campo malformado e apagá-lo).
export async function salvarFiscalDoPeriodo(cnpj, periodoId, fiscalPorCompetencia, clienteInfo) {
  const ref = doc(db, 'clientes', cnpj, 'periodos', periodoId);
  const snap = await getDoc(ref);
  const dadosAtuais = snap.exists() ? snap.data() : {};

  const camposLegadosComPonto = Object.keys(dadosAtuais).filter((k) => k.startsWith('fiscal.'));
  if (camposLegadosComPonto.length > 0) {
    const args = [];
    camposLegadosComPonto.forEach((k) => args.push(new FieldPath(k), deleteField()));
    await updateDoc(ref, ...args);
  }

  const fiscalMesclado = { ...(dadosAtuais.fiscal || {}), ...fiscalPorCompetencia };
  const atualizacao = { fiscal: fiscalMesclado };
  if (clienteInfo) atualizacao.cliente = clienteInfo;
  await setDoc(ref, atualizacao, { merge: true });
}

// Zera o bloco `fiscal` do período (e limpa qualquer campo legado
// `fiscal.AAAA-MM` malformado de uma tentativa antiga) — usado quando se
// quer descartar tudo e reimportar do zero, só com dado vindo de XML/SPED.
export async function limparFiscalDoPeriodo(cnpj, periodoId) {
  const ref = doc(db, 'clientes', cnpj, 'periodos', periodoId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const dadosAtuais = snap.data();

  const camposLegadosComPonto = Object.keys(dadosAtuais).filter((k) => k.startsWith('fiscal.'));
  if (camposLegadosComPonto.length > 0) {
    const args = [];
    camposLegadosComPonto.forEach((k) => args.push(new FieldPath(k), deleteField()));
    await updateDoc(ref, ...args);
  }

  await setDoc(ref, { fiscal: {} }, { merge: true });
}

// Lista os periodoIds disponíveis para um cliente (subcoleção
// clientes/{cnpj}/periodos), ordenados do mais recente pro mais antigo — o
// formato "AAAA-Sn" ordena corretamente como string, sem parsing especial.
// Cai na lista do mock quando offline ou quando o cliente ainda não tem
// nenhum período salvo de verdade.
export function usePeriodosDisponiveis(cnpj) {
  const [periodos, setPeriodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);

  useEffect(() => {
    if (!cnpj) return;
    let cancelado = false;
    setLoading(true);

    getDocs(collection(db, 'clientes', cnpj, 'periodos'))
      .then((snap) => {
        if (cancelado) return;
        const ids = snap.docs.map((d) => d.id).sort().reverse();
        if (ids.length > 0) {
          setPeriodos(ids);
          setIsMock(false);
        } else {
          setPeriodos(PERIODOS_ORDENADOS[cnpj] || []);
          setIsMock(true);
        }
      })
      .catch((e) => {
        if (cancelado) return;
        console.error('usePeriodosDisponiveis:', e);
        setPeriodos(PERIODOS_ORDENADOS[cnpj] || []);
        setIsMock(true);
      })
      .finally(() => { if (!cancelado) setLoading(false); });

    return () => { cancelado = true; };
  }, [cnpj]);

  return { periodos, loading, isMock };
}

// Busca vários períodos de uma vez (usado pela análise comparativa da aba
// Contábil — YoY, sequencial, produtividade e sazonalidade precisam ver mais
// de um período ao mesmo tempo). Cada período cai no mock individualmente se
// não existir no Firestore, igual usePeriodo. `periodoIds` como array de
// strings; a dependência do efeito usa o conteúdo (join), não a referência,
// pra não refazer a busca a cada render só porque o array é recriado.
export function useMultiplosPeriodos(cnpj, periodoIds) {
  const [periodosData, setPeriodosData] = useState({});
  const [loading, setLoading] = useState(true);
  const chave = (periodoIds || []).join(',');

  useEffect(() => {
    if (!cnpj || !periodoIds || periodoIds.length === 0) return;
    let cancelado = false;
    setLoading(true);

    Promise.all(
      periodoIds.map((id) =>
        getDoc(doc(db, 'clientes', cnpj, 'periodos', id))
          .then((snap) => [id, snap.exists() ? snap.data() : (MOCK_PERIODOS[cnpj]?.[id] || null)])
          .catch(() => [id, MOCK_PERIODOS[cnpj]?.[id] || null])
      )
    ).then((pares) => {
      if (cancelado) return;
      setPeriodosData(Object.fromEntries(pares.filter(([, v]) => v != null)));
    }).finally(() => { if (!cancelado) setLoading(false); });

    return () => { cancelado = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cnpj, chave]);

  return { periodosData, loading };
}
