import { Calendar } from 'lucide-react';
import { periodoLabel } from '../theme';

export default function PeriodoSelector({ periodos, periodoSelecionado, onChange }) {
  if (!periodos || periodos.length <= 1) return null;
  return (
    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 w-fit">
      <Calendar className="w-4 h-4 text-slate-600" />
      <select
        value={periodoSelecionado}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-sm font-bold text-slate-800 border-none outline-none focus:ring-0 cursor-pointer"
      >
        {periodos.map((id) => (
          <option key={id} value={id} className="bg-white text-slate-800">{periodoLabel(id)}</option>
        ))}
      </select>
    </div>
  );
}
