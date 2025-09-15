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

  // Mapear campos de data para nomes padronizados
  if (converted.dataCriacao) {
    converted.createdAt = converted.dataCriacao;
    delete converted.dataCriacao;
  }
  if (converted.dataAtualizacao) {
    converted.updatedAt = converted.dataAtualizacao;
    delete converted.dataAtualizacao;
  }

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
const getDateRange = (filter: string, customDate?: string, startDate?: string, endDate?: string) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (filter) {
    case 'today':
      return {
        start: today,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      };
    case 'yesterday':
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      return {
        start: yesterday,
        end: today
      };
    case 'week':
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      return {
        start: weekAgo,
        end: new Date(now.getTime() + 24 * 60 * 60 * 1000)
      };
    case 'month':
      const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
      return {
        start: monthAgo,
        end: new Date(now.getTime() + 24 * 60 * 60 * 1000)
      };
    case 'custom':
      if (customDate) {
        const selectedDate = new Date(customDate);
        const startOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
        return {
          start: startOfDay,
          end: endOfDay
        };
      }
      return {
        start: today,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      };
    case 'range':
      if (startDate && endDate) {
        // Criar datas no fuso horário local para evitar problemas de conversão
        const start = new Date(startDate + 'T00:00:00');
        const end = new Date(endDate + 'T23:59:59.999');
        return { start, end };
      }
      return {
        start: today,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      };
    default:
      return {
        start: today,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      };
  }
};

const getPreviousDateRange = (filter: string, customDate?: string, startDate?: string, endDate?: string) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (filter) {
    case 'today':
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      return {
        start: yesterday,
        end: today
      };
    case 'yesterday':
      const dayBeforeYesterday = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);
      const yesterdayEnd = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      return {
        start: dayBeforeYesterday,
        end: yesterdayEnd
      };
    case 'week':
      const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      return {
        start: twoWeeksAgo,
        end: weekAgo
      };
    case 'month':
      const twoMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, today.getDate());
      const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
      return {
        start: twoMonthsAgo,
        end: monthAgo
      };
    case 'custom':
      if (customDate) {
        const selectedDate = new Date(customDate);
        const previousDay = new Date(selectedDate.getTime() - 24 * 60 * 60 * 1000);
        const startOfPreviousDay = new Date(previousDay.getFullYear(), previousDay.getMonth(), previousDay.getDate());
        const endOfPreviousDay = new Date(startOfPreviousDay.getTime() + 24 * 60 * 60 * 1000);
        return {
          start: startOfPreviousDay,
          end: endOfPreviousDay
        };
      }
      const defaultYesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      return {
        start: defaultYesterday,
        end: today
      };
    case 'range':
      if (startDate && endDate) {
        // Criar datas no fuso horário local
        const rangeStart = new Date(startDate + 'T00:00:00');
        const rangeEnd = new Date(endDate + 'T23:59:59.999');
        const rangeDuration = rangeEnd.getTime() - rangeStart.getTime();
        const previousEnd = new Date(rangeStart.getTime() - 24 * 60 * 60 * 1000); // Um dia antes do início
        const previousStart = new Date(previousEnd.getTime() - rangeDuration);
        previousEnd.setHours(23, 59, 59, 999);
        return { start: previousStart, end: previousEnd };
      }
      const defaultYesterday3 = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      return {
        start: defaultYesterday3,
        end: today
      };
    default:
      const defaultYesterday2 = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      return {
        start: defaultYesterday2,
        end: today
      };
  }
};

