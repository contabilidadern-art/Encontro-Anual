import { useState } from 'react';
import { Users, TrendingUp, TrendingDown, DollarSign, Percent, UserPlus, UserMinus, X } from 'lucide-react';
import MonthlyChart from './components/MonthlyChart';
import StatCard from './components/StatCard';
import FuncionariosTable from './components/FuncionariosTable';
import { fBRL, fBRLCompact, fPct, mesLabel, ACCENT, escopoPeriodo } from './theme';

// Nomes de quem entrou/saiu da folha CLT entre o mês anterior e `competencias[idx]`
// (mesmo critério de parse_folha: código novo = admissão, código sumido = demissão).
// Depende de dp_nominal — sem ele (períodos mock antigos) não há nomes pra mostrar.
function nomesMovimentacao(dpNominal, competencias, idx) {
  if (!dpNominal || idx <= 0) return { admitidos: [], demitidos: [] };
  const atual = competencias[idx];
  const anterior = competencias[idx - 1];
  const codigosAnterior = new Map((dpNominal[anterior]?.clt || []).map((f) => [f.codigo, f.nome]));
  const codigosAtual = new Map((dpNominal[atual]?.clt || []).map((f) => [f.codigo, f.nome]));
  const admitidos = [...codigosAtual].filter(([cod]) => !codigosAnterior.has(cod)).map(([, nome]) => nome);
  const demitidos = [...codigosAnterior].filter(([cod]) => !codigosAtual.has(cod)).map(([, nome]) => nome);
  return { admitidos, demitidos };
}

