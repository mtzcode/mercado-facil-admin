import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Produto, 
  Categoria, 
  Cliente, 
  Pedido, 
  DashboardStats,
  ProdutoForm,
  CategoriaForm 
} from '@/types';

// Utilitário para converter Timestamp do Firestore para Date
const timestampToDate = (timestamp: unknown): Date => {
  if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
    return (timestamp as Timestamp).toDate();
  }
  if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
    return new Date((timestamp as { seconds: number }).seconds * 1000);
  }
  return new Date(timestamp as string | number | Date);
};

const convertTimestamp = (data: Record<string, unknown>) => {
  const converted = { ...data };
  
  // Converter Timestamps do Firestore para Date
  Object.keys(converted).forEach(key => {
    if (converted[key] instanceof Timestamp) {
      converted[key] = (converted[key] as Timestamp).toDate();
    }
  });
  
  return converted;
};

// Serviços para Produtos
export const produtoService = {
  async getAll(): Promise<Produto[]> {
    const querySnapshot = await getDocs(
      query(collection(db, 'produtos'), orderBy('nome'))
    );
    return querySnapshot.docs.map(doc => {
      const data = doc.data() as Record<string, unknown>;
      return {
        id: doc.id,
        ...convertTimestamp(data)
      } as Produto;
    });
  },

  async getById(id: string): Promise<Produto | null> {
    const docSnap = await getDoc(doc(db, 'produtos', id));
    if (docSnap.exists()) {
      const data = docSnap.data() as Record<string, unknown>;
      return {
        id: docSnap.id,
        ...convertTimestamp(data)
      } as Produto;
    }
    return null;
  },

  async create(produto: ProdutoForm): Promise<string> {
    const now = new Date();
    const docRef = await addDoc(collection(db, 'produtos'), {
      ...produto,
      avaliacoes: [],
      dataCriacao: Timestamp.fromDate(now),
      dataAtualizacao: Timestamp.fromDate(now)
    });
    return docRef.id;
  },

  async update(id: string, produto: Partial<ProdutoForm>): Promise<void> {
    await updateDoc(doc(db, 'produtos', id), {
      ...produto,
      dataAtualizacao: Timestamp.fromDate(new Date())
    });
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, 'produtos', id));
  },

  async getByCategoria(categoria: string): Promise<Produto[]> {
    const querySnapshot = await getDocs(
      query(
        collection(db, 'produtos'),
        where('categoria', '==', categoria),
        orderBy('nome')
      )
    );
    return querySnapshot.docs.map(doc => {
      const data = doc.data() as Record<string, unknown>;
      return {
        id: doc.id,
        ...convertTimestamp(data)
      } as Produto;
    });
  }
};

// Serviços para Categorias
export const categoriaService = {
  async getAll(): Promise<Categoria[]> {
    const querySnapshot = await getDocs(
      query(collection(db, 'categorias'), orderBy('ordem'))
    );
    return querySnapshot.docs.map(doc => {
      const data = doc.data() as Record<string, unknown>;
      return {
        id: doc.id,
        ...convertTimestamp(data)
      } as Categoria;
    });
  },

  async create(categoria: CategoriaForm): Promise<string> {
    const docRef = await addDoc(collection(db, 'categorias'), {
      ...categoria,
      dataCriacao: Timestamp.fromDate(new Date())
    });
    return docRef.id;
  },

  async update(id: string, categoria: Partial<CategoriaForm>): Promise<void> {
    await updateDoc(doc(db, 'categorias', id), categoria);
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, 'categorias', id));
  }
};

// Serviços para Usuários
export const usuarioService = {
  async getAll(): Promise<Cliente[]> {
    const querySnapshot = await getDocs(
      query(collection(db, 'clientes'), orderBy('dataCadastro', 'desc'))
    );
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dataCadastro: timestampToDate(doc.data().dataCadastro),
      ultimoLogin: doc.data().ultimoLogin ? timestampToDate(doc.data().ultimoLogin) : undefined
    })) as Cliente[];
  },

  async getById(id: string): Promise<Cliente | null> {
    const docSnap = await getDoc(doc(db, 'clientes', id));
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        dataCadastro: timestampToDate(data.dataCadastro),
        ultimoLogin: data.ultimoLogin ? timestampToDate(data.ultimoLogin) : undefined
      } as Cliente;
    }
    return null;
  }
};

