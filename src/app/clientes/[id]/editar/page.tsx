'use client';

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ArrowLeft, User, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';

interface ClienteForm {
  nome: string;
  email: string;
  whatsapp: string;
  ativo: boolean;
  cadastroCompleto: boolean;
}

export default function EditarClientePage() {
  const params = useParams();
  const router = useRouter();
  const clienteId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [formData, setFormData] = useState<ClienteForm>({
    nome: '',
    email: '',
    whatsapp: '',
    ativo: true,
    cadastroCompleto: false
  });

  const fetchCliente = useCallback(async () => {
    if (!clienteId) return;
    
    try {
      setLoadingData(true);
      const clienteDoc = await getDoc(doc(db, 'clientes', clienteId));
      
      if (clienteDoc.exists()) {
        const clienteData = clienteDoc.data();
        setFormData({
          nome: clienteData.nome || '',
          email: clienteData.email || '',
          whatsapp: clienteData.whatsapp || '',
          ativo: clienteData.ativo ?? true,
          cadastroCompleto: clienteData.cadastroCompleto ?? false
        });
      } else {
        alert('Cliente não encontrado');
        router.push('/clientes');
      }
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      alert('Erro ao carregar dados do cliente');
    } finally {
      setLoadingData(false);
    }
  }, [clienteId, router]);

  useEffect(() => {
    fetchCliente();
  }, [fetchCliente]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.email || !formData.whatsapp) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      setLoading(true);
      
      await updateDoc(doc(db, 'clientes', clienteId), {
        nome: formData.nome,
        email: formData.email,
        whatsapp: formData.whatsapp,
        ativo: formData.ativo,
        cadastroCompleto: formData.cadastroCompleto,
        updatedAt: new Date()
      });
      
      alert('Cliente atualizado com sucesso!');
      router.push(`/clientes/${clienteId}`);
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      alert('Erro ao atualizar cliente. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const formatWhatsApp = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a máscara (XX) XXXXX-XXXX
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return numbers.slice(0, 11).replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatWhatsApp(e.target.value);
    setFormData(prev => ({ ...prev, whatsapp: formatted }));
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AdminLayout title="Editar Cliente" currentPath="/clientes">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href={`/clientes/${clienteId}`}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            <User className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Editar Cliente</h1>
          </div>
        </div>

        {/* Formulário */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome */}
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-2">
                Nome Completo *
              </label>
              <input
                type="text"
                id="nome"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Digite o nome completo do cliente"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="cliente@email.com"
              />
            </div>

            {/* WhatsApp */}
            <div>
              <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp *
              </label>
              <input
                type="tel"
                id="whatsapp"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleWhatsAppChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="(11) 99999-9999"
                maxLength={15}
              />
            </div>

            {/* Checkboxes */}
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
                <label htmlFor="ativo" className="ml-2 block text-sm text-gray-700">
                  Cliente ativo
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="cadastroCompleto"
                  name="cadastroCompleto"
                  checked={formData.cadastroCompleto}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="cadastroCompleto" className="ml-2 block text-sm text-gray-700">
                  Cadastro completo
                </label>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-4 pt-6">
              <Link
                href={`/clientes/${clienteId}`}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>

        {/* Informações adicionais */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Informações importantes:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Todos os campos marcados com * são obrigatórios</li>
            <li>• O WhatsApp deve estar no formato (XX) XXXXX-XXXX</li>
            <li>• Clientes inativos não poderão fazer pedidos</li>
            <li>• O cadastro completo indica que o cliente preencheu todos os dados no app</li>
            <li>• As alterações serão aplicadas imediatamente</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}