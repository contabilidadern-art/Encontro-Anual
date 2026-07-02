import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { Shield, CheckCircle, X, RefreshCw, LogOut, Users, Clock, AlertTriangle } from 'lucide-react';
import emailjs from '@emailjs/browser';

const EMAILJS_SERVICE_ID  = 'Fiscal_Reforma';
const EMAILJS_TEMPLATE_CLIENTE = 'template_d6ckqmr'; // <-- CORRIGIDO!
const EMAILJS_PUBLIC_KEY  = 'pr5ftF3Pazc59I4CX';
export const getAprovados = () => [];

const AdminPanel = ({ onLogout }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('pendente');

  const carregar = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'usuarios'), orderBy('criadoEm', 'desc')));
      setUsuarios(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error('Erro ao carregar:', err); }
    setLoading(false);
  };

  useEffect(() => { carregar(); }, []);

  const aprovar = async (id) => {
    await updateDoc(doc(db, 'usuarios', id), { status: 'aprovado' });
    setUsuarios(prev => prev.map(u => u.id === id ? { ...u, status: 'aprovado' } : u));

    const usuario = usuarios.find(u => u.id === id);
    if (usuario?.email) {
      try {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_CLIENTE, {
          email_destinatario: usuario.email,
          nome:               usuario.nome,
          login:              usuario.login,
          senha:              usuario.senha || '(sua senha cadastrada)',
        }, EMAILJS_PUBLIC_KEY);
      } catch (err) {
        console.warn('Email não enviado:', err);
      }
    }
  };

  const rejeitar = async (id) => {
    await updateDoc(doc(db, 'usuarios', id), { status: 'rejeitado' });
    setUsuarios(prev => prev.map(u => u.id === id ? { ...u, status: 'rejeitado' } : u));
  };

  const excluir = async (id) => {
    if (!window.confirm('Excluir este usuário?')) return;
    await deleteDoc(doc(db, 'usuarios', id));
    setUsuarios(prev => prev.filter(u => u.id !== id));
  };

  const filtrados = usuarios.filter(u => filtro === 'todos' ? true : u.status === filtro);
  const counts = {
    pendente: usuarios.filter(u => u.status === 'pendente').length,
    aprovado: usuarios.filter(u => u.status === 'aprovado').length,
    rejeitado: usuarios.filter(u => u.status === 'rejeitado').length,
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-[#1c3a63] text-white p-6 rounded-2xl shadow-xl flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#64748b] rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white"/>
            </div>
            <div>
              <h1 className="text-xl font-bold">Painel Administrativo</h1>
              <p className="text-blue-200 text-xs">Gerenciamento de usuários — Firebase</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={carregar} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}/>
            </button>
            <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-red-500/30 rounded-lg text-sm font-bold transition-colors">
              <LogOut className="w-4 h-4"/> Sair
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { key: 'pendente', label: 'Pendentes', color: 'bg-amber-50 border-amber-200 text-amber-700', icon: Clock },
            { key: 'aprovado', label: 'Aprovados', color: 'bg-emerald-50 border-emerald-200 text-emerald-700', icon: CheckCircle },
            { key: 'rejeitado', label: 'Rejeitados', color: 'bg-red-50 border-red-200 text-red-700', icon: X },
          ].map(({ key, label, color, icon: Icon }) => (
            <button key={key} onClick={() => setFiltro(key)}
              className={`${color} border rounded-xl p-4 text-center transition-all ${filtro === key ? 'ring-2 ring-offset-1 shadow-md' : 'opacity-70 hover:opacity-100'}`}>
              <Icon className="w-5 h-5 mx-auto mb-1"/>
              <div className="text-2xl font-black">{counts[key]}</div>
              <div className="text-xs font-bold uppercase">{label}</div>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-bold text-slate-700 flex items-center gap-2">
              <Users className="w-4 h-4"/> {filtrados.length} usuário(s) — {filtro}
            </h2>
            <button onClick={() => setFiltro('todos')} className={`text-xs font-bold px-3 py-1 rounded-lg border transition-colors ${filtro === 'todos' ? 'bg-[#1c3a63] text-white border-transparent' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
              Ver todos
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 opacity-50"/>
              <p className="font-bold">Carregando...</p>
            </div>
          ) : filtrados.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <AlertTriangle className="w-8 h-8 mx-auto mb-3 opacity-30"/>
              <p className="font-bold">Nenhum usuário nesta categoria</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtrados.map(u => (
                <div key={u.id} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-800">{u.nome}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border uppercase ${
                        u.status === 'aprovado' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                        u.status === 'rejeitado' ? 'bg-red-100 text-red-700 border-red-200' :
                        'bg-amber-100 text-amber-700 border-amber-200'
                      }`}>{u.status}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 space-x-3">
                      <span>Login: <strong>{u.login}</strong></span>
                      <span>CNPJ: <strong>{u.cnpj}</strong></span>
                      {u.email && <span>Email: <strong>{u.email}</strong></span>}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Solicitado em: {u.criadoEm ? new Date(u.criadoEm).toLocaleString('pt-BR') : '—'}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {u.status !== 'aprovado' && (
                      <button onClick={() => aprovar(u.id)}
                        className="flex items-center gap-1 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm">
                        <CheckCircle className="w-3.5 h-3.5"/> Aprovar
                      </button>
                    )}
                    {u.status !== 'rejeitado' && (
                      <button onClick={() => rejeitar(u.id)}
                        className="flex items-center gap-1 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm">
                        <X className="w-3.5 h-3.5"/> Rejeitar
                      </button>
                    )}
                    <button onClick={() => excluir(u.id)}
                      className="flex items-center gap-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm">
                      <X className="w-3.5 h-3.5"/> Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