export const dashboardService = {
  async getSalesChartData(dateFilter: string = 'month', startDate?: string, endDate?: string): Promise<Array<{
    date: string;
    vendas: number;
    pedidos: number;
  }>> {
    try {
      const { start, end } = getDateRange(dateFilter, undefined, startDate, endDate);
      
      const pedidosQuery = query(
        collection(db, 'pedidos'),
        where('dataPedido', '>=', Timestamp.fromDate(start)),
        where('dataPedido', '<=', Timestamp.fromDate(end)),
        orderBy('dataPedido', 'asc')
      );
      
      const querySnapshot = await getDocs(pedidosQuery);
      const salesByDate: { [key: string]: { vendas: number; pedidos: number } } = {};
      
      querySnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const date = timestampToDate(data.dataPedido);
        const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
        
        if (!salesByDate[dateKey]) {
          salesByDate[dateKey] = { vendas: 0, pedidos: 0 };
        }
        
        salesByDate[dateKey].vendas += data.total || 0;
        salesByDate[dateKey].pedidos += 1;
      });
      
      return Object.entries(salesByDate)
        .map(([date, data]) => ({
          date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          vendas: data.vendas,
          pedidos: data.pedidos
        }))
        .sort((a, b) => new Date(a.date.split('/').reverse().join('-')).getTime() - new Date(b.date.split('/').reverse().join('-')).getTime());
    } catch (error) {
      console.error('Erro ao buscar dados do gráfico de vendas:', error);
      return [];
    }
  },

  async getSalesOverTime(startDate?: Date, endDate?: Date): Promise<Array<{
    date: string;
    vendas: number;
    pedidos: number;
  }>> {
    try {
      // Usar datas fornecidas ou padrão (últimos 30 dias)
      const now = endDate || new Date();
      const defaultStart = new Date(now);
      defaultStart.setDate(defaultStart.getDate() - 30);
      const queryStartDate = startDate || defaultStart;
      
      const pedidosQuery = query(
        collection(db, 'pedidos'),
        where('dataPedido', '>=', Timestamp.fromDate(queryStartDate)),
        where('dataPedido', '<=', Timestamp.fromDate(now)),
        orderBy('dataPedido', 'asc')
      );
      
      const querySnapshot = await getDocs(pedidosQuery);
      const salesByDate: { [key: string]: { vendas: number; pedidos: number } } = {};
      
      querySnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const date = timestampToDate(data.dataPedido);
        const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
        
        if (!salesByDate[dateKey]) {
          salesByDate[dateKey] = { vendas: 0, pedidos: 0 };
        }
        
        salesByDate[dateKey].vendas += data.total || 0;
        salesByDate[dateKey].pedidos += 1;
      });
      
      return Object.entries(salesByDate)
        .map(([date, data]) => ({
          date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          vendas: data.vendas,
          pedidos: data.pedidos
        }))
        .sort((a, b) => new Date(a.date.split('/').reverse().join('-')).getTime() - new Date(b.date.split('/').reverse().join('-')).getTime());
    } catch (error) {
      console.error('Erro ao buscar dados de vendas ao longo do tempo:', error);
      return [];
    }
  },

  async getCategoryDistribution(startDate?: Date, endDate?: Date): Promise<Array<{
    name: string;
    value: number;
    produtos: number;
  }>> {
    try {
      const produtosSnapshot = await getDocs(collection(db, 'produtos'));
      const categoryCount: { [key: string]: { produtos: number; vendas: number } } = {};
      
      // Contar produtos por categoria
      produtosSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const categoria = data.categoria || 'Sem Categoria';
        
        if (!categoryCount[categoria]) {
          categoryCount[categoria] = { produtos: 0, vendas: 0 };
        }
        categoryCount[categoria].produtos += 1;
      });
      
      // Buscar vendas por categoria com filtro de data opcional
      const defaultStartDate = new Date();
      defaultStartDate.setDate(defaultStartDate.getDate() - 30);
      
      const queryStartDate = startDate || defaultStartDate;
      const queryEndDate = endDate || new Date();
      
      const pedidosQuery = query(
        collection(db, 'pedidos'),
        where('dataPedido', '>=', Timestamp.fromDate(queryStartDate)),
        where('dataPedido', '<=', Timestamp.fromDate(queryEndDate))
      );
      
      const pedidosSnapshot = await getDocs(pedidosQuery);
      
      // Calcular vendas por categoria
      for (const pedidoDoc of pedidosSnapshot.docs) {
        const pedidoData = pedidoDoc.data();
        const itens = pedidoData.itens || [];
        
        for (const item of itens) {
          if (item.produtoId) {
            const produtoDoc = await getDoc(doc(db, 'produtos', item.produtoId));
            if (produtoDoc.exists()) {
              const produtoData = produtoDoc.data();
              const categoria = produtoData.categoria || 'Sem Categoria';
              
              if (!categoryCount[categoria]) {
                categoryCount[categoria] = { produtos: 0, vendas: 0 };
              }
              categoryCount[categoria].vendas += (item.preco * item.quantidade) || 0;
            }
          }
        }
      }
      
      return Object.entries(categoryCount).map(([name, data]) => ({
        name,
        value: data.vendas,
        produtos: data.produtos
      }));
    } catch (error) {
      console.error('Erro ao buscar distribuição por categoria:', error);
      return [];
    }
  },

  async getMonthlyComparison(startDate?: Date, endDate?: Date): Promise<Array<{
    month: string;
    pedidos: number;
    vendas: number;
    clientes: number;
  }>> {
    try {
      // Usar datas fornecidas ou padrão (últimos 6 meses)
      const now = endDate || new Date();
      const defaultStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      const queryStartDate = startDate || defaultStart;
      
      const monthlyData: { [key: string]: { pedidos: number; vendas: number; clientes: Set<string> } } = {};
      
      // Buscar pedidos no período especificado
      const pedidosQuery = query(
        collection(db, 'pedidos'),
        where('dataPedido', '>=', Timestamp.fromDate(queryStartDate)),
        where('dataPedido', '<=', Timestamp.fromDate(now)),
        orderBy('dataPedido', 'asc')
      );
      
      const pedidosSnapshot = await getDocs(pedidosQuery);
      
      pedidosSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const date = timestampToDate(data.dataPedido);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { pedidos: 0, vendas: 0, clientes: new Set() };
        }
        
        monthlyData[monthKey].pedidos += 1;
        monthlyData[monthKey].vendas += data.total || 0;
        if (data.userId) {
          monthlyData[monthKey].clientes.add(data.userId);
        }
      });
      
      return Object.entries(monthlyData)
        .map(([monthKey, data]) => {
          const [year, month] = monthKey.split('-');
          const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('pt-BR', { month: 'short' });
          
          return {
            month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
            pedidos: data.pedidos,
            vendas: data.vendas,
            clientes: data.clientes.size
          };
        })
        .sort((a, b) => {
          const monthOrder = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
          return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
        });
    } catch (error) {
      console.error('Erro ao buscar comparação mensal:', error);
      return [];
    }
  },

  async getRecentActivities(): Promise<Array<{
    id: string;
    type: 'pedido' | 'cliente' | 'produto';
    title: string;
    description: string;
    timestamp: Date;
    status: 'success' | 'info' | 'warning';
  }>> {
    const activities: Array<{
      id: string;
      type: 'pedido' | 'cliente' | 'produto';
      title: string;
      description: string;
      timestamp: Date;
      status: 'success' | 'info' | 'warning';
    }> = [];

    try {
      // Buscar últimos 5 pedidos
      const pedidosQuery = query(
        collection(db, "pedidos"),
        orderBy("dataPedido", "desc"),
        // limit(5)
      );
      const pedidosSnapshot = await getDocs(pedidosQuery);
      
      pedidosSnapshot.docs.slice(0, 5).forEach((doc) => {
        const pedido = doc.data();
        activities.push({
          id: doc.id,
          type: 'pedido',
          title: 'Novo pedido criado',
          description: `Pedido #${doc.id.slice(-8)} - R$ ${(pedido.total || 0).toFixed(2)}`,
          timestamp: timestampToDate(pedido.dataPedido),
          status: 'success'
        });
      });

      // Buscar últimos 3 clientes
      const clientesQuery = query(
        collection(db, "users"),
        orderBy("dataCadastro", "desc"),
        // limit(3)
      );
      const clientesSnapshot = await getDocs(clientesQuery);
      
      clientesSnapshot.docs.slice(0, 3).forEach((doc) => {
        const cliente = doc.data();
        activities.push({
          id: doc.id,
          type: 'cliente',
          title: 'Novo cliente cadastrado',
          description: `${cliente.nome} se cadastrou no sistema`,
          timestamp: timestampToDate(cliente.dataCadastro),
          status: 'info'
        });
      });

      // Buscar últimos 2 produtos
      const produtosQuery = query(
        collection(db, "produtos"),
        orderBy("dataCriacao", "desc"),
        // limit(2)
      );
      const produtosSnapshot = await getDocs(produtosQuery);
      
      produtosSnapshot.docs.slice(0, 2).forEach((doc) => {
        const produto = doc.data();
        activities.push({
          id: doc.id,
          type: 'produto',
          title: 'Novo produto adicionado',
          description: `${produto.nome} foi adicionado ao catálogo`,
          timestamp: timestampToDate(produto.dataCriacao),
          status: 'info'
        });
      });

      // Ordenar por timestamp (mais recente primeiro) e pegar apenas os 6 mais recentes
      return activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 6);
        
    } catch (error) {
      console.error('Erro ao buscar atividades recentes:', error);
      return [];
    }
  },

  async getDashboardStats(dateFilter: string = 'today', customDate?: string, startDate?: string, endDate?: string): Promise<DashboardStats> {
    const dateRange = getDateRange(dateFilter, customDate, startDate, endDate);
     const previousDateRange = getPreviousDateRange(dateFilter, customDate, startDate, endDate);
    
    // Buscar todos os dados básicos
    const [users, produtos] = await Promise.all([
      getDocs(collection(db, "users")),
      getDocs(collection(db, "produtos")),
    ]);

    // Buscar pedidos filtrados por data atual
    const pedidosQuery = query(
      collection(db, "pedidos"),
      where("dataPedido", ">=", Timestamp.fromDate(dateRange.start)),
      where("dataPedido", "<", Timestamp.fromDate(dateRange.end))
    );
    const pedidos = await getDocs(pedidosQuery);

    // Buscar pedidos do período anterior para comparação
    const pedidosAnteriorQuery = query(
      collection(db, "pedidos"),
      where("dataPedido", ">=", Timestamp.fromDate(previousDateRange.start)),
      where("dataPedido", "<", Timestamp.fromDate(previousDateRange.end))
    );
    const pedidosAnterior = await getDocs(pedidosAnteriorQuery);

    // Buscar clientes novos no período
    const novosClientesQuery = query(
      collection(db, "users"),
      where("dataCadastro", ">=", Timestamp.fromDate(dateRange.start)),
      where("dataCadastro", "<", Timestamp.fromDate(dateRange.end))
    );
    const novosClientes = await getDocs(novosClientesQuery);

    // Buscar produtos novos no período
    const novosProdutosQuery = query(
      collection(db, "produtos"),
      where("dataCriacao", ">=", Timestamp.fromDate(dateRange.start)),
      where("dataCriacao", "<", Timestamp.fromDate(dateRange.end))
    );
    const novosProdutos = await getDocs(novosProdutosQuery);

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

    const vendasAnterior = pedidosAnterior.docs.reduce((total, doc) => {
      const pedido = doc.data();
      if (pedido.status !== "cancelado") {
        return total + (pedido.total || 0);
      }
      return total;
    }, 0);

    // Calcular crescimento
    const crescimentoVendas = vendasAnterior > 0 
      ? Math.round(((totalVendas - vendasAnterior) / vendasAnterior) * 100)
      : totalVendas > 0 ? 100 : 0;
    
    const crescimentoPedidos = pedidosAnterior.size > 0 
      ? Math.round(((pedidos.size - pedidosAnterior.size) / pedidosAnterior.size) * 100)
      : pedidos.size > 0 ? 100 : 0;

    return {
      totalClientes: users.size,
      totalProdutos: produtos.size,
      totalPedidos: pedidos.size,
      totalVendas,
      pedidosPendentes: pedidosPendentes.size,
      produtosSemEstoque: produtosSemEstoque.size,
      novosClientes: novosClientes.size,
      novosProdutos: novosProdutos.size,
      crescimentoVendas,
      crescimentoPedidos,
    };
  },

  // Manter método antigo para compatibilidade
  async getStats(): Promise<DashboardStats> {
    return this.getDashboardStats('today');
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
