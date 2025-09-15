// Tipos padronizados - usando tipos compartilhados
// Importar tipos compartilhados (copie o conteúdo de shared/types.ts aqui)

// ===== USUÁRIOS/CLIENTES =====
export interface User {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  dataCadastro: Date;
  cadastroCompleto: boolean;
  ativo: boolean;
  ultimoLogin?: Date;
  enderecos?: Endereco[];
  // Campos de compatibilidade
  whatsapp?: string; // Alias para telefone
}

// Alias para compatibilidade
export type Cliente = User;
export type Usuario = User;

// ===== PRODUTOS =====
export interface Produto {
  id: string;
  nome: string;
  descricao?: string;
  codigoBarras?: string;
  preco: number;
  custo?: number;
  imagemUrl?: string;
  imagens?: string[];
  categoria: string;
  destaque?: boolean;
  disponivel: boolean;
  ativo: boolean;
  estoque: number;
  tipoUnidade?: string;
  unidadeMedida?: string;
  avaliacoes?: number[];
  tags?: string[];
  // Campos de promoção
  promocaoAtiva?: boolean;
  promocaoDataInicio?: Date;
  promocaoDataFinal?: Date;
  precoPromocional?: number;
  // Campos de compatibilidade
  promo_price?: number;
  promo_price_per_100g?: number;
  promo_status?: string;
  unit_type?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Alias para compatibilidade
export type Product = Produto;

// ===== CATEGORIAS =====
export interface Categoria {
  id: string;
  nome: string;
  descricao?: string;
  icone?: string;
  cor?: string;
  ordem?: number;
  ativa?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Alias para compatibilidade
export type Category = Categoria;

// ===== ENDEREÇOS =====
export interface Endereco {
  id: string;
  userId: string; // Padronizado - sempre userId
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  principal: boolean;
  // Campos de compatibilidade
  clienteId?: string; // Deprecated - usar userId
  usuarioId?: string; // Deprecated - usar userId
}

// ===== CARRINHO =====
export interface CarrinhoItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  barcode?: string;
  category?: string;
  // Campos de compatibilidade
  produto?: Produto;
  quantidade?: number;
  subtotal?: number;
}

// Alias para compatibilidade
export type CartItem = CarrinhoItem;

// ===== PEDIDOS =====
export interface Pedido {
  id: string;
  userId: string; // Padronizado - sempre userId
  itens: CarrinhoItem[];
  total: number;
  status:
    | "pendente"
    | "confirmado"
    | "preparando"
    | "saiu_entrega"
    | "entregue"
    | "cancelado";
  endereco: Endereco;
  dataPedido: Date;
  dataEntrega?: Date;
  observacoes?: string;
  metodoPagamento: string;
  // Campos de compatibilidade
  clienteId?: string; // Deprecated - usar userId
  usuarioId?: string; // Deprecated - usar userId
}

// Alias para compatibilidade
export type Order = Pedido;

// ===== NOTIFICAÇÕES =====
export interface Notificacao {
  id: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  timestamp: Date;
  read: boolean;
  userId?: string;
  type: "promocao" | "pedido" | "sistema" | "oferta";
}

// Alias para compatibilidade
export type NotificationModel = Notificacao;

export interface NotificationSettings {
  promocoes: boolean;
  pedidos: boolean;
  ofertas: boolean;
  novidades: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

// Tipos para o painel administrativo
export interface DashboardStats {
  totalClientes: number;
  totalProdutos: number;
  totalPedidos: number;
  totalVendas: number;
  pedidosPendentes: number;
  produtosSemEstoque: number;
  // Campos de tendência
  novosClientes: number;
  novosProdutos: number;
  crescimentoVendas: number;
  crescimentoPedidos: number;
}

export interface VendaPorPeriodo {
  periodo: string;
  vendas: number;
  pedidos: number;
}

export interface ProdutoMaisVendido {
  produto: Produto;
  quantidadeVendida: number;
  receita: number;
}

// Tipos específicos para formulários
export interface ProdutoForm {
  nome: string;
  descricao: string;
  codigoBarras: string;
  preco: number;
  custo: number;
  imagemUrl: string;
  imagens: string[];
  categoria: string;
  destaque: boolean;
  disponivel: boolean;
  ativo: boolean;
  estoque: number;
  tipoUnidade: string;
  tags: string[];
  // Campos de promoção
  promocaoAtiva: boolean;
  promocaoDataInicio?: string;
  promocaoDataFinal?: string;
  precoPromocional?: number;
}

export interface CategoriaForm {
  nome: string;
  descricao: string;
  ativa: boolean;
  ordem: number;
}

export interface NotificacaoForm {
  title: string;
  body: string;
  type: "promocao" | "pedido" | "sistema" | "oferta";
  targetUsers?: string[];
  sendToAll: boolean;
  data?: Record<string, unknown>;
}
