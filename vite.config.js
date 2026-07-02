import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core — raramente muda, cache longo no browser
          'vendor-react': ['react', 'react-dom'],
          // Firebase — pesado (~500KB), cache separado
          'vendor-firebase': ['firebase/app', 'firebase/firestore'],
          // Mapa — só carregado nas abas com mapa
          'vendor-map': ['leaflet', 'react-leaflet'],
          // XLSX agora é dinâmico (import()), mas jszip fica aqui
          'vendor-zip': ['jszip'],
          // Ícones — tree-shakeable, chunk separado para cache
          'vendor-icons': ['lucide-react'],
        },
      },
    },
    // Avisa só acima de 800KB (padrão 500KB é agressivo demais para apps com Firebase)
    chunkSizeWarningLimit: 800,
  },
})
