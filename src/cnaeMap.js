// ─────────────────────────────────────────────────────────────────────────────
// CNAE × Anexo LC 214/2025 — mapeamento para controle de enquadramento NCM
//
// Fontes: LC 214/2025, Tabela CNAE 2.3 (IBGE), conhecimento técnico-jurídico.
// Cada entrada: { tipo, label, anexo, descAnexo, anexosPermitidos }
//
// tipos:
//   farmacia_humana    → Somente Anexo XIV (medicamentos humanos)
//   saude_humana       → Somente Anexo XIV (hospitais/clínicas)
//   fabricante_humano  → Somente Anexo XIV (indústria farmacêutica humana)
//   atacadista_humano  → Somente Anexo XIV (distribuidor humano)
//   veterinaria        → Anexo IX (produtos vet) + XIV quando aplicável
//   fabricante_vet     → Anexo IX (indústria farmacêutica veterinária)
//   atacadista_vet     → Anexo IX (distribuidor veterinário)
//   agropecuaria       → Anexo IX possível (insumos/prod. veterinários)
//   dispositivo_medico → Anexo IV (dispositivos médicos)
//   geral              → Sem restrição (verificar por produto/NCM)
//
// anexosPermitidos: array de siglas dos anexos que esta atividade pode acessar.
//   null = sem filtro (todos os anexos são elegíveis).
//   O campo define o padrão; override manual (anexosHabilitados na empresa) adiciona.
// ─────────────────────────────────────────────────────────────────────────────

// Opções de override que o usuário pode habilitar manualmente por empresa.
// Exibidas no cadastro como "Também comercializa…"
export const OVERRIDE_OPTIONS = [
  { id: 'IX',  label: 'Também comercializa produtos veterinários',  descricao: 'Reabre Anexo IX — redução de 60% em IBS/CBS' },
  { id: 'XIV', label: 'Também comercializa medicamentos humanos',    descricao: 'Reabre Anexo XIV — alíquota zero em IBS/CBS' },
  { id: 'IV',  label: 'Também comercializa dispositivos médicos',    descricao: 'Reabre Anexo IV — alíquota zero em IBS/CBS' },
];

