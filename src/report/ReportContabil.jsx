import { useState } from 'react';
import {
  Calculator, TrendingUp, TrendingDown, Percent, ChevronDown, ChevronUp, Info, Landmark, Scale,
  Calendar, Repeat, AlertTriangle, Activity,
} from 'lucide-react';
import StatCard from './components/StatCard';
import MonthlyChart from './components/MonthlyChart';
import { fBRL, fBRLCompact, fPct, fVezes, ACCENT, periodoLabelCurto, escopoPeriodo } from './theme';
import {
  calcMargemBruta, calcMargemLiquida, calcPctDespesasAdministrativas,
  calcCmvSobreReceita, calcCargaTributaria, calcMargemEbitda,
  calcResultadoRecorrente, calcPontoEquilibrio, calcEbit, calcMargemOperacional,
  calcCoberturaDespesasAdm, calcCustosFixosVariaveis, calcLiquidez, calcEndividamento,
} from './indicators';
import {
  parsePeriodoId, periodoAnoAnterior, periodoAnteriorSequencial, calcVariacaoPct,
  calcCrescimentoReal, calcAlavancagemOperacional, calcProdutividadeSerie, calcSazonalidade,
} from './comparisons';
import { PADROES_DEPRECIACAO, PADROES_NAO_RECORRENTES } from './config/contasEspeciais';
import { classificar, direcaoTendencia } from './config/benchmarks';

const fmtVariacao = (v) => (v == null ? '—' : `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`);
const round2 = (n) => Math.round(n * 100) / 100;

// Texto explicativo por indicador — aparece quando o card é clicado. As
// faixas de referência citadas aqui são as mesmas de config/benchmarks.js
// (fonte dos níveis de semáforo); se ajustar um lado, ajustar o outro.
const EXPLICACOES = {
  margemBruta: {
    texto: 'Percentual da receita líquida que sobra depois de pagar o custo direto das mercadorias vendidas (CMV). Mostra a rentabilidade da venda em si, antes das despesas administrativas e da estrutura fixa.',
    referencia: 'Abaixo de 15% é apertado; entre 15% e 30% é uma faixa saudável; acima de 30% indica boa margem sobre o produto.',
  },
  margemLiquida: {
    texto: 'O que sobra de lucro depois de TODAS as despesas — administrativas, gerais e financeiras. De cada R$100 vendidos, quanto vira lucro de verdade no fim da conta.',
    referencia: 'Abaixo de 2% é uma margem apertada, qualquer imprevisto vira prejuízo; entre 2% e 8% é razoável; acima de 8% é saudável.',
  },
  margemOperacional: {
    texto: 'Resultado da operação em si (Lucro Bruto menos Despesas Administrativas e Gerais), ANTES do resultado financeiro. Mostra se o negócio dá lucro pela venda + estrutura, sem depender de juros/rendimentos para fechar a conta no azul.',
    referencia: 'Abaixo de 3% é uma operação apertada; entre 3% e 10% é razoável; acima de 10% é uma operação saudável.',
  },
  margemEbitda: {
    texto: 'Lucro antes de juros, resultado financeiro e depreciação/amortização — mostra a geração de caixa da operação, sem o efeito de decisões financeiras ou contábeis que não movimentam caixa.',
    referencia: 'Abaixo de 5% é geração de caixa fraca; entre 5% e 12% é razoável; acima de 12% é saudável.',
  },
  despesasAdm: {
    texto: 'Quanto da receita líquida é consumido pela folha de pagamento e pela estrutura administrativa (aluguel, energia, água, telefone). Mostra o peso da estrutura fixa sobre o negócio.',
    referencia: 'Até 20% é uma estrutura enxuta; entre 20% e 30% é comum; acima de 30% indica estrutura pesada para o tamanho da receita.',
  },
  cmv: {
    texto: 'Quanto da receita líquida foi consumido pelo custo das mercadorias vendidas (o que a empresa pagou pelos produtos revendidos). É naturalmente alto no varejo/mercearia.',
    referencia: 'Varia muito por segmento — comércio costuma ficar entre 60% e 75%. Vale mais comparar com os semestres anteriores da própria empresa do que com uma régua genérica.',
  },
  cargaTributaria: {
    texto: 'Soma de ICMS, PIS e COFINS sobre a receita bruta — quanto do faturamento vai direto para impostos sobre a venda, antes de qualquer despesa ou lucro.',
    referencia: 'Até 12% é uma carga leve; entre 12% e 20% é comum; acima de 20% pode valer revisar o enquadramento tributário com o contador.',
  },
  pontoEquilibrio: {
    texto: 'A receita bruta mínima que a empresa precisa faturar no período para cobrir todos os custos (variáveis + fixos), sem lucro nem prejuízo. Abaixo disso, a operação dá prejuízo.',
    referencia: 'Não existe "bom" ou "ruim" isolado aqui — o que importa é a distância até a receita bruta real do período (ver Margem de Segurança).',
  },
  margemSeguranca: {
    texto: 'O quanto a receita bruta atual está acima do Ponto de Equilíbrio. Mostra a folga que a empresa tem antes de a operação começar a dar prejuízo.',
    referencia: 'Abaixo de 10% é uma folga apertada — qualquer queda de vendas já ameaça o resultado; entre 10% e 25% é razoável; acima de 25% é uma folga confortável.',
  },
  coberturaDespesasAdm: {
    texto: 'Quantas vezes o Lucro Bruto cobre as Despesas Administrativas. Mostra se a venda por si só (já descontado o custo direto) sustenta a folha e a estrutura fixa, antes mesmo de entrar Despesas Gerais e Resultado Financeiro.',
    referencia: 'Abaixo de 1,0x o Lucro Bruto nem cobre a estrutura administrativa sozinho; entre 1,0x e 1,3x é uma folga apertada; acima de 1,3x é confortável.',
  },
  liquidezCorrente: {
    texto: 'Quantas vezes o Ativo Circulante (caixa + estoque + a receber) cobre o Passivo Circulante (dívidas que vencem em até 12 meses). Mede a folga pra pagar as contas de curto prazo sem precisar vender ativo fixo ou tomar dívida nova.',
    referencia: 'Abaixo de 1,5x é sinal de alerta — a folga está apertada; entre 1,5x e 2,0x é razoável; acima de 2,0x é confortável.',
  },
  liquidezSeca: {
    texto: 'Igual à Liquidez Corrente, mas tira o Estoque da conta — mede a capacidade de pagar o Passivo Circulante só com o que já é (ou vira) dinheiro rápido, sem depender de vender mercadoria primeiro.',
    referencia: 'Costuma ser bem menor que a Liquidez Corrente em varejo/mercearia (estoque é a maior parte do Ativo Circulante) — o que importa mais é a tendência ao longo do tempo do que um valor isolado.',
  },
  endividamentoGeral: {
    texto: 'Quanto do Ativo Total é financiado por terceiros (fornecedores, empréstimos, impostos a pagar) em vez de capital próprio. Quanto maior, mais a empresa depende de dívida pra sustentar a operação.',
    referencia: 'Até 50% é uma estrutura equilibrada; entre 50% e 70% já pesa mais pra dívida; acima de 70% é uma dependência forte de capital de terceiros.',
  },
};

