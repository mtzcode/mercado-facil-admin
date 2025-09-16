'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { 
  TrendingUp, 
  Users, 
  Package, 
  DollarSign,
  AlertTriangle,
  BarChart3,
  RefreshCw,
  UserX
} from 'lucide-react';
import { dashboardService } from '@/services/firestore';

// Tipos de dados
interface MetricaAvancada {
  titulo: string;
  valor: string;
  tendencia: {
    valor: number;
    positiva: boolean;
  };
  icone: React.ReactNode;
  descricao?: string;
}

interface ProdutoBaixoEstoque {
  id: string;
  nome: string;
  estoque: number;
  estoqueMinimo: number;
  categoria: string;
  status: 'critico' | 'baixo' | 'alerta';
}

interface ClienteInativo {
  id: string;
  nome: string;
  email: string;
  ultimaCompra: Date;
  diasInativo: number;
  totalCompras: number;
  valorTotalGasto: number;
}

interface ReceitaCategoria {
  categoria: string;
  receita: number;
  percentual: number;
  pedidos: number;
  produtosVendidos: number;
}





export default function RelatoriosPage() {
  const [loading, setLoading] = useState(true);
  const [metricas, setMetricas] = useState<MetricaAvancada[]>([]);
  const [produtosBaixoEstoque, setProdutosBaixoEstoque] = useState<ProdutoBaixoEstoque[]>([]);
  const [clientesInativos, setClientesInativos] = useState<ClienteInativo[]>([]);
  const [receitaPorCategoria, setReceitaPorCategoria] = useState<ReceitaCategoria[]>([]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      // Carregar todas as métricas em paralelo
      const [ticketMedioData, taxaConversaoData, produtosBaixo, clientesInativosData, receitaCategorias] = await Promise.all([
        dashboardService.getTicketMedio(),
        dashboardService.getTaxaConversao(),
        dashboardService.getProdutosBaixoEstoque(20),
        dashboardService.getClientesInativos(30),
        dashboardService.getReceitaPorCategoria()
      ]);

// Removed setTicketMedio since it's not defined in state
      setProdutosBaixoEstoque(produtosBaixo);
      setClientesInativos(clientesInativosData);
      setReceitaPorCategoria(receitaCategorias);

      // Montar métricas para exibição
      const metricasData: MetricaAvancada[] = [
        {
          titulo: 'Ticket Médio de Vendas',
          valor: `R$ ${ticketMedioData.valor.toFixed(2)}`,
          tendencia: ticketMedioData.tendencia,
          icone: <DollarSign className="h-4 w-4" />,
          descricao: 'Valor médio por pedido'
        },
        {
          titulo: 'Taxa de Conversão',
          valor: `${taxaConversaoData.taxa.toFixed(1)}%`,
          tendencia: taxaConversaoData.tendencia,
          icone: <TrendingUp className="h-4 w-4" />,
          descricao: `${taxaConversaoData.compradores} de ${taxaConversaoData.visitantes} visitantes`
        },
        {
          titulo: 'Produtos em Baixo Estoque',
          valor: produtosBaixo.length.toString(),
          tendencia: { valor: 0, positiva: true },
          icone: <AlertTriangle className="h-4 w-4" />,
          descricao: 'Produtos com estoque crítico'
        },
        {
          titulo: 'Clientes Inativos',
          valor: clientesInativosData.length.toString(),
          tendencia: { valor: 0, positiva: false },
          icone: <UserX className="h-4 w-4" />,
          descricao: 'Sem compras há 30+ dias'
        }
      ];

      setMetricas(metricasData);
    } catch (error) {
      console.error('Erro ao carregar dados dos relatórios:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);



  return (
    <AdminLayout title="Relatórios" currentPath="/relatorios">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Relatórios Avançados</h1>
            <p className="text-gray-600 mt-1">Métricas detalhadas e análises de performance</p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center gap-3">
            <button
              onClick={carregarDados}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Métricas Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {metricas.map((metrica, index) => {
                const colors = ['bg-green-500', 'bg-blue-500', 'bg-red-500', 'bg-orange-500'];
                return (
                  <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{metrica.titulo}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{metrica.valor}</p>
                        {metrica.descricao && (
                          <p className="text-sm text-gray-500 mt-1">{metrica.descricao}</p>
                        )}
                        <div className={`flex items-center mt-2 text-sm ${
                          metrica.tendencia.positiva ? 'text-green-600' : 'text-red-600'
                        }`}>
                          <TrendingUp className={`w-4 h-4 mr-1 ${
                            metrica.tendencia.positiva ? '' : 'rotate-180'
                          }`} />
                          {Math.abs(metrica.tendencia.valor)}% vs período anterior
                        </div>
                      </div>
                      <div className={`p-3 rounded-lg ${colors[index] || 'bg-gray-500'}`}>
                        {metrica.icone}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Seções Detalhadas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Produtos em Baixo Estoque */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Produtos em Baixo Estoque</h3>
                  </div>
                </div>
                <div className="p-6">
                  {produtosBaixoEstoque.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Nenhum produto com estoque baixo</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {produtosBaixoEstoque.map((produto) => (
                        <div key={produto.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{produto.nome}</p>
                            <p className="text-sm text-gray-500">Categoria: {produto.categoria}</p>
                            <p className="text-sm text-gray-500">
                              Estoque mínimo: {produto.estoqueMinimo}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900 mb-2">
                              {produto.estoque} unidades
                            </p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              produto.status === 'critico' ? 'bg-red-100 text-red-800' :
                              produto.status === 'baixo' ? 'bg-yellow-100 text-yellow-800' : 'bg-orange-100 text-orange-800'
                            }`}>
                              {produto.status === 'critico' ? 'Crítico' :
                               produto.status === 'baixo' ? 'Baixo' : 'Alerta'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Clientes Inativos */}
               <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                 <div className="p-6 border-b border-gray-200">
                   <div className="flex items-center gap-2">
                     <Users className="h-5 w-5 text-gray-600" />
                     <h3 className="text-lg font-semibold text-gray-900">Clientes Inativos</h3>
                   </div>
                 </div>
                 <div className="p-6">
                   {clientesInativos.length === 0 ? (
                     <div className="text-center py-8 text-gray-500">
                       <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                       <p>Nenhum cliente inativo encontrado</p>
                     </div>
                   ) : (
                     <div className="space-y-3">
                       {clientesInativos.slice(0, 10).map((cliente) => (
                         <div key={cliente.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                           <div className="flex-1">
                             <p className="font-medium text-gray-900">{cliente.nome}</p>
                             <p className="text-sm text-gray-500">{cliente.email}</p>
                             <p className="text-sm text-gray-500">
                               {cliente.totalCompras} compras • R$ {cliente.valorTotalGasto.toFixed(2)} total
                             </p>
                           </div>
                           <div className="text-right">
                             <p className="text-sm text-gray-600">Inativo há:</p>
                             <p className="text-lg font-bold text-orange-600">{cliente.diasInativo} dias</p>
                             <p className="text-xs text-gray-500">
                               Última: {cliente.ultimaCompra.toLocaleDateString('pt-BR')}
                             </p>
                           </div>
                         </div>
                       ))}
                       {clientesInativos.length > 10 && (
                         <div className="text-center pt-4">
                           <p className="text-sm text-gray-500">
                             E mais {clientesInativos.length - 10} clientes inativos...
                           </p>
                         </div>
                       )}
                     </div>
                   )}
                 </div>
               </div>
            </div>

            {/* Receita por Categoria */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Receita por Categoria</h3>
                </div>
              </div>
              <div className="p-6">
                {receitaPorCategoria.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhuma receita encontrada</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {receitaPorCategoria.map((categoria, index) => {
                      const colors = [
                        'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
                        'bg-orange-500', 'bg-red-500', 'bg-indigo-500'
                      ];
                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded ${colors[index % colors.length]}`}></div>
                              <span className="font-medium text-gray-900">{categoria.categoria}</span>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-900">
                                R$ {categoria.receita.toFixed(2)}
                              </p>
                              <p className="text-sm text-gray-500">
                                {categoria.percentual.toFixed(1)}% do total
                              </p>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className={`h-3 rounded-full ${colors[index % colors.length]}`}
                              style={{ width: `${categoria.percentual}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>{categoria.pedidos} pedidos</span>
                            <span>{categoria.produtosVendidos} produtos vendidos</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}