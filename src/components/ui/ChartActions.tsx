'use client';

import { useState } from 'react';
import { 
  ArrowDownTrayIcon, 
  ArrowPathIcon,
  EllipsisVerticalIcon,
  DocumentArrowDownIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';

interface ChartActionsProps {
  onRefresh?: () => void;
  onExportCSV?: () => void;
  onExportPNG?: () => void;
  onExportPDF?: () => void;
  isLoading?: boolean;
  className?: string;
}

export default function ChartActions({
  onRefresh,
  onExportCSV,
  onExportPNG,
  onExportPDF,
  isLoading = false,
  className = ''
}: ChartActionsProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleRefresh = () => {
    if (onRefresh && !isLoading) {
      onRefresh();
    }
  };

  const handleExport = (exportFn?: () => void) => {
    if (exportFn) {
      exportFn();
    }
    setIsDropdownOpen(false);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Botão de atualizar */}
      <button
        onClick={handleRefresh}
        disabled={isLoading}
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Atualizar dados"
      >
        <ArrowPathIcon 
          className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} 
        />
      </button>

      {/* Dropdown de exportação */}
      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Opções de exportação"
        >
          <EllipsisVerticalIcon className="w-4 h-4" />
        </button>

        {isDropdownOpen && (
          <>
            {/* Overlay para fechar o dropdown */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsDropdownOpen(false)}
            />
            
            {/* Menu dropdown */}
            <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
              <div className="py-1">
                <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  Exportar como
                </div>
                
                {onExportCSV && (
                  <button
                    onClick={() => handleExport(onExportCSV)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                  >
                    <DocumentArrowDownIcon className="w-4 h-4" />
                    Exportar CSV
                  </button>
                )}
                
                {onExportPNG && (
                  <button
                    onClick={() => handleExport(onExportPNG)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                  >
                    <PhotoIcon className="w-4 h-4" />
                    Exportar PNG
                  </button>
                )}
                
                {onExportPDF && (
                  <button
                    onClick={() => handleExport(onExportPDF)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    Exportar PDF
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Componente simplificado apenas com botão de refresh
export function RefreshButton({ 
  onRefresh, 
  isLoading = false, 
  className = '' 
}: {
  onRefresh?: () => void;
  isLoading?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onRefresh}
      disabled={isLoading}
      className={`p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title="Atualizar dados"
    >
      <ArrowPathIcon 
        className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} 
      />
    </button>
  );
}

// Utilitários para exportação
export const exportUtils = {
  // Exportar dados como CSV
  exportToCSV: (data: Record<string, unknown>[], filename: string) => {
    if (!data.length) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escapar valores que contêm vírgulas ou aspas
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // Exportar gráfico como PNG (requer html2canvas)
  exportChartToPNG: async (elementId: string, filename: string) => {
    try {
      const html2canvas = await import('html2canvas');
      const element = document.getElementById(elementId);
      if (!element) throw new Error('Elemento não encontrado');
      
      const canvas = await html2canvas.default(element, {
        backgroundColor: '#ffffff',
        scale: 2
      });
      
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Erro ao exportar PNG:', error);
      alert('Erro ao exportar imagem. Verifique se o html2canvas está instalado.');
    }
  }
};