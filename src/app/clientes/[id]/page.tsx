'use client';

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ArrowLeft, User, Mail, Phone, Calendar, ShoppingBag, DollarSign, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';

interface Cliente {
  id: string;
  nome: string;
  email: string;
  whatsapp: string;
  dataCadastro: Date;
  cadastroCompleto: boolean;
  ativo: boolean;
  ultimoLogin?: Date;
  totalPedidos?: number;
  totalGasto?: number;
}

interface Pedido {
  id: string;
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

interface Endereco {
  id: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  principal: boolean;
}

export default function ClienteDetalhePage() {
  const params = useParams();
  const clienteId = params.id as string;
  
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dados');


  const fetchClienteData = useCallback(async () => {
    if (!clienteId) return;
    
    try {
      setLoading(true);
      
      // Buscar dados do cliente
      const clienteDoc = await getDoc(doc(db, 'clientes', clienteId));
      if (clienteDoc.exists()) {
        const clienteData = {
          id: clienteDoc.id,
          ...clienteDoc.data(),
          dataCadastro: clienteDoc.data().dataCadastro?.toDate() || new Date(),
          ultimoLogin: clienteDoc.data().ultimoLogin?.toDate()
        } as Cliente;
        setCliente(clienteData);
      }

      // Buscar pedidos do cliente
      const pedidosRef = collection(db, 'pedidos');
      const pedidosQuery = query(
        pedidosRef, 
        where('userId', '==', clienteId),
        orderBy('dataPedido', 'desc')
      );
      const pedidosSnapshot = await getDocs(pedidosQuery);
      const pedidosData = pedidosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dataPedido: doc.data().dataPedido?.toDate() || new Date()
      })) as Pedido[];
      setPedidos(pedidosData);

      // Buscar endereços do cliente
      const enderecosRef = collection(db, 'enderecos');
      const enderecosQuery = query(
        enderecosRef,
        where('userId', '==', clienteId)
      );
      const enderecosSnapshot = await getDocs(enderecosQuery);
      const enderecosData = enderecosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Endereco[];
      setEnderecos(enderecosData);
      
    } catch (error) {
      console.error('Erro ao buscar dados do cliente:', error);
    } finally {
      setLoading(false);
    }
  }, [clienteId]);

  useEffect(() => {
    fetchClienteData();
  }, [fetchClienteData]);



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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Cliente não encontrado</h1>
          <Link
            href="/clientes"
            className="text-blue-600 hover:text-blue-800"
          >
            Voltar para lista de clientes
          </Link>
        </div>
      </div>
    );
  }

  const totalGasto = pedidos.reduce((sum, pedido) => sum + pedido.total, 0);
  const totalPedidos = pedidos.length;

  return (
    <AdminLayout title={cliente ? `Cliente: ${cliente.nome}` : 'Cliente'} currentPath="/clientes">
      <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/clientes"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-3">
          <User className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{cliente.nome}</h1>
            <p className="text-gray-600">{cliente.email}</p>
          </div>
        </div>
        <div className="ml-auto">
          <Link
            href={`/clientes/${clienteId}/editar`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Editar Cliente
          </Link>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Pedidos</p>
              <p className="text-2xl font-bold text-gray-900">{totalPedidos}</p>
            </div>
            <ShoppingBag className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Gasto</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalGasto)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Status</p>
              <p className={`text-sm font-semibold ${
                cliente.ativo ? 'text-green-600' : 'text-red-600'
              }`}>
                {cliente.ativo ? 'Ativo' : 'Inativo'}
              </p>
            </div>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
              cliente.ativo ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <div className={`h-4 w-4 rounded-full ${
                cliente.ativo ? 'bg-green-600' : 'bg-red-600'
              }`}></div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cadastro</p>
              <p className={`text-sm font-semibold ${
                cliente.cadastroCompleto ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {cliente.cadastroCompleto ? 'Completo' : 'Incompleto'}
              </p>
            </div>
            <User className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('dados')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'dados'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dados Pessoais
            </button>
            <button
              onClick={() => setActiveTab('pedidos')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'pedidos'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pedidos ({totalPedidos})
            </button>
            <button
              onClick={() => setActiveTab('enderecos')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'enderecos'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Endereços ({enderecos.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Tab: Dados Pessoais */}
          {activeTab === 'dados' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Completo
                  </label>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{cliente.nome}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{cliente.email}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    WhatsApp
                  </label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{cliente.whatsapp}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de Cadastro
                  </label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{formatDate(cliente.dataCadastro)}</span>
                  </div>
                </div>
                {cliente.ultimoLogin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Último Login
                    </label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{formatDate(cliente.ultimoLogin)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab: Pedidos */}
          {activeTab === 'pedidos' && (
            <div>
              {pedidos.length > 0 ? (
                <div className="space-y-4">
                  {pedidos.map((pedido) => (
                    <div key={pedido.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">Pedido #{pedido.id.slice(-8)}</span>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            getStatusColor(pedido.status)
                          }`}>
                            {getStatusLabel(pedido.status)}
                          </span>
                        </div>
                        <span className="font-bold text-green-600">{formatCurrency(pedido.total)}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>Data: {formatDate(pedido.dataPedido)}</p>
                        <p>Itens: {pedido.itens?.length || 0} produto(s)</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum pedido encontrado</h3>
                  <p className="mt-1 text-sm text-gray-500">Este cliente ainda não fez nenhum pedido.</p>
                </div>
              )}
            </div>
          )}

          {/* Tab: Endereços */}
          {activeTab === 'enderecos' && (
            <div>
              {enderecos.length > 0 ? (
                <div className="space-y-4">
                  {enderecos.map((endereco) => (
                    <div key={endereco.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900">
                                {endereco.logradouro}, {endereco.numero}
                              </span>
                              {endereco.principal && (
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                  Principal
                                </span>
                              )}
                            </div>
                            {endereco.complemento && (
                              <p className="text-sm text-gray-600">{endereco.complemento}</p>
                            )}
                            <p className="text-sm text-gray-600">
                              {endereco.bairro}, {endereco.cidade} - {endereco.estado}
                            </p>
                            <p className="text-sm text-gray-600">CEP: {endereco.cep}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum endereço cadastrado</h3>
                  <p className="mt-1 text-sm text-gray-500">Este cliente ainda não cadastrou nenhum endereço.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    </AdminLayout>
  );
}