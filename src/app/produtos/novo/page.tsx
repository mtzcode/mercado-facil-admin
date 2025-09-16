'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeft, 
  Upload,
  X,
  Menu,
  Image as ImageIcon
} from 'lucide-react';
import { produtoService, categoriaService } from '@/services/firestore';
import { Categoria, ProdutoForm } from '@/types';
import Sidebar from '@/components/Sidebar';
import { getProductImageUrl, checkImageExists } from '@/lib/cloudinary';
import { usePermission } from '@/hooks/usePermissions';

export default function NovoProdutoPage() {
  const router = useRouter();
  const { allowed: hasPermission, loading: permissionLoading } = usePermission('produtos', 'create');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!permissionLoading && !hasPermission) {
      router.push('/unauthorized');
    }
  }, [hasPermission, permissionLoading, router]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
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
    promocaoAtiva: false,
    promocaoDataInicio: '',
    promocaoDataFinal: '',
    precoPromocional: 0,
    tipoUnidade: 'un'
  });

  const [unidade, setUnidade] = useState('un');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [cloudinaryImageUrl, setCloudinaryImageUrl] = useState<string | null>(null);
  const [imageExists, setImageExists] = useState(false);
  const [checkingImage, setCheckingImage] = useState(false);

  useEffect(() => {
    const loadCategorias = async () => {
      try {
        const categoriasData = await categoriaService.getAll();
        setCategorias(categoriasData);
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
      }
    };

    loadCategorias();
  }, []);

  // Função para verificar se existe imagem no Cloudinary
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
        
        // Se a imagem existe e não há imagemUrl definida, define automaticamente
        if (exists && !formData.imagemUrl) {
          setFormData(prev => ({
            ...prev,
            imagemUrl: imageUrl
          }));
        }
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
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else if (type === 'date') {
      setFormData(prev => ({ ...prev, [name]: value }));
    } else {
      if (name === 'unidade') {
        setUnidade(value);
      } else {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    }

    // Verificar imagem do Cloudinary quando o código de barras for alterado
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

    setLoading(true);
    try {
      // Adiciona a URL da imagem do Cloudinary se existir
      const produtoData = {
        ...formData,
        imagemUrl: imageExists && cloudinaryImageUrl ? cloudinaryImageUrl : formData.imagemUrl
      };
      
      await produtoService.create(produtoData);
      alert('Produto criado com sucesso!');
      router.push('/produtos');
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      alert('Erro ao criar produto. Tente novamente.');
    } finally {
      setLoading(false);
    }
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
              <Link
                href="/produtos"
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft size={20} className="mr-2" />
                Voltar
              </Link>
              <h2 className="text-xl font-semibold text-gray-800">Novo Produto</h2>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informações Básicas */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Informações Básicas</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome do Produto *
                    </label>
                    <input
                      type="text"
                      name="nome"
                      value={formData.nome}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Digite o nome do produto"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Código de Barras
                    </label>
                    <input
                      type="text"
                      name="codigoBarras"
                      value={formData.codigoBarras}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Digite o código de barras"
                    />
                    
                    {/* Status da verificação de imagem */}
                    {formData.codigoBarras && (
                      <div className="mt-2">
                        {checkingImage ? (
                          <div className="flex items-center text-sm text-gray-600">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                            Verificando imagem no Cloudinary...
                          </div>
                        ) : imageExists ? (
                          <div className="flex items-center text-sm text-green-600">
                            <ImageIcon size={16} className="mr-2" />
                            Imagem encontrada no Cloudinary
                          </div>
                        ) : cloudinaryImageUrl ? (
                          <div className="flex items-center text-sm text-orange-600">
                            <X size={16} className="mr-2" />
                            Imagem não encontrada no Cloudinary
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoria *
                    </label>
                    <select
                      name="categoria"
                      value={formData.categoria}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Selecione uma categoria</option>
                      {categorias.map(categoria => (
                        <option key={categoria.id} value={categoria.nome}>
                          {categoria.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição do Produto *
                  </label>
                  <textarea
                    name="descricao"
                    value={formData.descricao}
                    onChange={handleInputChange}
                    rows={4}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Descreva detalhadamente o produto"
                  />
                </div>
              </div>

              {/* Prévia da Imagem do Cloudinary */}
              {imageExists && cloudinaryImageUrl && (
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Imagem do Produto</h3>
                  <div className="flex items-start gap-6">
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
                      <div className="flex items-center gap-2 mb-2">
                        <ImageIcon size={20} className="text-green-600" />
                        <span className="text-sm font-medium text-green-600">Imagem carregada automaticamente</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Esta imagem foi encontrada no Cloudinary baseada no código de barras do produto.
                      </p>
                      <div className="text-xs text-gray-500 break-all">
                        URL: {cloudinaryImageUrl}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Preços e Estoque */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Preços e Estoque</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custo (R$)
                    </label>
                    <input
                      type="number"
                      name="custo"
                      value={formData.custo}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preço de Venda (R$) *
                    </label>
                    <input
                      type="number"
                      name="preco"
                      value={formData.preco}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estoque
                    </label>
                    <input
                      type="number"
                      name="estoque"
                      value={formData.estoque}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unidade
                    </label>
                    <select
                      name="unidade"
                      value={unidade}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="un">Unidade</option>
                      <option value="kg">Quilograma</option>
                      <option value="g">Grama</option>
                      <option value="l">Litro</option>
                      <option value="ml">Mililitro</option>
                      <option value="m">Metro</option>
                      <option value="cm">Centímetro</option>
                    </select>
                  </div>
                </div>
                
              </div>
              
              {/* Promoção */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Promoção</h3>
                
                <div className="space-y-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="promocaoAtiva"
                      checked={formData.promocaoAtiva}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Promoção Ativa
                    </label>
                  </div>
                  
                  {formData.promocaoAtiva && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Data de Início
                        </label>
                        <input
                          type="date"
                          name="promocaoDataInicio"
                          value={formData.promocaoDataInicio}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Data Final
                        </label>
                        <input
                          type="date"
                          name="promocaoDataFinal"
                          value={formData.promocaoDataFinal}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Preço Promocional (R$)
                        </label>
                        <input
                          type="number"
                          name="precoPromocional"
                          value={formData.precoPromocional}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Imagens */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Imagens</h3>
                
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={handleImageUrlAdd}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Upload size={20} />
                    Adicionar URL de Imagem
                  </button>
                  
                  {imageUrls.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {imageUrls.map((url, index) => (
                        <div key={index} className="relative">
                          <Image
                            src={url}
                            alt={`Imagem ${index + 1}`}
                            width={200}
                            height={128}
                            className="w-full h-32 object-cover rounded-lg border"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlbSBuw6NvIGVuY29udHJhZGE8L3RleHQ+PC9zdmc+';
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleImageUrlRemove(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Tags</h3>
                
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Digite uma tag"
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
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Status</h3>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="ativo"
                    checked={formData.ativo}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Produto ativo (visível na loja)
                  </label>
                </div>
              </div>

              {/* Botões */}
              <div className="flex justify-end gap-4">
                <Link
                  href="/produtos"
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </Link>
                <button
                  type="submit"
                  disabled={loading || permissionLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Salvando...' : permissionLoading ? 'Verificando permissões...' : 'Salvar Produto'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}