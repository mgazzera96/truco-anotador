import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCaCNmDYiIYW4w9mvWT1M_3Lu2V1VZGo2M",
  authDomain: "truco-776e7.firebaseapp.com",
  projectId: "truco-776e7",
  storageBucket: "truco-776e7.firebasestorage.app",
  messagingSenderId: "484939836046",
  appId: "1:484939836046:web:7d794324283204a16df7df",
  measurementId: "G-RCYCES66EP"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

