'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Package, 
  ShoppingCart, 
  Users,
  DollarSign,
  AlertTriangle,
  LucideIcon
} from 'lucide-react';
import { dashboardService } from '@/services/firestore';
import { DashboardStats } from '@/types';
import AdminLayout from '@/components/AdminLayout';

const StatCard = ({ title, value, icon: Icon, color }: {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
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
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
                <StatCard
                  title="Total de Clientes"
                  value={stats?.totalClientes || 0}
                  icon={Users}
                  color="bg-blue-500"
                />
                <StatCard
                  title="Total de Produtos"
                  value={stats?.totalProdutos || 0}
                  icon={Package}
                  color="bg-green-500"
                />
                <StatCard
                  title="Total de Pedidos"
                  value={stats?.totalPedidos || 0}
                  icon={ShoppingCart}
                  color="bg-purple-500"
                />
                <StatCard
                  title="Total de Vendas"
                  value={formatCurrency(stats?.totalVendas || 0)}
                  icon={DollarSign}
                  color="bg-yellow-500"
                />
                <StatCard
                  title="Pedidos Pendentes"
                  value={stats?.pedidosPendentes || 0}
                  icon={AlertTriangle}
                  color="bg-orange-500"
                />
                <StatCard
                  title="Produtos sem Estoque"
                  value={stats?.produtosSemEstoque || 0}
                  icon={AlertTriangle}
                  color="bg-red-500"
                />
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link href="/produtos/novo" className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-blue-100 mr-4">
                      <Package size={24} className="text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Novo Produto</h3>
                      <p className="text-sm text-gray-600">Adicionar produto ao catálogo</p>
                    </div>
                  </div>
                </Link>

                <Link href="/categorias/nova" className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-green-100 mr-4">
                      <Package size={24} className="text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Nova Categoria</h3>
                      <p className="text-sm text-gray-600">Criar nova categoria</p>
                    </div>
                  </div>
                </Link>

                <Link href="/pedidos" className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-purple-100 mr-4">
                      <ShoppingCart size={24} className="text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Gerenciar Pedidos</h3>
                      <p className="text-sm text-gray-600">Visualizar e atualizar pedidos</p>
                    </div>
                  </div>
                </Link>

                <Link href="/minha-empresa" className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-green-100 mr-4">
                      <Package size={24} className="text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Minha Empresa</h3>
                      <p className="text-sm text-gray-600">Configurações e dados da empresa</p>
                    </div>
                  </div>
                </Link>
              </div>
            </>
          )}
    </AdminLayout>
  );
}
