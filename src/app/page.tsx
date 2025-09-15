'use client';

import { useState, useEffect, useCallback } from 'react';
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
  ChevronDown,
  X,
  LucideIcon
} from 'lucide-react';
import { dashboardService } from '@/services/firestore';
import { DashboardStats } from '@/types';
import AdminLayout from '@/components/AdminLayout';
import SalesChart from '@/components/charts/SalesChart';
import CategoryChart from '@/components/charts/CategoryChart';
import MonthlyComparisonChart from '@/components/charts/MonthlyComparisonChart';
import PeriodSelector, { usePeriodSelector } from '@/components/ui/PeriodSelector';
import ChartActions, { exportUtils } from '@/components/ui/ChartActions';
import ChartSkeleton from '@/components/ui/ChartSkeleton';
import ChartDetailModal from '@/components/ui/ChartDetailModal';

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

type DateFilter = 'today' | 'yesterday' | 'week' | 'month' | 'range';

const getDateLabel = (filter: DateFilter, customDate?: string, startDate?: string, endDate?: string): string => {
  switch (filter) {
    case 'today':
      return 'Hoje';
    case 'yesterday':
      return 'Ontem';
    case 'week':
      return 'Esta Semana';
    case 'month':
      return 'Este Mês';
    case 'range':
      if (startDate && endDate) {
        // Formatar as datas diretamente sem conversão para evitar problemas de fuso horário
        const formatDate = (dateStr: string) => {
          const [year, month, day] = dateStr.split('-');
          return `${day}/${month}/${year}`;
        };
        return `${formatDate(startDate)} - ${formatDate(endDate)}`;
      }
      return 'Período Customizado';
    default:
      return 'Hoje';
  }
};

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showRangePicker, setShowRangePicker] = useState(false);
  const [recentActivities, setRecentActivities] = useState<Array<{
    id: string;
    type: 'pedido' | 'cliente' | 'produto';
    title: string;
    description: string;
    timestamp: Date;
    status: 'success' | 'info' | 'warning';
  }>>([]);
  const [salesChartData, setSalesChartData] = useState<Array<{ date: string; vendas: number; pedidos: number }>>([]);
  const [categoryChartData, setCategoryChartData] = useState<Array<{ name: string; value: number; produtos: number }>>([]);
  const [monthlyComparisonData, setMonthlyComparisonData] = useState<Array<{ month: string; pedidos: number; vendas: number; clientes: number }>>([]);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Hook para gerenciar período selecionado
  const { selectedPeriod, setSelectedPeriod, getDateRange } = usePeriodSelector();
  
  // Estados para o modal de detalhes
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<{
    name?: string;
    value?: number;
    produtos?: number;
    date?: string;
    vendas?: number;
    pedidos?: number;
    month?: string;
    clientes?: number;
  } | null>(null);
  const [modalType, setModalType] = useState<'sales' | 'category' | 'monthly'>('sales');
  const [modalTitle, setModalTitle] = useState('');

  // Handlers para drill-down nos gráficos
  const handleCategoryClick = (category: string) => {
    const categoryData = categoryChartData.find(item => item.name === category);
    if (categoryData) {
      setModalData(categoryData);
      setModalType('category');
      setModalTitle(`Detalhes da Categoria: ${category}`);
      setModalOpen(true);
    }
  };

  const handleDataPointClick = (date: string, vendas: number, pedidos: number) => {
    setModalData({ date, vendas, pedidos });
    setModalType('sales');
    setModalTitle(`Detalhes de Vendas: ${date}`);
    setModalOpen(true);
  };

  const handleMonthClick = (month: string, data: {
    month: string;
    pedidos: number;
    vendas: number;
    clientes: number;
  }) => {
    setModalData(data);
    setModalType('monthly');
    setModalTitle(`Detalhes do Período: ${month}`);
    setModalOpen(true);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsData, activitiesData] = await Promise.all([
          dashboardService.getDashboardStats(dateFilter, undefined, startDate, endDate),
          dashboardService.getRecentActivities()
        ]);
        setStats(statsData);
        setRecentActivities(activitiesData);
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateFilter, startDate, endDate]);

  const loadChartsData = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setChartsLoading(true);
      }
      
      const { startDate, endDate } = getDateRange;
      
      // Carregar dados dos gráficos em paralelo com filtro de período
      const [salesData, categoryData, monthlyData] = await Promise.all([
        dashboardService.getSalesOverTime(startDate, endDate),
        dashboardService.getCategoryDistribution(startDate, endDate),
        dashboardService.getMonthlyComparison(startDate, endDate)
      ]);
      
      setSalesChartData(salesData);
      setCategoryChartData(categoryData);
      setMonthlyComparisonData(monthlyData);
    } catch (error) {
      console.error('Erro ao carregar dados dos gráficos:', error);
    } finally {
      setChartsLoading(false);
      setRefreshing(false);
    }
  }, [getDateRange]);

  useEffect(() => {
    loadChartsData();
  }, [selectedPeriod]);
  
  // Funções de exportação
  const handleExportSalesCSV = () => {
    exportUtils.exportToCSV(salesChartData, `vendas-${selectedPeriod.value}`);
  };
  
  const handleExportCategoryCSV = () => {
    exportUtils.exportToCSV(categoryChartData, `categorias-${selectedPeriod.value}`);
  };
  
  const handleExportMonthlyCSV = () => {
    exportUtils.exportToCSV(monthlyComparisonData, `comparacao-mensal-${selectedPeriod.value}`);
  };
  
  const handleRefreshData = () => {
    loadChartsData(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatActivityDate = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Agora';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} min atrás`;
    } else if (diffInMinutes < 1440) { // 24 horas
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h atrás`;
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  };

  const getActivityColor = (status: 'success' | 'info' | 'warning'): string => {
    switch (status) {
      case 'success': return 'bg-green-500';
      case 'info': return 'bg-blue-500';
      case 'warning': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
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
            {/* Controles de período e ações */}
            <PeriodSelector
              selectedPeriod={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
            />
            <ChartActions
              onRefresh={handleRefreshData}
              isLoading={refreshing}
            />
            <div className="flex items-center space-x-2">
              <div className="relative">
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  {getDateLabel(dateFilter, undefined, startDate, endDate)}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </button>
              
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <div className="py-1">
                    {(['today', 'yesterday', 'week', 'month'] as DateFilter[]).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => {
                          setDateFilter(filter);
                          setIsDropdownOpen(false);
                          setShowRangePicker(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                          dateFilter === filter ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                        }`}
                      >
                        {getDateLabel(filter)}
                      </button>
                    ))}
                    <hr className="my-1" />
                    <button
                      onClick={() => {
                          setDateFilter('range');
                          setShowRangePicker(!showRangePicker);
                        }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                        dateFilter === 'range' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                      }`}
                    >
                      Período Customizado
                    </button>
                    {showRangePicker && (
                      <div className="px-4 py-2 border-t">
                        <div className="mb-2">
                          <label className="block text-sm font-medium mb-1">Data de Início:</label>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div className="mb-2">
                          <label className="block text-sm font-medium mb-1">Data de Fim:</label>
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <button
                          onClick={() => {
                            if (startDate && endDate) {
                              setDateFilter('range');
                              setIsDropdownOpen(false);
                              setShowRangePicker(false);
                            }
                          }}
                          className="w-full mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                        >
                          Aplicar Período
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              </div>
              <button 
                onClick={() => {
                  setDateFilter('today');
                  setStartDate('');
                  setEndDate('');
                  setShowRangePicker(false);
                  setIsDropdownOpen(false);
                }}
                className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                title="Limpar Filtro"
              >
                <X className="w-4 h-4 mr-1" />
                Limpar
              </button>
            </div>
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
                trend={`+${stats?.novosClientes || 0} novos`}
              />
              <StatCard
                icon={Package}
                title="Produtos Cadastrados"
                value={stats?.totalProdutos || 0}
                color="bg-green-500"
                trend={`+${stats?.novosProdutos || 0} novos`}
              />
              <StatCard
                icon={ShoppingCart}
                title="Total de Pedidos"
                value={stats?.totalPedidos || 0}
                color="bg-orange-500"
                trend={`${(stats?.crescimentoPedidos ?? 0) >= 0 ? '+' : ''}${stats?.crescimentoPedidos ?? 0}% vs período anterior`}
              />
              <StatCard
                icon={DollarSign}
                title="Total de Vendas"
                value={formatCurrency(stats?.totalVendas || 0)}
                color="bg-purple-500"
                trend={`${(stats?.crescimentoVendas ?? 0) >= 0 ? '+' : ''}${stats?.crescimentoVendas ?? 0}% vs período anterior`}
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

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Vendas por Período</h2>
                  <ChartActions
                    onRefresh={handleRefreshData}
                    onExportCSV={handleExportSalesCSV}
                    onExportPNG={() => exportUtils.exportChartToPNG('sales-chart', `vendas-${selectedPeriod.value}`)}
                    isLoading={refreshing}
                  />
                </div>
                <div id="sales-chart">
                  {chartsLoading ? (
                    <ChartSkeleton 
                      type="line" 
                      title="Vendas por Período"
                      height="h-64"
                    />
                  ) : (
                    <SalesChart 
                      data={salesChartData} 
                      onDataPointClick={handleDataPointClick}
                    />
                  )}
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Distribuição por Categoria</h2>
                  <ChartActions
                    onRefresh={handleRefreshData}
                    onExportCSV={handleExportCategoryCSV}
                    onExportPNG={() => exportUtils.exportChartToPNG('category-chart', `categorias-${selectedPeriod.value}`)}
                    isLoading={refreshing}
                  />
                </div>
                <div id="category-chart">
                  {chartsLoading ? (
                    <ChartSkeleton 
                      type="pie" 
                      title="Distribuição por Categoria"
                      height="h-64"
                    />
                  ) : (
                    <CategoryChart 
                      data={categoryChartData} 
                      onCategoryClick={handleCategoryClick}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Monthly Comparison Chart */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Comparação por Período</h2>
                <ChartActions
                  onRefresh={handleRefreshData}
                  onExportCSV={handleExportMonthlyCSV}
                  onExportPNG={() => exportUtils.exportChartToPNG('monthly-chart', `comparacao-${selectedPeriod.value}`)}
                  isLoading={refreshing}
                />
              </div>
              <div id="monthly-chart">
                {chartsLoading ? (
                  <ChartSkeleton 
                    type="bar" 
                    title="Comparação por Período"
                    height="h-64"
                  />
                ) : (
                  <MonthlyComparisonChart 
                    data={monthlyComparisonData} 
                    onMonthClick={handleMonthClick}
                  />
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Atividade Recente</h2>
              <div className="space-y-3">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <div className={`w-2 h-2 ${getActivityColor(activity.status)} rounded-full mr-3`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        <p className="text-xs text-gray-600">{activity.description}</p>
                      </div>
                      <span className="text-xs text-gray-500">{formatActivityDate(activity.timestamp)}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Sistema inicializado</p>
                      <p className="text-xs text-gray-600">Mercado Fácil Admin em funcionamento</p>
                    </div>
                    <span className="text-xs text-gray-500">Agora</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
        
        {/* Modal de detalhes */}
        <ChartDetailModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={modalTitle}
          data={modalData}
          type={modalType}
        />
      </div>
    </AdminLayout>
  );
}
