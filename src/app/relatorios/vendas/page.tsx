'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, DollarSign, ShoppingCart, Calendar, Package } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface VendaDetalhada {
  id: string;
  numero: string;
  cliente: {
    nome: string;
    email: string;
  };
  total: number;
  status: string;
  dataVenda: Date;
  itens: Array<{
    produtoId: string;
    nome: string;
    quantidade: number;
    preco: number;
  }>;
}

interface MetricasVendas {
  totalVendas: number;
  faturamentoTotal: number;
  ticketMedio: number;
  produtosMaisVendidos: Array<{
    nome: string;
    quantidade: number;
    faturamento: number;
  }>;
  vendasPorPeriodo: Array<{
    periodo: string;
    vendas: number;
    faturamento: number;
  }>;
}

export default function RelatoriosVendasPage() {
  const [vendas, setVendas] = useState<VendaDetalhada[]>([]);
  const [metricas, setMetricas] = useState<MetricasVendas>({
    totalVendas: 0,
    faturamentoTotal: 0,
    ticketMedio: 0,
    produtosMaisVendidos: [],
    vendasPorPeriodo: []
  });
  const [loading, setLoading] = useState(true);
  const [filtroData, setFiltroData] = useState('30'); // últimos 30 dias

  const carregarDadosVendas = useCallback(async () => {
    try {
      setLoading(true);
      
      // Calcular data de início baseada no filtro
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - parseInt(filtroData));
      
      // Buscar vendas do período
      const vendasQuery = query(
        collection(db, 'vendas'),
        where('dataVenda', '>=', dataInicio),
        orderBy('dataVenda', 'desc'),
        limit(100)
      );
      
      const vendasSnapshot = await getDocs(vendasQuery);
      const vendasData: VendaDetalhada[] = [];
      
      vendasSnapshot.forEach((doc) => {
        const data = doc.data();
        vendasData.push({
          id: doc.id,
          numero: data.numero || `VD-${doc.id.slice(-6)}`,
          cliente: data.cliente || { nome: 'Cliente não informado', email: '' },
          total: data.total || 0,
          status: data.status || 'concluida',
          dataVenda: data.dataVenda?.toDate() || new Date(),
          itens: data.itens || []
        });
      });
      
      setVendas(vendasData);
      calcularMetricas(vendasData);
      
    } catch (error) {
      console.error('Erro ao carregar dados de vendas:', error);
    } finally {
      setLoading(false);
    }
  }, [filtroData]);

  const calcularMetricas = (vendasData: VendaDetalhada[]) => {
    const totalVendas = vendasData.length;
    const faturamentoTotal = vendasData.reduce((acc, venda) => acc + venda.total, 0);
    const ticketMedio = totalVendas > 0 ? faturamentoTotal / totalVendas : 0;
    
    // Produtos mais vendidos
    const produtosMap = new Map<string, { nome: string; quantidade: number; faturamento: number }>();
    
    vendasData.forEach(venda => {
      venda.itens.forEach(item => {
        const key = item.produtoId;
        if (produtosMap.has(key)) {
          const produto = produtosMap.get(key)!;
          produto.quantidade += item.quantidade;
          produto.faturamento += item.preco * item.quantidade;
        } else {
          produtosMap.set(key, {
            nome: item.nome,
            quantidade: item.quantidade,
            faturamento: item.preco * item.quantidade
          });
        }
      });
    });
    
    const produtosMaisVendidos = Array.from(produtosMap.values())
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5);
    
    // Vendas por período (últimos 7 dias)
    const vendasPorPeriodo = [];
    for (let i = 6; i >= 0; i--) {
      const data = new Date();
      data.setDate(data.getDate() - i);
      const dataStr = data.toLocaleDateString('pt-BR');
      
      const vendasDoDia = vendasData.filter(venda => {
        const dataVenda = new Date(venda.dataVenda);
        return dataVenda.toDateString() === data.toDateString();
      });
      
      vendasPorPeriodo.push({
        periodo: dataStr,
        vendas: vendasDoDia.length,
        faturamento: vendasDoDia.reduce((acc, venda) => acc + venda.total, 0)
      });
    }
    
    setMetricas({
      totalVendas,
      faturamentoTotal,
      ticketMedio,
      produtosMaisVendidos,
      vendasPorPeriodo
    });
  };

  useEffect(() => {
    carregarDadosVendas();
  }, [carregarDadosVendas]);

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarData = (data: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(data);
  };

  return (
    <AdminLayout title="Relatórios de Vendas" currentPath="/relatorios/vendas">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Relatórios de Vendas</h1>
            <p className="text-gray-600">Análise detalhada das vendas e performance</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={filtroData}
              onChange={(e) => setFiltroData(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="90">Últimos 90 dias</option>
              <option value="365">Último ano</option>
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
                  <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metricas.totalVendas}</div>
                  <p className="text-xs text-muted-foreground">
                    Últimos {filtroData} dias
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatarMoeda(metricas.faturamentoTotal)}</div>
                  <p className="text-xs text-muted-foreground">
                    Últimos {filtroData} dias
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatarMoeda(metricas.ticketMedio)}</div>
                  <p className="text-xs text-muted-foreground">
                    Por venda
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Produtos Vendidos</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metricas.produtosMaisVendidos.reduce((acc, produto) => acc + produto.quantidade, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Unidades vendidas
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
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium">{produto.nome}</p>
                            <p className="text-sm text-gray-500">{produto.quantidade} unidades</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatarMoeda(produto.faturamento)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Vendas por Período */}
              <Card>
                <CardHeader>
                  <CardTitle>Vendas dos Últimos 7 Dias</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metricas.vendasPorPeriodo.map((periodo, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="font-medium">{periodo.periodo}</p>
                            <p className="text-sm text-gray-500">{periodo.vendas} vendas</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatarMoeda(periodo.faturamento)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lista de Vendas Recentes */}
            <Card>
              <CardHeader>
                <CardTitle>Vendas Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Número</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Cliente</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Data</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Total</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendas.slice(0, 10).map((venda) => (
                        <tr key={venda.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <span className="font-medium">{venda.numero}</span>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium">{venda.cliente.nome}</p>
                              <p className="text-sm text-gray-500">{venda.cliente.email}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm">{formatarData(venda.dataVenda)}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium">{formatarMoeda(venda.total)}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              venda.status === 'concluida' 
                                ? 'bg-green-100 text-green-800'
                                : venda.status === 'pendente'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {venda.status}
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