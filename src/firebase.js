import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDEduuLR30x1fIrmKathiZ2JWDBmFcmgOU",
  authDomain: "portal-fiscal-9c77d.firebaseapp.com",
  projectId: "portal-fiscal-9c77d",
  storageBucket: "portal-fiscal-9c77d.firebasestorage.app",
  messagingSenderId: "360066022782",
  appId: "1:360066022782:web:00315ddd246c8b2eaec72f"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
