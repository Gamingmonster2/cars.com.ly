import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// ملاحظة: تأكد من وضع إعدادات Firebase الخاصة بك هنا
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
