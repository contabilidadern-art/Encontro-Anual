import { useId } from 'react';
import {
  ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Area, Bar,
} from 'recharts';
import { fBRLCompact } from '../theme';

const TooltipCard = ({ active, payload, label, formatter }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3.5 py-2.5 text-xs">
      <p className="font-bold text-slate-700 mb-1.5">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-slate-600">{p.name}:</span>
          <span className="font-bold text-slate-800">{formatter ? formatter(p.value) : p.value}</span>
        </p>
      ))}
    </div>
  );
};

// series: [{ key, label, color, type: 'line' | 'bar' }] — 'line' é desenhado
// como área com preenchimento em gradiente (mais chamativo que uma linha
// crua), a cor da série continua sendo o traço; 'bar' ganha um gradiente
// vertical sutil em vez de cor chapada.
// onBarClick (opcional): (dataPoint, seriesKey) => void — chamado ao clicar
// numa barra; dataPoint é a linha inteira de `data` (não só o valor da série
// clicada), então quem recebe pode ler outros campos da mesma linha (ex: a
// competência bruta, se o chamador incluiu esse campo em `data`).
export default function MonthlyChart({ data, series, height = 260, valueFormatter = fBRLCompact, onBarClick }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`grad-${uid}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={s.type === 'bar' ? 0.95 : 0.32} />
                <stop offset="100%" stopColor={s.color} stopOpacity={s.type === 'bar' ? 0.55 : 0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#00000014" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#0000001a' }} tickLine={false} interval={0} />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={valueFormatter} width={64} />
          <Tooltip content={<TooltipCard formatter={valueFormatter} />} cursor={{ fill: '#0000000d' }} />
          {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10, color: '#475569' }} iconType="circle" />}
          {series.map((s) =>
            s.type === 'bar' ? (
              <Bar
                key={s.key} dataKey={s.key} name={s.label} fill={`url(#grad-${uid}-${s.key})`} stroke={s.color} strokeWidth={1}
                radius={[6, 6, 0, 0]} maxBarSize={32}
                cursor={onBarClick ? 'pointer' : undefined}
                onClick={onBarClick ? (barData) => onBarClick(barData, s.key) : undefined}
              />
            ) : (
              <Area
                key={s.key} type="monotone" dataKey={s.key} name={s.label}
                stroke={s.color} strokeWidth={2.5} fill={`url(#grad-${uid}-${s.key})`}
                dot={{ r: 3, fill: s.color, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 5, strokeWidth: 0 }}
              />
            )
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
