import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAf3OruYIPCu_AgzAKOdOa_b-gySSEL7RQ",
  authDomain: "mercadofacilweb.firebaseapp.com",
  projectId: "mercadofacilweb",
  storageBucket: "mercadofacilweb.firebasestorage.app",
  messagingSenderId: "10443024714",
  appId: "1:10443024714:web:2f25bdbfbc090c14a439b3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testFirebase() {
  try {
    console.log('Testando conexão com Firebase...');
    
    // Testar produtos
    const produtosRef = collection(db, 'produtos');
    const produtosSnapshot = await getDocs(produtosRef);
    console.log(`Total de produtos: ${produtosSnapshot.size}`);
    
    if (produtosSnapshot.size > 0) {
      console.log('Primeiros 3 produtos:');
      produtosSnapshot.docs.slice(0, 3).forEach((doc, index) => {
        const data = doc.data();
        console.log(`${index + 1}. ${data.nome} - Estoque: ${data.estoque}`);
      });
    }
    
    // Testar usuários
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    console.log(`Total de usuários: ${usersSnapshot.size}`);
    
    // Testar pedidos
    const pedidosRef = collection(db, 'pedidos');
    const pedidosSnapshot = await getDocs(pedidosRef);
    console.log(`Total de pedidos: ${pedidosSnapshot.size}`);
    
  } catch (error) {
    console.error('Erro ao conectar com Firebase:', error);
  }
}

testFirebase();