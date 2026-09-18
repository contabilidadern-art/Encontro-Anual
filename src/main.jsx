import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import ReportPage from './report/ReportPage.jsx'
import './index.css' // <--- ESSA LINHA É OBRIGATÓRIA PARA O VISUAL FUNCIONAR

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/report/:clienteId/:periodoId" element={<ReportPage />} />
        <Route path="/report/:clienteId" element={<ReportPage />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)