const CNAE_RULES = {

  // ══════════════════════════════════════════════════════════════════════════
  // ANEXO XIV — Medicamentos para Uso Humano (100% — Alíquota Zero IBS/CBS)
  // ══════════════════════════════════════════════════════════════════════════

  // ── Fabricação ──────────────────────────────────────────────────────────
  '2121101': { tipo: 'fabricante_humano', label: 'Fabricação de medicamentos alopáticos (uso humano)',      anexo: 'XIV', descAnexo: 'Alíquota zero — medicamentos e insumos farmacêuticos',  anexosPermitidos: ['XIV'] },
  '2121102': { tipo: 'fabricante_humano', label: 'Fabricação de medicamentos homeopáticos (uso humano)',    anexo: 'XIV', descAnexo: 'Alíquota zero — medicamentos homeopáticos',              anexosPermitidos: ['XIV'] },
  '2121103': { tipo: 'fabricante_humano', label: 'Fabricação de medicamentos fitoterápicos (uso humano)',   anexo: 'XIV', descAnexo: 'Alíquota zero — fitoterápicos',                          anexosPermitidos: ['XIV'] },
  '2123800': { tipo: 'fabricante_humano', label: 'Fabricação de preparações farmacêuticas',                 anexo: 'XIV', descAnexo: 'Alíquota zero — preparações farmacêuticas',             anexosPermitidos: ['XIV'] },
  '2110600': { tipo: 'fabricante_humano', label: 'Fabricação de produtos farmoquímicos',                    anexo: 'XIV', descAnexo: 'Alíquota zero — insumos farmacêuticos (IFA)',           anexosPermitidos: ['XIV'] },

  // ── Comércio atacadista ──────────────────────────────────────────────────
  '4644301': { tipo: 'atacadista_humano', label: 'Atacado de medicamentos e drogas (uso humano)',           anexo: 'XIV', descAnexo: 'Alíquota zero — distribuição de medicamentos humanos', anexosPermitidos: ['XIV'] },

  // ── Comércio varejista — farmácias ─────────────────────────────────────
  '4771701': { tipo: 'farmacia_humana', label: 'Farmácia sem manipulação',        anexo: 'XIV', descAnexo: 'Alíquota zero — somente Anexo XIV; Anexo IX (vet) nunca se aplica', anexosPermitidos: ['XIV'] },
  '4771702': { tipo: 'farmacia_humana', label: 'Farmácia com manipulação',        anexo: 'XIV', descAnexo: 'Alíquota zero — inclui preparações magistrais',                     anexosPermitidos: ['XIV'] },
  '4771703': { tipo: 'farmacia_humana', label: 'Farmácia homeopática',            anexo: 'XIV', descAnexo: 'Alíquota zero — medicamentos homeopáticos',                         anexosPermitidos: ['XIV'] },
  '4771705': { tipo: 'farmacia_humana', label: 'Farmácia por manipulação/pedido', anexo: 'XIV', descAnexo: 'Alíquota zero — manipulação sob prescrição',                        anexosPermitidos: ['XIV'] },

  // ── Hospitais e serviços de saúde humana ────────────────────────────────
  '8610101': { tipo: 'saude_humana', label: 'Hospital geral',                      anexo: 'XIV', descAnexo: 'Alíquota zero — medicamentos administrados em internação', anexosPermitidos: ['XIV'] },
  '8610102': { tipo: 'saude_humana', label: 'Atividades de pronto-socorro',        anexo: 'XIV', descAnexo: 'Alíquota zero',                                             anexosPermitidos: ['XIV'] },
  '8630501': { tipo: 'saude_humana', label: 'Ambulatório com cirurgia',            anexo: 'XIV', descAnexo: 'Alíquota zero',                                             anexosPermitidos: ['XIV'] },
  '8630502': { tipo: 'saude_humana', label: 'Ambulatório com exames complementares', anexo: 'XIV', descAnexo: 'Alíquota zero',                                          anexosPermitidos: ['XIV'] },
  '8630503': { tipo: 'saude_humana', label: 'Consultório médico',                  anexo: 'XIV', descAnexo: 'Alíquota zero',                                             anexosPermitidos: ['XIV'] },
  '8630506': { tipo: 'saude_humana', label: 'Serviços de vacinação humana',        anexo: 'XIV', descAnexo: 'Alíquota zero — inclui imunobiológicos',                    anexosPermitidos: ['XIV'] },
  '8630599': { tipo: 'saude_humana', label: 'Atividade médica ambulatorial NEC',   anexo: 'XIV', descAnexo: 'Alíquota zero',                                             anexosPermitidos: ['XIV'] },
  '8640201': { tipo: 'saude_humana', label: 'Laboratório de anatomia patológica',  anexo: 'XIV', descAnexo: 'Alíquota zero — insumos diagnósticos',                      anexosPermitidos: ['XIV'] },
  '8640202': { tipo: 'saude_humana', label: 'Laboratório clínico',                 anexo: 'XIV', descAnexo: 'Alíquota zero — reagentes e insumos',                       anexosPermitidos: ['XIV'] },
  '8640210': { tipo: 'saude_humana', label: 'Serviços de quimioterapia',            anexo: 'XIV', descAnexo: 'Alíquota zero — antineoplásicos',                          anexosPermitidos: ['XIV'] },
  '8640212': { tipo: 'saude_humana', label: 'Serviços de hemoterapia',             anexo: 'XIV', descAnexo: 'Alíquota zero',                                             anexosPermitidos: ['XIV'] },
  '8650001': { tipo: 'saude_humana', label: 'Enfermagem — assistência domiciliar', anexo: 'XIV', descAnexo: 'Alíquota zero — insumos de enfermagem',                     anexosPermitidos: ['XIV'] },
  '8712300': { tipo: 'saude_humana', label: 'Home care — infraestrutura',          anexo: 'XIV', descAnexo: 'Alíquota zero — medicamentos domiciliares',                  anexosPermitidos: ['XIV'] },

  // ══════════════════════════════════════════════════════════════════════════
  // ANEXO IX — Produtos Veterinários (60% de redução IBS/CBS)
  // ══════════════════════════════════════════════════════════════════════════

  // ── Fabricação ──────────────────────────────────────────────────────────
  '2122000': { tipo: 'fabricante_vet', label: 'Fabricação de medicamentos veterinários', anexo: 'IX', descAnexo: 'Redução 60% — prod. veterinários; verificar se há linha humana separada', anexosPermitidos: ['IX'] },

  // ── Comércio atacadista ──────────────────────────────────────────────────
  '4644302': { tipo: 'atacadista_vet', label: 'Atacado de medicamentos veterinários',    anexo: 'IX', descAnexo: 'Redução 60% — distribuição veterinária', anexosPermitidos: ['IX'] },

  // ── Comércio varejista ───────────────────────────────────────────────────
  '4771704': { tipo: 'veterinaria', label: 'Farmácia/comércio de medicamentos veterinários', anexo: 'IX', descAnexo: 'Redução 60% — Anexo IX primário; Anexo XIV se tiver linha humana', anexosPermitidos: ['IX', 'XIV'] },
  '4744005': { tipo: 'veterinaria', label: 'Comércio varejista de prod. veterinários', anexo: 'IX', descAnexo: 'Redução 60%', anexosPermitidos: ['IX', 'XIV'] },
  '4741500': { tipo: 'veterinaria', label: 'Material de construção/agropecuária (misto)', anexo: 'IX', descAnexo: 'Redução 60% para itens vet; geral para demais', anexosPermitidos: ['IX', 'XIV'] },

  // ── Serviços veterinários ────────────────────────────────────────────────
  '7500100': { tipo: 'veterinaria', label: 'Atividades veterinárias (clínica/hospital vet)', anexo: 'IX', descAnexo: 'Redução 60% — produtos administrados em animais', anexosPermitidos: ['IX', 'XIV'] },

  // ── Agropecuária — usa insumos vet (Anexo IX e Anexo VI) ────────────────
  '0151201': { tipo: 'agropecuaria', label: 'Criação de bovinos para corte',   anexo: 'IX', descAnexo: 'Redução 60% em produtos veterinários / Anexo VI em insumos agro', anexosPermitidos: ['IX'] },
  '0151202': { tipo: 'agropecuaria', label: 'Criação de bovinos para leite',   anexo: 'IX', descAnexo: 'Redução 60%', anexosPermitidos: ['IX'] },
  '0152100': { tipo: 'agropecuaria', label: 'Criação de bufalinos',            anexo: 'IX', descAnexo: 'Redução 60%', anexosPermitidos: ['IX'] },
  '0153901': { tipo: 'agropecuaria', label: 'Criação de ovinos',               anexo: 'IX', descAnexo: 'Redução 60%', anexosPermitidos: ['IX'] },
  '0154700': { tipo: 'agropecuaria', label: 'Criação de suínos',               anexo: 'IX', descAnexo: 'Redução 60%', anexosPermitidos: ['IX'] },
  '0155501': { tipo: 'agropecuaria', label: 'Caprinocultura',                  anexo: 'IX', descAnexo: 'Redução 60%', anexosPermitidos: ['IX'] },
  '0159801': { tipo: 'agropecuaria', label: 'Apicultura',                      anexo: 'IX', descAnexo: 'Redução 60%', anexosPermitidos: ['IX'] },
  '0162801': { tipo: 'agropecuaria', label: 'Serviço de inseminação artificial em animais', anexo: 'IX', descAnexo: 'Redução 60%', anexosPermitidos: ['IX'] },
  '0162802': { tipo: 'agropecuaria', label: 'Serviço de tosquiamento / manejo animal',      anexo: 'IX', descAnexo: 'Redução 60%', anexosPermitidos: ['IX'] },

  // ══════════════════════════════════════════════════════════════════════════
  // ANEXO IV — Dispositivos Médicos (100% — Alíquota Zero)
  // ══════════════════════════════════════════════════════════════════════════
  '3250701': { tipo: 'dispositivo_medico', label: 'Fabricação de instrumentos e materiais para uso médico-cirúrgico', anexo: 'IV', descAnexo: 'Alíquota zero — dispositivos médicos',                     anexosPermitidos: ['IV'] },
  '3250703': { tipo: 'dispositivo_medico', label: 'Fabricação de implantes e próteses ortopédicas',                   anexo: 'IV', descAnexo: 'Alíquota zero — próteses e implantes',                     anexosPermitidos: ['IV'] },
  '3250706': { tipo: 'dispositivo_medico', label: 'Fabricação de artigos ópticos — óculos/lentes',                    anexo: 'IV', descAnexo: 'Alíquota zero — óculos e lentes corretivas',               anexosPermitidos: ['IV'] },
  '4645101': { tipo: 'dispositivo_medico', label: 'Atacado de instrumentos e materiais odonto-médico-hospitalar',     anexo: 'IV', descAnexo: 'Alíquota zero — distribuição de dispositivos médicos',      anexosPermitidos: ['IV'] },
  '4773300': { tipo: 'dispositivo_medico', label: 'Comércio varejista de artigos médicos e ortopédicos',              anexo: 'IV', descAnexo: 'Alíquota zero — varejo de dispositivos médicos e órteses', anexosPermitidos: ['IV'] },

  // ══════════════════════════════════════════════════════════════════════════
  // GERAL — múltiplos anexos (verificar por NCM/produto)
  // ══════════════════════════════════════════════════════════════════════════
  '4711302': { tipo: 'geral', label: 'Supermercado',           anexo: null, descAnexo: 'Vários anexos — verificar por NCM (alimentos, higiene, medicamentos OTC)', anexosPermitidos: null },
  '4712100': { tipo: 'geral', label: 'Minimercado / mercearia', anexo: null, descAnexo: 'Vários anexos — verificar por NCM',                                        anexosPermitidos: null },
  '4771799': { tipo: 'geral', label: 'Comércio varejista de produtos farmacêuticos NEC', anexo: null, descAnexo: 'Verificar por NCM/produto',                        anexosPermitidos: null },
  '4772500': { tipo: 'geral', label: 'Comércio varejista de cosméticos, perfumaria e higiene pessoal', anexo: null, descAnexo: 'Sem benefício sobre cosméticos; verificar se há medicamentos OTC', anexosPermitidos: null },
  '4744004': { tipo: 'geral', label: 'Comércio varejista de ferragens e insumos agropecuários',        anexo: null, descAnexo: 'Misto — insumos agrícolas no Anexo VI, vet no Anexo IX',            anexosPermitidos: null },
};