export default function ReportDP({ data }) {
  const dp = data.dp || {};
  const dpNominal = data.dp_nominal;
  const competencias = Object.keys(dp).sort();
  const ultimo = dp[competencias[competencias.length - 1]];
  const primeiro = dp[competencias[0]];
  const escopo = escopoPeriodo(data.periodo);
  const [movimentacao, setMovimentacao] = useState(null); // { competencia, admitidos, demitidos }

  if (!ultimo) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 font-bold text-sm">
        Nenhum dado de folha (DP) disponível ainda para este cliente/período.
      </div>
    );
  }

  const chartData = competencias.map((c) => ({
    label: mesLabel(c),
    competencia: c,
    headcount: dp[c].total.qtd,
    folhaBruta: dp[c].total.bruto,
    folhaLiquida: dp[c].total.liquido,
    admissoes: dp[c].admissoes ?? 0,
    demissoes: dp[c].demissoes ?? 0,
    salarioMedioClt: dp[c].clt.qtd ? dp[c].clt.bruto / dp[c].clt.qtd : 0,
  }));

  const abrirMovimentacao = (barData) => {
    const row = barData?.payload ?? barData;
    const idx = competencias.indexOf(row?.competencia);
    const { admitidos, demitidos } = nomesMovimentacao(dpNominal, competencias, idx);
    if (!admitidos.length && !demitidos.length) return;
    setMovimentacao({ competencia: row.competencia, admitidos, demitidos });
  };

  const somaCampo = (secao, campo) => competencias.reduce((s, c) => s + (dp[c][secao][campo] || 0), 0);
  const folhaBrutaTotal = somaCampo('total', 'bruto');
  const folhaLiquidaTotal = somaCampo('total', 'liquido');
  const fgtsTotal = somaCampo('clt', 'fgts');
  const inssTotal = somaCampo('total', 'inss');
  const irrfTotal = somaCampo('total', 'irrf');
  const outDescTotal = somaCampo('total', 'out_desc');
  const salarioTotal = somaCampo('clt', 'salario');
  const outProvTotal = somaCampo('clt', 'out_prov');

  const salarioMedioClt = ultimo.clt.qtd ? ultimo.clt.bruto / ultimo.clt.qtd : 0;
  const variacaoHeadcount = ultimo.total.qtd - primeiro.total.qtd;
  const pctVariavel = salarioTotal + outProvTotal ? (outProvTotal / (salarioTotal + outProvTotal)) * 100 : 0;
  const pctCltVsPL = folhaBrutaTotal ? (somaCampo('clt', 'bruto') / folhaBrutaTotal) * 100 : 0;

  const admissoesTotal = competencias.reduce((s, c) => s + (dp[c].admissoes || 0), 0);
  const demissoesTotal = competencias.reduce((s, c) => s + (dp[c].demissoes || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Headcount Atual" value={ultimo.total.qtd} sub={`${variacaoHeadcount >= 0 ? '+' : ''}${variacaoHeadcount} vs. início do período`} icon={Users} />
        <StatCard label="Folha Bruta no Semestre" value={fBRLCompact(folhaBrutaTotal)} sub={`Líquida: ${fBRLCompact(folhaLiquidaTotal)}`} icon={DollarSign} />
        <StatCard label="Salário Médio CLT" value={fBRL(salarioMedioClt)} sub={`Base: ${ultimo.clt.qtd} empregados CLT`} icon={TrendingUp} />
        <StatCard label="Encargos (INSS + FGTS)" value={fBRLCompact(inssTotal + fgtsTotal)} sub={`FGTS ${fBRLCompact(fgtsTotal)} · INSS ${fBRLCompact(inssTotal)}`} icon={Percent} accent="#10b981" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200">
          <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-4 uppercase text-xs tracking-wider">
            <DollarSign className="w-4 h-4" style={{ color: ACCENT }} /> Evolução da Folha Bruta
          </h3>
          <MonthlyChart data={chartData} series={[{ key: 'folhaBruta', label: 'Folha Bruta', color: ACCENT, type: 'line' }]} />
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200">
          <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-4 uppercase text-xs tracking-wider">
            <Users className="w-4 h-4 text-emerald-500" /> Evolução do Headcount
          </h3>
          <MonthlyChart data={chartData} series={[{ key: 'headcount', label: 'Headcount', color: '#10b981', type: 'bar' }]} valueFormatter={(v) => v} />
        </div>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200">
        <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-4 uppercase text-xs tracking-wider">
          <UserPlus className="w-4 h-4" style={{ color: ACCENT }} /> Admissões x Demissões (CLT)
        </h3>
        <MonthlyChart data={chartData} series={[
          { key: 'admissoes', label: 'Admissões', color: '#10b981', type: 'bar' },
          { key: 'demissoes', label: 'Demissões', color: '#ef4444', type: 'bar' },
        ]} valueFormatter={(v) => v} onBarClick={dpNominal ? abrirMovimentacao : undefined} />
        <div className="flex items-center justify-between flex-wrap gap-2 mt-4">
          <div className="flex gap-6 text-sm">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold"><UserPlus className="w-4 h-4" /> {admissoesTotal} admissões no {escopo.labelMin}</span>
            <span className="flex items-center gap-1.5 text-red-400 font-bold"><UserMinus className="w-4 h-4" /> {demissoesTotal} demissões no {escopo.labelMin}</span>
          </div>
          {dpNominal && <p className="text-[11px] text-slate-600">Clique numa barra pra ver os nomes.</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200">
          <h3 className="font-bold text-slate-700 mb-4 uppercase text-xs tracking-wider">Composição da Folha</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-slate-500">Fixo (Salário) vs. Variável (Out.Prov.)</span>
                <span className="font-bold text-slate-800">{fPct(100 - pctVariavel)} / {fPct(pctVariavel)}</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                <div className="h-full" style={{ width: `${100 - pctVariavel}%`, backgroundColor: ACCENT }} />
                <div className="h-full bg-emerald-500" style={{ width: `${pctVariavel}%` }} />
              </div>
              {pctVariavel > 20 && (
                <p className="text-[11px] text-amber-400 font-semibold mt-1">⚠ Parcela variável elevada — vale checar hora extra/comissão com o cliente.</p>
              )}
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-slate-500">CLT vs. Pró-labore (folha bruta)</span>
                <span className="font-bold text-slate-800">{fPct(pctCltVsPL)} / {fPct(100 - pctCltVsPL)}</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                <div className="h-full" style={{ width: `${pctCltVsPL}%`, backgroundColor: ACCENT }} />
                <div className="h-full bg-slate-500" style={{ width: `${100 - pctCltVsPL}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200">
          <h3 className="font-bold text-slate-700 mb-4 uppercase text-xs tracking-wider">Descontos no Semestre</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-slate-200">
              <span className="text-sm text-slate-500">INSS retido</span>
              <span className="font-bold text-slate-800">{fBRL(inssTotal)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-200">
              <span className="text-sm text-slate-500">IRRF retido</span>
              <span className="font-bold text-slate-800">{fBRL(irrfTotal)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-slate-500">Outros descontos</span>
              <span className="font-bold text-slate-800">{fBRL(outDescTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {dpNominal && Object.keys(dpNominal).length > 0 && (
        <div className="flex justify-end">
          <FuncionariosTable dpNominal={dpNominal} competencias={competencias} />
        </div>
      )}

      {movimentacao && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setMovimentacao(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-sm max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 sticky top-0 bg-white">
              <h4 className="font-black text-slate-900 text-sm">{mesLabel(movimentacao.competencia)} — Movimentação CLT</h4>
              <button onClick={() => setMovimentacao(null)} className="text-slate-600 hover:text-slate-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              {movimentacao.admitidos.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <UserPlus className="w-3 h-3" /> Admissões ({movimentacao.admitidos.length})
                  </p>
                  <ul className="space-y-1">
                    {movimentacao.admitidos.map((nome) => <li key={nome} className="text-xs text-slate-700">{nome}</li>)}
                  </ul>
                </div>
              )}
              {movimentacao.demitidos.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-red-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <UserMinus className="w-3 h-3" /> Demissões ({movimentacao.demitidos.length})
                  </p>
                  <ul className="space-y-1">
                    {movimentacao.demitidos.map((nome) => <li key={nome} className="text-xs text-slate-700">{nome}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
