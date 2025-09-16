// Script para criar usuário administrador inicial usando Firebase Client SDK
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, addDoc, collection, Timestamp } from 'firebase/firestore';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAf3OruYIPCu_AgzAKOdOa_b-gySSEL7RQ",
  authDomain: "mercadofacilweb.firebaseapp.com",
  projectId: "mercadofacilweb",
  storageBucket: "mercadofacilweb.firebasestorage.app",
  messagingSenderId: "10443024714",
  appId: "1:10443024714:web:2f25bdbfbc090c14a439b3"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createAdminUser() {
  try {
    // Dados do usuário administrador
    const adminData = {
      email: 'admin@mercadofacil.com',
      password: 'Admin123!',
      displayName: 'Administrador Principal'
    };

    console.log('Criando usuário administrador...');
    console.log('Email:', adminData.email);
    console.log('Senha:', adminData.password);
    
    // Criar usuário no Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      adminData.email, 
      adminData.password
    );

    console.log('Usuário criado no Auth:', userCredential.user.uid);

    // Criar documento do administrador no Firestore
    const adminDoc = {
      nome: adminData.displayName,
      email: adminData.email,
      telefone: '',
      role: 'super_admin',
      permissions: [
        {
          resource: 'produtos',
          actions: ['create', 'read', 'update', 'delete']
        },
        {
          resource: 'categorias',
          actions: ['create', 'read', 'update', 'delete']
        },
        {
          resource: 'clientes',
          actions: ['create', 'read', 'update', 'delete']
        },
        {
          resource: 'pedidos',
          actions: ['create', 'read', 'update', 'delete']
        },
        {
          resource: 'usuarios_admin',
          actions: ['create', 'read', 'update', 'delete']
        },
        {
          resource: 'dashboard',
          actions: ['read']
        },
        {
          resource: 'relatorios',
          actions: ['read']
        }
      ],
      dataCriacao: Timestamp.now(),
      ultimoLogin: null,
      ativo: true,
      criadoPor: null
    };

    console.log('Criando documento no Firestore...');
    
    const docRef = await addDoc(collection(db, 'admin_users'), adminDoc);
    
    console.log('\n✅ Administrador criado com sucesso!');
    console.log('📄 ID do documento:', docRef.id);
    console.log('📧 Email:', adminData.email);
    console.log('🔑 Senha:', adminData.password);
    console.log('\n🚀 Você pode fazer login no painel administrativo com essas credenciais.');
    
  } catch (error) {
    console.error('❌ Erro ao criar administrador:', error.message);
    
    if (error.code === 'auth/email-already-exists') {
      console.log('\n⚠️  O usuário já existe. Tentando criar apenas o documento no Firestore...');
      
      try {
        const adminDoc = {
          nome: 'Administrador Principal',
          email: 'admin@mercadofacil.com',
          telefone: '',
          role: 'super_admin',
          permissions: [
            {
              resource: 'produtos',
              actions: ['create', 'read', 'update', 'delete']
            },
            {
              resource: 'categorias',
              actions: ['create', 'read', 'update', 'delete']
            },
            {
              resource: 'clientes',
              actions: ['create', 'read', 'update', 'delete']
            },
            {
              resource: 'pedidos',
              actions: ['create', 'read', 'update', 'delete']
            },
            {
              resource: 'usuarios_admin',
              actions: ['create', 'read', 'update', 'delete']
            },
            {
              resource: 'dashboard',
              actions: ['read']
            },
            {
              resource: 'relatorios',
              actions: ['read']
            }
          ],
          dataCriacao: Timestamp.now(),
          ultimoLogin: null,
          ativo: true,
          criadoPor: null
        };
        
        const docRef = await addDoc(collection(db, 'admin_users'), adminDoc);
        console.log('✅ Documento do administrador criado:', docRef.id);
        console.log('📧 Email: admin@mercadofacil.com');
        console.log('🔑 Use a senha existente para fazer login.');
        
      } catch (docError) {
        console.error('❌ Erro ao criar documento:', docError.message);
      }
    }
  }
}

// Executar o script
createAdminUser().then(() => {
  console.log('\n🏁 Script finalizado.');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erro no script:', error);
  process.exit(1);
});