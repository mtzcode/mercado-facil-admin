'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Menu
} from 'lucide-react';
import { produtoService, categoriaService } from '@/services/firestore';
import { Produto, Categoria } from '@/types';
import Sidebar from '@/components/Sidebar';
import { getProductImageUrl } from '@/lib/cloudinary';

export default function ProdutosPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Função para obter a URL da imagem do produto
  const getImageUrl = (produto: Produto): string | null => {
    // Prioridade: imagemUrl > imagens[0] > Cloudinary baseado no código de barras
    if (produto.imagemUrl) return produto.imagemUrl;
    if (produto.imagens && produto.imagens.length > 0) return produto.imagens[0];
    if (produto.codigoBarras) return getProductImageUrl(produto.codigoBarras);
    return null;
  };
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [produtosData, categoriasData] = await Promise.all([
          produtoService.getAll(),
          categoriaService.getAll()
        ]);
        setProdutos(produtosData);
        setCategorias(categoriasData);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await produtoService.delete(id);
        setProdutos(produtos.filter(p => p.id !== id));
      } catch (error) {
        console.error('Erro ao excluir produto:', error);
        alert('Erro ao excluir produto');
      }
    }
  };

  const filteredProdutos = produtos.filter(produto => {
    const matchesSearch = produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (produto.descricao && produto.descricao.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === '' || produto.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} currentPath="/produtos" />
      
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
              <h2 className="text-xl font-semibold text-gray-800">Produtos</h2>
            </div>
            <Link
              href="/produtos/novo"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus size={20} />
              Novo Produto
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Filtros e Busca */}
          <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Busca */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Filtro por categoria */}
              <div className="lg:w-64">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todas as categorias</option>
                  {categorias.map(categoria => (
                    <option key={categoria.id} value={categoria.nome}>
                      {categoria.nome}
                    </option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Filter size={20} />
                Filtros
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Estatísticas */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total de Produtos</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{produtos.length}</p>
                    </div>
                    <Package className="text-blue-500" size={24} />
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Produtos Ativos</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {produtos.filter(p => p.ativo).length}
                      </p>
                    </div>
                    <Package className="text-green-500" size={24} />
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Sem Estoque</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {produtos.filter(p => p.estoque <= 0).length}
                      </p>
                    </div>
                    <Package className="text-red-500" size={24} />
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Categorias</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{categorias.length}</p>
                    </div>
                    <Package className="text-purple-500" size={24} />
                  </div>
                </div>
              </div>

              {/* Lista de Produtos */}
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Produto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Categoria
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Preço
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estoque
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredProdutos.map((produto) => (
                        <tr key={produto.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-12 w-12">
                                {getImageUrl(produto) ? (
                                  <Image
                                    className="h-12 w-12 rounded-lg object-cover"
                                    src={getImageUrl(produto)!}
                                    alt={produto.nome}
                                    width={48}
                                    height={48}
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      target.nextElementSibling?.classList.remove('hidden');
                                    }}
                                  />
                                ) : null}
                                <div className={`h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center ${getImageUrl(produto) ? 'hidden' : ''}`}>
                                  <Package className="text-gray-400" size={20} />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {produto.nome}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {produto.descricao ? produto.descricao.substring(0, 50) + '...' : 'Sem descrição'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {produto.categoria}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(produto.preco)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              produto.estoque > 10 
                                ? 'bg-green-100 text-green-800'
                                : produto.estoque > 0
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {produto.estoque} unidades
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              produto.ativo 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {produto.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/produtos/${produto.id}`}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded"
                                title="Visualizar"
                              >
                                <Eye size={16} />
                              </Link>
                              <Link
                                href={`/produtos/${produto.id}/editar`}
                                className="text-green-600 hover:text-green-900 p-1 rounded"
                                title="Editar"
                              >
                                <Edit size={16} />
                              </Link>
                              <button
                                onClick={() => handleDelete(produto.id!)}
                                className="text-red-600 hover:text-red-900 p-1 rounded"
                                title="Excluir"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {filteredProdutos.length === 0 && (
                  <div className="text-center py-12">
                    <Package className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum produto encontrado</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm || selectedCategory 
                        ? 'Tente ajustar os filtros de busca.'
                        : 'Comece criando seu primeiro produto.'
                      }
                    </p>
                    {!searchTerm && !selectedCategory && (
                      <div className="mt-6">
                        <Link
                          href="/produtos/novo"
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="-ml-1 mr-2 h-5 w-5" />
                          Novo Produto
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}