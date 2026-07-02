import React, { useState } from 'react';
import emailjs from '@emailjs/browser';
import { db } from './firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import {
  UserPlus, ArrowRight, Eye, EyeOff,
  Mail, User, Lock, LogIn, CheckCircle, ShieldCheck,
  BarChart3, FileText, Calculator, Zap
} from 'lucide-react';

// ─── EmailJS ───────────────────────────────────────────────────────────────
const EMAILJS_SERVICE_ID     = 'Fiscal_Reforma';
const EMAILJS_TEMPLATE_ADMIN = 'template_doa9u4p';  // O e-mail que VOCÊ recebe avisando do cadastro
const EMAILJS_PUBLIC_KEY     = 'pr5ftF3Pazc59I4CX';
// ──────────────────────────────────────────────────────────────────────────
const salvarPendente = async (dados) => {
  const q = query(collection(db, 'usuarios'), where('login', '==', dados.login));
  const snap = await getDocs(q);
  if (!snap.empty) throw new Error('Login já existe');
  await addDoc(collection(db, 'usuarios'), {
    ...dados,
    cnpj:        '',   // preenchido depois no CompanySetup
    razaoSocial: '',
    regime:      '',
    simplesRate: 0,
    status:      'pendente',
    criadoEm:    new Date().toISOString(),
    dataSolicitacao: new Date().toLocaleString('pt-BR'),
  });
};

