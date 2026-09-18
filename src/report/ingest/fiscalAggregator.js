// Monta o bloco `fiscal` do schema do Report Semestral (clientes/{cnpj}/periodos/{periodoId})
// a partir dos itens de saída/entrada já parseados dos XMLs (ver xmlFiscalParser.js),
// reaproveitando a mesma agregação da aba "Visão Geral" (computeDashboardStats).
import { computeDashboardStats } from './dashboardStats';
import { parsePeriodoId } from '../comparisons';

const TOP_N = 10;

function competenciaDoItem(item) {
  if (!item.date) return null;
  const d = new Date(item.date);
  if (isNaN(d)) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function agruparPorCompetencia(items) {
  const grupos = {};
  for (const item of items) {
    const comp = competenciaDoItem(item);
    if (!comp) continue;
    (grupos[comp] ||= []).push(item);
  }
  return grupos;
}

/**
 * @param {Array} saidas - itens de saída (venda) já parseados
 * @param {Array} entradas - itens de entrada (compra) já parseados
 * @returns {Object} fiscal[competenciaId] = { faturamento, vendas, compras, vendas_por_uf, top_clientes, top_fornecedores }
 */
export function buildFiscalPorCompetencia(saidas, entradas) {
  const saidasPorMes = agruparPorCompetencia(saidas);
  const entradasPorMes = agruparPorCompetencia(entradas);
  const competencias = new Set([...Object.keys(saidasPorMes), ...Object.keys(entradasPorMes)]);

  const fiscal = {};
  for (const comp of competencias) {
    const dashSaidas = computeDashboardStats(saidasPorMes[comp] || []);
    const dashEntradas = computeDashboardStats(entradasPorMes[comp] || []);

    fiscal[comp] = {
      faturamento: Math.round(dashSaidas.totalRevenue),
      vendas: Math.round(dashSaidas.totalRevenue),
      compras: Math.round(dashEntradas.totalRevenue),
      vendas_por_uf: Object.fromEntries(
        Object.entries(dashSaidas.mapStats)
          .filter(([, d]) => d.value > 0)
          .map(([uf, d]) => [uf, Math.round(d.value)])
      ),
      compras_por_uf: Object.fromEntries(
        Object.entries(dashEntradas.mapStats)
          .filter(([, d]) => d.value > 0)
          .map(([uf, d]) => [uf, Math.round(d.value)])
      ),
      top_clientes: dashSaidas.clientsByRevenue.slice(0, TOP_N).map((c) => ({ nome: c.name, valor: Math.round(c.revenue) })),
      top_fornecedores: dashEntradas.clientsByRevenue.slice(0, TOP_N).map((f) => ({ nome: f.name, valor: Math.round(f.revenue) })),
    };
  }
  return fiscal;
}

// Restringe um `fiscal` por-competência (potencialmente com o histórico
// inteiro do cliente) aos 6 meses do semestre de `periodoId` ("2026-S1" etc).
export function filtrarPorPeriodo(fiscalPorCompetencia, periodoId) {
  const p = parsePeriodoId(periodoId);
  if (!p) return {};
  const inicioMes = p.semestre === 1 ? 1 : 7;
  const mesesDoSemestre = Array.from({ length: 6 }, (_, i) => `${p.ano}-${String(inicioMes + i).padStart(2, '0')}`);
  return Object.fromEntries(mesesDoSemestre.filter((m) => fiscalPorCompetencia[m]).map((m) => [m, fiscalPorCompetencia[m]]));
}
