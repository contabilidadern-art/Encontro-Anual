import { useMemo, useState } from 'react';
import { Search, X, UserPlus, UserMinus, ChevronRight, Users } from 'lucide-react';
import { fBRL, mesLabel, ACCENT } from '../theme';
import { CARGOS_2026_S1 } from '../cargosFuncionarios2026S1';

const TIPO_LABEL = { clt: 'CLT', pro_labore: 'Pró-labore' };

// Cargo vem em CAIXA ALTA na fonte (export do Domínio) — título-caso só pra
// leitura, mantendo preposições comuns em minúsculo ("de", "da"...).
const PREPOSICOES_MINUSCULAS = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);
function formatarCargo(cargo) {
  if (!cargo) return null;
  return cargo.toLowerCase().split(' ').map((palavra, i) => (
    i > 0 && PREPOSICOES_MINUSCULAS.has(palavra) ? palavra : palavra.charAt(0).toUpperCase() + palavra.slice(1)
  )).join(' ');
}

// Junta clt + pro_labore de uma competência numa lista só, já tagueada por
// tipo — a tabela mostra os dois juntos, o histórico (ficha) filtra por tipo.
function registrosDoMes(dpNominal, mes) {
  const bloco = dpNominal?.[mes];
  if (!bloco) return [];
  const clt = (bloco.clt || []).map((f) => ({ ...f, tipo: 'clt' }));
  const pl = (bloco.pro_labore || []).map((f) => ({ ...f, tipo: 'pro_labore' }));
  return [...clt, ...pl];
}

