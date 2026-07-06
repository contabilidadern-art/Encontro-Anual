import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBYGV4tznFdig9LfsbIhCrt3TVhOEmT_k",
  authDomain: "analisador-c676c.firebaseapp.com",
  projectId: "analisador-c676c",
  storageBucket: "analisador-c676c.firebasestorage.app",
  messagingSenderId: "838970696114",
  appId: "1:838970696114:web:a65efe5a4b852ab3ceb1ab",
  measurementId: "G-94D8QXM70"
};

const app = initializeApp(firebaseConfig);
// Em algumas redes (proxy/antivírus/VPN) a conexão "streaming" padrão do
// Firestore (WebChannel) trava silenciosamente sem gerar erro. O long-polling
// automático detecta esse cenário e usa um transporte alternativo compatível.
export const db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
