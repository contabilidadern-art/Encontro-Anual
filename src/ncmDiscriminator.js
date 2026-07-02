import { NCM_SUBSTANCES_MAP, NCM_SUBSTANCES_FULL } from './ncmSubstancesMap';

// ── Vigência dos anexos ──────────────────────────────────────────────────────
// Formato: 'YYYY-MM' da última competência em que o anexo estava vigente.
// null = ainda vigente. Atualizar quando novas LCs revogarem anexos.
export const ANEXO_FINS = {
  'Anexo XIV da LC 214/2025': null, // LC 227/2026 — inserir 'YYYY-MM' quando publicada no DOU
};

// Capítulos de medicamentos que SÓ têm benefício pelo Anexo XIV (uso humano).
// O Anexo IX cobre uso VETERINÁRIO e nunca deve ser aplicado automaticamente.
const MEDICATION_PREFIXES = ['3002', '3004'];

function isMedication(ncm8) {
  return MEDICATION_PREFIXES.some(p => ncm8.startsWith(p));
}

function isAnexoXIV(full) {
  return full?.anexo?.includes('Anexo XIV');
}

// ── Stopwords farmacêuticas e de formas ─────────────────────────────────────
const STOPWORDS = new Set([
  'de','do','da','dos','das','e','em','para','com','sem','por','a','o','os','as',
  'cloridrato','sulfato','fosfato','acetato','citrato','maleato','tartarato',
  'besilato','mesilato','laurilsulfato','sodico','sódico','potassico','potássico',
  'calcico','cálcico','monosidrato','mono','hemi','tri','di',
  'sol','cap','cpr','cpd','cps','amp','fr','cx','un','comp','rev','lib','ext','ret',
  'inj','nas','oft','top','oral','uso','humano','veterinario',
  'geo','gen','ger','nq','eq','ref','ad','inf','ped','hs','iv','im','sc','ev',
  'g','mg','mcg','ug','ml','l','ui','bi',
  'generico','similar','referencia','original',
]);

function normalizeTokens(text) {
  return (text || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1 && !STOPWORDS.has(t.toLowerCase()));
}

// Jaccard — usado apenas para ORDENAR candidatos na fila de revisão
function jaccardScore(tokensA, tokensB) {
  if (!tokensA.length || !tokensB.length) return 0;
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  let inter = 0;
  setA.forEach(t => { if (setB.has(t)) inter++; });
  const union = setA.size + setB.size - inter;
  return inter / union;
}

// Match literal: todos os tokens da substância precisam estar presentes no xProd.
// Única forma de confirmação automática — sem fuzzy.
function literalMatch(xProdSet, substTokens) {
  if (!substTokens.length) return false;
  return substTokens.every(t => xProdSet.has(t));
}

function buildFundamentacao(full) {
  if (!full) return '';
  const anexo = full.anexo || '';
  const desc  = full.desc  || '';
  return anexo && desc ? `${anexo} — ${desc}` : (anexo || desc);
}

// Helper para retornar resultado de decisão humana confirmada
function returnManualDecision(substances, fullList, cached) {
  const idx = cached.substanceIdx;
  const full = fullList[idx] || null;
  const desc = substances[idx] ?? null;
  const candidates = substances.map((d, i) => ({
    idx: i,
    sub: fullList[i] || { desc: d },
    s: i === idx ? 1 : 0,
  }));
  return {
    status: 'ENQUADRADO',
    formaConfirmacao: 'manual',
    substancia: desc,
    reducao: full?.reducao ?? null,
    tipo: full?.tipo ?? null,
    anexo: full?.anexo ?? null,
    fundamentacao: cached.fundamentacao || buildFundamentacao(full),
    score: 1,
    candidates,
  };
}

