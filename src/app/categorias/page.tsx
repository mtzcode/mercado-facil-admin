'use client';

import { useState, useEffect } from 'react';

import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Menu,
  Grid,
  X
} from 'lucide-react';
import { categoriaService } from '@/services/firestore';
import { Categoria } from '@/types';
import Sidebar from '@/components/Sidebar';

export default function CategoriasPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    icone: '',
    cor: '#3B82F6',
    ordem: 0,
    ativa: true
  });

  useEffect(() => {
    loadCategorias();
  }, []);

  const loadCategorias = async () => {
    try {
      const categoriasData = await categoriaService.getAll();
      setCategorias(categoriasData);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta categoria?')) {
      try {
        await categoriaService.delete(id);
        setCategorias(categorias.filter(c => c.id !== id));
      } catch (error) {
        console.error('Erro ao excluir categoria:', error);
        alert('Erro ao excluir categoria');
      }
    }
  };

  const handleEdit = (categoria: Categoria) => {
    setEditingCategoria(categoria);
    setFormData({
        nome: categoria.nome,
        descricao: categoria.descricao || '',
        icone: categoria.icone || '',
        cor: categoria.cor || '#3B82F6',
        ordem: categoria.ordem || 0,
        ativa: categoria.ativa ?? true
      });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      alert('Nome da categoria é obrigatório');
      return;
    }

    try {
      if (editingCategoria) {
        await categoriaService.update(editingCategoria.id!, formData);
        setCategorias(categorias.map(c => 
          c.id === editingCategoria.id 
            ? { ...c, ...formData }
            : c
        ));
      } else {
        const id = await categoriaService.create(formData);
        const newCategoria: Categoria = {
          id,
          ...formData,
          createdAt: new Date()
        };
        setCategorias([...categorias, newCategoria]);
      }
      
      setShowModal(false);
      setEditingCategoria(null);
      setFormData({ nome: '', descricao: '', icone: '', cor: '#3B82F6', ordem: 0, ativa: true });
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      alert('Erro ao salvar categoria');
    }
  };

  const filteredCategorias = categorias.filter(categoria =>
    categoria.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (categoria.descricao && categoria.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const iconOptions = [
    '🛒', '🥖', '🥛', '🍎', '🥩', '🧽', '💊', '👕', '📱', '🏠',
    '🚗', '📚', '🎮', '⚽', '🎵', '🌸', '🔧', '🎨', '☕', '🍕'
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} currentPath="/categorias" />
      
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
              <h2 className="text-xl font-semibold text-gray-800">Categorias</h2>
            </div>
            <button
              onClick={() => {
                setEditingCategoria(null);
                setFormData({ nome: '', descricao: '', icone: '', cor: '#3B82F6', ordem: categorias.length, ativa: true });
                setShowModal(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus size={20} />
              Nova Categoria
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Busca */}
          <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar categorias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Estatísticas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total de Categorias</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{categorias.length}</p>
                    </div>
                    <Grid className="text-blue-500" size={24} />
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Categorias com Ícone</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {categorias.filter(c => c.icone).length}
                      </p>
                    </div>
                    <Grid className="text-green-500" size={24} />
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Última Criada</p>
                      <p className="text-sm text-gray-900 mt-1">
                        {categorias.length > 0 
                          ? new Date(Math.max(...categorias.map(c => c.createdAt?.getTime() || 0))).toLocaleDateString('pt-BR')
                          : 'Nenhuma'
                        }
                      </p>
                    </div>
                    <Grid className="text-purple-500" size={24} />
                  </div>
                </div>
              </div>

              {/* Lista de Categorias */}
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                {filteredCategorias.length === 0 ? (
                  <div className="text-center py-12">
                    <Grid className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma categoria encontrada</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm 
                        ? 'Tente ajustar os termos de busca.'
                        : 'Comece criando sua primeira categoria.'
                      }
                    </p>
                    {!searchTerm && (
                      <div className="mt-6">
                        <button
                          onClick={() => {
                            setEditingCategoria(null);
                            setFormData({ nome: '', descricao: '', icone: '', cor: '#3B82F6', ordem: 0, ativa: true });
                            setShowModal(true);
                          }}
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="-ml-1 mr-2 h-5 w-5" />
                          Nova Categoria
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
                    {filteredCategorias.map((categoria) => (
                      <div key={categoria.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            {categoria.icone && (
                              <span className="text-2xl mr-2">{categoria.icone}</span>
                            )}
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: categoria.cor || '#3B82F6' }}
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEdit(categoria)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded"
                              title="Editar"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(categoria.id!)}
                              className="text-red-600 hover:text-red-900 p-1 rounded"
                              title="Excluir"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        
                        <h3 className="font-semibold text-gray-900 mb-1">{categoria.nome}</h3>
                        {categoria.descricao && (
                          <p className="text-sm text-gray-600 mb-2">{categoria.descricao}</p>
                        )}
                        
                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span>Ordem: {categoria.ordem || 0}</span>
                          <span>{categoria.createdAt?.toLocaleDateString('pt-BR') || 'N/A'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingCategoria ? 'Editar Categoria' : 'Nova Categoria'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nome da categoria"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Descrição da categoria"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ícone
                  </label>
                  <div className="grid grid-cols-10 gap-2 mb-2">
                    {iconOptions.map((icon, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setFormData({ ...formData, icone: icon })}
                        className={`p-2 text-lg border rounded hover:bg-gray-50 ${
                          formData.icone === icon ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={formData.icone}
                    onChange={(e) => setFormData({ ...formData, icone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ou digite um emoji"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cor
                    </label>
                    <input
                      type="color"
                      value={formData.cor}
                      onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                      className="w-full h-10 border border-gray-300 rounded-lg"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ordem
                    </label>
                    <input
                      type="number"
                      value={formData.ordem}
                      onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) || 0 })}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingCategoria ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}