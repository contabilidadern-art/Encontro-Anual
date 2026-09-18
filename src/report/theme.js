// Mesma paleta usada em App.jsx (BRAND) — duplicada aqui de propósito para
// não acoplar o módulo de report ao monólito do App.jsx.
export const BRAND = {
  primary: 'bg-[#222222]',
  primaryText: 'text-[#222222]',
  accent: 'bg-[#D9C14A]',
  accentHover: 'hover:bg-[#B8A030]',
  accentText: 'text-[#D9C14A]',
};

export const ACCENT = '#D9C14A';
export const ACCENT_HOVER = '#B8A030';
export const DARK = '#222222';

export const fBRL = (v) =>
  (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fBRLCompact = (v) => {
  const n = v || 0;
  // Sem espaço depois do "R$": o Text do Recharts quebra linha no espaço
  // quando o rótulo não cabe na largura do eixo, partindo "R$" de "18.0M".
  if (n === 0) return 'R$0';
  if (Math.abs(n) >= 1_000_000) return `R$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `R$${(n / 1_000).toFixed(0)}k`;
  return fBRL(n).replace('R$ ', 'R$');
};

export const fPct = (v) => `${(v || 0).toFixed(1)}%`;

export const fCNPJ = (v) => {
  const n = (v || '').replace(/\D/g, '');
  if (n.length !== 14) return v || '';
  return n.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
};

// Índices de cobertura (ex: Lucro Bruto / Despesas Administrativas) — "quantas
// vezes" uma conta cobre a outra. null (sem despesa base pra dividir) -> '—'.
export const fVezes = (v) => (v == null ? '—' : `${v.toFixed(2)}x`);

export const MES_LABEL = {
  '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr', '05': 'Mai', '06': 'Jun',
  '07': 'Jul', '08': 'Ago', '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez',
};

export const mesLabel = (competencia) => MES_LABEL[competencia.split('-')[1]] || competencia;

// Todas as competências "AAAA-MM" entre `inicio` e `fim` (inclusive) — usado
// pra desenhar o eixo do tempo inteiro do período (ex: mai/25 a mai/26 da
// AKIK), mesmo em meses sem dado ainda (fica com gap no gráfico em vez de
// simplesmente sumir/comprimir o eixo pros meses que já têm arquivo).
export const mesesEntre = (inicio, fim) => {
  if (!inicio || !fim) return [];
  const [anoIni, mesIni] = inicio.split('-').map(Number);
  const [anoFim, mesFim] = fim.split('-').map(Number);
  const total = (anoFim * 12 + mesFim) - (anoIni * 12 + mesIni) + 1;
  if (total <= 0) return [inicio];
  return Array.from({ length: total }, (_, i) => {
    const idx = anoIni * 12 + (mesIni - 1) + i;
    return `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, '0')}`;
  });
};

// A partir de `periodo: {inicio, fim}` (competências "AAAA-MM") decide se o
// período em questão é um semestre (6 meses) ou um ano (ex: AKIK, que pediu
// período anual mai/25-mai/26 em vez de semestral) — usado pra trocar os
// textos fixos "semestre" por "ano" nas abas do Report sem precisar de mais
// um prop dedicado.
export const escopoPeriodo = (periodo) => {
  const { inicio, fim } = periodo || {};
  if (!inicio || !fim) return { label: 'Semestre', labelMin: 'semestre', labelArtigo: 'o Semestre' };
  const [anoIni, mesIni] = inicio.split('-').map(Number);
  const [anoFim, mesFim] = fim.split('-').map(Number);
  const totalMeses = (anoFim * 12 + mesFim) - (anoIni * 12 + mesIni) + 1;
  return totalMeses > 6
    ? { label: 'Ano', labelMin: 'ano', labelArtigo: 'o Ano' }
    : { label: 'Semestre', labelMin: 'semestre', labelArtigo: 'o Semestre' };
};

// '2026-S1' -> '1º Semestre de 2026'; '2025-2026' (anual, fora do calendário
// civil, ex: mai/25-mai/26) -> 'Anual 2025-2026'
export const periodoLabel = (periodoId) => {
  const [ano, sem] = (periodoId || '').split('-S');
  if (ano && sem) return `${sem}º Semestre de ${ano}`;
  const anual = /^(\d{4})-(\d{4})$/.exec(periodoId || '');
  if (anual) return `Anual ${anual[1]}-${anual[2]}`;
  return periodoId;
};

// '2026-S1' -> '2026-S1' abreviado pra eixo de gráfico ('26.1'); anual
// '2025-2026' -> '25/26'
export const periodoLabelCurto = (periodoId) => {
  const [ano, sem] = (periodoId || '').split('-S');
  if (ano && sem) return `${ano.slice(2)}.${sem}`;
  const anual = /^(\d{4})-(\d{4})$/.exec(periodoId || '');
  if (anual) return `${anual[1].slice(2)}/${anual[2].slice(2)}`;
  return periodoId;
};
