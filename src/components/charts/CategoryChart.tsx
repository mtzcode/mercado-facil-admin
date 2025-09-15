'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import ChartSkeleton from '@/components/ui/ChartSkeleton';

interface CategoryChartProps {
  data: Array<{
    name: string;
    value: number;
    produtos: number;
  }>;
  onCategoryClick?: (category: string) => void;
  loading?: boolean;
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#ec4899', // pink
  '#6b7280', // gray
];

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      name: string;
      value: number;
      produtos: number;
    };
  }>;
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-900">{data.name}</p>
        <p className="text-sm text-blue-600">
          Vendas: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.value)}
        </p>
        <p className="text-sm text-gray-600">
          Produtos: {data.produtos}
        </p>
      </div>
    );
  }
  return null;
};



// CustomLabel removido pois não está sendo utilizado

export default function CategoryChart({ data, onCategoryClick, loading }: CategoryChartProps) {
  const handleCellClick = (data: {
    name: string;
    value: number;
    produtos: number;
  }) => {
    if (onCategoryClick && data.name) {
      onCategoryClick(data.name);
    }
  };
  if (loading) {
    return (
      <ChartSkeleton 
        type="pie" 
        title="Vendas por Categoria"
        height="h-80"
      />
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Vendas por Categoria</h3>
        </div>
        <div className="h-80 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 text-sm">Nenhum dado de categoria encontrado</p>
            <p className="text-gray-400 text-xs mt-1">Os dados aparecerão quando houver produtos cadastrados</p>
          </div>
        </div>
      </div>
    );
  }

  // Filtrar apenas categorias com vendas
  const dataWithSales = data.filter(item => item.value > 0);
  
  if (dataWithSales.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Vendas por Categoria</h3>
        </div>
        <div className="h-80 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 text-sm">Nenhuma venda por categoria encontrada</p>
            <p className="text-gray-400 text-xs mt-1">Os dados aparecerão quando houver vendas registradas</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Vendas por Categoria</h3>
        <p className="text-sm text-gray-600">Últimos 30 dias</p>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              onClick={handleCellClick}
              style={{ cursor: 'pointer' }}
            >
              {dataWithSales.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value, entry) => {
                const categoryData = dataWithSales.find(item => item.name === value);
                return (
                  <span style={{ color: entry.color }}>
                    {value} ({categoryData?.produtos || 0} produtos)
                  </span>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Resumo das categorias */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
        {dataWithSales.slice(0, 6).map((item, index) => (
          <div key={item.name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <div className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              ></div>
              <span className="text-sm font-medium text-gray-700 truncate">{item.name}</span>
            </div>
            <span className="text-sm text-gray-600">
              {new Intl.NumberFormat('pt-BR', { 
                style: 'currency', 
                currency: 'BRL',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}