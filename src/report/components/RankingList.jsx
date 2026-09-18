import { ACCENT, fBRL } from '../theme';

// Generaliza o padrão de barra de ranking já usado em várias telas do App.jsx
// (<div style={{width:`${pct}%`}}/>) para listas de UF / top clientes / fornecedores.
export default function RankingList({ items, color = ACCENT, valueFormatter = fBRL, emptyLabel = 'Sem dados no período' }) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-slate-600 italic py-4 text-center">{emptyLabel}</p>;
  }
  const max = Math.max(...items.map((i) => i.valor), 1);
  return (
    <div className="space-y-3.5">
      {items.map((item, idx) => {
        const pct = (item.valor / max) * 100;
        return (
          <div key={item.nome + idx} className="flex items-center gap-3">
            <span
              className="w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center shrink-0"
              style={{ backgroundColor: idx === 0 ? color : `${color}20`, color: idx === 0 ? '#141414' : color }}
            >
              {idx + 1}
            </span>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex justify-between text-sm gap-2">
                <span className="truncate font-medium text-slate-700" title={item.nome}>{item.nome}</span>
                <span className="font-bold text-slate-900 shrink-0">{valueFormatter(item.valor)}</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