// Um getter por linha da DRE — fonte única usada tanto pro valor do período
// atual quanto pro período de comparação (variação %), pra não duplicar a
// lógica de sinal em cada chamada de <Linha>.
const CAMPO_DRE = {
  receitaBruta: (o) => o?.receita_bruta?.total,
  vendasVista: (o) => o?.receita_bruta?.vendas_vista,
  vendasPrazo: (o) => o?.receita_bruta?.vendas_prazo,
  deducoes: (o) => -((o?.deducoes?.total) || 0),
  icms: (o) => -((o?.deducoes?.icms) || 0),
  cofins: (o) => -((o?.deducoes?.cofins) || 0),
  pis: (o) => -((o?.deducoes?.pis) || 0),
  devolucao: (o) => -((o?.deducoes?.devolucao) || 0),
  receitaLiquida: (o) => o?.receita_liquida,
  cmv: (o) => -((o?.cmv) || 0),
  lucroBruto: (o) => o?.lucro_bruto,
  despesasAdm: (o) => -((o?.despesas_administrativas?.total) || 0),
  despesasGerais: (o) => -((o?.despesas_gerais?.total) || 0),
  ebit: (o) => calcEbit(o),
  resultadoFinanceiro: (o) => o?.resultado_financeiro,
  lucroLiquido: (o) => o?.lucro_liquido,
};

// Linhas que são SEMPRE custo (o valor só é negativo por convenção de
// exibição da DRE, não porque o "resultado" possa ficar negativo de verdade).
// Pra essas, a variação % é calculada pela magnitude — senão um imposto que
// cresceu 5,8% apareceria como "-5,8%" (o valor exibido ficou mais negativo),
// o oposto do que um contador diria em voz alta. Lucro/resultado financeiro
// ficam de fora dessa lista de propósito: ali o sinal É a informação (pode
// virar prejuízo de verdade), então mantém a fórmula literal sem abs().
const CAMPOS_SEMPRE_CUSTO = new Set(['deducoes', 'icms', 'cofins', 'pis', 'devolucao', 'cmv', 'despesasAdm', 'despesasGerais']);

