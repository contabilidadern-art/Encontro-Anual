import React, { useState } from 'react';
import { db } from './firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Building2, CheckCircle, ShieldAlert, ArrowRight, Calculator } from 'lucide-react';

const formatCNPJ = (v) => {
  const n = v.replace(/\D/g, '').slice(0, 14);
  return n
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
};

const CompanySetup = ({ currentUser, onComplete }) => {
  const [form, setForm] = useState({ cnpj: '', simplesRate: '' });
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    const cnpjLimpo = form.cnpj.replace(/\D/g, '');
    if (cnpjLimpo.length !== 14) { setErro('CNPJ inválido. Digite os 14 dígitos.'); return; }
    if (!form.simplesRate || isNaN(parseFloat(form.simplesRate))) {
      setErro('Informe a alíquota média do Simples Nacional.'); return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'empresas'), {
        loginDono:    currentUser.login,
        cnpj:         cnpjLimpo,
        razaoSocial:  '',
        regime:       'simples',
        simplesRate:  parseFloat(form.simplesRate),
        cadastradaEm: new Date().toISOString(),
      });

      onComplete({
        cnpj:        cnpjLimpo,
        razaoSocial: '',
        regime:      'simples',
        simplesRate: parseFloat(form.simplesRate),
      });
    } catch (err) {
      console.error(err);
      setErro('Erro ao salvar. Tente novamente.');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .cs-input { width:100%; padding:13px 14px; border:1.5px solid #e2e8f0; border-radius:10px; font-size:14px; color:#1e293b; background:#f8fafc; outline:none; transition:all 0.2s; box-sizing:border-box; font-family:inherit; }
        .cs-input:focus { border-color:#1c3a63; background:white; box-shadow:0 0 0 3px rgba(28,58,99,0.08); }
        .cs-input::placeholder { color:#94a3b8; }
        .cs-btn { width:100%; padding:14px; background:#1c3a63; color:white; border:none; border-radius:12px; font-size:15px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; transition:all 0.2s; font-family:inherit; }
        .cs-btn:hover:not(:disabled) { background:#152c4d; transform:translateY(-1px); box-shadow:0 10px 28px rgba(28,58,99,0.3); }
        .cs-btn:disabled { background:#94a3b8; cursor:not-allowed; }
      `}</style>

      {/* Painel esquerdo */}
      <div style={{ flex: '0 0 42%', background: 'linear-gradient(155deg,#0b1d35 0%,#1c3a63 55%,#1a3a6e 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '3rem 3.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '320px', height: '320px', borderRadius: '50%', background: 'rgba(100,116,139,0.07)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '3rem' }}>
          <div style={{ width: '46px', height: '46px', background: 'rgba(100,116,139,0.28)', borderRadius: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.14)' }}>
            <Calculator size={22} color="#94a3b8" />
          </div>
          <div>
            <p style={{ color: 'white', fontWeight: 800, fontSize: '16px', margin: 0 }}>Portal Fiscal</p>
            <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '12px', margin: 0 }}>Analisador Tributário</p>
          </div>
        </div>
        <h1 style={{ color: 'white', fontSize: '30px', fontWeight: 800, lineHeight: 1.2, margin: '0 0 1rem' }}>
          Quase pronto,<br /><span style={{ color: '#64748b' }}>{currentUser.name.split(' ')[0]}!</span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.52)', fontSize: '15px', lineHeight: 1.75, margin: '0 0 2rem', maxWidth: '320px' }}>
          Informe o CNPJ e a alíquota do Simples para começar a analisar os XMLs.
        </p>
        <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '1.25rem 1.5rem' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', margin: '0 0 12px', textTransform: 'uppercase' }}>Para que usamos isso?</p>
          {[
            'Validar quais XMLs pertencem à sua empresa',
            'Calcular os impostos corretamente',
            'Configurar a alíquota do Simples Nacional',
          ].map((txt, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: i < 2 ? '10px' : 0 }}>
              <CheckCircle size={14} color="#64748b" style={{ flexShrink: 0, marginTop: '2px' }} />
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>{txt}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Painel direito — formulário */}
      <div style={{ flex: 1, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2.5rem' }}>
        <div style={{ width: '100%', maxWidth: '420px', animation: 'fadeUp 0.45s ease' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '2.5rem', boxShadow: '0 4px 32px rgba(15,23,42,0.08)' }}>

            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(28,58,99,0.08)', color: '#1c3a63', padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, marginBottom: '1rem', letterSpacing: '0.4px' }}>
                <Building2 size={12} /> IDENTIFICAÇÃO DA EMPRESA
              </div>
              <h2 style={{ color: '#0f172a', fontSize: '22px', fontWeight: 800, margin: '0 0 6px' }}>Dados para Consulta</h2>
              <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Essas informações direcionam os XMLs de entrada e saída.</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                {/* CNPJ */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '6px', letterSpacing: '0.4px' }}>CNPJ DA EMPRESA</label>
                  <input className="cs-input" type="text" placeholder="00.000.000/0000-00" maxLength={18}
                    value={form.cnpj}
                    onChange={e => setForm(p => ({ ...p, cnpj: formatCNPJ(e.target.value) }))} />
                </div>

                {/* Alíquota Simples Nacional */}
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderLeft: '3px solid #f59e0b', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#92400e', marginBottom: '4px', letterSpacing: '0.4px' }}>ALÍQUOTA DO SIMPLES NACIONAL (%)</label>
                  <p style={{ color: '#a16207', fontSize: '12px', margin: '0 0 10px', lineHeight: 1.5 }}>
                    Média das últimas alíquotas efetivas do DAS.
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input className="cs-input" type="number" step="0.01" min="0" max="33"
                      placeholder="ex: 11.44" style={{ background: 'white', borderColor: '#fde68a' }}
                      value={form.simplesRate}
                      onChange={e => setForm(p => ({ ...p, simplesRate: e.target.value }))} />
                    <span style={{ color: '#64748b', fontWeight: 700, fontSize: '16px', flexShrink: 0 }}>%</span>
                  </div>
                </div>

                {/* Erro */}
                {erro && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '11px 14px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <ShieldAlert size={15} color="#dc2626" style={{ flexShrink: 0 }} />
                    <p style={{ color: '#dc2626', fontSize: '13px', margin: 0 }}>{erro}</p>
                  </div>
                )}

                <button type="submit" className="cs-btn" disabled={loading} style={{ marginTop: '4px' }}>
                  {loading
                    ? <><div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> Salvando...</>
                    : <><span>Entrar no Sistema</span><ArrowRight size={17} /></>}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanySetup;
