import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Configurações do Firebase - mesmo projeto do app mobile
const firebaseConfig = {
  apiKey: 'AIzaSyAf3OruYIPCu_AgzAKOdOa_b-gySSEL7RQ',
  authDomain: 'mercadofacilweb.firebaseapp.com',
  projectId: 'mercadofacilweb',
  storageBucket: 'mercadofacilweb.firebasestorage.app',
  messagingSenderId: '10443024714',
  appId: '1:10443024714:web:2f25bdbfbc090c14a439b3'
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar serviços
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;