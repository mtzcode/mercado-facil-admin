import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';

// Configuração do Firebase (usando as mesmas configurações do projeto)
const firebaseConfig = {
  apiKey: "AIzaSyBvOkuAiJlqOxd9O0F5-FwGwpqhfHhGUGc",
  authDomain: "mercadofacilweb.firebaseapp.com",
  projectId: "mercadofacilweb",
  storageBucket: "mercadofacilweb.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createTestUser() {
  try {
    const userData = {
      nome: 'João Silva Teste',
      email: 'joao.teste@email.com',
      telefone: '(11) 99999-8888',
      whatsapp: '(11) 99999-8888',
      ativo: true,
      cadastroCompleto: true,
      dataCadastro: Timestamp.now(),
      ultimoLogin: null,
      totalPedidos: 0,
      totalGasto: 0
    };
    
    const docRef = await addDoc(collection(db, 'users'), userData);
    console.log('✅ Usuário de teste criado com sucesso!');
    console.log('ID:', docRef.id);
    console.log('Nome:', userData.nome);
    console.log('Email:', userData.email);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao criar usuário de teste:', error);
    process.exit(1);
  }
}

createTestUser();