const RegisterScreen = ({ onBackToLogin }) => {
  const [step, setStep]           = useState('form');
  const [showPass, setShowPass]   = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors]       = useState({});
  const [form, setForm]           = useState({ nome: '', email: '', login: '', senha: '' });

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.nome.trim())         e.nome  = 'Informe seu nome completo.';
    if (!form.email.includes('@')) e.email = 'E-mail inválido.';
    if (form.login.length < 4)     e.login = 'Mínimo 4 caracteres.';
    if (form.senha.length < 6)     e.senha = 'Mínimo 6 caracteres.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      await salvarPendente({ nome: form.nome, email: form.email, login: form.login, senha: form.senha });

  await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ADMIN, {
        nome:  form.nome,
        email: form.email, // Tem que estar minúsculo assim
        login: form.login,
        senha: form.senha,
        data:  new Date().toLocaleString('pt-BR'), // Tem que se chamar "data"
      }, EMAILJS_PUBLIC_KEY);

      setStep('success');
    } catch (err) {
      console.error(err);
      if (err.message === 'Login já existe') {
        setErrors({ login: 'Este login já está em uso. Escolha outro.' });
      } else {
        alert('Erro ao enviar solicitação. Tente novamente.');
      }
    } finally { setIsLoading(false); }
  };

  const features = [
    { icon: BarChart3,   label: 'Dashboard Tributário', desc: 'Visão geográfica de saídas e entradas' },
    { icon: FileText,    label: 'Reforma Tributária',   desc: 'Simulação IBS e CBS nota a nota' },
    { icon: Zap,         label: 'Painel Inteligente',   desc: 'DRE estimada e alertas de risco' },
    { icon: ShieldCheck, label: 'Créditos IBS/CBS',     desc: 'Apuração automática de débitos' },
  ];

  /* ─── TELA DE SUCESSO ─── */
  if (step === 'success') return (
    <div style={{ minHeight:'100vh', display:'flex', fontFamily:"'Segoe UI', system-ui, sans-serif" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ flex:'0 0 46%', background:'linear-gradient(155deg,#0b1d35 0%,#1c3a63 55%,#1a3a6e 100%)', display:'flex', flexDirection:'column', justifyContent:'center', padding:'3rem 3.5rem', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-100px', right:'-100px', width:'320px', height:'320px', borderRadius:'50%', background:'rgba(100,116,139,0.07)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:'-60px', left:'-80px', width:'240px', height:'240px', borderRadius:'50%', background:'rgba(100,116,139,0.05)', pointerEvents:'none' }}/>
        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'3rem' }}>
          <div style={{ width:'46px', height:'46px', background:'rgba(100,116,139,0.28)', borderRadius:'13px', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid rgba(255,255,255,0.14)' }}>
            <Calculator size={22} color="#94a3b8" />
          </div>
          <div>
            <p style={{ color:'white', fontWeight:800, fontSize:'16px', margin:0 }}>Portal Fiscal</p>
            <p style={{ color:'rgba(255,255,255,0.38)', fontSize:'12px', margin:0 }}>Analisador Tributário</p>
          </div>
        </div>
        <h1 style={{ color:'white', fontSize:'32px', fontWeight:800, lineHeight:1.2, margin:'0 0 1rem' }}>
          Quase lá!<br /><span style={{ color:'#64748b' }}>Só aguardar.</span>
        </h1>
        <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'15px', lineHeight:1.75, margin:0, maxWidth:'340px' }}>
          Nossa equipe revisará sua solicitação e enviará as credenciais por e-mail em breve.
        </p>
      </div>

      <div style={{ flex:1, background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', padding:'2.5rem' }}>
        <div style={{ width:'100%', maxWidth:'400px', animation:'fadeUp 0.45s ease' }}>
          <div style={{ background:'white', borderRadius:'20px', padding:'2.5rem', boxShadow:'0 4px 32px rgba(15,23,42,0.08)' }}>
            <div style={{ textAlign:'center', marginBottom:'1.75rem' }}>
              <div style={{ width:'72px', height:'72px', background:'linear-gradient(135deg,#ecfdf5,#d1fae5)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.25rem', border:'3px solid #a7f3d0' }}>
                <CheckCircle size={36} color="#059669" />
              </div>
              <h2 style={{ color:'#0f172a', fontSize:'22px', fontWeight:800, margin:'0 0 8px' }}>Solicitação Enviada!</h2>
              <p style={{ color:'#64748b', fontSize:'14px', margin:0, lineHeight:1.6 }}>
                Você receberá um <strong style={{ color:'#334155' }}>e-mail de confirmação</strong> assim que o acesso for liberado.
              </p>
            </div>
            <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'12px', padding:'1rem', marginBottom:'1.25rem' }}>
              {[['Nome', form.nome], ['E-mail', form.email], ['Login', form.login]].map(([k, v]) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f1f5f9' }}>
                  <span style={{ color:'#94a3b8', fontSize:'11px', fontWeight:700, letterSpacing:'0.4px' }}>{k.toUpperCase()}</span>
                  <span style={{ color:'#334155', fontSize:'13px', fontWeight:600 }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderLeft:'3px solid #f59e0b', borderRadius:'10px', padding:'12px 14px', marginBottom:'1.5rem', display:'flex', gap:'10px', alignItems:'center' }}>
              <span style={{ fontSize:'18px' }}>⏱️</span>
              <p style={{ color:'#92400e', fontSize:'13px', margin:0 }}>Após aprovado, você receberá um <strong>e-mail</strong> com o link de acesso.</p>
            </div>
            <button onClick={onBackToLogin} style={{ width:'100%', padding:'14px', background:'#1c3a63', color:'white', border:'none', borderRadius:'12px', fontSize:'15px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', fontFamily:'inherit' }}>
              <LogIn size={17} /> Voltar ao Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  /* ─── FORMULÁRIO ─── */
  return (
    <div style={{ minHeight:'100vh', display:'flex', fontFamily:"'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
        @keyframes fadeUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
        @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .reg-input { width:100%; padding:13px 14px; border:1.5px solid #e2e8f0; border-radius:10px; font-size:14px; color:#1e293b; background:#f8fafc; outline:none; transition:all 0.2s; box-sizing:border-box; font-family:inherit; }
        .reg-input:focus { border-color:#1c3a63; background:white; box-shadow:0 0 0 3px rgba(28,58,99,0.08); }
        .reg-input::placeholder { color:#94a3b8; }
        .reg-input.error { border-color:#ef4444; background:#fef2f2; }
        .reg-input.has-icon  { padding-left:44px; }
        .reg-input.has-right { padding-right:44px; }
        .reg-btn { width:100%; padding:14px; background:#1c3a63; color:white; border:none; border-radius:12px; font-size:15px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; transition:all 0.2s; font-family:inherit; }
        .reg-btn:hover:not(:disabled) { background:#152c4d; transform:translateY(-1px); box-shadow:0 10px 28px rgba(28,58,99,0.3); }
        .reg-btn:disabled { background:#94a3b8; cursor:not-allowed; }
        .feat-row { display:flex; align-items:center; gap:12px; padding:12px 14px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:12px; animation:slideIn 0.4s ease both; }
        .back-btn { background:none; border:none; cursor:pointer; color:#64748b; font-size:13px; font-family:inherit; display:inline-flex; align-items:center; gap:6px; transition:color 0.2s; }
        .back-btn:hover { color:#1c3a63; }
      `}</style>

      {/* ── PAINEL ESQUERDO ── */}
      <div style={{ flex:'0 0 46%', background:'linear-gradient(155deg,#0b1d35 0%,#1c3a63 55%,#1a3a6e 100%)', display:'flex', flexDirection:'column', padding:'3rem 3.5rem', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-100px', right:'-100px', width:'320px', height:'320px', borderRadius:'50%', background:'rgba(100,116,139,0.07)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:'-60px', left:'-80px', width:'240px', height:'240px', borderRadius:'50%', background:'rgba(100,116,139,0.05)', pointerEvents:'none' }}/>
        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'3.5rem' }}>
          <div style={{ width:'46px', height:'46px', background:'rgba(100,116,139,0.28)', borderRadius:'13px', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid rgba(255,255,255,0.14)' }}>
            <Calculator size={22} color="#94a3b8" />
          </div>
          <div>
            <p style={{ color:'white', fontWeight:800, fontSize:'16px', margin:0 }}>Portal Fiscal</p>
            <p style={{ color:'rgba(255,255,255,0.38)', fontSize:'12px', margin:0 }}>Analisador Tributário</p>
          </div>
        </div>
        <h1 style={{ color:'white', fontSize:'32px', fontWeight:800, lineHeight:1.2, margin:'0 0 1rem', letterSpacing:'-0.6px' }}>
          Gestão tributária<br /><span style={{ color:'#64748b' }}>inteligente.</span>
        </h1>
        <p style={{ color:'rgba(255,255,255,0.52)', fontSize:'15px', lineHeight:1.75, margin:'0 0 2.5rem', maxWidth:'340px' }}>
          Importe XMLs, simule a Reforma Tributária e tome decisões com base em dados reais do seu negócio.
        </p>
        <div style={{ display:'flex', flexDirection:'column', gap:'8px', flex:1 }}>
          {features.map(({ icon: Icon, label, desc }, i) => (
            <div key={i} className="feat-row" style={{ animationDelay:`${i*0.08}s` }}>
              <div style={{ width:'34px', height:'34px', flexShrink:0, background:'rgba(100,116,139,0.22)', borderRadius:'9px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon size={16} color="#94a3b8" />
              </div>
              <div>
                <p style={{ color:'white', fontSize:'13px', fontWeight:600, margin:'0 0 1px' }}>{label}</p>
                <p style={{ color:'rgba(255,255,255,0.38)', fontSize:'12px', margin:0 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginTop:'2rem', paddingTop:'1.5rem', borderTop:'1px solid rgba(255,255,255,0.07)' }}>
          <ShieldCheck size={13} color="rgba(255,255,255,0.25)" />
          <span style={{ color:'rgba(255,255,255,0.25)', fontSize:'12px' }}>Desenvolvido por Felipe Schott · v4.3.0</span>
        </div>
      </div>

      {/* ── PAINEL DIREITO ── */}
      <div style={{ flex:1, background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', padding:'2.5rem' }}>
        <div style={{ width:'100%', maxWidth:'420px', animation:'fadeUp 0.45s ease' }}>
          <div style={{ background:'white', borderRadius:'20px', padding:'2.5rem', boxShadow:'0 4px 32px rgba(15,23,42,0.08)' }}>
            <div style={{ marginBottom:'1.75rem' }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:'rgba(28,58,99,0.08)', color:'#1c3a63', padding:'5px 12px', borderRadius:'20px', fontSize:'11px', fontWeight:700, marginBottom:'1rem', letterSpacing:'0.4px' }}>
                <UserPlus size={12} /> SOLICITAR ACESSO
              </div>
              <h2 style={{ color:'#0f172a', fontSize:'24px', fontWeight:800, margin:'0 0 6px', letterSpacing:'-0.4px' }}>Crie sua conta</h2>
              <p style={{ color:'#64748b', fontSize:'14px', margin:0, lineHeight:1.6 }}>Preencha os dados abaixo. Acesso liberado após aprovação.</p>
            </div>

            <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderLeft:'3px solid #f59e0b', borderRadius:'10px', padding:'11px 14px', marginBottom:'1.5rem', display:'flex', gap:'10px', alignItems:'flex-start' }}>
              <ShieldCheck size={15} color="#d97706" style={{ flexShrink:0, marginTop:'1px' }} />
              <p style={{ color:'#92400e', fontSize:'13px', margin:0, lineHeight:1.5 }}>
                Acesso liberado após <strong>aprovação manual</strong>. Você receberá um <strong>e-mail</strong>.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>

                {/* Nome */}
                <Field label="NOME COMPLETO" error={errors.nome}>
                  <div style={{ position:'relative' }}>
                    <User size={15} color="#94a3b8" style={{ position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                    <input className={`reg-input has-icon${errors.nome?' error':''}`} type="text"
                      placeholder="Seu nome completo"
                      value={form.nome} onChange={e => handleChange('nome', e.target.value)} />
                  </div>
                </Field>

                {/* Email */}
                <Field label="E-MAIL" error={errors.email}>
                  <div style={{ position:'relative' }}>
                    <Mail size={15} color="#94a3b8" style={{ position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                    <input className={`reg-input has-icon${errors.email?' error':''}`} type="email"
                      placeholder="seu@email.com"
                      value={form.email} onChange={e => handleChange('email', e.target.value)} />
                  </div>
                </Field>

                {/* Login + Senha */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                  <Field label="LOGIN" error={errors.login}>
                    <div style={{ position:'relative' }}>
                      <User size={14} color="#94a3b8" style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                      <input className={`reg-input has-icon${errors.login?' error':''}`} type="text"
                        placeholder="mín. 4 chars"
                        value={form.login} onChange={e => handleChange('login', e.target.value)} />
                    </div>
                  </Field>
                  <Field label="SENHA" error={errors.senha}>
                    <div style={{ position:'relative' }}>
                      <Lock size={14} color="#94a3b8" style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                      <input className={`reg-input has-icon has-right${errors.senha?' error':''}`}
                        type={showPass ? 'text' : 'password'} placeholder="mín. 6 chars"
                        value={form.senha} onChange={e => handleChange('senha', e.target.value)} />
                      <button type="button" onClick={() => setShowPass(s => !s)}
                        style={{ position:'absolute', right:'11px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', padding:0, display:'flex' }}>
                        {showPass ? <EyeOff size={15} color="#94a3b8" /> : <Eye size={15} color="#94a3b8" />}
                      </button>
                    </div>
                  </Field>
                </div>

                <button type="submit" className="reg-btn" disabled={isLoading} style={{ marginTop:'4px' }}>
                  {isLoading
                    ? <><div style={{ width:'16px', height:'16px', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.6s linear infinite' }} /> Enviando...</>
                    : <><UserPlus size={17} /> Solicitar Acesso <ArrowRight size={16} /></>}
                </button>
              </div>
            </form>
          </div>

          <div style={{ textAlign:'center', marginTop:'1.5rem' }}>
            <button className="back-btn" onClick={onBackToLogin}>
              <LogIn size={14} /> Já tenho acesso → Fazer Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, error, children }) => (
  <div>
    <label style={{ display:'block', fontSize:'11px', fontWeight:700, color:'#475569', marginBottom:'6px', letterSpacing:'0.4px' }}>{label}</label>
    {children}
    {error && <p style={{ color:'#ef4444', fontSize:'11px', margin:'4px 0 0', fontWeight:500 }}>{error}</p>}
  </div>
);

export default RegisterScreen;
