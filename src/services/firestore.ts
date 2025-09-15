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
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Produto,
  Categoria,
  User,
  Pedido,
  DashboardStats,
  ProdutoForm,
  CategoriaForm,
} from "@/types";

// Utilitário para converter Timestamp do Firestore para Date
const timestampToDate = (timestamp: unknown): Date => {
  if (timestamp && typeof timestamp === "object" && "toDate" in timestamp) {
    return (timestamp as Timestamp).toDate();
  }
  if (timestamp && typeof timestamp === "object" && "seconds" in timestamp) {
    return new Date((timestamp as { seconds: number }).seconds * 1000);
  }
  return new Date(timestamp as string | number | Date);
};

const convertTimestamp = (data: Record<string, unknown>) => {
  const converted = { ...data };

  // Converter Timestamps do Firestore para Date
  Object.keys(converted).forEach((key) => {
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
      query(collection(db, "produtos"), orderBy("nome"))
    );
    return querySnapshot.docs.map((doc) => {
      const data = doc.data() as Record<string, unknown>;
      return {
        id: doc.id,
        ...convertTimestamp(data),
      } as Produto;
    });
  },

  async getById(id: string): Promise<Produto | null> {
    const docSnap = await getDoc(doc(db, "produtos", id));
    if (docSnap.exists()) {
      const data = docSnap.data() as Record<string, unknown>;
      return {
        id: docSnap.id,
        ...convertTimestamp(data),
      } as Produto;
    }
    return null;
  },

  async create(produto: ProdutoForm): Promise<string> {
    const now = new Date();
    const docRef = await addDoc(collection(db, "produtos"), {
      ...produto,
      avaliacoes: [],
      dataCriacao: Timestamp.fromDate(now),
      dataAtualizacao: Timestamp.fromDate(now),
    });
    return docRef.id;
  },

  async update(id: string, produto: Partial<ProdutoForm>): Promise<void> {
    await updateDoc(doc(db, "produtos", id), {
      ...produto,
      dataAtualizacao: Timestamp.fromDate(new Date()),
    });
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, "produtos", id));
  },

  async getByCategoria(categoria: string): Promise<Produto[]> {
    const querySnapshot = await getDocs(
      query(
        collection(db, "produtos"),
        where("categoria", "==", categoria),
        orderBy("nome")
      )
    );
    return querySnapshot.docs.map((doc) => {
      const data = doc.data() as Record<string, unknown>;
      return {
        id: doc.id,
        ...convertTimestamp(data),
      } as Produto;
    });
  },
};

// Serviços para Categorias
export const categoriaService = {
  async getAll(): Promise<Categoria[]> {
    const querySnapshot = await getDocs(
      query(collection(db, "categorias"), orderBy("ordem"))
    );
    return querySnapshot.docs.map((doc) => {
      const data = doc.data() as Record<string, unknown>;
      return {
        id: doc.id,
        ...convertTimestamp(data),
      } as Categoria;
    });
  },

  async create(categoria: CategoriaForm): Promise<string> {
    const docRef = await addDoc(collection(db, "categorias"), {
      ...categoria,
      dataCriacao: Timestamp.fromDate(new Date()),
    });
    return docRef.id;
  },

  async update(id: string, categoria: Partial<CategoriaForm>): Promise<void> {
    await updateDoc(doc(db, "categorias", id), categoria);
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, "categorias", id));
  },
};

// Serviços para Usuários (padronizado)
export const usuarioService = {
  async getAll(): Promise<User[]> {
    const querySnapshot = await getDocs(
      query(collection(db, "users"), orderBy("dataCadastro", "desc"))
    );
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      dataCadastro: timestampToDate(doc.data().dataCadastro),
      ultimoLogin: doc.data().ultimoLogin
        ? timestampToDate(doc.data().ultimoLogin)
        : undefined,
    })) as User[];
  },

  async getById(id: string): Promise<User | null> {
    const docSnap = await getDoc(doc(db, "users", id));
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        dataCadastro: timestampToDate(data.dataCadastro),
        ultimoLogin: data.ultimoLogin
          ? timestampToDate(data.ultimoLogin)
          : undefined,
      } as User;
    }
    return null;
  },
};

