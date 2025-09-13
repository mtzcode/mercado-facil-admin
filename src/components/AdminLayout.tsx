'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  currentPath: string;
}

export default function AdminLayout({ children, title, currentPath }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} currentPath={currentPath} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md hover:bg-gray-100 mr-2"
              >
                <Menu size={20} />
              </button>
              <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
            </div>
            <div className="text-sm text-gray-600">
              {new Date().toLocaleDateString('pt-BR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}