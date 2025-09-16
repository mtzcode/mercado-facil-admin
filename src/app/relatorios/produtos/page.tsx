'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, TrendingUp, AlertTriangle, Star, BarChart3, Eye } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Produto {
  id: string;
  nome: string;
  preco: number;
  categoria: string;
  estoque: number;
  vendidos: number;
  visualizacoes: number;
  avaliacaoMedia: number;
  totalAvaliacoes: number;
  ativo: boolean;
  dataCriacao: Date;
}

interface MetricasProdutos {
  totalProdutos: number;
  produtosAtivos: number;
  produtosSemEstoque: number;
  valorTotalEstoque: number;
  produtosMaisVendidos: Produto[];
  produtosMaisVisualizados: Produto[];
  produtosBaixoEstoque: Produto[];
  categoriasMaisVendidas: Array<{
    categoria: string;
    vendas: number;
    faturamento: number;
  }>;
}

export default function RelatoriosProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [metricas, setMetricas] = useState<MetricasProdutos>({
    totalProdutos: 0,
    produtosAtivos: 0,
    produtosSemEstoque: 0,
    valorTotalEstoque: 0,
    produtosMaisVendidos: [],
    produtosMaisVisualizados: [],
    produtosBaixoEstoque: [],
    categoriasMaisVendidas: []
  });
  const [loading, setLoading] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [categorias, setCategorias] = useState<string[]>([]);

  const carregarDadosProdutos = useCallback(async () => {
    try {
      setLoading(true);
      
      // Buscar produtos
      let produtosQuery = query(
        collection(db, 'produtos'),
        orderBy('nome')
      );
      
      if (filtroCategoria !== 'todas') {
        produtosQuery = query(
          collection(db, 'produtos'),
          where('categoria', '==', filtroCategoria),
          orderBy('nome')
        );
      }
      
      const produtosSnapshot = await getDocs(produtosQuery);
      const produtosData: Produto[] = [];
      const categoriasSet = new Set<string>();
      
      produtosSnapshot.forEach((doc) => {
        const data = doc.data();
        const produto: Produto = {
          id: doc.id,
          nome: data.nome || 'Produto sem nome',
          preco: data.preco || 0,
          categoria: data.categoria || 'Sem categoria',
          estoque: data.estoque || 0,
          vendidos: data.vendidos || 0,
          visualizacoes: data.visualizacoes || 0,
          avaliacaoMedia: data.avaliacaoMedia || 0,
          totalAvaliacoes: data.totalAvaliacoes || 0,
          ativo: data.ativo !== false,
          dataCriacao: data.dataCriacao?.toDate() || new Date()
        };
        
        produtosData.push(produto);
        categoriasSet.add(produto.categoria);
      });
      
      setProdutos(produtosData);
      setCategorias(Array.from(categoriasSet).sort());
      calcularMetricas(produtosData);
      
    } catch (error) {
      console.error('Erro ao carregar dados de produtos:', error);
    } finally {
      setLoading(false);
    }
  }, [filtroCategoria]);

  const calcularMetricas = (produtosData: Produto[]) => {
    const totalProdutos = produtosData.length;
    const produtosAtivos = produtosData.filter(p => p.ativo).length;
    const produtosSemEstoque = produtosData.filter(p => p.estoque === 0).length;
    const valorTotalEstoque = produtosData.reduce((acc, produto) => acc + (produto.preco * produto.estoque), 0);
    
    // Produtos mais vendidos
    const produtosMaisVendidos = [...produtosData]
      .sort((a, b) => b.vendidos - a.vendidos)
      .slice(0, 5);
    
    // Produtos mais visualizados
    const produtosMaisVisualizados = [...produtosData]
      .sort((a, b) => b.visualizacoes - a.visualizacoes)
      .slice(0, 5);
    
    // Produtos com baixo estoque (menos de 10 unidades)
    const produtosBaixoEstoque = produtosData
      .filter(p => p.estoque > 0 && p.estoque < 10)
      .sort((a, b) => a.estoque - b.estoque)
      .slice(0, 10);
    
    // Categorias mais vendidas
    const categoriasMap = new Map<string, { vendas: number; faturamento: number }>();
    
    produtosData.forEach(produto => {
      if (categoriasMap.has(produto.categoria)) {
        const categoria = categoriasMap.get(produto.categoria)!;
        categoria.vendas += produto.vendidos;
        categoria.faturamento += produto.vendidos * produto.preco;
      } else {
        categoriasMap.set(produto.categoria, {
          vendas: produto.vendidos,
          faturamento: produto.vendidos * produto.preco
        });
      }
    });
    
    const categoriasMaisVendidas = Array.from(categoriasMap.entries())
      .map(([categoria, dados]) => ({ categoria, ...dados }))
      .sort((a, b) => b.vendas - a.vendas)
      .slice(0, 5);
    
    setMetricas({
      totalProdutos,
      produtosAtivos,
      produtosSemEstoque,
      valorTotalEstoque,
      produtosMaisVendidos,
      produtosMaisVisualizados,
      produtosBaixoEstoque,
      categoriasMaisVendidas
    });
  };

  useEffect(() => {
    carregarDadosProdutos();
  }, [carregarDadosProdutos]);

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const renderizarEstrelas = (avaliacao: number) => {
    const estrelas = [];
    for (let i = 1; i <= 5; i++) {
      estrelas.push(
        <Star
          key={i}
          className={`w-4 h-4 ${
            i <= avaliacao ? 'text-yellow-400 fill-current' : 'text-gray-300'
          }`}
        />
      );
    }
    return estrelas;
  };

  return (
    <AdminLayout title="Relatórios de Produtos" currentPath="/relatorios/produtos">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Relatórios de Produtos</h1>
            <p className="text-gray-600">Análise detalhada do catálogo e performance dos produtos</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="todas">Todas as categorias</option>
              {categorias.map(categoria => (
                <option key={categoria} value={categoria}>{categoria}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Cards de Métricas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metricas.totalProdutos}</div>
                  <p className="text-xs text-muted-foreground">
                    {metricas.produtosAtivos} ativos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Valor do Estoque</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatarMoeda(metricas.valorTotalEstoque)}</div>
                  <p className="text-xs text-muted-foreground">
                    Valor total em estoque
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sem Estoque</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{metricas.produtosSemEstoque}</div>
                  <p className="text-xs text-muted-foreground">
                    Produtos esgotados
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Baixo Estoque</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{metricas.produtosBaixoEstoque.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Menos de 10 unidades
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Produtos Mais Vendidos */}
              <Card>
                <CardHeader>
                  <CardTitle>Produtos Mais Vendidos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metricas.produtosMaisVendidos.map((produto, index) => (
                      <div key={produto.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-green-600">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium">{produto.nome}</p>
                            <p className="text-sm text-gray-500">{produto.categoria}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{produto.vendidos} vendidos</p>
                          <p className="text-sm text-gray-500">{formatarMoeda(produto.preco)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Produtos Mais Visualizados */}
              <Card>
                <CardHeader>
                  <CardTitle>Produtos Mais Visualizados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metricas.produtosMaisVisualizados.map((produto, index) => (
                      <div key={produto.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium">{produto.nome}</p>
                            <div className="flex items-center space-x-1">
                              {renderizarEstrelas(produto.avaliacaoMedia)}
                              <span className="text-sm text-gray-500">({produto.totalAvaliacoes})</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-1">
                            <Eye className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{produto.visualizacoes}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Categorias Mais Vendidas */}
              <Card>
                <CardHeader>
                  <CardTitle>Categorias Mais Vendidas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metricas.categoriasMaisVendidas.map((categoria) => (
                      <div key={categoria.categoria} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <BarChart3 className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium">{categoria.categoria}</p>
                            <p className="text-sm text-gray-500">{categoria.vendas} vendas</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatarMoeda(categoria.faturamento)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Produtos com Baixo Estoque */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <span>Produtos com Baixo Estoque</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metricas.produtosBaixoEstoque.slice(0, 5).map((produto) => (
                      <div key={produto.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          </div>
                          <div>
                            <p className="font-medium">{produto.nome}</p>
                            <p className="text-sm text-gray-500">{produto.categoria}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-yellow-600">{produto.estoque} unidades</p>
                          <p className="text-sm text-gray-500">{formatarMoeda(produto.preco)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lista de Todos os Produtos */}
            <Card>
              <CardHeader>
                <CardTitle>Todos os Produtos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Produto</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Categoria</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Preço</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Estoque</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Vendidos</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Avaliação</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {produtos.slice(0, 20).map((produto) => (
                        <tr key={produto.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium">{produto.nome}</p>
                              <div className="flex items-center space-x-1 mt-1">
                                <Eye className="h-3 w-3 text-gray-400" />
                                <span className="text-xs text-gray-500">{produto.visualizacoes} visualizações</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm">{produto.categoria}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium">{formatarMoeda(produto.preco)}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`font-medium ${
                              produto.estoque === 0 
                                ? 'text-red-600'
                                : produto.estoque < 10
                                ? 'text-yellow-600'
                                : 'text-green-600'
                            }`}>
                              {produto.estoque}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium">{produto.vendidos}</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-1">
                              {renderizarEstrelas(produto.avaliacaoMedia)}
                              <span className="text-xs text-gray-500">({produto.totalAvaliacoes})</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              produto.ativo
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {produto.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}