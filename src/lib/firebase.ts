import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "hotel-project-485811",
  appId: "1:693691274781:web:cc15f62ad313d881bad8f4",
  apiKey: "AIzaSyAZqYQwWRnQNkWwS6qPUBdkrexNhnURjgk",
  authDomain: "hotel-project-485811.firebaseapp.com",
  storageBucket: "hotel-project-485811.firebasestorage.app",
  messagingSenderId: "693691274781"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-carslibya-f8cf7d50-bd16-44a3-8284-47deae4aef16");
