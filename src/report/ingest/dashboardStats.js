// Agregação de itens fiscais (saídas OU entradas — chamar uma vez pra cada)
// em estatísticas de dashboard: faturamento total, ranking de clientes,
// produtos, distribuição por UF etc.
//
// Extraído do hook `useDashboard` de App.jsx (usado pela aba "Visão Geral")
// como função pura, sem `useMemo`, pra poder ser reaproveitado fora de um
// componente React — é a mesma agregação usada pra montar o bloco `fiscal`
// do Report Semestral a partir dos XMLs importados (ver fiscalAggregator.js).
import { STATE_COORDINATES } from '../../constants';

const cleanCNPJ = (v) => (v ? v.replace(/\D/g, '') : '');

export function computeDashboardStats(data, cnpjCache = {}) {
  const mapStats = {}, monthStats = {}, productStats = {}, clientStats = {}, cfopStats = {};
  const regimeStats = { 'Simples Nacional': 0, 'Regime Normal': 0, Desconhecido: 0 };
  const dailyStats = {};
  let totalRevenue = 0, totalQty = 0;
  Object.keys(STATE_COORDINATES).forEach((uf) => { mapStats[uf] = { count: 0, value: 0 }; });

  data.forEach((item) => {
    const safeVal = item.prodValTotal || 0, safeQty = item.prodQty || 0;
    const uf = item.peerUF;
    if (STATE_COORDINATES[uf]) { mapStats[uf].count += 1; mapStats[uf].value += safeVal; }
    if (item.date) {
      const d = new Date(item.date);
      if (!isNaN(d)) {
        const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!monthStats[mk]) monthStats[mk] = 0;
        monthStats[mk] += safeVal;
        const dk = item.date.split('T')[0];
        if (!dailyStats[dk]) dailyStats[dk] = { date: dk, value: 0, qty: 0 };
        dailyStats[dk].value += safeVal;
        dailyStats[dk].qty += safeQty;
      }
    }
    const pName = item.prodNome || 'Produto Desconhecido';
    if (!productStats[pName]) productStats[pName] = { name: pName, qty: 0, revenue: 0, count: 0, unit: item.prodUnit };
    productStats[pName].qty += safeQty;
    productStats[pName].revenue += safeVal;
    productStats[pName].count += 1;
    const cCNPJ = cleanCNPJ(item.peerCNPJ) || '---';
    const regime = cnpjCache[cCNPJ] || 'Desconhecido';
    const isConsumidorFinal = item.peerCNPJ === 'Consumidor Final' || !item.peerCNPJ || cCNPJ.length < 14 || cCNPJ === '---';
    const regimeEfetivo = isConsumidorFinal ? 'Simples Nacional' : regime;
    if (regimeEfetivo === 'Simples Nacional') regimeStats['Simples Nacional'] += safeVal;
    else if (regimeEfetivo === 'Regime Normal') regimeStats['Regime Normal'] += safeVal;
    else regimeStats.Desconhecido += safeVal;
    if (!clientStats[cCNPJ]) clientStats[cCNPJ] = { name: item.peerNome || 'Desconhecido', cnpj: cCNPJ, uf: item.peerUF || 'EX', revenue: 0, count: 0, products: {}, regime: regimeEfetivo };
    clientStats[cCNPJ].revenue += safeVal;
    clientStats[cCNPJ].count += 1;
    clientStats[cCNPJ].regime = regimeEfetivo;
    if (!clientStats[cCNPJ].products[pName]) clientStats[cCNPJ].products[pName] = 0;
    clientStats[cCNPJ].products[pName] += safeVal;
    const cfop = item.prodCFOP || 'S/ CFOP';
    if (!cfopStats[cfop]) cfopStats[cfop] = { code: cfop, revenue: 0, count: 0 };
    cfopStats[cfop].revenue += safeVal;
    cfopStats[cfop].count += 1;
    totalRevenue += safeVal;
    totalQty += safeQty;
  });

  const MAX_AFINIDADE = 25;
  const pairCounts = {};
  const productAffinities = {};
  Object.values(clientStats).forEach((client) => {
    const prods = Object.entries(client.products)
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_AFINIDADE)
      .map((e) => e[0])
      .sort();
    for (let i = 0; i < prods.length; i++) {
      if (!productAffinities[prods[i]]) productAffinities[prods[i]] = {};
      for (let j = i + 1; j < prods.length; j++) {
        const pair = `${prods[i]} ||| ${prods[j]}`;
        pairCounts[pair] = (pairCounts[pair] || 0) + 1;
        productAffinities[prods[i]][prods[j]] = (productAffinities[prods[i]][prods[j]] || 0) + 1;
        if (!productAffinities[prods[j]]) productAffinities[prods[j]] = {};
        productAffinities[prods[j]][prods[i]] = (productAffinities[prods[j]][prods[i]] || 0) + 1;
      }
    }
  });
  const topPairs = Object.entries(pairCounts).filter(([, count]) => count > 1).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([pair, count]) => ({ items: pair.split(' ||| '), count }));
  const productsByRevenue = Object.values(productStats).sort((a, b) => b.revenue - a.revenue);
  let accum = 0;
  const abcProducts = productsByRevenue.map((p) => {
    accum += p.revenue;
    const pct = (accum / totalRevenue) * 100;
    const affinities = productAffinities[p.name] || {};
    const topAffinities = Object.entries(affinities).sort((a, b) => b[1] - a[1]).slice(0, 2).map((entry) => entry[0]);
    return { ...p, classification: pct <= 80 ? 'A' : pct <= 95 ? 'B' : 'C', topAffinities };
  });
  const clientsByRevenue = Object.values(clientStats).map((c) => {
    let topProduct = 'N/A', maxVal = 0;
    Object.entries(c.products).forEach(([n, v]) => { if (v > maxVal) { maxVal = v; topProduct = n; } });
    return { ...c, topProduct };
  }).sort((a, b) => b.revenue - a.revenue);

  return {
    mapStats, totalRevenue, totalQty: totalQty || 1,
    monthStats,
    productsByRevenue: abcProducts,
    productsByQty: Object.values(productStats).sort((a, b) => b.qty - a.qty),
    clientsByRevenue,
    cfopsByRevenue: Object.values(cfopStats).sort((a, b) => b.revenue - a.revenue),
    regimeStats,
    uniqueProducts: Object.keys(productStats).length,
    dailyChartData: Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date)),
    topPairs,
  };
}