// Serviços para Clientes (compatibilidade - usar usuarioService)
export const clienteService = {
  async getAll(): Promise<User[]> {
    return usuarioService.getAll();
  },

  async getById(id: string): Promise<User | null> {
    return usuarioService.getById(id);
  },

  async create(user: {
    nome: string;
    email: string;
    telefone: string;
    ativo: boolean;
    cadastroCompleto: boolean;
  }): Promise<string> {
    const userData = {
      ...user,
      whatsapp: user.telefone, // Compatibilidade
      dataCadastro: Timestamp.now(),
      ultimoLogin: null,
      totalPedidos: 0,
      totalGasto: 0,
    };

    const docRef = await addDoc(collection(db, "users"), userData);
    return docRef.id;
  },

  async update(
    id: string,
    user: Partial<{
      nome: string;
      email: string;
      telefone: string;
      ativo: boolean;
      cadastroCompleto: boolean;
    }>
  ): Promise<void> {
    const docRef = doc(db, "users", id);
    const updateData = {
      ...user,
      whatsapp: user.telefone, // Compatibilidade
      updatedAt: Timestamp.now(),
    };
    await updateDoc(docRef, updateData);
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, "users", id));
  },

  async search(searchTerm: string): Promise<User[]> {
    const snapshot = await getDocs(collection(db, "users"));
    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...convertTimestamp(doc.data()),
    })) as User[];

    return users.filter(
      (user) =>
        user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.telefone.includes(searchTerm) ||
        (user.whatsapp && user.whatsapp.includes(searchTerm))
    );
  },

  async getStats(): Promise<{
    total: number;
    ativos: number;
    cadastrosCompletos: number;
    novos30Dias: number;
  }> {
    const snapshot = await getDocs(collection(db, "users"));
    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...convertTimestamp(doc.data()),
    })) as User[];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return {
      total: users.length,
      ativos: users.filter((u) => u.ativo).length,
      cadastrosCompletos: users.filter((u) => u.cadastroCompleto).length,
      novos30Dias: users.filter((u) => u.dataCadastro >= thirtyDaysAgo).length,
    };
  },
};

// Serviços para Pedidos (padronizado com userId)
export const pedidoService = {
  async getAll(): Promise<Pedido[]> {
    const querySnapshot = await getDocs(
      query(collection(db, "pedidos"), orderBy("dataPedido", "desc"))
    );
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        userId: data.userId, // Campo padronizado
        dataPedido: timestampToDate(data.dataPedido),
        dataEntrega: data.dataEntrega
          ? timestampToDate(data.dataEntrega)
          : undefined,
      } as Pedido;
    });
  },

  async getByStatus(status: string): Promise<Pedido[]> {
    const querySnapshot = await getDocs(
      query(
        collection(db, "pedidos"),
        where("status", "==", status),
        orderBy("dataPedido", "desc")
      )
    );
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        userId: data.userId, // Campo padronizado
        dataPedido: timestampToDate(data.dataPedido),
        dataEntrega: data.dataEntrega
          ? timestampToDate(data.dataEntrega)
          : undefined,
      } as Pedido;
    });
  },

  async getByUserId(userId: string): Promise<Pedido[]> {
    const querySnapshot = await getDocs(
      query(
        collection(db, "pedidos"),
        where("userId", "==", userId),
        orderBy("dataPedido", "desc")
      )
    );
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        userId: data.userId, // Campo padronizado
        dataPedido: timestampToDate(data.dataPedido),
        dataEntrega: data.dataEntrega
          ? timestampToDate(data.dataEntrega)
          : undefined,
      } as Pedido;
    });
  },

  async updateStatus(id: string, status: string): Promise<void> {
    await updateDoc(doc(db, "pedidos", id), {
      status,
      updatedAt: Timestamp.now(),
    });
  },

  async create(pedido: Omit<Pedido, "id" | "dataPedido">): Promise<string> {
    const pedidoData = {
      ...pedido,
      dataPedido: Timestamp.now(),
      // Garantir que userId está definido
      userId: pedido.userId || pedido.clienteId || pedido.usuarioId,
    };

    const docRef = await addDoc(collection(db, "pedidos"), pedidoData);
    return docRef.id;
  },
};

// Serviços para Dashboard (atualizado para usar users)
export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const [users, produtos, pedidos] = await Promise.all([
      getDocs(collection(db, "users")),
      getDocs(collection(db, "produtos")),
      getDocs(collection(db, "pedidos")),
    ]);

    const pedidosPendentes = await getDocs(
      query(collection(db, "pedidos"), where("status", "==", "pendente"))
    );

    const produtosSemEstoque = await getDocs(
      query(collection(db, "produtos"), where("estoque", "<=", 0))
    );

    const totalVendas = pedidos.docs.reduce((total, doc) => {
      const pedido = doc.data();
      if (pedido.status !== "cancelado") {
        return total + (pedido.total || 0);
      }
      return total;
    }, 0);

    return {
      totalClientes: users.size,
      totalProdutos: produtos.size,
      totalPedidos: pedidos.size,
      totalVendas,
      pedidosPendentes: pedidosPendentes.size,
      produtosSemEstoque: produtosSemEstoque.size,
    };
  },
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
      const usuarios = await getDocs(collection(db, "usuarios"));

      usuarios.docs.forEach((userDoc) => {
        const notifRef = doc(collection(db, "notificacoes"));
        batch.set(notifRef, {
          ...notificacao,
          userId: userDoc.id,
          timestamp: Timestamp.fromDate(new Date()),
          read: false,
        });
      });
    } else if (notificacao.targetUsers) {
      // Enviar para usuários específicos
      notificacao.targetUsers.forEach((userId) => {
        const notifRef = doc(collection(db, "notificacoes"));
        batch.set(notifRef, {
          ...notificacao,
          userId,
          timestamp: Timestamp.fromDate(new Date()),
          read: false,
        });
      });
    }

    await batch.commit();
  },
};
