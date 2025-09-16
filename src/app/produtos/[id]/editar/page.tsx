'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeft, 
  Save,
  Package,
  DollarSign,
  Hash,
  Image as ImageIcon,
  Menu,
  X,
  Upload
} from 'lucide-react';
import { produtoService, categoriaService } from '@/services/firestore';
import { Categoria, ProdutoForm } from '@/types';
import Sidebar from '@/components/Sidebar';
import { getProductImageUrl, checkImageExists } from '@/lib/cloudinary';
import { usePermission } from '@/hooks/usePermissions';

export default function EditarProdutoPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  
  // Verificar permissão de edição
  const { allowed: hasPermission, loading: permissionLoading } = usePermission('produtos', 'update');

  useEffect(() => {
    if (!permissionLoading && !hasPermission) {
      router.push('/unauthorized');
    }
  }, [hasPermission, permissionLoading, router]);
  
  // Estados do Cloudinary
  const [cloudinaryImageUrl, setCloudinaryImageUrl] = useState<string | null>(null);
  const [imageExists, setImageExists] = useState(false);
  const [checkingImage, setCheckingImage] = useState(false);

  const [formData, setFormData] = useState<ProdutoForm>({
    nome: '',
    descricao: '',
    codigoBarras: '',
    preco: 0,
    custo: 0,
    imagemUrl: '',
    imagens: [],
    categoria: '',
    destaque: false,
    disponivel: true,
    ativo: true,
    estoque: 0,
    tags: [],
    tipoUnidade: 'unidade',
    promocaoAtiva: false,
    promocaoDataInicio: '',
    promocaoDataFinal: '',
    precoPromocional: 0
  });

  const loadCategorias = useCallback(async () => {
    try {
      const categoriasData = await categoriaService.getAll();
      setCategorias(categoriasData);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  }, []);

  const loadProduto = useCallback(async (id: string) => {
    try {
      const produto = await produtoService.getById(id);
      if (produto) {
        setFormData({
          nome: produto.nome || '',
          descricao: produto.descricao || '',
          codigoBarras: produto.codigoBarras || '',
          preco: produto.preco || 0,
          custo: produto.custo || 0,
          imagemUrl: produto.imagemUrl || '',
          imagens: produto.imagens || [],
          categoria: produto.categoria || '',
          destaque: produto.destaque || false,
          disponivel: produto.disponivel ?? true,
          ativo: produto.ativo ?? true,
          estoque: produto.estoque || 0,
          tags: produto.tags || [],
          tipoUnidade: produto.tipoUnidade || 'unidade',
          promocaoAtiva: produto.promocaoAtiva || false,
          promocaoDataInicio: produto.promocaoDataInicio ? new Date(produto.promocaoDataInicio).toISOString().split('T')[0] : '',
          promocaoDataFinal: produto.promocaoDataFinal ? new Date(produto.promocaoDataFinal).toISOString().split('T')[0] : '',
          precoPromocional: produto.precoPromocional || 0
        });
        setImageUrls(produto.imagens || []);
        
        // Verificar imagem do Cloudinary se houver código de barras
        if (produto.codigoBarras) {
          checkCloudinaryImage(produto.codigoBarras);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
      alert('Erro ao carregar produto.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategorias();
    if (params.id) {
      loadProduto(params.id as string);
    }
  }, [params.id, loadProduto, loadCategorias]);

  const checkCloudinaryImage = async (barcode: string) => {
    if (!barcode.trim()) {
      setCloudinaryImageUrl(null);
      setImageExists(false);
      return;
    }

    setCheckingImage(true);
    try {
      const imageUrl = getProductImageUrl(barcode);
      if (imageUrl) {
        const exists = await checkImageExists(imageUrl);
        setCloudinaryImageUrl(imageUrl);
        setImageExists(exists);
      }
    } catch (error) {
      console.error('Erro ao verificar imagem:', error);
      setCloudinaryImageUrl(null);
      setImageExists(false);
    } finally {
      setCheckingImage(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value
    }));

    // Verificar imagem do Cloudinary quando o código de barras mudar
    if (name === 'codigoBarras') {
      checkCloudinaryImage(value);
    }
  };

  const handleImageUrlAdd = () => {
    const url = prompt('Digite a URL da imagem:');
    if (url && url.trim()) {
      const newUrls = [...imageUrls, url.trim()];
      setImageUrls(newUrls);
      setFormData(prev => ({ ...prev, imagens: newUrls }));
    }
  };

  const handleImageUrlRemove = (index: number) => {
    const newUrls = imageUrls.filter((_, i) => i !== index);
    setImageUrls(newUrls);
    setFormData(prev => ({ ...prev, imagens: newUrls }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      const newTags = [...formData.tags, newTag.trim()];
      setFormData(prev => ({ ...prev, tags: newTags }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    const newTags = formData.tags.filter(t => t !== tag);
    setFormData(prev => ({ ...prev, tags: newTags }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.descricao || !formData.categoria || formData.preco <= 0) {
      alert('Por favor, preencha todos os campos obrigatórios (Nome, Descrição, Categoria e Preço).');
      return;
    }

    // Validação de promoção
    if (formData.promocaoAtiva) {
      if (!formData.promocaoDataInicio || !formData.promocaoDataFinal || !formData.precoPromocional) {
        alert('Para ativar a promoção, preencha todos os campos: Data de Início, Data Final e Preço Promocional.');
        return;
      }
      
      if (new Date(formData.promocaoDataInicio) >= new Date(formData.promocaoDataFinal)) {
        alert('A data de início da promoção deve ser anterior à data final.');
        return;
      }
      
      if (formData.precoPromocional >= formData.preco) {
        alert('O preço promocional deve ser menor que o preço de venda.');
        return;
      }
    }

    setSaving(true);
    try {
      // Adiciona a URL da imagem do Cloudinary se existir
      const produtoData = {
        ...formData,
        imagemUrl: imageExists && cloudinaryImageUrl ? cloudinaryImageUrl : formData.imagemUrl
      };
      
      await produtoService.update(params.id as string, produtoData);
      alert('Produto atualizado com sucesso!');
      router.push('/produtos');
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      alert('Erro ao atualizar produto. Tente novamente.');
    } finally {
      setSaving(false);
    }
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
              <h1 className="text-xl font-semibold text-gray-900">Editar Produto</h1>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informações Básicas */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Package className="mr-2" size={20} />
                  Informações Básicas
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-2">
                      Nome do Produto *
                    </label>
                    <input
                      type="text"
                      id="nome"
                      name="nome"
                      value={formData.nome}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 mb-2">
                      Categoria *
                    </label>
                    <select
                      id="categoria"
                      name="categoria"
                      value={formData.categoria}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Selecione uma categoria</option>
                      {categorias.map((categoria) => (
                        <option key={categoria.id} value={categoria.nome}>
                          {categoria.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="codigoBarras" className="block text-sm font-medium text-gray-700 mb-2">
                      Código de Barras
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        id="codigoBarras"
                        name="codigoBarras"
                        value={formData.codigoBarras}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Digite o código de barras"
                      />
                    </div>
                    
                    {/* Status da verificação de imagem do Cloudinary */}
                    {formData.codigoBarras && (
                      <div className="mt-2">
                        {checkingImage && (
                          <div className="flex items-center text-sm text-blue-600">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                            Verificando imagem...
                          </div>
                        )}
                        {!checkingImage && imageExists && (
                          <div className="flex items-center text-sm text-green-600">
                            <ImageIcon size={16} className="mr-2" />
                            Imagem encontrada no Cloudinary
                          </div>
                        )}
                        {!checkingImage && !imageExists && (
                          <div className="flex items-center text-sm text-gray-500">
                            <ImageIcon size={16} className="mr-2" />
                            Imagem não encontrada no Cloudinary
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label htmlFor="estoque" className="block text-sm font-medium text-gray-700 mb-2">
                      Estoque
                    </label>
                    <input
                      type="number"
                      id="estoque"
                      name="estoque"
                      value={formData.estoque}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="tipoUnidade" className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Unidade
                    </label>
                    <select
                      id="tipoUnidade"
                      name="tipoUnidade"
                      value={formData.tipoUnidade}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="unidade">Unidade</option>
                      <option value="kg">Quilograma (kg)</option>
                      <option value="g">Grama (g)</option>
                      <option value="l">Litro (l)</option>
                      <option value="ml">Mililitro (ml)</option>
                      <option value="pacote">Pacote</option>
                      <option value="caixa">Caixa</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-2">
                      Descrição *
                    </label>
                    <textarea
                      id="descricao"
                      name="descricao"
                      value={formData.descricao}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Preview da imagem do Cloudinary */}
              {imageExists && cloudinaryImageUrl && (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <ImageIcon className="mr-2" size={20} />
                    Imagem do Cloudinary
                  </h2>
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-32 h-32 border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                        <Image
                          src={cloudinaryImageUrl}
                          alt="Prévia do produto"
                          width={128}
                          height={128}
                          className="w-full h-full object-contain"
                          onError={() => setImageExists(false)}
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-sm font-medium text-green-700">Imagem encontrada</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Esta imagem será usada automaticamente como imagem principal do produto.
                      </p>
                      <p className="text-xs text-gray-500 break-all">
                        URL: {cloudinaryImageUrl}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Preços */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <DollarSign className="mr-2" size={20} />
                  Preços
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="preco" className="block text-sm font-medium text-gray-700 mb-2">
                      Preço de Venda *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                      <input
                        type="number"
                        id="preco"
                        name="preco"
                        value={formData.preco}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="custo" className="block text-sm font-medium text-gray-700 mb-2">
                      Custo
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                      <input
                        type="number"
                        id="custo"
                        name="custo"
                        value={formData.custo}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="precoPromocional" className="block text-sm font-medium text-gray-700 mb-2">
                      Preço Promocional
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                      <input
                        type="number"
                        id="precoPromocional"
                        name="precoPromocional"
                        value={formData.precoPromocional}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={!formData.promocaoAtiva}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Configurações */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Configurações</h2>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="ativo"
                      name="ativo"
                      checked={formData.ativo}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="ativo" className="ml-2 block text-sm text-gray-900">
                      Produto ativo
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="disponivel"
                      name="disponivel"
                      checked={formData.disponivel}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="disponivel" className="ml-2 block text-sm text-gray-900">
                      Produto disponível
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="destaque"
                      name="destaque"
                      checked={formData.destaque}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="destaque" className="ml-2 block text-sm text-gray-900">
                      Produto em destaque
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="promocaoAtiva"
                      name="promocaoAtiva"
                      checked={formData.promocaoAtiva}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="promocaoAtiva" className="ml-2 block text-sm text-gray-900">
                      Promoção ativa
                    </label>
                  </div>
                </div>
              </div>

              {/* Promoção */}
              {formData.promocaoAtiva && (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Configurações da Promoção</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="promocaoDataInicio" className="block text-sm font-medium text-gray-700 mb-2">
                        Data de Início
                      </label>
                      <input
                        type="date"
                        id="promocaoDataInicio"
                        name="promocaoDataInicio"
                        value={formData.promocaoDataInicio}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="promocaoDataFinal" className="block text-sm font-medium text-gray-700 mb-2">
                        Data Final
                      </label>
                      <input
                        type="date"
                        id="promocaoDataFinal"
                        name="promocaoDataFinal"
                        value={formData.promocaoDataFinal}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tags */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Tags</h2>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Digite uma tag"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Adicionar
                    </button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Imagens */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <ImageIcon className="mr-2" size={20} />
                  Imagens Adicionais
                </h2>
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={handleImageUrlAdd}
                    className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Upload size={16} className="mr-2" />
                    Adicionar URL de Imagem
                  </button>
                  {imageUrls.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {imageUrls.map((url, index) => (
                        <div key={index} className="relative">
                          <Image
                            src={url}
                            alt={`Imagem ${index + 1}`}
                            width={200}
                            height={128}
                            className="w-full h-32 object-cover rounded-lg border"
                            onError={() => {
                              console.error('Erro ao carregar imagem:', url);
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleImageUrlRemove(index)}
                            className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex justify-end gap-4">
                <Link
                  href="/produtos"
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Save size={16} className="mr-2" />
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}