'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Building2, Save, Clock, MapPin, Phone, Globe } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';

interface EmpresaData {
  id?: string;
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  whatsapp: string;
  endereco: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
  };
  horarioFuncionamento: {
    segunda: { abertura: string; fechamento: string; ativo: boolean };
    terca: { abertura: string; fechamento: string; ativo: boolean };
    quarta: { abertura: string; fechamento: string; ativo: boolean };
    quinta: { abertura: string; fechamento: string; ativo: boolean };
    sexta: { abertura: string; fechamento: string; ativo: boolean };
    sabado: { abertura: string; fechamento: string; ativo: boolean };
    domingo: { abertura: string; fechamento: string; ativo: boolean };
  };
  configuracoes: {
    entregaGratis: boolean;
    valorMinimoEntrega: number;
    taxaEntrega: number;
    tempoEntregaMinimo: number;
    tempoEntregaMaximo: number;
    aceitaPedidosOnline: boolean;
  };
  aparencia: {
    corPrimaria: string;
    corSecundaria: string;
    logo?: string;
    banner?: string;
  };
  updatedAt?: Date;
}

const empresaDefault: EmpresaData = {
  nome: '',
  cnpj: '',
  email: '',
  telefone: '',
  whatsapp: '',
  endereco: {
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: ''
  },
  horarioFuncionamento: {
    segunda: { abertura: '08:00', fechamento: '18:00', ativo: true },
    terca: { abertura: '08:00', fechamento: '18:00', ativo: true },
    quarta: { abertura: '08:00', fechamento: '18:00', ativo: true },
    quinta: { abertura: '08:00', fechamento: '18:00', ativo: true },
    sexta: { abertura: '08:00', fechamento: '18:00', ativo: true },
    sabado: { abertura: '08:00', fechamento: '12:00', ativo: true },
    domingo: { abertura: '08:00', fechamento: '12:00', ativo: false }
  },
  configuracoes: {
    entregaGratis: false,
    valorMinimoEntrega: 50,
    taxaEntrega: 5,
    tempoEntregaMinimo: 30,
    tempoEntregaMaximo: 60,
    aceitaPedidosOnline: true
  },
  aparencia: {
    corPrimaria: '#3B82F6',
    corSecundaria: '#1E40AF',
    logo: '',
    banner: ''
  }
};

