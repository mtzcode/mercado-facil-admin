'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeft, 
  Edit,
  Trash2,
  Package,
  DollarSign,
  Hash,
  FileText,
  Calendar,
  Tag,
  Image as ImageIcon,
  Menu
} from 'lucide-react';
import { produtoService } from '@/services/firestore';
import { Produto } from '@/types';
import Sidebar from '@/components/Sidebar';
import { PermissionGuard, usePermission } from '@/hooks/usePermissions';

export default function VisualizarProdutoPage() {
  const router = useRouter();
  const params = useParams();
  const [produto, setProduto] = useState<Produto | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Verificar permissão de leitura
  const { allowed: canRead, loading: permissionLoading } = usePermission('produtos', 'read');

  useEffect(() => {
    if (params.id) {
      loadProduto(params.id as string);
    }
  }, [params.id]);

  // Redirecionar se não tiver permissão
  useEffect(() => {
    if (!permissionLoading && !canRead) {
      router.push('/unauthorized');
    }
  }, [permissionLoading, canRead, router]);

  const loadProduto = async (id: string) => {
    try {
      const produtoData = await produtoService.getById(id);
      setProduto(produtoData);
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
      alert('Erro ao carregar produto.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!produto?.id) return;
    
    if (!confirm('Tem certeza que deseja excluir este produto?')) {
      return;
    }

    setDeleting(true);
    try {
      await produtoService.delete(produto.id);
      alert('Produto excluído com sucesso!');
      router.push('/produtos');
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      alert('Erro ao excluir produto. Tente novamente.');
    } finally {
      setDeleting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Não informado';
    return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
  };

  if (loading || permissionLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} currentPath="/produtos" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando produto...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!produto) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} currentPath="/produtos" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Produto não encontrado</h2>
            <p className="text-gray-600 mb-4">O produto que você está procurando não existe.</p>
            <Link
              href="/produtos"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <ArrowLeft size={16} className="mr-2" />
              Voltar para produtos
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
              <Link
                href="/produtos"
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft size={20} className="mr-2" />
                Voltar
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Visualizar Produto</h1>
            </div>
            <div className="flex items-center gap-2">
              <PermissionGuard resource="produtos" action="update">
                <Link
                  href={`/produtos/${produto.id}/editar`}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Edit size={16} className="mr-2" />
                  Editar
                </Link>
              </PermissionGuard>
              <PermissionGuard resource="produtos" action="delete">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  <Trash2 size={16} className="mr-2" />
                  {deleting ? 'Excluindo...' : 'Excluir'}
                </button>
              </PermissionGuard>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border">
              {/* Cabeçalho do produto */}
              <div className="p-6 border-b">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{produto.nome}</h2>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        produto.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {produto.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        produto.disponivel ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {produto.disponivel ? 'Disponível' : 'Indisponível'}
                      </span>
                      {produto.destaque && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Destaque
                        </span>
                      )}
                    </div>
                  </div>
                  {produto.imagemUrl && (
                    <div className="ml-6">
                      <Image
                        src={produto.imagemUrl}
                        alt={produto.nome}
                        width={120}
                        height={120}
                        className="rounded-lg border object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Informações básicas */}
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Package className="mr-2" size={20} />
                  Informações Básicas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Código de Barras
                    </label>
                    <div className="flex items-center">
                      <Hash size={16} className="text-gray-400 mr-2" />
                      <span className="text-gray-900">{produto.codigoBarras || 'Não informado'}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoria
                    </label>
                    <span className="text-gray-900">{produto.categoria}</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estoque
                    </label>
                    <span className="text-gray-900">{produto.estoque} unidades</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Unidade
                    </label>
                    <span className="text-gray-900">{produto.unidadeMedida || 'Unidade'}</span>
                  </div>
                </div>
              </div>

              {/* Preços */}
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <DollarSign className="mr-2" size={20} />
                  Preços
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preço de Venda
                    </label>
                    <span className="text-xl font-bold text-green-600">{formatCurrency(produto.preco)}</span>
                  </div>
                  {produto.custo && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Custo
                      </label>
                      <span className="text-lg text-gray-900">{formatCurrency(produto.custo)}</span>
                    </div>
                  )}
                  {produto.precoPromocional && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Preço Promocional
                      </label>
                      <span className="text-lg font-bold text-red-600">{formatCurrency(produto.precoPromocional)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Descrição */}
              {produto.descricao && (
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FileText className="mr-2" size={20} />
                    Descrição
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{produto.descricao}</p>
                </div>
              )}

              {/* Promoção */}
              {produto.promocaoAtiva && (
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Tag className="mr-2" size={20} />
                    Promoção
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data de Início
                      </label>
                      <div className="flex items-center">
                        <Calendar size={16} className="text-gray-400 mr-2" />
                        <span className="text-gray-900">{formatDate(produto.promocaoDataInicio)}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data Final
                      </label>
                      <div className="flex items-center">
                        <Calendar size={16} className="text-gray-400 mr-2" />
                        <span className="text-gray-900">{formatDate(produto.promocaoDataFinal)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tags */}
              {produto.tags && produto.tags.length > 0 && (
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Tag className="mr-2" size={20} />
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {produto.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Imagens adicionais */}
              {produto.imagens && produto.imagens.length > 0 && (
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <ImageIcon className="mr-2" size={20} />
                    Imagens Adicionais
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {produto.imagens.map((url, index) => (
                      <div key={index} className="relative">
                        <Image
                          src={url}
                          alt={`Imagem ${index + 1}`}
                          width={200}
                          height={128}
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadados */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Calendar className="mr-2" size={20} />
                  Informações do Sistema
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
                  <div>
                    <label className="block font-medium mb-1">Data de Criação</label>
                    <span>{formatDate(produto.createdAt)}</span>
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Última Atualização</label>
                    <span>{formatDate(produto.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}