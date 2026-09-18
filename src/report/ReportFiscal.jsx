import { useState } from 'react';
import { TrendingUp, ShoppingCart, MapPin, Users, Truck, Calendar, PieChart, Activity, Scale } from 'lucide-react';
import MonthlyChart from './components/MonthlyChart';
import RankingList from './components/RankingList';
import StatCard from './components/StatCard';
import ImportarXmlFiscal from './components/ImportarXmlFiscal';
import MapaUF from './components/MapaUF';
import { fBRLCompact, fPct, mesLabel, ACCENT, escopoPeriodo, mesesEntre } from './theme';

const round2 = (n) => Math.round(n * 100) / 100;

// Faixas simples de concentração — quanto mais dependente de poucos
// clientes/fornecedores, maior o risco (um sair derruba o faturamento).
function nivelConcentracao(pct) {
  if (pct >= 70) return 'atencao';
  if (pct >= 40) return 'neutro';
  return 'saudavel';
}

function somarPorNome(mesesData, campo) {
  const totais = new Map();
  for (const mes of mesesData) {
    for (const { nome, valor } of mes[campo] || []) {
      totais.set(nome, (totais.get(nome) || 0) + valor);
    }
  }
  return [...totais.entries()]
    .map(([nome, valor]) => ({ nome, valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10);
}

function somarPorUF(mesesData, campo) {
  const totais = {};
  for (const mes of mesesData) {
    for (const [uf, valor] of Object.entries(mes[campo] || {})) {
      totais[uf] = (totais[uf] || 0) + valor;
    }
  }
  return totais;
}

export default function ReportFiscal({ data, clienteId, periodoId, onImportado }) {
  const fiscal = data.fiscal || {};
  const competenciasComDado = Object.keys(fiscal).sort();
  // Eixo do tempo inteiro do período (ex: mai/25 a mai/26 da AKIK) — inclui
  // meses sem SPED/XML processado ainda, que ficam com gap no gráfico em vez
  // de o eixo simplesmente pular pros meses que já têm arquivo.
  const competencias = mesesEntre(data.periodo?.inicio, data.periodo?.fim);
  const escopo = escopoPeriodo(data.periodo);
  const [competenciaSelecionada, setCompetenciaSelecionada] = useState('TODAS');

  const chartData = competencias.map((c, idx) => {
    const anteriorC = competencias[idx - 1];
    const anterior = idx > 0 ? fiscal[anteriorC]?.faturamento : null;
    const atual = fiscal[c];
    return {
      label: mesLabel(c),
      faturamento: atual?.faturamento ?? null,
      vendas: atual?.vendas ?? null,
      compras: atual?.compras ?? null,
      margem: atual && atual.vendas != null ? round2((atual.vendas || 0) - (atual.compras || 0)) : null,
      variacaoMensal: anterior && atual ? round2(((atual.faturamento - anterior) / anterior) * 100) : null,
    };
  });

  // Escopo da análise: ou o período inteiro, ou só o mês selecionado — afeta
  // os cards, mapas e rankings; o gráfico de evolução mensal acima continua
  // mostrando o eixo do tempo inteiro pra dar contexto (com gap nos meses
  // sem dado). Só entram meses que realmente têm fiscal processado.
  const mesesEmEscopo = competenciaSelecionada === 'TODAS' ? competenciasComDado : [competenciaSelecionada];
  const dadosEmEscopo = mesesEmEscopo.map((c) => fiscal[c]).filter(Boolean);

  const faturamentoEscopo = dadosEmEscopo.reduce((s, m) => s + (m.faturamento || 0), 0);
  const comprasEscopo = dadosEmEscopo.reduce((s, m) => s + (m.compras || 0), 0);
  // Meses com faturamento REALMENTE apurado (exclui os que só têm compras —
  // ver fiscalAkik.js — pra não diluir a média mensal com meses sem vendas).
  const competenciasComFaturamento = competenciasComDado.filter((c) => fiscal[c].faturamento != null);
  const faturamentoTotalComDado = competenciasComFaturamento.reduce((s, c) => s + (fiscal[c].faturamento || 0), 0);
  const mediaMensal = competenciasComFaturamento.length ? faturamentoTotalComDado / competenciasComFaturamento.length : 0;

  const topClientes = somarPorNome(dadosEmEscopo, 'top_clientes');
  const topFornecedores = somarPorNome(dadosEmEscopo, 'top_fornecedores');
  const vendasPorUF = somarPorUF(dadosEmEscopo, 'vendas_por_uf');
  const comprasPorUF = somarPorUF(dadosEmEscopo, 'compras_por_uf');
  const rankingUF = Object.entries(vendasPorUF).map(([uf, valor]) => ({ nome: uf, valor })).sort((a, b) => b.valor - a.valor);

  // Concentração: quanto do faturamento/compras depende dos 10 maiores —
  // risco de dependência, um cliente/fornecedor grande saindo dói mais
  // quanto maior esse %.
  const pctTop10Clientes = faturamentoEscopo ? (topClientes.reduce((s, c) => s + c.valor, 0) / faturamentoEscopo) * 100 : 0;
  const pctTop10Fornecedores = comprasEscopo ? (topFornecedores.reduce((s, f) => s + f.valor, 0) / comprasEscopo) * 100 : 0;

  // UF sede = onde mais vende, pra medir dependência geográfica ("quanto do
  // faturamento vem de fora da própria região").
  const ufSede = rankingUF[0]?.nome;
  const pctForaDaSede = faturamentoEscopo && ufSede ? ((faturamentoEscopo - (vendasPorUF[ufSede] || 0)) / faturamentoEscopo) * 100 : 0;

  // Margem só entra em meses com vendas E compras apuradas — meses só com
  // compras (ver fiscalAkik.js) ficariam com "margem" artificialmente bem
  // negativa se a compra real entrasse contra um faturamento zerado/ausente.
  const dadosComVendas = dadosEmEscopo.filter((m) => m.vendas != null);
  const faturamentoComVendas = dadosComVendas.reduce((s, m) => s + (m.faturamento || 0), 0);
  const comprasComVendas = dadosComVendas.reduce((s, m) => s + (m.compras || 0), 0);
  const margemEscopo = faturamentoComVendas - comprasComVendas;
  const margemPct = faturamentoComVendas ? (margemEscopo / faturamentoComVendas) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Escondido pro grupo AKIK/Maridel: o fiscal delas é montado à parte
          (SPED + relatórios Domínio processados fora do app, ver
          fiscalAkik.js/fiscalMaridel.js), o card de import fica só como
          ruído visual numa tela pensada pra apresentação ("Encontro Anual"). */}
      {clienteId && periodoId && !['02976533000139', '05655885000180'].includes(clienteId) && (
        <ImportarXmlFiscal clienteId={clienteId} periodoId={periodoId} onImportado={onImportado} />
      )}

      {/* Seletor de competência */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col gap-3">
        <div className="flex items-center gap-3 shrink-0">
          <div className="p-2 rounded-lg text-[#141414] shrink-0" style={{ backgroundColor: ACCENT }}><Calendar className="w-4 h-4" /></div>
          <span className="text-sm font-bold text-slate-800 whitespace-nowrap">
            {competenciaSelecionada === 'TODAS' ? `Todo ${escopo.labelArtigo}` : mesLabel(competenciaSelecionada)}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCompetenciaSelecionada('TODAS')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${competenciaSelecionada === 'TODAS' ? 'text-[#141414] border-transparent' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}
            style={competenciaSelecionada === 'TODAS' ? { backgroundColor: ACCENT } : undefined}
          >
            TODO {escopo.labelArtigo.toUpperCase()}
          </button>
          {competencias.map((c) => (
            <button
              key={c} onClick={() => setCompetenciaSelecionada(c)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${competenciaSelecionada === c ? 'text-[#141414] border-transparent' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}
              style={competenciaSelecionada === c ? { backgroundColor: ACCENT } : undefined}
            >
              {mesLabel(c)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label={competenciaSelecionada === 'TODAS' ? `Faturamento no ${escopo.label}` : 'Faturamento no Mês'}
          value={fBRLCompact(faturamentoEscopo)}
          sub={competenciaSelecionada === 'TODAS' ? `Média mensal: ${fBRLCompact(mediaMensal)}` : ''}
          icon={TrendingUp}
        />
        <StatCard
          label={competenciaSelecionada === 'TODAS' ? `Compras no ${escopo.label}` : 'Compras no Mês'}
          value={fBRLCompact(comprasEscopo)}
          sub={faturamentoEscopo ? `${((comprasEscopo / faturamentoEscopo) * 100).toFixed(1)}% do faturamento` : ''}
          icon={ShoppingCart} accent="#10b981"
        />
        <StatCard label="Estados Atendidos" value={rankingUF.length} sub={rankingUF[0] ? `Líder: ${rankingUF[0].nome}` : ''} icon={MapPin} />
      </div>

      {/* Concentração & risco — quão dependente do pouca gente/pouco lugar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Concentração Top 10 Clientes" value={fPct(pctTop10Clientes)}
          sub="do faturamento vem dos 10 maiores" icon={PieChart}
          nivel={nivelConcentracao(pctTop10Clientes)}
        />
        <StatCard
          label="Concentração Top 10 Fornecedores" value={fPct(pctTop10Fornecedores)}
          sub="das compras vêm dos 10 maiores" icon={PieChart}
          nivel={nivelConcentracao(pctTop10Fornecedores)} accent="#10b981"
        />
        <StatCard
          label={`Faturamento Fora de ${ufSede || '—'}`} value={fPct(pctForaDaSede)}
          sub={ufSede ? `${ufSede} é a UF líder de vendas` : 'sem dado de UF'} icon={MapPin}
        />
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200">
        <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-4 uppercase text-xs tracking-wider">
          <TrendingUp className="w-4 h-4" style={{ color: ACCENT }} /> Evolução Mensal do Faturamento
        </h3>
        <MonthlyChart data={chartData} series={[{ key: 'faturamento', label: 'Faturamento', color: ACCENT, type: 'line' }]} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200">
          <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-4 uppercase text-xs tracking-wider">
            <Scale className="w-4 h-4" style={{ color: ACCENT }} /> Margem Aproximada (Vendas − Compras)
          </h3>
          <p className="text-xs text-slate-500 -mt-2 mb-4">
            {competenciaSelecionada === 'TODAS' ? `No ${escopo.labelMin}` : 'No mês'}: {fBRLCompact(margemEscopo)} ({fPct(margemPct)} do faturamento). Não é lucro líquido — só a diferença bruta entre vendas e compras fiscais, sem folha/despesas.
          </p>
          <MonthlyChart data={chartData} series={[{ key: 'margem', label: 'Margem', color: margemEscopo >= 0 ? '#10b981' : '#ef4444', type: 'bar' }]} />
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200">
          <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-4 uppercase text-xs tracking-wider">
            <Activity className="w-4 h-4" style={{ color: ACCENT }} /> Variação Mensal do Faturamento
          </h3>
          <p className="text-xs text-slate-500 -mt-2 mb-4">% de crescimento (ou queda) em relação ao mês anterior.</p>
          <MonthlyChart
            data={chartData} series={[{ key: 'variacaoMensal', label: 'Variação', color: ACCENT, type: 'bar' }]}
            valueFormatter={fPct}
          />
        </div>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200">
        <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-4 uppercase text-xs tracking-wider">
          <ShoppingCart className="w-4 h-4 text-emerald-500" /> Vendas x Compras
        </h3>
        <MonthlyChart data={chartData} series={[
          { key: 'vendas', label: 'Vendas', color: ACCENT, type: 'bar' },
          { key: 'compras', label: 'Compras', color: '#10b981', type: 'bar' },
        ]} />
      </div>

      {/* Mapas de vendas e compras por UF */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200">
          <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-4 uppercase text-xs tracking-wider">
            <MapPin className="w-4 h-4" style={{ color: ACCENT }} /> Mapa de Vendas por UF
          </h3>
          <MapaUF dados={vendasPorUF} cor={ACCENT} titulo="vendas" />
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200">
          <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-4 uppercase text-xs tracking-wider">
            <MapPin className="w-4 h-4 text-emerald-500" /> Mapa de Compras por UF
          </h3>
          <MapaUF dados={comprasPorUF} cor="#10b981" titulo="compras" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200">
          <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-4 uppercase text-xs tracking-wider">
            <MapPin className="w-4 h-4" style={{ color: ACCENT }} /> Ranking por UF
          </h3>
          <RankingList items={rankingUF} />
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200">
          <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-4 uppercase text-xs tracking-wider">
            <Users className="w-4 h-4" style={{ color: ACCENT }} /> Top 10 Clientes
          </h3>
          <RankingList items={topClientes} />
        </div>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200">
        <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-4 uppercase text-xs tracking-wider">
          <Truck className="w-4 h-4 text-emerald-500" /> Top 10 Fornecedores
        </h3>
        <RankingList items={topFornecedores} color="#10b981" />
      </div>
    </div>
  );
}
