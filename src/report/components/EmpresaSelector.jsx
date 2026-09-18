import { Building2 } from 'lucide-react';

// Troca de empresa dentro do mesmo Report (ex: grupo AKIK + Maridel,
// analisadas juntas no "Encontro Anual") — some sozinho se só tem 1 empresa
// no grupo, mesma lógica do PeriodoSelector.
export default function EmpresaSelector({ empresas, cnpjSelecionado, onChange }) {
  if (!empresas || empresas.length <= 1) return null;
  return (
    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 w-fit">
      <Building2 className="w-4 h-4 text-slate-600" />
      <select
        value={cnpjSelecionado}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-sm font-bold text-slate-800 border-none outline-none focus:ring-0 cursor-pointer max-w-[220px] truncate"
      >
        {empresas.map((e) => (
          <option key={e.cnpj} value={e.cnpj} className="bg-white text-slate-800">{e.razao_social}</option>
        ))}
      </select>
    </div>
  );
}
