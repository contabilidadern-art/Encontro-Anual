import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import App from './App.jsx'
import ReportPage from './report/ReportPage.jsx'
import './index.css' // <--- ESSA LINHA É OBRIGATÓRIA PARA O VISUAL FUNCIONAR

// Deploy "Encontro Anual" (repo/Vercel dedicados à apresentação AKIK/Maridel)
// — raiz abre direto no Report da AKIK em vez da tela de login do módulo de
// Precificação, que não faz sentido pra esse deploy específico.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/report/02976533000139" replace />} />
        <Route path="/report/:clienteId/:periodoId" element={<ReportPage />} />
        <Route path="/report/:clienteId" element={<ReportPage />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)