// Serviços para Clientes
export const clienteService = {
  async getAll(): Promise<Cliente[]> {
    const snapshot = await getDocs(
      query(collection(db, 'clientes'), orderBy('dataCadastro', 'desc'))
    );
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamp(doc.data())
    })) as Cliente[];
  },

  async getById(id: string): Promise<Cliente | null> {
    const docRef = doc(db, 'clientes', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...convertTimestamp(docSnap.data())
      } as Cliente;
    }
    return null;
  },

  async create(cliente: {
    nome: string;
    email: string;
    whatsapp: string;
    ativo: boolean;
    cadastroCompleto: boolean;
  }): Promise<string> {
    const clienteData = {
      ...cliente,
      dataCadastro: Timestamp.now(),
      ultimoLogin: null,
      totalPedidos: 0,
      totalGasto: 0
    };
    
    const docRef = await addDoc(collection(db, 'clientes'), clienteData);
    return docRef.id;
  },

  async update(id: string, cliente: Partial<{
    nome: string;
    email: string;
    whatsapp: string;
    ativo: boolean;
    cadastroCompleto: boolean;
  }>): Promise<void> {
    const docRef = doc(db, 'clientes', id);
    await updateDoc(docRef, {
      ...cliente,
      updatedAt: Timestamp.now()
    });
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, 'clientes', id));
  },

  async search(searchTerm: string): Promise<Cliente[]> {
    const snapshot = await getDocs(collection(db, 'clientes'));
    const clientes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamp(doc.data())
    })) as Cliente[];
    
    return clientes.filter(cliente =>
      cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.whatsapp.includes(searchTerm)
    );
  },

  async getStats(): Promise<{
    total: number;
    ativos: number;
    cadastrosCompletos: number;
    novos30Dias: number;
  }> {
    const snapshot = await getDocs(collection(db, 'clientes'));
    const clientes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamp(doc.data())
    })) as Cliente[];
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return {
      total: clientes.length,
      ativos: clientes.filter(c => c.ativo).length,
      cadastrosCompletos: clientes.filter(c => c.cadastroCompleto).length,
      novos30Dias: clientes.filter(c => c.dataCadastro >= thirtyDaysAgo).length
    };
  }
};

// Serviços para Pedidos
export const pedidoService = {
  async getAll(): Promise<Pedido[]> {
    const querySnapshot = await getDocs(
      query(collection(db, 'pedidos'), orderBy('dataPedido', 'desc'))
    );
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dataPedido: timestampToDate(doc.data().dataPedido),
      dataEntrega: doc.data().dataEntrega ? timestampToDate(doc.data().dataEntrega) : undefined
    })) as Pedido[];
  },

  async getByStatus(status: string): Promise<Pedido[]> {
    const querySnapshot = await getDocs(
      query(
        collection(db, 'pedidos'),
        where('status', '==', status),
        orderBy('dataPedido', 'desc')
      )
    );
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dataPedido: timestampToDate(doc.data().dataPedido),
      dataEntrega: doc.data().dataEntrega ? timestampToDate(doc.data().dataEntrega) : undefined
    })) as Pedido[];
  },

  async updateStatus(id: string, status: string): Promise<void> {
    await updateDoc(doc(db, 'pedidos', id), { status });
  }
};

// Serviços para Dashboard
export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const [clientes, produtos, pedidos] = await Promise.all([
      getDocs(collection(db, 'clientes')),
      getDocs(collection(db, 'produtos')),
      getDocs(collection(db, 'pedidos'))
    ]);

    const pedidosPendentes = await getDocs(
      query(collection(db, 'pedidos'), where('status', '==', 'pendente'))
    );

    const produtosSemEstoque = await getDocs(
      query(collection(db, 'produtos'), where('estoque', '<=', 0))
    );

    const totalVendas = pedidos.docs.reduce((total, doc) => {
      const pedido = doc.data();
      if (pedido.status !== 'cancelado') {
        return total + (pedido.total || 0);
      }
      return total;
    }, 0);

    return {
      totalClientes: clientes.size,
      totalProdutos: produtos.size,
      totalPedidos: pedidos.size,
      totalVendas,
      pedidosPendentes: pedidosPendentes.size,
      produtosSemEstoque: produtosSemEstoque.size
    };
  }
};

// Serviços para Notificações
export const notificacaoService = {
  async enviarNotificacao(notificacao: {
    title: string;
    body: string;
    type: string;
    targetUsers?: string[];
    sendToAll: boolean;
    data?: Record<string, unknown>;
  }): Promise<void> {
    const batch = writeBatch(db);
    
    if (notificacao.sendToAll) {
      // Buscar todos os usuários
      const usuarios = await getDocs(collection(db, 'usuarios'));
      
      usuarios.docs.forEach(userDoc => {
        const notifRef = doc(collection(db, 'notificacoes'));
        batch.set(notifRef, {
          ...notificacao,
          userId: userDoc.id,
          timestamp: Timestamp.fromDate(new Date()),
          read: false
        });
      });
    } else if (notificacao.targetUsers) {
      // Enviar para usuários específicos
      notificacao.targetUsers.forEach(userId => {
        const notifRef = doc(collection(db, 'notificacoes'));
        batch.set(notifRef, {
          ...notificacao,
          userId,
          timestamp: Timestamp.fromDate(new Date()),
          read: false
        });
      });
    }
    
    await batch.commit();
  }
};