function Linha({ label, campo, c, cComparado, bold, indent, sinal, onClick, expandido, expansivel, modo, pctBase }) {
  const getter = CAMPO_DRE[campo];
  const valor = getter(c);
  let exibido;
  if (modo === 'percentual' && pctBase) {
    exibido = `${((valor / pctBase) * 100).toFixed(1)}%`;
  } else if (modo === 'variacao') {
    if (!cComparado) {
      exibido = '—';
    } else {
      const valorComparado = getter(cComparado);
      const ehCusto = CAMPOS_SEMPRE_CUSTO.has(campo);
      const variacao = calcVariacaoPct(ehCusto ? Math.abs(valor) : valor, ehCusto ? Math.abs(valorComparado) : valorComparado);
      exibido = fmtVariacao(variacao);
    }
  } else {
    exibido = fBRL(valor);
  }
  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between py-2.5 ${indent ? 'pl-6' : ''} ${bold ? 'border-t-2 border-slate-300 mt-1 pt-3' : 'border-b border-slate-200'} ${expansivel ? 'cursor-pointer hover:bg-slate-50 -mx-2 px-2 rounded' : ''}`}
    >
      <span className={`text-sm flex items-center gap-1.5 ${bold ? 'font-black text-slate-900' : 'text-slate-500 font-medium'}`}>
        {expansivel && (expandido ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
        {sinal && <span className="text-slate-600 font-mono">{sinal}</span>} {label}
      </span>
      <span className={`text-sm ${bold ? 'font-black text-slate-900 text-base' : 'font-bold text-slate-700'}`}>{exibido}</span>
    </div>
  );
}

// Mesmo bloco usado na Comparação Temporal (YoY ou sequencial, conforme o
// toggle) — antes era um parágrafo com "Receita: X% · Folha: Y% · Desp.
// Gerais: Z%" numa linha só, que quebra mal em telas estreitas. Como
// mini-stats lado a lado (flex-wrap), cada métrica quebra de forma
// independente e nunca estoura o card.
function AlavancagemStats({ crescimentoReceita, alavancagem }) {
  return (
    <div>
      <div className="flex flex-wrap gap-x-8 gap-y-3">
        <div>
          <span className="text-[10px] text-slate-500 font-bold uppercase block">Receita</span>
          <p className="text-lg font-black text-slate-900">{fmtVariacao(crescimentoReceita)}</p>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 font-bold uppercase block">Folha</span>
          <p className={`text-lg font-black ${alavancagem?.alertaFolha ? 'text-red-400' : 'text-slate-900'}`}>{fmtVariacao(alavancagem?.crescimentoFolha)}</p>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 font-bold uppercase block">Desp. Gerais</span>
          <p className={`text-lg font-black ${alavancagem?.alertaDespGerais ? 'text-red-400' : 'text-slate-900'}`}>{fmtVariacao(alavancagem?.crescimentoDespGerais)}</p>
        </div>
      </div>
      {(alavancagem?.alertaFolha || alavancagem?.alertaDespGerais) && (
        <p className="text-xs text-red-400 flex items-start gap-1.5 mt-3">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> Custo crescendo mais rápido que a receita — possível perda de eficiência operacional.
        </p>
      )}
    </div>
  );
}

function DetalheContas({ contas, modo, pctBase }) {
  return (
    <div className="pl-10 pb-2 space-y-1">
      {modo === 'variacao' && (
        <p className="text-[10px] text-slate-500 italic mb-1">Detalhamento por conta mostrado em R$ — variação disponível só nos totais.</p>
      )}
      {Object.entries(contas).filter(([k]) => k !== 'total').map(([conta, valor]) => (
        <div key={conta} className="flex items-center justify-between py-1 text-xs">
          <span className="text-slate-600">{conta}</span>
          <span className="text-slate-500 font-semibold">
            {modo === 'percentual' && pctBase ? `${((valor / pctBase) * 100).toFixed(1)}%` : fBRL(valor)}
          </span>
        </div>
      ))}
    </div>
  );
}

// Cabeçalho padrão de cada bloco temático (ícone + rótulo + título + uma
// linha de contexto) — mesmo padrão nas 4 seções, extraído pra não repetir
// as mesmas 5 linhas de className quatro vezes.
function SecaoHeader({ icon: Icon, eyebrow, titulo, desc, children }) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap mb-1">
      <div>
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-600">
          <Icon className="w-4 h-4" style={{ color: ACCENT }} /> {eyebrow}
        </div>
        <h3 className="text-lg font-black text-slate-900 mt-1">{titulo}</h3>
        {desc && <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">{desc}</p>}
      </div>
      {children}
    </div>
  );
}

// Barras de "funil" (Receita Bruta -> Lucro Líquido), cada linha como % da
// Receita Bruta — mesma cor do semáforo dos StatCards pra reforçar visualmente
// onde a margem vai apertando (EBIT/Lucro Líquido em cor de alerta quando a
// faixa fica fina).
function FunilComposicao({ receitaBrutaTotal, receitaLiquida, lucroBruto, ebit, lucroLiquido }) {
  if (!receitaBrutaTotal) {
    return <p className="text-sm text-slate-500 italic py-2">Sem Receita Bruta no período para montar a composição.</p>;
  }
  const linhas = [
    { label: 'Receita Bruta', valor: receitaBrutaTotal, cor: ACCENT },
    { label: 'Receita Líquida', valor: receitaLiquida, cor: ACCENT },
    { label: 'Lucro Bruto', valor: lucroBruto, cor: '#64748b' },
    { label: 'EBIT', valor: ebit, cor: '#f59e0b' },
    { label: 'Lucro Líquido', valor: lucroLiquido, cor: '#ef4444' },
  ];
  return (
    <div className="space-y-2 mt-3">
      {linhas.map(({ label, valor, cor }) => {
        const pct = (valor / receitaBrutaTotal) * 100;
        return (
          <div key={label} className="grid grid-cols-[110px_1fr_110px] sm:grid-cols-[140px_1fr_130px] items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 truncate">{label}</span>
            <div className="h-5 bg-slate-50 rounded overflow-hidden">
              <div className="h-full rounded" style={{ width: `${Math.max(0, Math.min(100, pct))}%`, backgroundColor: cor }} />
            </div>
            <div className="text-right text-xs">
              <b className="text-slate-900 font-bold">{fBRLCompact(valor)}</b>
              <span className="text-slate-500 font-semibold ml-1.5">{pct.toFixed(1)}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// "Bullet chart": receita bruta (barra) vs. ponto de equilíbrio (marcador) de
// cada período disponível, na mesma escala — mostra a Margem de Segurança
// encolhendo/crescendo entre semestres de forma mais direta que um combo
// bar+linha com dois eixos.
function BulletsReceitaBreakeven({ serie }) {
  const max = Math.max(...serie.map((s) => s.receitaBruta || 0), 1);
  return (
    <div className="space-y-4 mt-3">
      {serie.map((s) => {
        const barPct = ((s.receitaBruta || 0) / max) * 100;
        const tickPct = s.pontoEquilibrio != null ? (s.pontoEquilibrio / max) * 100 : null;
        const folgaPp = tickPct != null ? barPct - tickPct : null;
        return (
          <div key={s.label} className="grid grid-cols-[44px_1fr_112px] items-center gap-3">
            <span className="text-xs font-bold text-slate-600">{s.label}</span>
            <div className="h-6 bg-slate-50 rounded relative">
              <div className="h-full rounded" style={{ width: `${barPct}%`, backgroundColor: ACCENT }} />
              {tickPct != null && (
                <div className="absolute -top-1 -bottom-1 w-0.5 bg-slate-800" style={{ left: `${tickPct}%` }} />
              )}
            </div>
            <div className="text-right text-xs font-bold text-slate-900">
              {fBRLCompact(s.receitaBruta)}
              {folgaPp != null && <span className="block text-[10px] font-semibold text-slate-500">folga {folgaPp.toFixed(1)}pp</span>}
            </div>
          </div>
        );
      })}
      <p className="text-[11px] text-slate-500">A barra dourada é a receita bruta; o traço escuro marca o break-even. Quanto mais perto do fim da barra, menor a folga (Margem de Segurança).</p>
    </div>
  );
}

export default function ReportContabil({ data, periodosData = {}, periodoAtualId }) {
  const c = data.contabil || {};
  const dp = data.dp || {};
  const periodo = data.periodo || {};
  const escopo = escopoPeriodo(data.periodo);
  const balancoHistorico = [...(data.balanco || [])].sort((a, b) => a.data.localeCompare(b.data));
  const balancoAtual = balancoHistorico[balancoHistorico.length - 1] || null;
  const liquidez = balancoAtual ? calcLiquidez(balancoAtual) : null;
  const endividamento = balancoAtual ? calcEndividamento(balancoAtual) : null;
  const [expandido, setExpandido] = useState({ adm: false, gerais: false });
  const [modoDRE, setModoDRE] = useState('valor'); // 'valor' | 'percentual' | 'variacao'
  const [baseVariacao, setBaseVariacao] = useState('sequencial'); // 'sequencial' | 'anual' — compartilhado entre a DRE (modo variação) e a Comparação Temporal

  // ── período de comparação (sequencial e YoY) ────────────────────────────
  const periodosDisponiveis = Object.keys(periodosData);
  const periodoSeqAnteriorId = periodoAtualId ? periodoAnteriorSequencial(periodosDisponiveis, periodoAtualId) : null;
  const periodoAnoAnteriorId = periodoAtualId ? periodoAnoAnterior(periodoAtualId) : null;
  const dadosSeqAnterior = periodoSeqAnteriorId ? periodosData[periodoSeqAnteriorId] : null;
  const dadosAnoAnterior = periodoAnoAnteriorId ? periodosData[periodoAnoAnteriorId] : null;

  // ── indicadores do período atual ────────────────────────────────────────
  const margemBruta = calcMargemBruta(c);
  const margemLiquida = calcMargemLiquida(c);
  const pctDespesasAdm = calcPctDespesasAdministrativas(c);
  const cmvPct = calcCmvSobreReceita(c);
  const cargaTributaria = calcCargaTributaria(c);
  const { margem: margemEbitda } = calcMargemEbitda(c, PADROES_DEPRECIACAO);
  const { lucroLiquido, lucroRecorrente, totalNaoRecorrente, itensNaoRecorrentes } = calcResultadoRecorrente(c, PADROES_NAO_RECORRENTES);
  const pontoEquilibrio = calcPontoEquilibrio(c);
  const margemOperacional = calcMargemOperacional(c);
  const coberturaDespesasAdm = calcCoberturaDespesasAdm(c);
  const custosFixosVariaveis = calcCustosFixosVariaveis(c);
  const ebitAtual = calcEbit(c);
  const receitaBrutaTotal = c.receita_bruta?.total || 0;
  // Base da Análise Vertical (coluna "% Receita" da DRE) é a Receita Líquida —
  // padrão contábil (AV% = conta / Receita Líquida). Por isso a própria
  // Receita Bruta aparece acima de 100% (ela inclui os tributos que a Receita
  // Líquida já não tem).
  const pctBase = c.receita_liquida;

  // ── setas de tendência — sempre contra o período sequencial anterior ────
  const montaTendencia = (indicador, valorAtual, calcAnterior, formatter = fPct) => {
    if (!dadosSeqAnterior) return undefined;
    const valorAnterior = calcAnterior(dadosSeqAnterior.contabil, dadosSeqAnterior.dp);
    return {
      direcao: direcaoTendencia(indicador, valorAtual, valorAnterior),
      textoAnterior: `${periodoLabelCurto(periodoSeqAnteriorId)}: ${formatter(valorAnterior)}`,
    };
  };

  // ── análise comparativa (YoY e sequencial) ──────────────────────────────
  const crescimentoNominalAnual = dadosAnoAnterior ? calcVariacaoPct(c.receita_liquida, dadosAnoAnterior.contabil?.receita_liquida) : null;
  const crescimentoRealAnual = crescimentoNominalAnual != null ? calcCrescimentoReal(crescimentoNominalAnual, data.ipca_acumulado) : null;
  const alavancagemAnual = dadosAnoAnterior ? calcAlavancagemOperacional(data, dadosAnoAnterior) : null;

  const crescimentoNominalSeq = dadosSeqAnterior ? calcVariacaoPct(c.receita_liquida, dadosSeqAnterior.contabil?.receita_liquida) : null;
  const crescimentoRealSeq = crescimentoNominalSeq != null ? calcCrescimentoReal(crescimentoNominalSeq, data.ipca_acumulado) : null;
  const alavancagemSeq = dadosSeqAnterior ? calcAlavancagemOperacional(data, dadosSeqAnterior) : null;

  // Comparação Temporal lê estas quatro conforme o toggle (baseVariacao) —
  // um único bloco no lugar de "Comparação Anual" e "Evolução Sequencial"
  // duplicados.
  const dadosComparacaoAtual = baseVariacao === 'anual' ? dadosAnoAnterior : dadosSeqAnterior;
  const periodoComparacaoIdAtual = baseVariacao === 'anual' ? periodoAnoAnteriorId : periodoSeqAnteriorId;
  const crescimentoNominalAtual = baseVariacao === 'anual' ? crescimentoNominalAnual : crescimentoNominalSeq;
  const crescimentoRealAtual = baseVariacao === 'anual' ? crescimentoRealAnual : crescimentoRealSeq;
  const alavancagemAtual = baseVariacao === 'anual' ? alavancagemAnual : alavancagemSeq;

  const periodosOrdenadosAsc = [...periodosDisponiveis].sort();
  const produtividadeSerie = calcProdutividadeSerie(periodosOrdenadosAsc, periodosData);
  const anoAtual = periodoAtualId ? parsePeriodoId(periodoAtualId)?.ano : null;
  const sazonalidade = anoAtual ? calcSazonalidade(periodosData, anoAtual) : null;

  // Série de margens/receita por semestre — alimenta o sparkline do hero, o
  // gráfico de margens (Rentabilidade) e o bullet chart (Ponto de Equilíbrio).
  const evolucaoSemestresSerie = periodosOrdenadosAsc
    .filter((id) => periodosData[id]?.contabil)
    .map((id) => {
      const contabilPeriodo = periodosData[id].contabil;
      const peSerie = calcPontoEquilibrio(contabilPeriodo);
      return {
        label: periodoLabelCurto(id),
        receitaLiquida: contabilPeriodo.receita_liquida,
        lucroLiquido: contabilPeriodo.lucro_liquido,
        margemLiquida: calcMargemLiquida(contabilPeriodo),
        margemOperacional: calcMargemOperacional(contabilPeriodo),
        margemEbitda: calcMargemEbitda(contabilPeriodo, PADROES_DEPRECIACAO).margem,
        receitaBruta: contabilPeriodo.receita_bruta?.total,
        pontoEquilibrio: peSerie?.pontoEquilibrio ?? null,
      };
    });

  const cComparadoDRE = modoDRE === 'variacao' ? (baseVariacao === 'anual' ? dadosAnoAnterior?.contabil : dadosSeqAnterior?.contabil) : null;
  const linhaProps = { c, cComparado: cComparadoDRE, modo: modoDRE, pctBase };

  return (
    <div className="space-y-6">

      <h2 className="text-xl font-black text-slate-900">Análise Contábil</h2>

      {/* ── RENTABILIDADE ────────────────────────────────────────────── */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200">
        <SecaoHeader
          icon={TrendingUp} eyebrow="Rentabilidade" titulo="Margens sobre a Receita"
          desc="Da venda ao lucro final — cada margem mostra onde o resultado está sendo consumido. Clique num card pra entender o que ele significa."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <StatCard
            label="Margem Bruta" value={fPct(margemBruta)} sub="Lucro Bruto / Receita Líquida"
            icon={TrendingUp} nivel={classificar('margemBruta', margemBruta)}
            tendencia={montaTendencia('margemBruta', margemBruta, calcMargemBruta)}
            explicacao={EXPLICACOES.margemBruta}
          />
          <StatCard
            label="Margem Operacional (EBIT)" value={fPct(margemOperacional)} sub="Resultado antes do Financeiro / Receita Líquida"
            icon={margemOperacional >= 0 ? TrendingUp : TrendingDown} nivel={classificar('margemOperacional', margemOperacional)}
            tendencia={montaTendencia('margemOperacional', margemOperacional, calcMargemOperacional)}
            explicacao={EXPLICACOES.margemOperacional}
          />
          <StatCard
            label="Margem Líquida" value={fPct(margemLiquida)} sub="Lucro Líquido / Receita Líquida"
            icon={margemLiquida >= 0 ? TrendingUp : TrendingDown} nivel={classificar('margemLiquida', margemLiquida)}
            tendencia={montaTendencia('margemLiquida', margemLiquida, calcMargemLiquida)}
            explicacao={EXPLICACOES.margemLiquida}
          />
          <StatCard
            label="Margem EBITDA" value={fPct(margemEbitda)} sub="Lucro + Fin. + Depreciação"
            icon={TrendingUp} nivel={classificar('margemEbitda', margemEbitda)}
            tendencia={montaTendencia('margemEbitda', margemEbitda, (cc) => calcMargemEbitda(cc, PADROES_DEPRECIACAO).margem)}
            explicacao={EXPLICACOES.margemEbitda}
          />
        </div>

        {evolucaoSemestresSerie.length >= 2 ? (
          <div className="mt-6 pt-6 border-t border-slate-200">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block mb-2">Margens ao longo dos semestres</span>
            <MonthlyChart
              height={220}
              data={evolucaoSemestresSerie}
              series={[
                { key: 'margemEbitda', label: 'Margem EBITDA', color: ACCENT, type: 'line' },
                { key: 'margemOperacional', label: 'Margem Operacional', color: '#94a3b8', type: 'line' },
                { key: 'margemLiquida', label: 'Margem Líquida', color: '#60a5fa', type: 'line' },
              ]}
              valueFormatter={fPct}
            />
            <p className="text-[11px] text-slate-500 mt-2">O espaço entre as três linhas mostra a distância entre geração de caixa (EBITDA), resultado operacional (EBIT) e o que sobra de verdade (Líquida).</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block mb-2">Receita Líquida</span>
                <MonthlyChart height={160} data={evolucaoSemestresSerie} series={[{ key: 'receitaLiquida', label: 'Receita Líquida', color: ACCENT, type: 'bar' }]} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block mb-2">Lucro Líquido</span>
                <MonthlyChart height={160} data={evolucaoSemestresSerie} series={[{ key: 'lucroLiquido', label: 'Lucro Líquido', color: '#10b981', type: 'bar' }]} />
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500 italic mt-4 pt-4 border-t border-slate-200">Precisa de pelo menos 2 períodos disponíveis pra montar os gráficos de evolução.</p>
        )}

        <div className="mt-6 pt-6 border-t border-slate-200">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-3">
            <Calculator className="w-3.5 h-3.5" style={{ color: ACCENT }} /> Resultado Recorrente vs. Não-Recorrente
          </div>
          <div className="flex flex-wrap items-start gap-x-10 gap-y-3">
            <div>
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block mb-1">Lucro Líquido</span>
              <span className="text-2xl font-black text-slate-900">{fBRL(lucroLiquido)}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1 mb-1">
                Lucro Recorrente
                <span
                  title={itensNaoRecorrentes.length
                    ? `Exclui ${itensNaoRecorrentes.length} item(ns) atípico(s) somando ${fBRL(totalNaoRecorrente)}: ${itensNaoRecorrentes.map((i) => i.conta).join(', ')}`
                    : 'Nenhum item não-recorrente identificado no período'}
                >
                  <Info className="w-3 h-3 text-slate-500 cursor-help" />
                </span>
              </span>
              <span className="text-2xl font-black text-emerald-400">{fBRL(lucroRecorrente)}</span>
            </div>
          </div>
          {itensNaoRecorrentes.length > 0 && (
            <p className="text-xs text-slate-500 mt-3">
              Itens desconsiderados: {itensNaoRecorrentes.map((i) => `${i.conta} (${fBRL(i.valor)})`).join(' · ')}
            </p>
          )}
        </div>
      </div>

      {/* ── ESTRUTURA DE CUSTOS ──────────────────────────────────────── */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200">
        <SecaoHeader
          icon={Percent} eyebrow="Estrutura de Custos" titulo="Da Receita Bruta ao Lucro Líquido"
          desc="Onde cada real do faturamento é consumido, e o quanto disso é estrutura fixa vs. custo que acompanha a venda."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <StatCard
            label="CMV / Receita Líquida" value={fPct(cmvPct)} sub="Custo das mercadorias vendidas" icon={Percent}
            explicacao={EXPLICACOES.cmv}
          />
          <StatCard
            label="Despesas Adm. / Receita" value={fPct(pctDespesasAdm)} sub="Peso da folha e estrutura fixa" icon={Percent}
            nivel={classificar('despesasAdm', pctDespesasAdm)}
            tendencia={montaTendencia('despesasAdm', pctDespesasAdm, calcPctDespesasAdministrativas)}
            explicacao={EXPLICACOES.despesasAdm}
          />
          <StatCard
            label="Carga Tributária" value={fPct(cargaTributaria)} sub="ICMS+PIS+COFINS / Receita Bruta" icon={Percent}
            nivel={classificar('cargaTributaria', cargaTributaria)}
            tendencia={montaTendencia('cargaTributaria', cargaTributaria, calcCargaTributaria)}
            explicacao={EXPLICACOES.cargaTributaria}
          />
          {coberturaDespesasAdm != null ? (
            <StatCard
              label="Cobertura Despesas Adm." value={fVezes(coberturaDespesasAdm)} sub="Lucro Bruto / Despesas Administrativas" icon={Scale}
              nivel={coberturaDespesasAdm >= 1.3 ? 'saudavel' : coberturaDespesasAdm >= 1 ? 'neutro' : 'atencao'}
              tendencia={montaTendencia('coberturaDespesasAdm', coberturaDespesasAdm, calcCoberturaDespesasAdm, fVezes)}
              explicacao={EXPLICACOES.coberturaDespesasAdm}
            />
          ) : (
            <StatCard label="Cobertura Despesas Adm." empty icon={Scale} sub="Sem Despesas Administrativas no período" />
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-slate-200">
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block">Composição — Receita Bruta → Lucro Líquido</span>
          <FunilComposicao
            receitaBrutaTotal={receitaBrutaTotal} receitaLiquida={c.receita_liquida}
            lucroBruto={c.lucro_bruto} ebit={ebitAtual} lucroLiquido={c.lucro_liquido}
          />
        </div>

        <div className="mt-6 pt-6 border-t border-slate-200">
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block">Estrutura de Custos — Fixos x Variáveis</span>
          <p className="text-[11px] text-slate-500 mt-1 mb-3">Fixos = Despesas Administrativas + Gerais (não somem se a venda cair). Variáveis = CMV + Deduções (escalam com a venda).</p>
          {custosFixosVariaveis ? (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-slate-500">
                  Fixos <span className="text-slate-500 font-normal">({fBRL(custosFixosVariaveis.custosFixos)})</span> vs. Variáveis <span className="text-slate-500 font-normal">({fBRL(custosFixosVariaveis.custosVariaveis)})</span>
                </span>
                <span className="font-bold text-slate-900">{fPct(custosFixosVariaveis.pctFixos)} / {fPct(custosFixosVariaveis.pctVariaveis)}</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                <div className="h-full" style={{ width: `${custosFixosVariaveis.pctFixos}%`, backgroundColor: ACCENT }} />
                <div className="h-full bg-slate-400" style={{ width: `${custosFixosVariaveis.pctVariaveis}%` }} />
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Quanto maior a fatia fixa, mais o resultado sofre numa queda de vendas — o custo variável acompanha a receita, o fixo não.
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic py-2">Sem dados suficientes de custo no período para essa quebra.</p>
          )}
        </div>
      </div>

      {/* ── PONTO DE EQUILÍBRIO ──────────────────────────────────────── */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200">
        <SecaoHeader
          icon={Scale} eyebrow="Ponto de Equilíbrio" titulo="Quanto falta para o prejuízo"
          desc="A folga entre a receita real e a receita mínima para não fechar a conta no vermelho."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          {pontoEquilibrio ? (
            <>
              <StatCard
                label="Ponto de Equilíbrio" value={fBRL(pontoEquilibrio.pontoEquilibrio)}
                sub="Receita bruta mínima para não ter prejuízo" icon={Scale}
                explicacao={EXPLICACOES.pontoEquilibrio}
              />
              <StatCard
                label="Margem de Segurança" value={fPct(pontoEquilibrio.margemSeguranca)}
                sub="Quanto a receita atual está acima do break-even" icon={Percent}
                nivel={classificar('margemSeguranca', pontoEquilibrio.margemSeguranca)}
                tendencia={montaTendencia('margemSeguranca', pontoEquilibrio.margemSeguranca, (cc) => calcPontoEquilibrio(cc)?.margemSeguranca)}
                explicacao={EXPLICACOES.margemSeguranca}
              />
            </>
          ) : (
            <StatCard label="Ponto de Equilíbrio" empty icon={Scale} sub="Margem de contribuição negativa — sem break-even a calcular" />
          )}
        </div>

        {evolucaoSemestresSerie.length >= 2 ? (
          <div className="mt-6 pt-6 border-t border-slate-200">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block">Receita Bruta vs. Ponto de Equilíbrio</span>
            <BulletsReceitaBreakeven serie={evolucaoSemestresSerie} />
          </div>
        ) : (
          <p className="text-sm text-slate-500 italic mt-4 pt-4 border-t border-slate-200">Precisa de pelo menos 2 períodos disponíveis pra comparar receita bruta e break-even ao longo do tempo.</p>
        )}
      </div>

      {/* ── COMPARAÇÃO TEMPORAL ──────────────────────────────────────── */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200">
        <SecaoHeader
          icon={Calendar} eyebrow="Comparação Temporal" titulo="Crescimento e alavancagem operacional"
        >
          <div className="flex bg-slate-50 rounded-lg p-1 shrink-0 max-w-full overflow-x-auto">
            <button onClick={() => setBaseVariacao('anual')} disabled={!dadosAnoAnterior}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-[11px] font-bold rounded-md whitespace-nowrap transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${baseVariacao === 'anual' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-700'}`}>
              vs. {periodoAnoAnteriorId ? periodoLabelCurto(periodoAnoAnteriorId) : 'ano anterior'}
            </button>
            <button onClick={() => setBaseVariacao('sequencial')} disabled={!dadosSeqAnterior}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-[11px] font-bold rounded-md whitespace-nowrap transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${baseVariacao === 'sequencial' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-700'}`}>
              vs. {periodoSeqAnteriorId ? periodoLabelCurto(periodoSeqAnteriorId) : 'semestre anterior'}
            </button>
          </div>
        </SecaoHeader>

        {baseVariacao === 'sequencial' && (
          <p className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/30 rounded-lg px-3 py-2 mt-4 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            Trajetória entre semestres consecutivos pode carregar efeito de sazonalidade — troque pra "vs. ano anterior" pra uma leitura mais "limpa".
          </p>
        )}

        {!dadosComparacaoAtual ? (
          <p className="text-sm text-slate-500 italic py-4 mt-2">
            {periodoComparacaoIdAtual ? `Período ${periodoLabelCurto(periodoComparacaoIdAtual)} não disponível para comparação.` : 'Sem período comparável disponível.'}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div>
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block mb-2">
                Crescimento da Receita Líquida ({periodoLabelCurto(periodoComparacaoIdAtual)} → {periodoLabelCurto(periodoAtualId)})
              </span>
              <div className="flex gap-8">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase h-4 flex items-center gap-1">Nominal</span>
                  <p className="text-xl font-black text-slate-900">{fmtVariacao(crescimentoNominalAtual)}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase h-4 flex items-center gap-1">
                    Real
                    <span title="Crescimento nominal descontado do IPCA acumulado do período — mostra se a empresa cresceu de verdade ou só acompanhou a inflação.">
                      <Info className="w-3 h-3 cursor-help" />
                    </span>
                  </span>
                  <p className="text-xl font-black text-emerald-400">{fmtVariacao(crescimentoRealAtual)}</p>
                </div>
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block mb-2">Alavancagem Operacional</span>
              <AlavancagemStats crescimentoReceita={crescimentoNominalAtual} alavancagem={alavancagemAtual} />
            </div>
          </div>
        )}

        {sazonalidade && (
          <div className="mt-6 bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center gap-3">
            <Activity className="w-5 h-5 text-slate-500 shrink-0" />
            <p className="text-sm text-slate-500">
              Historicamente, o 2º semestre de {sazonalidade.ano} faturou <b className="text-slate-900">{Math.abs(sazonalidade.variacaoPct).toFixed(1)}%</b> {sazonalidade.variacaoPct >= 0 ? 'a mais' : 'a menos'} que o 1º semestre.
            </p>
          </div>
        )}

        {produtividadeSerie.length >= 2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-slate-200">
            <div>
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block mb-2">Receita Líquida por Funcionário</span>
              <MonthlyChart
                height={180}
                data={produtividadeSerie.map((p) => ({ label: periodoLabelCurto(p.periodoId), valor: p.receitaPorFuncionario }))}
                series={[{ key: 'valor', label: 'Receita/Func.', color: ACCENT, type: 'line' }]}
              />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block mb-2">Custo de Folha / Receita Líquida</span>
              <MonthlyChart
                height={180}
                data={produtividadeSerie.map((p) => ({ label: periodoLabelCurto(p.periodoId), valor: p.custoFolhaPorReceitaPct }))}
                series={[{ key: 'valor', label: 'Folha/Receita', color: '#ef4444', type: 'line' }]}
                valueFormatter={fPct}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── DRE — bloco de referência, mais quieto ───────────────────── */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="font-bold text-slate-700 flex items-center gap-2 uppercase text-xs tracking-wider">
            <Calculator className="w-4 h-4 text-slate-600" /> DRE — Acumulado do {escopo.label}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            {modoDRE === 'variacao' && (
              <div className="flex bg-slate-50 rounded-lg p-1 border border-slate-200 max-w-full overflow-x-auto">
                <button onClick={() => setBaseVariacao('sequencial')} disabled={!dadosSeqAnterior}
                  className={`px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-bold rounded-md whitespace-nowrap transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${baseVariacao === 'sequencial' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:text-slate-700'}`}>
                  vs. {periodoSeqAnteriorId ? periodoLabelCurto(periodoSeqAnteriorId) : 'período anterior'}
                </button>
                <button onClick={() => setBaseVariacao('anual')} disabled={!dadosAnoAnterior}
                  className={`px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-bold rounded-md whitespace-nowrap transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${baseVariacao === 'anual' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:text-slate-700'}`}>
                  vs. {periodoAnoAnteriorId ? periodoLabelCurto(periodoAnoAnteriorId) : 'ano anterior'}
                </button>
              </div>
            )}
            <div className="flex bg-slate-50 rounded-lg p-1 border border-slate-200">
              {[['valor', 'R$', 'R$'], ['percentual', '% Receita', '% Receita Líquida'], ['variacao', 'Variação %', 'Variação %']].map(([id, labelCurto, labelLongo]) => (
                <button key={id} onClick={() => setModoDRE(id)}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold rounded-md whitespace-nowrap transition-colors ${modoDRE === id ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:text-slate-700'}`}>
                  <span className="sm:hidden">{labelCurto}</span>
                  <span className="hidden sm:inline">{labelLongo}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {modoDRE === 'variacao' && !cComparadoDRE && (
          <p className="text-xs text-slate-500 italic mb-3">Sem período disponível para essa comparação — as linhas vão mostrar "—".</p>
        )}

        <div>
          <Linha label="Receita Bruta" campo="receitaBruta" bold {...linhaProps} />
          <Linha label="Vendas à Vista" campo="vendasVista" indent {...linhaProps} />
          <Linha label="Vendas a Prazo" campo="vendasPrazo" indent {...linhaProps} />

          <Linha label="Deduções" campo="deducoes" sinal="(-)" bold {...linhaProps} />
          <Linha label="ICMS" campo="icms" indent {...linhaProps} />
          <Linha label="COFINS" campo="cofins" indent {...linhaProps} />
          <Linha label="PIS" campo="pis" indent {...linhaProps} />
          <Linha label="Devolução de Vendas" campo="devolucao" indent {...linhaProps} />

          <Linha label="Receita Líquida" campo="receitaLiquida" bold {...linhaProps} />
          <Linha label="CMV" campo="cmv" sinal="(-)" bold {...linhaProps} />
          <Linha label="Lucro Bruto" campo="lucroBruto" bold {...linhaProps} />

          <Linha
            label="Despesas Administrativas" campo="despesasAdm" sinal="(-)" bold
            expansivel expandido={expandido.adm}
            onClick={() => setExpandido((s) => ({ ...s, adm: !s.adm }))}
            {...linhaProps}
          />
          {expandido.adm && c.despesas_administrativas && <DetalheContas contas={c.despesas_administrativas} modo={modoDRE} pctBase={pctBase} />}

          <Linha
            label="Despesas Gerais" campo="despesasGerais" sinal="(-)" bold
            expansivel expandido={expandido.gerais}
            onClick={() => setExpandido((s) => ({ ...s, gerais: !s.gerais }))}
            {...linhaProps}
          />
          {expandido.gerais && c.despesas_gerais && <DetalheContas contas={c.despesas_gerais} modo={modoDRE} pctBase={pctBase} />}

          <Linha label="Resultado Operacional (EBIT)" campo="ebit" bold {...linhaProps} />

          <Linha label="Resultado Financeiro" campo="resultadoFinanceiro" sinal={c.resultado_financeiro < 0 ? '(-)' : '(+)'} bold {...linhaProps} />
          <Linha label={`Lucro Líquido do ${escopo.label}`} campo="lucroLiquido" bold {...linhaProps} />
        </div>
      </div>

      {/* ── ESTRUTURA FINANCEIRA (Balanço Patrimonial) ──────────────────── */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200">
        <SecaoHeader
          icon={Landmark} eyebrow="Estrutura Financeira" titulo="Liquidez e Endividamento"
          desc="Vem do Balanço Patrimonial (não da DRE) — capacidade de pagar dívida de curto prazo e quanto do ativo depende de capital de terceiros."
        />
        {!balancoAtual ? (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-4">
            <StatCard label="Liquidez Corrente" empty icon={Scale} />
            <StatCard label="Liquidez Seca" empty icon={Scale} />
            <StatCard label="Endividamento" empty icon={Percent} />
            <StatCard label="ROE" empty icon={TrendingUp} />
            <StatCard label="ROA" empty icon={TrendingUp} />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
              <StatCard
                label="Liquidez Corrente" value={fVezes(liquidez.liquidezCorrente)} sub="Ativo Circ. / Passivo Circ."
                icon={Scale} nivel={classificar('liquidezCorrente', liquidez.liquidezCorrente)}
                explicacao={EXPLICACOES.liquidezCorrente}
              />
              <StatCard
                label="Liquidez Seca" value={fVezes(liquidez.liquidezSeca)} sub="(Ativo Circ. − Estoque) / Passivo Circ."
                icon={Scale} explicacao={EXPLICACOES.liquidezSeca}
              />
              <StatCard label="Liquidez Imediata" value={fVezes(liquidez.liquidezImediata)} sub="Caixa / Passivo Circ." icon={Scale} />
              <StatCard
                label="Endividamento Geral" value={fPct(endividamento.endividamentoGeral)} sub="Passivo Total / Ativo Total"
                icon={Percent} nivel={classificar('endividamentoGeral', endividamento.endividamentoGeral)}
                explicacao={EXPLICACOES.endividamentoGeral}
              />
              <StatCard
                label="Dívida de Curto Prazo" value={fPct(endividamento.composicaoEndividamento)} sub="% do Passivo Total que vence em até 12 meses"
                icon={Percent}
              />
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Balanço em {new Date(balancoAtual.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} ·
              Capital Circulante Líquido {fBRLCompact(liquidez.capitalCirculanteLiquido)} ·
              ROE/ROA aguardando esclarecer com o cliente o que compõe "Prejuízo no Exercício" no balanço (ver observação sobre isso).
            </p>

            {balancoHistorico.length >= 2 && (
              <div className="mt-6 pt-6 border-t border-slate-200 space-y-6">
                <div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block mb-2">Evolução do Patrimônio Líquido</span>
                  <MonthlyChart
                    height={200}
                    data={balancoHistorico.map((b) => ({ label: new Date(b.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' }), pl: b.patrimonio_liquido }))}
                    series={[{ key: 'pl', label: 'Patrimônio Líquido', color: ACCENT, type: 'bar' }]}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block mb-2">Liquidez Corrente</span>
                    <MonthlyChart
                      height={180}
                      data={balancoHistorico.map((b) => ({ label: new Date(b.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' }), liquidezCorrente: round2(calcLiquidez(b).liquidezCorrente) }))}
                      series={[{ key: 'liquidezCorrente', label: 'Liquidez Corrente', color: ACCENT, type: 'line' }]}
                      valueFormatter={fVezes}
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block mb-2">Endividamento Geral</span>
                    <MonthlyChart
                      height={180}
                      data={balancoHistorico.map((b) => ({ label: new Date(b.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' }), endividamento: round2(calcEndividamento(b).endividamentoGeral) }))}
                      series={[{ key: 'endividamento', label: 'Endividamento', color: '#ef4444', type: 'line' }]}
                      valueFormatter={fPct}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