// ─────────────────────────────────────────────────────────────────────────────

function normCNAE(cnae) {
  return (cnae || '').replace(/\D/g, '').padStart(7, '0').slice(0, 7);
}

export function getCnaeTipo(cnae) {
  return CNAE_RULES[normCNAE(cnae)] || { tipo: 'geral', label: 'Atividade geral', anexo: null, descAnexo: 'Sem restrição — verificar por NCM/produto', anexosPermitidos: null };
}

// true = pode ter produtos veterinários → mostra caminho Anexo IX na UI
export function isVeterinariaPermitida(cnae) {
  if (!cnae) return true;
  const { tipo } = getCnaeTipo(cnae);
  return ['veterinaria', 'fabricante_vet', 'atacadista_vet', 'agropecuaria', 'geral'].includes(tipo);
}

/**
 * Retorna o Set de siglas de anexos elegíveis para a empresa.
 * - null → sem filtro (CNAE não mapeado ou sem restrição declarada)
 * - Set → apenas os anexos listados são considerados no discriminador
 *
 * @param {string} cnae   CNAE principal (qualquer formato, ex: "4771-7/01")
 * @param {string[]} overrides  Siglas adicionadas manualmente no cadastro (ex: ['IX'])
 */
export function getAnexosPermitidos(cnae, overrides = []) {
  if (!cnae) return null;
  const rule = CNAE_RULES[normCNAE(cnae)];
  if (!rule || !rule.anexosPermitidos) return null; // CNAE não mapeado = sem filtro
  const combined = new Set([...rule.anexosPermitidos, ...(overrides || [])]);
  return combined;
}

/**
 * Retorna as siglas de override que fazem sentido mostrar para um dado CNAE.
 * São as opções presentes em OVERRIDE_OPTIONS que NÃO já estão nos permissões base.
 */
export function getOverrideDisponiveis(cnae) {
  const rule = cnae ? CNAE_RULES[normCNAE(cnae)] : null;
  const base = new Set(rule?.anexosPermitidos || []);
  if (!rule || !rule.anexosPermitidos) return []; // geral = sem filtro, overrides não fazem sentido
  return OVERRIDE_OPTIONS.filter(o => !base.has(o.id));
}
