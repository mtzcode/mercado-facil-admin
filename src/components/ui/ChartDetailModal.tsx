'use client';

import { useState, useEffect } from 'react';
import { X, TrendingUp, Calendar, DollarSign, ShoppingCart, Users } from 'lucide-react';

interface ChartDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: {
    name?: string;
    value?: number;
    produtos?: number;
    date?: string;
    vendas?: number;
    pedidos?: number;
    month?: string;
    clientes?: number;
  } | null;
  type: 'sales' | 'category' | 'monthly';
}

export default function ChartDetailModal({ isOpen, onClose, title, data, type }: ChartDetailModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const renderContent = () => {
    switch (type) {
      case 'sales':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Vendas</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(data?.vendas || 0)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Pedidos</p>
                    <p className="text-2xl font-bold text-green-900">{data?.pedidos || 0}</p>
                  </div>
                  <ShoppingCart className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">Métricas Calculadas</h4>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Ticket Médio:</span>
                  <span className="font-semibold">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format((data?.vendas || 0) / (data?.pedidos || 1))}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Data:</span>
                  <span className="font-semibold">{data?.date}</span>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'category':
        return (
          <div className="space-y-6">
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Vendas da Categoria</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(data?.value || 0)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-600" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Produtos</p>
                    <p className="text-xl font-bold text-blue-900">{data?.produtos || 0}</p>
                  </div>
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Venda Média/Produto</p>
                    <p className="text-xl font-bold text-green-900">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format((data?.value || 0) / (data?.produtos || 1))}
                    </p>
                  </div>
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">Insights da Categoria</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Esta categoria representa uma parte importante das vendas</p>
                <p>• Considere expandir o portfólio desta categoria</p>
                <p>• Monitore a performance dos produtos individuais</p>
              </div>
            </div>
          </div>
        );
        
      case 'monthly':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Vendas</p>
                    <p className="text-xl font-bold text-blue-900">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(data?.vendas || 0)}
                    </p>
                  </div>
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Pedidos</p>
                    <p className="text-xl font-bold text-green-900">{data?.pedidos || 0}</p>
                  </div>
                  <ShoppingCart className="w-6 h-6 text-green-600" />
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Clientes</p>
                    <p className="text-xl font-bold text-purple-900">{data?.clientes || 0}</p>
                  </div>
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">Métricas do Período</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Ticket Médio:</span>
                  <span className="font-semibold">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format((data?.vendas || 0) / (data?.pedidos || 1))}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Vendas por Cliente:</span>
                  <span className="font-semibold">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format((data?.vendas || 0) / (data?.clientes || 1))}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Pedidos por Cliente:</span>
                  <span className="font-semibold">
                    {((data?.pedidos || 0) / (data?.clientes || 1)).toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Período:</span>
                  <span className="font-semibold">{data?.month}</span>
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return <div>Dados não disponíveis</div>;
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div 
        className={`fixed inset-0 bg-black transition-opacity duration-300 ${
          isOpen ? 'bg-opacity-50' : 'bg-opacity-0'
        }`}
        onClick={handleBackdropClick}
      >
        <div className="flex min-h-full items-center justify-center p-4">
          <div 
            className={`relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 ${
              isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <Calendar className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6">
              {renderContent()}
            </div>
            
            {/* Footer */}
            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}