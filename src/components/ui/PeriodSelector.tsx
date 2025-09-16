'use client';

import { useState, useMemo } from 'react';
import { CalendarIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

export interface PeriodOption {
  label: string;
  value: string;
  days: number;
}

interface PeriodSelectorProps {
  selectedPeriod: PeriodOption;
  onPeriodChange: (period: PeriodOption) => void;
  className?: string;
}

const DEFAULT_PERIODS: PeriodOption[] = [
  { label: 'Últimos 7 dias', value: '7d', days: 7 },
  { label: 'Últimos 15 dias', value: '15d', days: 15 },
  { label: 'Últimos 30 dias', value: '30d', days: 30 },
  { label: 'Últimos 60 dias', value: '60d', days: 60 },
  { label: 'Últimos 90 dias', value: '90d', days: 90 },
  { label: 'Últimos 6 meses', value: '6m', days: 180 },
  { label: 'Último ano', value: '1y', days: 365 },
];

export default function PeriodSelector({ 
  selectedPeriod, 
  onPeriodChange, 
  className = '' 
}: PeriodSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handlePeriodSelect = (period: PeriodOption) => {
    onPeriodChange(period);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      >
        <CalendarIcon className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">
          {selectedPeriod.label}
        </span>
        <ChevronDownIcon 
          className={`w-4 h-4 text-gray-500 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {isOpen && (
        <>
          {/* Overlay para fechar o dropdown */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown menu */}
          <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="py-1">
              {DEFAULT_PERIODS.map((period) => (
                <button
                  key={period.value}
                  onClick={() => handlePeriodSelect(period)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                    selectedPeriod.value === period.value
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Hook para gerenciar o período selecionado
export function usePeriodSelector(initialPeriod?: PeriodOption) {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>(
    initialPeriod || DEFAULT_PERIODS[2] // Default: últimos 30 dias
  );

  const getDateRange = useMemo(() => {
    return () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - selectedPeriod.days);
      
      return {
        startDate,
        endDate,
        days: selectedPeriod.days
      };
    };
  }, [selectedPeriod.days]);

  return {
    selectedPeriod,
    setSelectedPeriod,
    getDateRange,
    periods: DEFAULT_PERIODS
  };
}