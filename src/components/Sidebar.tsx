'use client';

import Link from 'next/link';
import { 
  Package, 
  DollarSign,
  Grid,
  ShoppingCart,
  Users,
  Building2,
  X,
  ChevronDown,
  ChevronRight,
  LogOut,
  BarChart3
} from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/auth';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath?: string;
}

const Sidebar = ({ isOpen, onClose, currentPath = '' }: SidebarProps) => {
  const [empresaMenuOpen, setEmpresaMenuOpen] = useState(false);
  const [relatoriosMenuOpen, setRelatoriosMenuOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await authService.logout();
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const menuItems = [
    {
      href: '/',
      icon: DollarSign,
      label: 'Dashboard',
      active: currentPath === '/'
    },
    {
      href: '/clientes',
      icon: Users,
      label: 'Clientes',
      active: currentPath.startsWith('/clientes')
    },
    {
      href: '/produtos',
      icon: Package,
      label: 'Produtos',
      active: currentPath.startsWith('/produtos')
    },
    {
      href: '/categorias',
      icon: Grid,
      label: 'Categorias',
      active: currentPath.startsWith('/categorias')
    },
    {
      href: '/pedidos',
      icon: ShoppingCart,
      label: 'Pedidos',
      active: currentPath.startsWith('/pedidos')
    },
    // Relatórios será tratado como submenu separadamente
  ];

  const empresaSubmenus = [
    {
      href: '/minha-empresa/configuracoes',
      label: 'Configurações Gerais'
    },
    {
      href: '/minha-empresa/dados',
      label: 'Dados da Empresa'
    },
    {
      href: '/minha-empresa/aparencia',
      label: 'Aparência do Site'
    },
    {
      href: '/minha-empresa/horarios',
      label: 'Horários de Funcionamento'
    },
    {
      href: '/minha-empresa/entrega',
      label: 'Configurações de Entrega'
    },
    {
      href: '/minha-empresa/usuarios',
      label: 'Usuários'
    }
  ];

  const relatoriosSubmenus = [
    {
      href: '/relatorios',
      label: 'Visão Geral'
    },
    {
      href: '/relatorios/vendas',
      label: 'Relatórios de Vendas'
    },
    {
      href: '/relatorios/produtos',
      label: 'Relatórios de Produtos'
    },
    {
      href: '/relatorios/clientes',
      label: 'Relatórios de Clientes'
    }
  ];

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-800">Mercado Fácil</h1>
            <button 
              onClick={onClose}
              className="lg:hidden p-1 rounded-md hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">Painel Administrativo</p>
        </div>
        
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link 
                    href={item.href} 
                    className={`flex items-center p-3 rounded-lg transition-colors ${
                      item.active 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <Icon size={20} className="mr-3" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
            
            {/* Menu Minha Empresa com submenus */}
            <li>
              <button
                onClick={() => setEmpresaMenuOpen(!empresaMenuOpen)}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                  currentPath.startsWith('/minha-empresa')
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="flex items-center">
                  <Building2 size={20} className="mr-3" />
                  Minha Empresa
                </div>
                {empresaMenuOpen ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </button>
              
              {empresaMenuOpen && (
                <ul className="mt-2 ml-6 space-y-1">
                  {empresaSubmenus.map((submenu) => (
                    <li key={submenu.href}>
                      <Link
                        href={submenu.href}
                        className={`block p-2 text-sm rounded-md transition-colors ${
                          currentPath === submenu.href
                            ? 'bg-blue-50 text-blue-700'
                            : 'hover:bg-gray-50 text-gray-600'
                        }`}
                      >
                        {submenu.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>

            {/* Menu Relatórios com submenus */}
            <li>
              <button
                onClick={() => setRelatoriosMenuOpen(!relatoriosMenuOpen)}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                  currentPath.startsWith('/relatorios')
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="flex items-center">
                  <BarChart3 size={20} className="mr-3" />
                  Relatórios
                </div>
                {relatoriosMenuOpen ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </button>
              
              {relatoriosMenuOpen && (
                <ul className="mt-2 ml-6 space-y-1">
                  {relatoriosSubmenus.map((submenu) => (
                    <li key={submenu.href}>
                      <Link
                        href={submenu.href}
                        className={`block p-2 text-sm rounded-md transition-colors ${
                          currentPath === submenu.href
                            ? 'bg-blue-50 text-blue-700'
                            : 'hover:bg-gray-50 text-gray-600'
                        }`}
                      >
                        {submenu.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          </ul>
          
          {/* Seção de logout */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
            <button
              onClick={handleLogout}
              className="flex items-center w-full p-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={20} className="mr-3" />
              Sair
            </button>
          </div>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;