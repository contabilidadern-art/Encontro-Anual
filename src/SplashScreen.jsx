// ═══════════════════════════════════════════════════
// SPLASH SCREEN ANIMADA — cole este componente
// ANTES do componente TaxAnalyzer no seu App.jsx
// ═══════════════════════════════════════════════════
import React, { useState, useEffect } from 'react';
import { Calculator, Zap } from 'lucide-react';

const SplashScreen = ({ user, onEnter }) => {
  const [phase, setPhase] = useState(0);
  // phase 0: aguardando  |  1: digita título  |  2: digita subtítulo  |  3: botão + barra
  const [typedTitle, setTypedTitle] = useState('');
  const [typedSub,   setTypedSub]   = useState('');
  const [autoProgress, setAutoProgress] = useState(0);

  const TITLE = 'Analisador Fiscal';
  const SUB   = 'Sua empresa na palma da sua mão';

  // fase 1 — logo entra, depois inicia digitação do título
  useEffect(() => {
    const t = setTimeout(() => setPhase(1), 700);
    return () => clearTimeout(t);
  }, []);

  // fase 1 → digita título
  useEffect(() => {
    if (phase !== 1) return;
    let i = 0;
    const iv = setInterval(() => {
      setTypedTitle(TITLE.slice(0, ++i));
      if (i >= TITLE.length) { clearInterval(iv); setPhase(2); }
    }, 60);
    return () => clearInterval(iv);
  }, [phase]);

  // fase 2 → digita subtítulo
  useEffect(() => {
    if (phase !== 2) return;
    let i = 0;
    const iv = setInterval(() => {
      setTypedSub(SUB.slice(0, ++i));
      if (i >= SUB.length) { clearInterval(iv); setPhase(3); }
    }, 36);
    return () => clearInterval(iv);
  }, [phase]);

  // fase 3 → barra de progresso automática (≈ 4 s) e depois entra
  useEffect(() => {
    if (phase !== 3) return;
    let p = 0;
    const iv = setInterval(() => {
      p += 1;
      setAutoProgress(p);
      if (p >= 100) { clearInterval(iv); onEnter(); }
    }, 40);
    return () => clearInterval(iv);
  }, [phase, onEnter]);

  // partículas flutuantes geradas uma vez
  const particles = React.useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        r: Math.random() * 3.5 + 1,
        dur: (Math.random() * 6 + 4).toFixed(1),
        delay: (Math.random() * 4).toFixed(1),
        op: (Math.random() * 0.2 + 0.04).toFixed(2),
        type: i % 3,
      })),
    []
  );

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 font-sans relative overflow-hidden select-none"
      style={{ background: 'linear-gradient(140deg, #0d1f36 0%, #1c3a63 55%, #14304f 100%)' }}
    >
      {/* ── Keyframes injetados via <style> ── */}
      <style>{`
        @keyframes sp-float0 { from{transform:translate(0,0)} to{transform:translate(12px,-22px)} }
        @keyframes sp-float1 { from{transform:translate(0,0)} to{transform:translate(-14px,16px)} }
        @keyframes sp-float2 { from{transform:translate(0,0)} to{transform:translate(-8px,-12px)} }
        @keyframes sp-ring   { 0%,100%{transform:translate(-50%,-50%) scale(1);opacity:.12}
                               50%{transform:translate(-50%,-50%) scale(1.2);opacity:.05} }
        @keyframes sp-ring2  { 0%,100%{transform:translate(-50%,-50%) scale(1);opacity:.07}
                               50%{transform:translate(-50%,-50%) scale(1.35);opacity:.03} }
        @keyframes sp-logo   { 0%{opacity:0;transform:scale(.45) rotate(-12deg)}
                               65%{transform:scale(1.07) rotate(2deg)}
                               100%{opacity:1;transform:scale(1) rotate(0deg)} }
        @keyframes sp-fadeup { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes sp-blink  { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes sp-glow   { 0%,100%{box-shadow:0 0 18px 3px rgba(100,116,139,.35)}
                               50%{box-shadow:0 0 32px 8px rgba(100,116,139,.6)} }
        @keyframes sp-bar    { from{width:0%} }
      `}</style>

      {/* Partículas SVG */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
        {particles.map(p => (
          <circle
            key={p.id}
            cx={`${p.x}%`} cy={`${p.y}%`} r={p.r}
            fill="#64748b" opacity={p.op}
            style={{ animation: `sp-float${p.type} ${p.dur}s ${p.delay}s ease-in-out infinite alternate` }}
          />
        ))}
      </svg>

      {/* Anéis pulsantes atrás do logo */}
      <div style={{
        position: 'absolute', width: 200, height: 200,
        top: '44%', left: '50%',
        borderRadius: '50%', border: '1px solid #64748b',
        animation: 'sp-ring 3.2s ease-in-out infinite',
        zIndex: 1,
      }}/>
      <div style={{
        position: 'absolute', width: 300, height: 300,
        top: '44%', left: '50%',
        borderRadius: '50%', border: '1px solid #475569',
        animation: 'sp-ring2 4s ease-in-out infinite',
        zIndex: 1,
      }}/>

      {/* ── Conteúdo central ── */}
      <div className="relative flex flex-col items-center gap-7 max-w-md w-full text-center"
           style={{ zIndex: 10 }}>

        {/* Logo */}
        <div style={{ animation: 'sp-logo .75s cubic-bezier(.34,1.56,.64,1) .1s both' }}>
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl"
            style={{
              background: 'linear-gradient(135deg,#64748b,#475569)',
              animation: 'sp-glow 2.5s ease-in-out infinite',
            }}
          >
            <Calculator className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Textos */}
        <div style={{ minHeight: 100 }}>
          {/* Título typewriter */}
          <h1
            className="font-extrabold text-white leading-tight tracking-tight"
            style={{ fontSize: 'clamp(2.2rem, 6vw, 3.5rem)', textShadow: '0 4px 30px rgba(100,116,139,.5)' }}
          >
            {typedTitle}
            {phase <= 1 && (
              <span
                className="inline-block ml-1 align-middle rounded"
                style={{
                  width: 3, height: '1em',
                  background: '#64748b',
                  animation: 'sp-blink .75s steps(1) infinite',
                  verticalAlign: 'middle',
                }}
              />
            )}
          </h1>

          {/* Subtítulo typewriter */}
          <p
            className="font-medium mt-2 transition-opacity duration-500"
            style={{ color: '#94a3b8', fontSize: '1.1rem', opacity: phase >= 2 ? 1 : 0, minHeight: 30 }}
          >
            {typedSub}
            {phase === 2 && (
              <span
                className="inline-block ml-0.5 align-middle rounded"
                style={{
                  width: 2, height: '1em',
                  background: '#64748b',
                  animation: 'sp-blink .75s steps(1) infinite',
                  verticalAlign: 'middle',
                }}
              />
            )}
          </p>

          {/* Bem-vindo */}
          <p
            className="text-sm font-medium mt-2 transition-all duration-500"
            style={{
              color: '#475569',
              opacity: phase >= 3 ? 1 : 0,
              transform: phase >= 3 ? 'translateY(0)' : 'translateY(8px)',
              transitionDelay: '.2s',
            }}
          >
            Bem-vindo(a),{' '}
            <strong style={{ color: '#94a3b8' }}>{user?.name}</strong>
          </p>
        </div>

        {/* Divisor */}
        <div
          className="w-full max-w-xs h-px"
          style={{
            background: 'linear-gradient(90deg,transparent,#475569,transparent)',
            opacity: phase >= 3 ? .5 : 0,
            transition: 'opacity .6s ease .3s',
          }}
        />

        {/* Barra de progresso */}
        <div
          className="w-full max-w-xs"
          style={{
            opacity: phase >= 3 ? 1 : 0,
            transform: phase >= 3 ? 'translateY(0)' : 'translateY(12px)',
            transition: 'all .5s ease .4s',
          }}
        >
          <div className="flex justify-between mb-1.5"
               style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <span>Carregando sistema</span>
            <span>{autoProgress}%</span>
          </div>
          <div className="w-full rounded-full overflow-hidden" style={{ height: 5, background: '#1e3451' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${autoProgress}%`,
                background: 'linear-gradient(90deg,#64748b,#94a3b8)',
                boxShadow: '0 0 10px rgba(100,116,139,.7)',
                transition: 'width .1s linear',
              }}
            />
          </div>
        </div>

        {/* Botão "Pular" */}
        <button
          onClick={onEnter}
          style={{
            opacity: phase >= 3 ? 1 : 0,
            transform: phase >= 3 ? 'translateY(0)' : 'translateY(16px)',
            transition: 'all .6s cubic-bezier(.34,1.56,.64,1) .6s',
            background: 'transparent',
            border: '1px solid #334155',
            color: '#64748b',
            fontWeight: 700,
            fontSize: '0.85rem',
            padding: '8px 24px',
            borderRadius: 12,
            cursor: 'pointer',
          }}
          onMouseEnter={e => { e.target.style.borderColor = '#94a3b8'; e.target.style.color = '#e2e8f0'; }}
          onMouseLeave={e => { e.target.style.borderColor = '#334155'; e.target.style.color = '#64748b'; }}
        >
          Pular →
        </button>
      </div>

      {/* Rodapé */}
      <div
        className="absolute bottom-5 left-0 right-0 text-center"
        style={{
          opacity: phase >= 3 ? .35 : 0,
          transition: 'opacity .8s ease 1s',
          fontSize: 10,
          fontWeight: 700,
          color: '#475569',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        Desenvolvido por UpConta Contabilidade · v4.3.0
      </div>
    </div>
  );
};

export default SplashScreen;
