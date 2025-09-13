// Tipos baseados nos modelos do app mobile Flutter

export interface Cliente {
  id: string;
  nome: string;
  email: string;
  whatsapp: string;
  dataCadastro: Date;
  cadastroCompleto: boolean;
  ativo: boolean;
  ultimoLogin?: Date;
  enderecos?: Endereco[];
}

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
  createdAt?: Date;
  updatedAt?: Date;
}

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

export interface Endereco {
  id: string;
  clienteId: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  principal: boolean;
}

export interface CarrinhoItem {
  produto: Produto;
  quantidade: number;
  subtotal: number;
}

export interface Pedido {
  id: string;
  clienteId: string;
  itens: CarrinhoItem[];
  total: number;
  status: 'pendente' | 'confirmado' | 'preparando' | 'saiu_entrega' | 'entregue' | 'cancelado';
  endereco: Endereco;
  dataPedido: Date;
  dataEntrega?: Date;
  observacoes?: string;
  metodoPagamento: string;
}

export interface NotificationModel {
  id: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  timestamp: Date;
  read: boolean;
  userId?: string;
  type: 'promocao' | 'pedido' | 'sistema' | 'oferta';
}

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
  type: 'promocao' | 'pedido' | 'sistema' | 'oferta';
  targetUsers?: string[];
  sendToAll: boolean;
  data?: Record<string, unknown>;
}