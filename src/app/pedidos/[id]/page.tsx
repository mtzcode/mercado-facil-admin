'use client';

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ArrowLeft, User, Package, Clock, CheckCircle, XCircle, Truck, Edit, Save } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';

interface Cliente {
  id: string;
  nome: string;
  email: string;
  whatsapp: string;
}

interface Endereco {
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

interface Pedido {
  id: string;
  clienteId: string;
  cliente?: Cliente;
  total: number;
  status: string;
  dataPedido: Date;
  endereco: Endereco;
  observacoes?: string;
  itens: {
    id: string;
    nome: string;
    quantidade: number;
    preco: number;
    subtotal: number;
  }[];
}

export default function PedidoDetalhePage() {
  const params = useParams();
// Remove router since it's not being used
  const pedidoId = params.id as string;
  
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingStatus, setEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchPedidoData = useCallback(async () => {
    if (!pedidoId) return;
    
    try {
      setLoading(true);
      
      // Buscar dados do pedido
      const pedidoDoc = await getDoc(doc(db, 'pedidos', pedidoId));
      if (pedidoDoc.exists()) {
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
                email: clienteDoc.data().email,
                whatsapp: clienteDoc.data().whatsapp
              };
            }
          } catch (error) {
            console.error('Erro ao buscar cliente:', error);
          }
        }
        
        setPedido(pedidoData);
        setNewStatus(pedidoData.status);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do pedido:', error);
    } finally {
      setLoading(false);
    }
  }, [pedidoId]);

  useEffect(() => {
    fetchPedidoData();
  }, [fetchPedidoData]);

  const handleUpdateStatus = async () => {
    if (!pedido || !newStatus) return;
    
    try {
      setUpdating(true);
      await updateDoc(doc(db, 'pedidos', pedido.id), {
        status: newStatus
      });
      
      setPedido({ ...pedido, status: newStatus });
      setEditingStatus(false);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status do pedido');
    } finally {
      setUpdating(false);
    }
  };

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
    return <Icon className="h-5 w-5" />;
  };

  const getStatusProgress = (status: string) => {
    const statusOrder = ['pendente', 'confirmado', 'preparando', 'saiu_entrega', 'entregue'];
    const currentIndex = statusOrder.indexOf(status);
    return currentIndex >= 0 ? ((currentIndex + 1) / statusOrder.length) * 100 : 0;
  };

  if (loading) {
    return (
      <AdminLayout title="Carregando..." currentPath="/pedidos">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!pedido) {
    return (
      <AdminLayout title="Pedido não encontrado" currentPath="/pedidos">
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Pedido não encontrado</h3>
          <p className="mt-1 text-sm text-gray-500">O pedido solicitado não existe ou foi removido.</p>
          <Link
            href="/pedidos"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Voltar para Pedidos
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`Pedido #${pedido.id.slice(-8)}`} currentPath="/pedidos">
      <div>
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/pedidos"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Pedido #{pedido.id.slice(-8)}</h1>
              <p className="text-gray-600">{formatDate(pedido.dataPedido)}</p>
            </div>
          </div>
        </div>

        {/* Status e Progresso */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {getStatusIcon(pedido.status)}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Status do Pedido</h3>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                  getStatusColor(pedido.status)
                }`}>
                  {getStatusLabel(pedido.status)}
                </span>
              </div>
            </div>
            <div>
              {editingStatus ? (
                <div className="flex items-center gap-2">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="pendente">Pendente</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="preparando">Preparando</option>
                    <option value="saiu_entrega">Saiu para entrega</option>
                    <option value="entregue">Entregue</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                  <button
                    onClick={handleUpdateStatus}
                    disabled={updating}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    <Save className="h-4 w-4" />
                    {updating ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingStatus(false);
                      setNewStatus(pedido.status);
                    }}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingStatus(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Alterar Status
                </button>
              )}
            </div>
          </div>
          
          {/* Barra de Progresso */}
          {pedido.status !== 'cancelado' && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>Pendente</span>
                <span>Confirmado</span>
                <span>Preparando</span>
                <span>Saiu para entrega</span>
                <span>Entregue</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getStatusProgress(pedido.status)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Informações do Cliente */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Cliente
            </h3>
            {pedido.cliente ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome</label>
                  <p className="text-gray-900">{pedido.cliente.nome}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="text-gray-900">{pedido.cliente.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">WhatsApp</label>
                  <p className="text-gray-900">{pedido.cliente.whatsapp}</p>
                </div>
                <Link
                  href={`/clientes/${pedido.clienteId}`}
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                >
                  Ver perfil do cliente →
                </Link>
              </div>
            ) : (
              <p className="text-gray-500">Informações do cliente não disponíveis</p>
            )}
          </div>

          {/* Endereço de Entrega */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Endereço de Entrega</h3>
            {pedido.endereco ? (
              <div className="space-y-2">
                <p className="text-gray-900">
                  {pedido.endereco.logradouro}, {pedido.endereco.numero}
                </p>
                {pedido.endereco.complemento && (
                  <p className="text-gray-600">{pedido.endereco.complemento}</p>
                )}
                <p className="text-gray-600">
                  {pedido.endereco.bairro}, {pedido.endereco.cidade} - {pedido.endereco.estado}
                </p>
                <p className="text-gray-600">CEP: {pedido.endereco.cep}</p>
              </div>
            ) : (
              <p className="text-gray-500">Endereço não disponível</p>
            )}
          </div>
        </div>

        {/* Itens do Pedido */}
        <div className="bg-white p-6 rounded-lg shadow mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Itens do Pedido</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantidade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preço Unit.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pedido.itens?.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.nome}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.quantidade}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(item.preco)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(item.subtotal || item.preco * item.quantidade)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                    Total:
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                    {formatCurrency(pedido.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Observações */}
        {pedido.observacoes && (
          <div className="bg-white p-6 rounded-lg shadow mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Observações</h3>
            <p className="text-gray-700">{pedido.observacoes}</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}