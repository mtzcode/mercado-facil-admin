'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ChartSkeleton from '@/components/ui/ChartSkeleton';
import { MouseHandlerDataParam } from 'recharts/types/synchronisation/types';

interface MonthlyComparisonChartProps {
  data: Array<{
    month: string;
    pedidos: number;
    vendas: number;
    clientes: number;
  }>;
  loading?: boolean;
  onMonthClick?: (month: string, data: {
    month: string;
    pedidos: number;
    vendas: number;
    clientes: number;
  }) => void;
}

// Interface para o tooltip customizado
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

// Tooltip customizado para o gráfico de comparação mensal
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const vendas = payload.find(p => p.dataKey === 'vendas')?.value || 0;
    const pedidos = payload.find(p => p.dataKey === 'pedidos')?.value || 0;
    const clientes = payload.find(p => p.dataKey === 'clientes')?.value || 0;
    const ticketMedio = pedidos > 0 ? (vendas as number) / (pedidos as number) : 0;
    const vendasPorCliente = clientes > 0 ? (vendas as number) / (clientes as number) : 0;
    
    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-800 mb-2">{`Mês: ${label}`}</p>
        <div className="space-y-1">
          <p className="text-blue-600">
            <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
            {`Vendas: R$ ${(vendas as number).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          </p>
          <p className="text-green-600">
            <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
            {`Pedidos: ${pedidos}`}
          </p>
          <p className="text-purple-600">
            <span className="inline-block w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
            {`Clientes: ${clientes}`}
          </p>
          <div className="border-t pt-2 mt-2 space-y-1">
            <p className="text-orange-600 text-sm">
              {`Ticket Médio: R$ ${ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            </p>
            <p className="text-indigo-600 text-sm">
              {`Vendas/Cliente: R$ ${vendasPorCliente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            </p>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function MonthlyComparisonChart({ data, loading, onMonthClick }: MonthlyComparisonChartProps) {
  const handleBarClick = (nextState: MouseHandlerDataParam) => {
    if (onMonthClick && nextState && typeof nextState.activeTooltipIndex === 'number') {
      const clickedData = data[nextState.activeTooltipIndex];
      if (clickedData) {
        onMonthClick(clickedData.month, clickedData);
      }
    }
  };
  if (loading) {
    return (
      <ChartSkeleton 
        type="bar" 
        title="Comparação Mensal de Pedidos"
        height="h-80"
      />
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Comparação Mensal de Pedidos</h3>
        </div>
        <div className="h-80 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 text-sm">Nenhum dado de comparação encontrado</p>
            <p className="text-gray-400 text-xs mt-1">Os dados aparecerão quando houver pedidos nos últimos meses</p>
          </div>
        </div>
      </div>
    );
  }

  // Calcular totais (usando apenas pedidos para comparação)
  const totalPedidos = data.reduce((sum, item) => sum + item.pedidos, 0);
  const totalVendas = data.reduce((sum, item) => sum + item.vendas, 0);
  
  // Para variação, comparamos com o mês anterior (se disponível)
  const ultimoMes = data[data.length - 1];
  const penultimoMes = data[data.length - 2];
  const variacao = penultimoMes ? ((ultimoMes?.pedidos - penultimoMes.pedidos) / penultimoMes.pedidos * 100) : 0;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Comparação Mensal de Pedidos</h3>
        <div className="text-right">
          <p className="text-sm text-gray-600">Variação total</p>
          <p className={`text-lg font-semibold ${
            variacao > 0 ? 'text-green-600' : variacao < 0 ? 'text-red-600' : 'text-gray-600'
          }`}>
            {variacao > 0 ? '+' : ''}{variacao.toFixed(1)}%
          </p>
        </div>
      </div>
      
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-600">Total Pedidos</p>
          <p className="text-2xl font-bold text-blue-600">{totalPedidos}</p>
          <p className="text-xs text-gray-500">últimos 6 meses</p>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-gray-600">Total Vendas</p>
          <p className="text-2xl font-bold text-green-600">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(totalVendas)}
          </p>
          <p className="text-xs text-gray-500">últimos 6 meses</p>
        </div>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
            barCategoryGap="20%"
            onClick={handleBarClick}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="month" 
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              label={{ value: 'Pedidos', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="rect"
            />
            <Bar
              dataKey="pedidos"
              fill="#3b82f6"
              name="Pedidos"
              radius={[4, 4, 0, 0]}
              style={{ cursor: 'pointer' }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Insights */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Insights</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-gray-600">
          <div>
            <span className="font-medium">Melhor mês:</span> {data.reduce((max, item) => 
              item.pedidos > max.pedidos ? item : max, data[0]
            )?.month || 'N/A'}
          </div>
          <div>
            <span className="font-medium">Maior faturamento:</span> {data.reduce((max, item) => 
              item.vendas > max.vendas ? item : max, data[0]
            )?.month || 'N/A'}
          </div>
          <div>
            <span className="font-medium">Tendência:</span> {variacao > 5 ? 'Crescimento' : variacao < -5 ? 'Declínio' : 'Estável'}
          </div>
        </div>
      </div>
    </div>
  );
}