export default function MinhaEmpresaPage() {
  const [empresa, setEmpresa] = useState<EmpresaData>(empresaDefault);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('dados');

  useEffect(() => {
    loadEmpresaData();
  }, []);

  const loadEmpresaData = async () => {
    try {
      const empresaDoc = await getDoc(doc(db, 'configuracoes', 'empresa'));
      if (empresaDoc.exists()) {
        setEmpresa({ ...empresaDefault, ...empresaDoc.data() } as EmpresaData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados da empresa:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await setDoc(doc(db, 'configuracoes', 'empresa'), {
        ...empresa,
        updatedAt: new Date()
      });
      alert('Dados salvos com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar os dados.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof EmpresaData, value: string | number | boolean) => {
    setEmpresa(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedInputChange = (section: keyof Pick<EmpresaData, 'endereco' | 'configuracoes' | 'aparencia'>, field: string, value: string | number | boolean) => {
    setEmpresa(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as Record<string, unknown>),
        [field]: value
      }
    }));
  };

  const handleHorarioChange = (dia: keyof EmpresaData['horarioFuncionamento'], campo: 'abertura' | 'fechamento' | 'ativo', valor: string | boolean) => {
    setEmpresa(prev => ({
      ...prev,
      horarioFuncionamento: {
        ...prev.horarioFuncionamento,
        [dia]: {
          ...prev.horarioFuncionamento[dia],
          [campo]: valor
        }
      }
    }));
  };

  const tabs = [
    { id: 'dados', label: 'Dados da Empresa', icon: Building2 },
    { id: 'endereco', label: 'Endereço', icon: MapPin },
    { id: 'contato', label: 'Contato', icon: Phone },
    { id: 'horarios', label: 'Horários', icon: Clock },
    { id: 'configuracoes', label: 'Configurações', icon: Globe }
  ];

  if (loading) {
    return (
      <AdminLayout title="Minha Empresa" currentPath="/minha-empresa">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando dados da empresa...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Minha Empresa" currentPath="/minha-empresa">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Building2 className="mr-3" size={28} />
              Minha Empresa
            </h1>
            <p className="text-gray-600 mt-1">Configure os dados e configurações da sua empresa</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={16} className="mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="p-6">
            {/* Dados da Empresa */}
            {activeTab === 'dados' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Dados da Empresa</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome da Empresa *
                    </label>
                    <input
                      type="text"
                      value={empresa.nome}
                      onChange={(e) => handleInputChange('nome', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Digite o nome da empresa"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CNPJ
                    </label>
                    <input
                      type="text"
                      value={empresa.cnpj}
                      onChange={(e) => handleInputChange('cnpj', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Endereço */}
            {activeTab === 'endereco' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Endereço</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CEP *
                    </label>
                    <input
                      type="text"
                      value={empresa.endereco.cep}
                      onChange={(e) => handleNestedInputChange('endereco', 'cep', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="00000-000"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Logradouro *
                    </label>
                    <input
                      type="text"
                      value={empresa.endereco.logradouro}
                      onChange={(e) => handleNestedInputChange('endereco', 'logradouro', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Rua, Avenida, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número *
                    </label>
                    <input
                      type="text"
                      value={empresa.endereco.numero}
                      onChange={(e) => handleNestedInputChange('endereco', 'numero', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="123"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Complemento
                    </label>
                    <input
                      type="text"
                      value={empresa.endereco.complemento || ''}
                      onChange={(e) => handleNestedInputChange('endereco', 'complemento', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Apto, Sala, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bairro *
                    </label>
                    <input
                      type="text"
                      value={empresa.endereco.bairro}
                      onChange={(e) => handleNestedInputChange('endereco', 'bairro', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nome do bairro"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cidade *
                    </label>
                    <input
                      type="text"
                      value={empresa.endereco.cidade}
                      onChange={(e) => handleNestedInputChange('endereco', 'cidade', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nome da cidade"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado *
                    </label>
                    <select
                      value={empresa.endereco.estado}
                      onChange={(e) => handleNestedInputChange('endereco', 'estado', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecione o estado</option>
                      <option value="AC">Acre</option>
                      <option value="AL">Alagoas</option>
                      <option value="AP">Amapá</option>
                      <option value="AM">Amazonas</option>
                      <option value="BA">Bahia</option>
                      <option value="CE">Ceará</option>
                      <option value="DF">Distrito Federal</option>
                      <option value="ES">Espírito Santo</option>
                      <option value="GO">Goiás</option>
                      <option value="MA">Maranhão</option>
                      <option value="MT">Mato Grosso</option>
                      <option value="MS">Mato Grosso do Sul</option>
                      <option value="MG">Minas Gerais</option>
                      <option value="PA">Pará</option>
                      <option value="PB">Paraíba</option>
                      <option value="PR">Paraná</option>
                      <option value="PE">Pernambuco</option>
                      <option value="PI">Piauí</option>
                      <option value="RJ">Rio de Janeiro</option>
                      <option value="RN">Rio Grande do Norte</option>
                      <option value="RS">Rio Grande do Sul</option>
                      <option value="RO">Rondônia</option>
                      <option value="RR">Roraima</option>
                      <option value="SC">Santa Catarina</option>
                      <option value="SP">São Paulo</option>
                      <option value="SE">Sergipe</option>
                      <option value="TO">Tocantins</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Contato */}
            {activeTab === 'contato' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Informações de Contato</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={empresa.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="contato@empresa.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone *
                    </label>
                    <input
                      type="tel"
                      value={empresa.telefone}
                      onChange={(e) => handleInputChange('telefone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="(11) 1234-5678"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={empresa.whatsapp}
                      onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Horários */}
            {activeTab === 'horarios' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Horários de Funcionamento</h2>
                <div className="space-y-4">
                  {Object.entries(empresa.horarioFuncionamento).map(([dia, horario]) => (
                    <div key={dia} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                      <div className="w-20">
                        <span className="font-medium text-gray-900 capitalize">{dia}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={horario.ativo}
                          onChange={(e) => handleHorarioChange(dia as keyof EmpresaData['horarioFuncionamento'], 'ativo', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-600">Aberto</span>
                      </div>
                      {horario.ativo && (
                        <>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Abertura</label>
                            <input
                              type="time"
                              value={horario.abertura}
                              onChange={(e) => handleHorarioChange(dia as keyof EmpresaData['horarioFuncionamento'], 'abertura', e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Fechamento</label>
                            <input
                              type="time"
                              value={horario.fechamento}
                              onChange={(e) => handleHorarioChange(dia as keyof EmpresaData['horarioFuncionamento'], 'fechamento', e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Configurações */}
            {activeTab === 'configuracoes' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Configurações de Entrega</h2>
                <div className="space-y-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={empresa.configuracoes.aceitaPedidosOnline}
                      onChange={(e) => handleNestedInputChange('configuracoes', 'aceitaPedidosOnline', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label className="ml-2 text-sm font-medium text-gray-700">
                      Aceitar pedidos online
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={empresa.configuracoes.entregaGratis}
                      onChange={(e) => handleNestedInputChange('configuracoes', 'entregaGratis', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label className="ml-2 text-sm font-medium text-gray-700">
                      Entrega grátis
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Valor mínimo para entrega (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={empresa.configuracoes.valorMinimoEntrega}
                        onChange={(e) => handleNestedInputChange('configuracoes', 'valorMinimoEntrega', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Taxa de entrega (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={empresa.configuracoes.taxaEntrega}
                        onChange={(e) => handleNestedInputChange('configuracoes', 'taxaEntrega', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={empresa.configuracoes.entregaGratis}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tempo mínimo de entrega (min)
                      </label>
                      <input
                        type="number"
                        value={empresa.configuracoes.tempoEntregaMinimo}
                        onChange={(e) => handleNestedInputChange('configuracoes', 'tempoEntregaMinimo', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tempo máximo de entrega (min)
                      </label>
                      <input
                        type="number"
                        value={empresa.configuracoes.tempoEntregaMaximo}
                        onChange={(e) => handleNestedInputChange('configuracoes', 'tempoEntregaMaximo', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <Save className="-ml-1 mr-2 h-4 w-4" />
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}