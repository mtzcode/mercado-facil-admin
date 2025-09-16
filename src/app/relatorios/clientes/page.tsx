'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserPlus, ShoppingBag, Calendar, MapPin, Phone, Mail, TrendingUp } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  endereco: {
    cidade: string;
    estado: string;
    cep: string;
  };
  totalCompras: number;
  valorTotalGasto: number;
  ultimaCompra: Date;
  dataCadastro: Date;
  ativo: boolean;
  frequenciaCompras: number; // compras por mês
}

interface MetricasClientes {
  totalClientes: number;
  clientesAtivos: number;
  novosClientesMes: number;
  ticketMedioCliente: number;
  clientesVIP: Cliente[];
  clientesInativos: Cliente[];
  cidadesMaisClientes: Array<{
    cidade: string;
    quantidade: number;
    faturamento: number;
  }>;
  frequenciaCompras: Array<{
    periodo: string;
    novosClientes: number;
    clientesRecorrentes: number;
  }>;
}

export default function RelatoriosClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [metricas, setMetricas] = useState<MetricasClientes>({
    totalClientes: 0,
    clientesAtivos: 0,
    novosClientesMes: 0,
    ticketMedioCliente: 0,
    clientesVIP: [],
    clientesInativos: [],
    cidadesMaisClientes: [],
    frequenciaCompras: []
  });
  const [loading, setLoading] = useState(true);
  const [filtroPeriodo, setFiltroPeriodo] = useState('30'); // últimos 30 dias
  const [filtroStatus, setFiltroStatus] = useState('todos');

  const calcularMetricas = useCallback((clientesData: Cliente[]) => {
    const totalClientes = clientesData.length;
    const clientesAtivos = clientesData.filter(c => c.ativo).length;
    
    // Novos clientes no mês
    const inicioMes = new Date();
    inicioMes.setDate(inicioMes.getDate() - parseInt(filtroPeriodo));
    const novosClientesMes = clientesData.filter(c => c.dataCadastro >= inicioMes).length;
    
    // Ticket médio por cliente
    const valorTotalTodosClientes = clientesData.reduce((acc, cliente) => acc + cliente.valorTotalGasto, 0);
    const ticketMedioCliente = totalClientes > 0 ? valorTotalTodosClientes / totalClientes : 0;
    
    // Clientes VIP (top 10 por valor gasto)
    const clientesVIP = [...clientesData]
      .sort((a, b) => b.valorTotalGasto - a.valorTotalGasto)
      .slice(0, 10);
    
    // Clientes inativos (sem compra há mais de 90 dias)
    const dataLimiteInativo = new Date();
    dataLimiteInativo.setDate(dataLimiteInativo.getDate() - 90);
    const clientesInativos = clientesData
      .filter(c => c.ultimaCompra < dataLimiteInativo)
      .sort((a, b) => a.ultimaCompra.getTime() - b.ultimaCompra.getTime())
      .slice(0, 10);
    
    // Cidades com mais clientes
    const cidadesMap = new Map<string, { quantidade: number; faturamento: number }>();
    
    clientesData.forEach(cliente => {
      const cidade = cliente.endereco.cidade || 'Não informado';
      if (cidadesMap.has(cidade)) {
        const cidadeData = cidadesMap.get(cidade)!;
        cidadeData.quantidade += 1;
        cidadeData.faturamento += cliente.valorTotalGasto;
      } else {
        cidadesMap.set(cidade, {
          quantidade: 1,
          faturamento: cliente.valorTotalGasto
        });
      }
    });
    
    const cidadesMaisClientes = Array.from(cidadesMap.entries())
      .map(([cidade, dados]) => ({ cidade, ...dados }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5);
    
    // Frequência de compras (últimos 7 dias)
    const frequenciaCompras = [];
    for (let i = 6; i >= 0; i--) {
      const data = new Date();
      data.setDate(data.getDate() - i);
      const dataStr = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      
      const novosClientesDia = clientesData.filter(cliente => {
        const dataCadastro = new Date(cliente.dataCadastro);
        return dataCadastro.toDateString() === data.toDateString();
      }).length;
      
      const clientesRecorrentesDia = clientesData.filter(cliente => {
        const ultimaCompra = new Date(cliente.ultimaCompra);
        return ultimaCompra.toDateString() === data.toDateString() && cliente.totalCompras > 1;
      }).length;
      
      frequenciaCompras.push({
        periodo: dataStr,
        novosClientes: novosClientesDia,
        clientesRecorrentes: clientesRecorrentesDia
      });
    }
    
    setMetricas({
      totalClientes,
      clientesAtivos,
      novosClientesMes,
      ticketMedioCliente,
      clientesVIP,
      clientesInativos,
      cidadesMaisClientes,
      frequenciaCompras
    });
  }, [filtroPeriodo]);

  const carregarDadosClientes = useCallback(async () => {
    try {
      setLoading(true);
      
      // Buscar clientes da coleção 'users'
      let clientesQuery = query(
        collection(db, 'users'),
        orderBy('dataCadastro', 'desc')
      );
      
      if (filtroStatus === 'ativos') {
        clientesQuery = query(
          collection(db, 'users'),
          where('ativo', '==', true),
          orderBy('dataCadastro', 'desc')
        );
      } else if (filtroStatus === 'inativos') {
        clientesQuery = query(
          collection(db, 'users'),
          where('ativo', '==', false),
          orderBy('dataCadastro', 'desc')
        );
      }
      
      const clientesSnapshot = await getDocs(clientesQuery);
      const clientesData: Cliente[] = [];
      
      clientesSnapshot.forEach((doc) => {
        const data = doc.data();
        const cliente: Cliente = {
          id: doc.id,
          nome: data.nome || 'Cliente sem nome',
          email: data.email || '',
          telefone: data.whatsapp || data.telefone || '',
          endereco: {
            cidade: data.endereco?.cidade || '',
            estado: data.endereco?.estado || '',
            cep: data.endereco?.cep || ''
          },
          totalCompras: data.totalCompras || 0,
          valorTotalGasto: data.valorTotalGasto || 0,
          ultimaCompra: data.ultimaCompra?.toDate() || new Date(),
          dataCadastro: data.dataCadastro?.toDate() || new Date(),
          ativo: data.ativo !== false,
          frequenciaCompras: data.frequenciaCompras || 0
        };
        
        clientesData.push(cliente);
      });
      
      setClientes(clientesData);
      calcularMetricas(clientesData);
      
    } catch (error) {
      console.error('Erro ao carregar dados de clientes:', error);
    } finally {
      setLoading(false);
    }
  }, [filtroStatus, calcularMetricas]);

  useEffect(() => {
    carregarDadosClientes();
  }, [carregarDadosClientes, filtroPeriodo]);

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
      year: 'numeric'
    }).format(data);
  };

  const calcularDiasUltimaCompra = (ultimaCompra: Date) => {
    const hoje = new Date();
    const diffTime = Math.abs(hoje.getTime() - ultimaCompra.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <AdminLayout title="Relatórios de Clientes" currentPath="/relatorios/clientes">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Relatórios de Clientes</h1>
            <p className="text-gray-600">Análise detalhada da base de clientes e comportamento</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={filtroPeriodo}
              onChange={(e) => setFiltroPeriodo(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="90">Últimos 90 dias</option>
              <option value="365">Último ano</option>
            </select>
            
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="todos">Todos os clientes</option>
              <option value="ativos">Clientes ativos</option>
              <option value="inativos">Clientes inativos</option>
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
                  <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metricas.totalClientes}</div>
                  <p className="text-xs text-muted-foreground">
                    {metricas.clientesAtivos} ativos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Novos Clientes</CardTitle>
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metricas.novosClientesMes}</div>
                  <p className="text-xs text-muted-foreground">
                    Últimos {filtroPeriodo} dias
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatarMoeda(metricas.ticketMedioCliente)}</div>
                  <p className="text-xs text-muted-foreground">
                    Por cliente
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Clientes VIP</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metricas.clientesVIP.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Top compradores
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Clientes VIP */}
              <Card>
                <CardHeader>
                  <CardTitle>Clientes VIP (Top Compradores)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metricas.clientesVIP.slice(0, 5).map((cliente, index) => (
                      <div key={cliente.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gold-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-yellow-600">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium">{cliente.nome}</p>
                            <p className="text-sm text-gray-500">{cliente.totalCompras} compras</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatarMoeda(cliente.valorTotalGasto)}</p>
                          <p className="text-sm text-gray-500">{cliente.endereco.cidade}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Cidades com Mais Clientes */}
              <Card>
                <CardHeader>
                  <CardTitle>Cidades com Mais Clientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metricas.cidadesMaisClientes.map((cidade) => (
                      <div key={cidade.cidade} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <MapPin className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{cidade.cidade}</p>
                            <p className="text-sm text-gray-500">{cidade.quantidade} clientes</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatarMoeda(cidade.faturamento)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Atividade dos Últimos 7 Dias */}
              <Card>
                <CardHeader>
                  <CardTitle>Atividade dos Últimos 7 Dias</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metricas.frequenciaCompras.map((periodo, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="font-medium">{periodo.periodo}</p>
                            <p className="text-sm text-gray-500">
                              {periodo.novosClientes} novos, {periodo.clientesRecorrentes} recorrentes
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Clientes Inativos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-red-500" />
                    <span>Clientes Inativos</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metricas.clientesInativos.slice(0, 5).map((cliente) => (
                      <div key={cliente.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                            <Users className="h-4 w-4 text-red-600" />
                          </div>
                          <div>
                            <p className="font-medium">{cliente.nome}</p>
                            <p className="text-sm text-gray-500">{cliente.endereco.cidade}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-red-600">
                            {calcularDiasUltimaCompra(cliente.ultimaCompra)} dias
                          </p>
                          <p className="text-xs text-gray-500">sem comprar</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lista de Todos os Clientes */}
            <Card>
              <CardHeader>
                <CardTitle>Lista de Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Cliente</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Contato</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Localização</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Compras</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Total Gasto</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Última Compra</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientes.slice(0, 20).map((cliente) => (
                        <tr key={cliente.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium">{cliente.nome}</p>
                              <p className="text-sm text-gray-500">
                                Cadastro: {formatarData(cliente.dataCadastro)}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-1">
                                <Mail className="h-3 w-3 text-gray-400" />
                                <span className="text-sm">{cliente.email}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Phone className="h-3 w-3 text-gray-400" />
                                <span className="text-sm">{cliente.telefone}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="text-sm">{cliente.endereco.cidade}</p>
                              <p className="text-xs text-gray-500">{cliente.endereco.estado}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium">{cliente.totalCompras}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium">{formatarMoeda(cliente.valorTotalGasto)}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm">{formatarData(cliente.ultimaCompra)}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              cliente.ativo
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {cliente.ativo ? 'Ativo' : 'Inativo'}
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