// ── Ponto de entrada principal ───────────────────────────────────────────────
// status: 'ENQUADRADO' | 'CONFERIR' | 'FORA_DO_ANEXO'
// formaConfirmacao: 'automatica_substancia' | 'manual' | 'ncm_direta'
// cached: objeto Firestore { substanceIdx, fundamentacao, competenciaVigencia, ... }
// competenciaAtual: 'YYYY-MM' para validação de vigência (ex: '2026-06')
export function discriminarNCM(ncm, xProd, cached, competenciaAtual) {
  const n = (ncm || '').replace(/\D/g, '').padStart(8, '0');
  const substances = NCM_SUBSTANCES_MAP[n];
  const fullList   = NCM_SUBSTANCES_FULL[n] || [];

  // ── Decisão humana de confirmação previamente salva (Firestore) ──────────
  if (cached != null && typeof cached.substanceIdx === 'number') {
    // Valida vigência: ignora cache se o anexo citado foi revogado para esta competência
    let cacheValido = true;
    if (competenciaAtual && cached.fundamentacao) {
      for (const [nomeAnexo, fim] of Object.entries(ANEXO_FINS)) {
        if (fim && cached.fundamentacao.includes(nomeAnexo) && competenciaAtual > fim) {
          cacheValido = false;
          break;
        }
      }
    }
    if (cacheValido && substances) {
      return returnManualDecision(substances, fullList, cached);
    }
    // Se cache expirado: cai para análise automática abaixo
  }

  // ── Decisão humana de rejeição explícita (substanceIdx === null) ─────────
  if (cached != null && cached.substanceIdx === null) {
    return {
      status: 'FORA_DO_ANEXO',
      formaConfirmacao: 'manual',
      substancia: null,
      reducao: null,
      tipo: null,
      anexo: null,
      fundamentacao: cached.fundamentacao || 'Descartado manualmente pelo usuário',
      score: 0,
      candidates: substances
        ? substances.map((d, i) => ({ idx: i, sub: fullList[i] || { desc: d }, s: 0 }))
        : [],
    };
  }

  // ── NCM não está no mapa de ambiguidade ──────────────────────────────────
  if (!substances || substances.length === 0) {
    if (isMedication(n)) {
      // Medicamento (cap. 3002/3004) fora do Anexo XIV → sem benefício automático.
      // O Anexo IX é exclusivo para uso veterinário e nunca se aplica automaticamente.
      return {
        status: 'FORA_DO_ANEXO',
        formaConfirmacao: null,
        substancia: null,
        reducao: null,
        tipo: null,
        anexo: null,
        fundamentacao: 'NCM não listada no Anexo XIV da LC 214/2025 — tributação integral',
        score: 0,
        candidates: [],
        motivoFora: 'nao_listado_xiv',
      };
    }
    // Não-medicamento: usa NCM_REDUCOES normalmente
    return {
      status: 'ENQUADRADO',
      formaConfirmacao: 'ncm_direta',
      substancia: null,
      reducao: null,
      tipo: null,
      anexo: null,
      fundamentacao: '',
      score: 1,
      candidates: [],
    };
  }

  // ── NCM está no mapa (capítulos 3002/3004 com 2+ enquadramentos possíveis) ─
  // Auto-match SOMENTE contra entradas do Anexo XIV (uso humano).
  // O Anexo IX (veterinário) fica disponível como candidato manual, nunca automático.
  const xivIndexes = fullList
    .map((full, i) => ({ i, full }))
    .filter(({ full }) => isAnexoXIV(full));

  const xProdTokens = normalizeTokens(xProd);
  const xProdSet    = new Set(xProdTokens);

  // Pontua todas as substâncias do mapa (todos os anexos) — nenhum filtro de CNAE.
  const scored = substances.map((desc, idx) => {
    const substTokens = normalizeTokens(desc);
    const literal = literalMatch(xProdSet, substTokens);
    const score   = jaccardScore(xProdTokens, substTokens);
    return { idx, desc, substTokens, literal, score, full: fullList[idx] || null };
  });

  const candidates = [...scored]
    .sort((a, b) => (b.literal ? 1 : 0) - (a.literal ? 1 : 0) || b.score - a.score)
    .map(({ idx, score, full, desc }) => ({ idx, sub: full || { desc }, s: score }));

  // NCM presente no mapa mas sem nenhuma entrada Anexo XIV → sem benefício humano
  if (xivIndexes.length === 0) {
    return {
      status: 'FORA_DO_ANEXO',
      formaConfirmacao: null,
      substancia: null,
      reducao: null,
      tipo: null,
      anexo: null,
      fundamentacao: 'NCM presente no mapa mas sem substâncias no Anexo XIV — verif. se uso veterinário',
      score: 0,
      candidates,
      motivoFora: 'sem_substancia_xiv',
    };
  }

  // Match literal SOMENTE contra entradas Anexo XIV
  const xivScored = xivIndexes.map(({ i, full }) => {
    const desc        = substances[i];
    const substTokens = normalizeTokens(desc);
    const literal     = literalMatch(xProdSet, substTokens);
    const score       = jaccardScore(xProdTokens, substTokens);
    return { idx: i, desc, literal, score, full };
  });

  const xivLiteralMatches = xivScored.filter(s => s.literal).sort((a, b) => b.score - a.score);

  if (xivLiteralMatches.length > 0) {
    const best = xivLiteralMatches[0];
    return {
      status: 'ENQUADRADO',
      formaConfirmacao: 'automatica_substancia',
      substancia: best.desc,
      reducao: best.full?.reducao ?? null,
      tipo: best.full?.tipo ?? null,
      anexo: best.full?.anexo ?? null,
      fundamentacao: buildFundamentacao(best.full),
      score: best.score,
      candidates,
    };
  }

  // Sem match literal contra Anexo XIV → possível nome comercial (LANTUS, JANUVIA...).
  // Vai para fila de revisão manual com todos os candidatos disponíveis (XIV e IX).
  return {
    status: 'CONFERIR',
    formaConfirmacao: null,
    substancia: null,
    reducao: null,
    tipo: null,
    anexo: null,
    fundamentacao: '',
    score: xivScored.length ? Math.max(...xivScored.map(s => s.score)) : 0,
    candidates,
  };
}