export default function FuncionariosTable({ dpNominal, competencias }) {
  const [aberto, setAberto] = useState(false);
  const [mes, setMes] = useState(competencias[competencias.length - 1]);
  const [busca, setBusca] = useState('');
  const [selecionado, setSelecionado] = useState(null); // { codigo, tipo, nome }

  const ultimaCompetencia = competencias[competencias.length - 1];
  const headcountAtual = registrosDoMes(dpNominal, ultimaCompetencia).length;

  const idxMes = competencias.indexOf(mes);
  const mesAnterior = idxMes > 0 ? competencias[idxMes - 1] : null;

  // Só rastreia admissão/demissão pra CLT — pró-labore (sócios) não tem
  // rotatividade no mesmo sentido, e parse_folha também só compara códigos CLT.
  const codigosCltAnterior = useMemo(() => {
    if (!mesAnterior) return null;
    return new Set((dpNominal[mesAnterior]?.clt || []).map((f) => f.codigo));
  }, [dpNominal, mesAnterior]);

  const registros = useMemo(() => {
    const lista = registrosDoMes(dpNominal, mes).map((f) => ({
      ...f,
      bruto: Math.round((f.salario + f.out_prov) * 100) / 100,
      admitidoNoMes: f.tipo === 'clt' && codigosCltAnterior ? !codigosCltAnterior.has(f.codigo) : false,
      cargo: formatarCargo(CARGOS_2026_S1[f.codigo]),
    }));
    const termo = busca.trim().toLowerCase();
    const filtrada = termo ? lista.filter((f) => f.nome.toLowerCase().includes(termo)) : lista;
    return filtrada.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [dpNominal, mes, busca, codigosCltAnterior]);

  // Quem estava no mês anterior e não aparece mais neste — não vira linha na
  // tabela (a tabela é "quem está na folha agora"), mas vale sinalizar.
  const desligadosDoMes = useMemo(() => {
    if (!mesAnterior) return [];
    const codigosAtual = new Set((dpNominal[mes]?.clt || []).map((f) => f.codigo));
    return (dpNominal[mesAnterior]?.clt || []).filter((f) => !codigosAtual.has(f.codigo));
  }, [dpNominal, mes, mesAnterior]);

  const historico = useMemo(() => {
    if (!selecionado) return [];
    return competencias.map((comp) => {
      const lista = dpNominal[comp]?.[selecionado.tipo] || [];
      const registro = lista.find((f) => f.codigo === selecionado.codigo);
      return { competencia: comp, registro };
    });
  }, [selecionado, dpNominal, competencias]);

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all text-left w-full sm:w-72"
      >
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${ACCENT}22` }}>
          <Users className="w-5 h-5" style={{ color: ACCENT }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900">Quadro de Funcionários</p>
          <p className="text-xs text-slate-600">{headcountAtual} na folha em {mesLabel(ultimaCompetencia)}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
      </button>

      {/* backdrop + painel lateral — sempre montados, animam via transform/opacity
          pra não perder o estado de busca/mês toda vez que fecha e abre */}
      <div
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-200 ${aberto ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setAberto(false)}
      />
      <div
        className={`fixed inset-y-0 right-0 z-50 h-full w-full sm:w-[680px] bg-white border-l border-slate-200 shadow-2xl overflow-y-auto transition-transform duration-200 ease-out ${aberto ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div>
            <h3 className="font-black text-slate-900 text-sm">Quadro de Funcionários</h3>
            <p className="text-xs text-slate-600 mt-0.5">{registros.length} na folha em {mesLabel(mes)}/{mes.split('-')[0]}</p>
          </div>
          <button onClick={() => setAberto(false)} className="text-slate-600 hover:text-slate-700 p-1.5 hover:bg-slate-50 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <div className="relative flex-1 min-w-[160px]">
              <Search className="w-3.5 h-3.5 text-slate-600 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome..."
                className="pl-8 pr-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-600 rounded-lg outline-none focus:border-slate-300 w-full"
              />
            </div>
            <select
              value={mes}
              onChange={(e) => setMes(e.target.value)}
              className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 outline-none focus:border-slate-300"
            >
              {competencias.map((c) => (
                <option key={c} value={c} className="bg-white">{mesLabel(c)}/{c.split('-')[0]}</option>
              ))}
            </select>
          </div>

          <p className="text-[11px] text-slate-600 mb-4">Clique num nome pra ver o histórico no semestre.</p>

          {desligadosDoMes.length > 0 && (
            <div className="flex items-start gap-2 text-xs text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2 mb-4">
              <UserMinus className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>Saíram da folha entre {mesLabel(mesAnterior)} e {mesLabel(mes)}: {desligadosDoMes.map((f) => f.nome).join(', ')}.</span>
            </div>
          )}

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            {registros.map((f) => (
              <div
                key={`${f.tipo}-${f.codigo}`}
                onClick={() => setSelecionado({ codigo: f.codigo, tipo: f.tipo, nome: f.nome })}
                className="flex items-center justify-between px-3 py-2.5 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 cursor-pointer"
              >
                <div className="flex items-baseline gap-2 min-w-0">
                  <span className="text-xs font-semibold text-slate-800 truncate">{f.nome}</span>
                  {f.cargo && <span className="text-[11px] text-slate-600 truncate shrink-0">{f.cargo}</span>}
                  {f.admitidoNoMes && (
                    <span className="flex items-center gap-0.5 text-emerald-400 bg-emerald-400/10 border border-emerald-400/30 rounded-full px-1.5 py-0.5 text-[9px] font-bold shrink-0">
                      <UserPlus className="w-2.5 h-2.5" /> novo
                    </span>
                  )}
                  <span className="text-[10px] text-slate-600 font-medium shrink-0">{TIPO_LABEL[f.tipo]}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              </div>
            ))}
            {registros.length === 0 && (
              <p className="px-3 py-6 text-center text-xs text-slate-600 italic">Nenhum funcionário encontrado para "{busca}".</p>
            )}
          </div>
        </div>
      </div>

      {selecionado && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
          onClick={() => setSelecionado(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 sticky top-0 bg-white">
              <div>
                <h4 className="font-black text-slate-900 text-sm">{selecionado.nome}</h4>
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wide mt-0.5">
                  {[formatarCargo(CARGOS_2026_S1[selecionado.codigo]), TIPO_LABEL[selecionado.tipo], `Código ${selecionado.codigo}`].filter(Boolean).join(' · ')}
                </p>
              </div>
              <button onClick={() => setSelecionado(null)} className="text-slate-600 hover:text-slate-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-4 overflow-x-auto">
              <table className="w-full text-xs min-w-[560px]">
                <thead>
                  <tr className="text-left text-slate-600 font-bold uppercase text-[9px] border-b border-slate-200">
                    <th className="py-2 pr-2">Mês</th>
                    <th className="py-2 px-2 text-right">Salário</th>
                    <th className="py-2 px-2 text-right">Out. Prov.</th>
                    <th className="py-2 px-2 text-right">Bruto</th>
                    <th className="py-2 px-2 text-right">INSS</th>
                    <th className="py-2 px-2 text-right">IRRF</th>
                    <th className="py-2 px-2 text-right">Out. Desc.</th>
                    <th className="py-2 px-2 text-right">Líquido</th>
                    <th className="py-2 pl-2 text-right">FGTS</th>
                  </tr>
                </thead>
                <tbody>
                  {historico.map(({ competencia, registro }) => (
                    <tr key={competencia} className={`border-b border-slate-100 ${!registro ? 'opacity-40' : ''}`}>
                      <td className="py-2 pr-2 font-bold text-slate-500">{mesLabel(competencia)}</td>
                      {registro ? (
                        <>
                          <td className="py-2 px-2 text-right text-slate-500">{fBRL(registro.salario)}</td>
                          <td className="py-2 px-2 text-right text-slate-500">{fBRL(registro.out_prov)}</td>
                          <td className="py-2 px-2 text-right font-bold text-slate-900">{fBRL(registro.salario + registro.out_prov)}</td>
                          <td className="py-2 px-2 text-right text-slate-600">{fBRL(registro.inss)}</td>
                          <td className="py-2 px-2 text-right text-slate-600">{fBRL(registro.irrf)}</td>
                          <td className="py-2 px-2 text-right text-slate-600">{fBRL(registro.out_desc)}</td>
                          <td className="py-2 px-2 text-right font-bold text-slate-900">{fBRL(registro.liquido)}</td>
                          <td className="py-2 pl-2 text-right text-slate-600">{fBRL(registro.fgts)}</td>
                        </>
                      ) : (
                        <td colSpan={8} className="py-2 px-2 text-center italic text-slate-600">Fora da folha neste mês</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
