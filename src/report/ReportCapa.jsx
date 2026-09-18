import { Building2, Calendar } from 'lucide-react';
import { mesLabel, ACCENT, fCNPJ } from './theme';

export default function ReportCapa({ data }) {
  const { cliente, periodo } = data;

  return (
    <div className="space-y-6">
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-xl text-slate-900 p-5 sm:p-9 md:p-11 bg-white">
        <div
          className="absolute -top-32 -right-24 w-[30rem] h-[30rem] rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${ACCENT}30, transparent 65%)` }}
        />

        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 sm:gap-2.5">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: ACCENT }} />
              <span className="text-lg sm:text-2xl md:text-3xl font-black uppercase tracking-[0.1em]" style={{ color: ACCENT }}>Report</span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-500 mt-1.5">Análise Semestral</p>
            <h1 className="text-2xl sm:text-[2.1rem] md:text-[2.5rem] font-black tracking-tight leading-[1.1] mt-2 break-words">
              {cliente?.razao_social || 'Cliente'}
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm font-mono mt-2.5 tracking-wide">{fCNPJ(cliente?.cnpj)}</p>
          </div>

          <div
            className="shrink-0 flex items-center gap-3 rounded-xl px-4 py-3 border w-full md:w-auto"
            style={{ backgroundColor: `${ACCENT}14`, borderColor: `${ACCENT}33` }}
          >
            <Calendar className="w-4 h-4 shrink-0" style={{ color: ACCENT }} />
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide font-bold">Período</p>
              <p className="text-sm font-bold text-slate-900 whitespace-nowrap">
                {mesLabel(periodo?.inicio)} — {mesLabel(periodo?.fim)} de {periodo?.inicio?.split('-')[0]}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
