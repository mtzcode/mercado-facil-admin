'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Search, Filter, Eye, Package, Clock, CheckCircle, XCircle, Truck } from 'lucide-react';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';

interface Cliente {
  id: string;
  nome: string;
  email: string;
}

interface Pedido {
  id: string;
  clienteId: string;
  cliente?: Cliente;
  total: number;
  status: string;
  dataPedido: Date;
  itens: {
    id: string;
    nome: string;
    quantidade: number;
    preco: number;
  }[];
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');

  const fetchPedidos = useCallback(async () => {
    try {
      setLoading(true);
      
      // Buscar todos os pedidos
      const pedidosRef = collection(db, 'pedidos');
      const pedidosQuery = query(pedidosRef, orderBy('dataPedido', 'desc'));
      const pedidosSnapshot = await getDocs(pedidosQuery);
      
      const pedidosData = await Promise.all(
        pedidosSnapshot.docs.map(async (pedidoDoc) => {
          const pedidoData = {
            id: pedidoDoc.id,
            ...pedidoDoc.data(),
            dataPedido: pedidoDoc.data().dataPedido?.toDate() || new Date()
          } as Pedido;
          
          // Buscar dados do cliente
          if (pedidoData.clienteId) {
            try {
              const clienteDoc = await getDoc(doc(db, 'clientes', pedidoData.clienteId));
              if (clienteDoc.exists()) {
                pedidoData.cliente = {
                  id: clienteDoc.id,
                  nome: clienteDoc.data().nome,
                  email: clienteDoc.data().email
                };
              }
            } catch (error) {
              console.error('Erro ao buscar cliente:', error);
            }
          }
          
          return pedidoData;
        })
      );
      
      setPedidos(pedidosData);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPedidos();
  }, [fetchPedidos]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'pendente': 'bg-yellow-100 text-yellow-800',
      'confirmado': 'bg-blue-100 text-blue-800',
      'preparando': 'bg-orange-100 text-orange-800',
      'saiu_entrega': 'bg-purple-100 text-purple-800',
      'entregue': 'bg-green-100 text-green-800',
      'cancelado': 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      'pendente': 'Pendente',
      'confirmado': 'Confirmado',
      'preparando': 'Preparando',
      'saiu_entrega': 'Saiu para entrega',
      'entregue': 'Entregue',
      'cancelado': 'Cancelado'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      'pendente': Clock,
      'confirmado': CheckCircle,
      'preparando': Package,
      'saiu_entrega': Truck,
      'entregue': CheckCircle,
      'cancelado': XCircle
    };
    const Icon = icons[status as keyof typeof icons] || Clock;
    return <Icon className="h-4 w-4" />;
  };

  // Filtrar pedidos
  const filteredPedidos = pedidos.filter(pedido => {
    const matchesSearch = 
      pedido.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pedido.cliente?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pedido.cliente?.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'todos' || pedido.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Estatísticas
  const stats = {
    total: pedidos.length,
    pendente: pedidos.filter(p => p.status === 'pendente').length,
    confirmado: pedidos.filter(p => p.status === 'confirmado').length,
    preparando: pedidos.filter(p => p.status === 'preparando').length,
    saiu_entrega: pedidos.filter(p => p.status === 'saiu_entrega').length,
    entregue: pedidos.filter(p => p.status === 'entregue').length,
    cancelado: pedidos.filter(p => p.status === 'cancelado').length,
    faturamento: pedidos
      .filter(p => p.status === 'entregue')
      .reduce((sum, p) => sum + p.total, 0)
  };

  if (loading) {
    return (
      <AdminLayout title="Pedidos" currentPath="/pedidos">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Pedidos" currentPath="/pedidos">
      <div>
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.pendente}</p>
              <p className="text-sm text-gray-600">Pendente</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.confirmado}</p>
              <p className="text-sm text-gray-600">Confirmado</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{stats.preparando}</p>
              <p className="text-sm text-gray-600">Preparando</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.saiu_entrega}</p>
              <p className="text-sm text-gray-600">Saiu</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.entregue}</p>
              <p className="text-sm text-gray-600">Entregue</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.cancelado}</p>
              <p className="text-sm text-gray-600">Cancelado</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-center">
              <p className="text-lg font-bold text-green-600">{formatCurrency(stats.faturamento)}</p>
              <p className="text-sm text-gray-600">Faturamento</p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar por ID, cliente ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="todos">Todos os status</option>
                <option value="pendente">Pendente</option>
                <option value="confirmado">Confirmado</option>
                <option value="preparando">Preparando</option>
                <option value="saiu_entrega">Saiu para entrega</option>
                <option value="entregue">Entregue</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Pedidos */}
        <div className="bg-white rounded-lg shadow">
          {filteredPedidos.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pedido
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Itens
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPedidos.map((pedido) => (
                    <tr key={pedido.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          #{pedido.id.slice(-8)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {pedido.cliente?.nome || 'Cliente não encontrado'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {pedido.cliente?.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(pedido.dataPedido)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(pedido.status)}
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            getStatusColor(pedido.status)
                          }`}>
                            {getStatusLabel(pedido.status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {formatCurrency(pedido.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {pedido.itens?.length || 0} item(s)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/pedidos/${pedido.id}`}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum pedido encontrado</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'todos'
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Ainda não há pedidos cadastrados no sistema.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}