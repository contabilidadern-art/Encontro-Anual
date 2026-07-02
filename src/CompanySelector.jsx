import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase'; 
import { Building2, Plus, LogOut, Loader2 } from 'lucide-react';

const CompanySelector = ({ user, onSelectCompany, onAddNew, onLogout }) => {
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmpresas = async () => {
      try {
        // Busca na nova coleção 'empresas' as que pertencem a este login
        const q = query(collection(db, 'empresas'), where('loginDono', '==', user.login));
        const snap = await getDocs(q);
        const lista = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEmpresas(lista);
      } catch (error) {
        console.error("Erro ao buscar empresas:", error);
      } finally {
        setLoading(false);
      }
    };
    if (user?.login) fetchEmpresas();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1c3a63] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-4xl">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-[#1c3a63]">Bem-vindo(a), {user.name.split(' ')[0]}</h1>
            <p className="text-slate-500 mt-2">Selecione a empresa para acessar o painel fiscal ou cadastre uma nova.</p>
          </div>
          <button onClick={onLogout} className="flex items-center gap-2 text-slate-500 hover:text-red-600 font-bold px-4 py-2 bg-white rounded-lg border border-slate-200 shadow-sm transition-colors">
            <LogOut size={16} /> Sair
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Renderiza os Cards das empresas já cadastradas */}
          {empresas.map((emp) => (
            <div key={emp.id} onClick={() => onSelectCompany(emp)} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-[#64748b] hover:shadow-md transition-all cursor-pointer group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#1c3a63] group-hover:bg-[#64748b] transition-colors"></div>
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Building2 className="w-6 h-6 text-[#1c3a63]" />
              </div>
              <h3 className="font-bold text-slate-800 text-lg truncate" title={emp.razaoSocial}>{emp.razaoSocial}</h3>
              <p className="text-sm text-slate-500 mt-1 font-mono">{emp.cnpj}</p>
              <div className="mt-4 inline-block px-2 py-1 rounded text-[10px] font-bold uppercase border bg-slate-50 text-slate-600 border-slate-200">
                {emp.regime}
              </div>
            </div>
          ))}

          {/* Botão de Adicionar Nova Empresa */}
          <div onClick={onAddNew} className="bg-transparent border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:text-[#1c3a63] hover:border-[#1c3a63] hover:bg-white transition-all cursor-pointer min-h-[200px] p-6 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
              <Plus className="w-6 h-6" />
            </div>
            <span className="font-bold">Cadastrar Nova Empresa</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanySelector;
