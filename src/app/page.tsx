'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Package, 
  ShoppingCart, 
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  Bell,
  Activity,
  LucideIcon
} from 'lucide-react';
import { dashboardService } from '@/services/firestore';
import { DashboardStats } from '@/types';
import AdminLayout from '@/components/AdminLayout';

const StatCard = ({ title, value, icon: Icon, color, trend }: {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  trend?: string;
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <p className="text-sm text-green-600 mt-1 flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const dashboardStats = await dashboardService.getStats();
        setStats(dashboardStats);
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <AdminLayout title="Dashboard" currentPath="/">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Visão geral do seu negócio</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Calendar className="w-4 h-4 mr-2" />
              Hoje
            </button>
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={Users}
                title="Total de Clientes"
                value={stats?.totalClientes || 0}
                color="bg-blue-500"
                trend="+12% este mês"
              />
              <StatCard
                icon={Package}
                title="Produtos Cadastrados"
                value={stats?.totalProdutos || 0}
                color="bg-green-500"
                trend="+5 novos"
              />
              <StatCard
                icon={ShoppingCart}
                title="Total de Pedidos"
                value={stats?.totalPedidos || 0}
                color="bg-orange-500"
                trend="+8% vs mês anterior"
              />
              <StatCard
                icon={DollarSign}
                title="Total de Vendas"
                value={formatCurrency(stats?.totalVendas || 0)}
                color="bg-purple-500"
                trend="+15% vs mês anterior"
              />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button 
                  onClick={() => router.push('/produtos/novo')}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Package className="w-8 h-8 text-blue-600 mr-3" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Novo Produto</p>
                    <p className="text-sm text-gray-600">Adicionar produto ao catálogo</p>
                  </div>
                </button>
                
                <button 
                  onClick={() => router.push('/clientes/novo')}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Users className="w-8 h-8 text-green-600 mr-3" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Novo Cliente</p>
                    <p className="text-sm text-gray-600">Cadastrar novo cliente</p>
                  </div>
                </button>
                
                <button 
                  onClick={() => router.push('/pedidos')}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Activity className="w-8 h-8 text-orange-600 mr-3" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Ver Pedidos</p>
                    <p className="text-sm text-gray-600">Gerenciar pedidos ativos</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Atividade Recente</h2>
              <div className="space-y-3">
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Novo pedido criado</p>
                    <p className="text-xs text-gray-600">Sistema atualizado com dados reais</p>
                  </div>
                  <span className="text-xs text-gray-500">Agora</span>
                </div>
                
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Dashboard atualizado</p>
                    <p className="text-xs text-gray-600">Dados sincronizados com Firebase</p>
                  </div>
                  <span className="text-xs text-gray-500">1 min atrás</span>
                </div>
                
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Sistema inicializado</p>
                    <p className="text-xs text-gray-600">Mercado Fácil Admin em funcionamento</p>
                  </div>
                  <span className="text-xs text-gray-500">2 min atrás</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
