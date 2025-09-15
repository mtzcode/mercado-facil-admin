'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ChartSkeleton from '@/components/ui/ChartSkeleton';
import { MouseHandlerDataParam } from 'recharts/types/synchronisation/types';

interface SalesChartProps {
  data: Array<{
    date: string;
    vendas: number;
    pedidos: number;
  }>;
  loading?: boolean;
  onDataPointClick?: (date: string, vendas: number, pedidos: number) => void;
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

// Tooltip customizado para o gráfico de vendas
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const vendas = payload.find(p => p.dataKey === 'vendas')?.value || 0;
    const pedidos = payload.find(p => p.dataKey === 'pedidos')?.value || 0;
    const ticketMedio = pedidos > 0 ? (vendas as number) / (pedidos as number) : 0;
    
    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-800 mb-2">{`Data: ${label}`}</p>
        <div className="space-y-1">
          <p className="text-blue-600">
            <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
            {`Vendas: R$ ${(vendas as number).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          </p>
          <p className="text-green-600">
            <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
            {`Pedidos: ${pedidos}`}
          </p>
          <p className="text-purple-600 text-sm border-t pt-1 mt-2">
            {`Ticket Médio: R$ ${ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export default function SalesChart({ data, loading, onDataPointClick }: SalesChartProps) {
  const handlePointClick = (nextState: MouseHandlerDataParam) => {
    if (onDataPointClick && nextState && typeof nextState.activeTooltipIndex === 'number') {
      const clickedData = data[nextState.activeTooltipIndex];
      if (clickedData) {
        onDataPointClick(clickedData.date, clickedData.vendas, clickedData.pedidos);
      }
    }
  };
  if (loading) {
    return (
      <ChartSkeleton 
        type="line" 
        title="Vendas ao Longo do Tempo"
        height="h-80"
      />
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Vendas ao Longo do Tempo</h3>
        </div>
        <div className="h-80 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 text-sm">Nenhum dado de vendas encontrado</p>
            <p className="text-gray-400 text-xs mt-1">Os dados aparecerão quando houver pedidos no período selecionado</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Vendas ao Longo do Tempo</h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-gray-600">Vendas (R$)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-gray-600">Pedidos</span>
          </div>
        </div>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
            onClick={handlePointClick}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              yAxisId="vendas"
              orientation="left"
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => 
                new Intl.NumberFormat('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(value)
              }
            />
            <YAxis 
              yAxisId="pedidos"
              orientation="right"
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
            <Line
              yAxisId="vendas"
              type="monotone"
              dataKey="vendas"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4, cursor: 'pointer' }}
              activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, cursor: 'pointer' }}
              name="Vendas"
            />
            <Line
              yAxisId="pedidos"
              type="monotone"
              dataKey="pedidos"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4, cursor: 'pointer' }}
              activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, cursor: 'pointer' }}
              name="Pedidos"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}