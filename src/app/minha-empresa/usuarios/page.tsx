"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Shield, ShieldCheck, ShieldX, Eye, EyeOff, Save, X } from "lucide-react";
import { AdminUser, AdminPermission } from "@/types";
import { adminService } from "@/services/firestore";
import { toast } from "react-hot-toast";

interface AdminUserFormData {
  nome: string;
  email: string;
  telefone: string;
  role: 'super_admin' | 'admin' | 'moderador';
  permissions: AdminPermission[];
}

interface RoleTemplate {
  id: string;
  nome: string;
  descricao: string;
  permissions: AdminPermission[];
}

const defaultRoleTemplates: RoleTemplate[] = [
  {
    id: 'super_admin',
    nome: 'Super Administrador',
    descricao: 'Acesso total ao sistema',
    permissions: [
      { resource: 'produtos', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'categorias', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'clientes', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'pedidos', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'usuarios_admin', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'dashboard', actions: ['read'] },
      { resource: 'relatorios', actions: ['read'] }
    ]
  },
  {
    id: 'admin',
    nome: 'Administrador',
    descricao: 'Gerenciamento de produtos, categorias e pedidos',
    permissions: [
      { resource: 'produtos', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'categorias', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'clientes', actions: ['read', 'update'] },
      { resource: 'pedidos', actions: ['read', 'update'] },
      { resource: 'dashboard', actions: ['read'] },
      { resource: 'relatorios', actions: ['read'] }
    ]
  },
  {
    id: 'moderador',
    nome: 'Moderador',
    descricao: 'Visualização e edição básica',
    permissions: [
      { resource: 'produtos', actions: ['read', 'update'] },
      { resource: 'categorias', actions: ['read'] },
      { resource: 'clientes', actions: ['read'] },
      { resource: 'pedidos', actions: ['read', 'update'] },
      { resource: 'dashboard', actions: ['read'] }
    ]
  }
];

const resourceLabels = {
  produtos: 'Produtos',
  categorias: 'Categorias',
  clientes: 'Clientes',
  pedidos: 'Pedidos',
  usuarios_admin: 'Usuários Admin',
  dashboard: 'Dashboard',
  relatorios: 'Relatórios'
};

const actionLabels = {
  create: 'Criar',
  read: 'Visualizar',
  update: 'Editar',
  delete: 'Excluir'
};

export default function UsuariosPage() {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [showPermissions, setShowPermissions] = useState<string | null>(null);
  const [formData, setFormData] = useState<AdminUserFormData>({
    nome: "",
    email: "",
    telefone: "",
    role: "moderador",
    permissions: []
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await adminService.getAll();
      setAdminUsers(usersData);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      toast.error("Erro ao carregar usuários administradores");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (role: 'super_admin' | 'admin' | 'moderador') => {
    const template = defaultRoleTemplates.find(t => t.id === role);
    if (template) {
      setFormData({
        ...formData,
        role,
        permissions: [...template.permissions]
      });
    }
  };

  const handlePermissionChange = (resource: string, action: string, checked: boolean) => {
    const newPermissions = [...formData.permissions];
    const existingPermissionIndex = newPermissions.findIndex(p => p.resource === resource);
    
    if (existingPermissionIndex >= 0) {
      const existingPermission = newPermissions[existingPermissionIndex];
      if (checked) {
        if (!existingPermission.actions.includes(action as 'create' | 'read' | 'update' | 'delete')) {
          existingPermission.actions.push(action as 'create' | 'read' | 'update' | 'delete');
        }
      } else {
        existingPermission.actions = existingPermission.actions.filter(a => a !== action);
        if (existingPermission.actions.length === 0) {
          newPermissions.splice(existingPermissionIndex, 1);
        }
      }
    } else if (checked) {
      newPermissions.push({
        resource: resource as 'produtos' | 'categorias' | 'clientes' | 'pedidos' | 'usuarios_admin' | 'dashboard' | 'relatorios',
        actions: [action as 'create' | 'read' | 'update' | 'delete']
      });
    }
    
    setFormData({ ...formData, permissions: newPermissions });
  };

  const hasPermission = (resource: string, action: string): boolean => {
    const permission = formData.permissions.find(p => p.resource === resource);
    return permission ? permission.actions.includes(action as 'create' | 'read' | 'update' | 'delete') : false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingUser) {
        await adminService.update(editingUser.id, {
          nome: formData.nome,
          telefone: formData.telefone,
          role: formData.role,
          permissions: formData.permissions
        });
        toast.success("Usuário atualizado com sucesso!");
      } else {
        await adminService.create({
          nome: formData.nome,
          email: formData.email,
          telefone: formData.telefone,
          role: formData.role,
          permissions: formData.permissions,
          ativo: true
        });
        toast.success("Usuário criado com sucesso!");
      }
      
      setShowForm(false);
      setEditingUser(null);
      resetForm();
      loadUsers();
    } catch (error) {
      console.error("Erro ao salvar usuário:", error);
      toast.error("Erro ao salvar usuário");
    }
  };

  const handleEdit = (user: AdminUser) => {
    setEditingUser(user);
    setFormData({
      nome: user.nome,
      email: user.email,
      telefone: user.telefone || "",
      role: user.role,
      permissions: user.permissions
    });
    setShowForm(true);
  };

  const handleDelete = async (user: AdminUser) => {
    if (confirm(`Tem certeza que deseja desativar o usuário ${user.nome}?`)) {
      try {
        await adminService.delete(user.id);
        toast.success("Usuário desativado com sucesso!");
        loadUsers();
      } catch (error) {
        console.error("Erro ao desativar usuário:", error);
        toast.error("Erro ao desativar usuário");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      email: "",
      telefone: "",
      role: "moderador",
      permissions: defaultRoleTemplates.find(t => t.id === 'moderador')?.permissions || []
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <ShieldCheck className="w-4 h-4 text-red-500" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-blue-500" />;
      case 'moderador':
        return <ShieldX className="w-4 h-4 text-green-500" />;
      default:
        return <Shield className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleLabel = (role: string) => {
    const template = defaultRoleTemplates.find(t => t.id === role);
    return template ? template.nome : role;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Usuários</h1>
          <p className="text-gray-600 mt-1">Administre usuários e suas permissões no sistema</p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            resetForm();
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Usuário
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
            </h2>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingUser(null);
                resetForm();
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dados básicos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={!!editingUser}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Função *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => handleRoleChange(e.target.value as 'super_admin' | 'admin' | 'moderador')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {defaultRoleTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.nome} - {template.descricao}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Permissões */}
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-3">Permissões Detalhadas</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid gap-4">
                  {Object.entries(resourceLabels).map(([resource, label]) => (
                    <div key={resource} className="border-b border-gray-200 pb-3 last:border-b-0">
                      <h4 className="font-medium text-gray-800 mb-2">{label}</h4>
                      <div className="flex flex-wrap gap-3">
                        {Object.entries(actionLabels).map(([action, actionLabel]) => (
                          <label key={`${resource}-${action}`} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={hasPermission(resource, action)}
                              onChange={(e) => handlePermissionChange(resource, action, e.target.checked)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{actionLabel}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {editingUser ? 'Atualizar' : 'Criar'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingUser(null);
                  resetForm();
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de usuários */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Usuários Cadastrados</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Função
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Último Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {adminUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.nome}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      {user.telefone && (
                        <div className="text-sm text-gray-500">{user.telefone}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getRoleIcon(user.role)}
                      <span className="text-sm text-gray-900">{getRoleLabel(user.role)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.ultimoLogin ? new Date(user.ultimoLogin).toLocaleDateString('pt-BR') : 'Nunca'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowPermissions(showPermissions === user.id ? null : user.id)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Ver permissões"
                      >
                        {showPermissions === user.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Editar usuário"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        className="text-red-600 hover:text-red-900"
                        title="Desativar usuário"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {/* Detalhes das permissões */}
              {adminUsers.map((user) => (
                showPermissions === user.id && (
                  <tr key={`${user.id}-permissions`} className="bg-blue-50">
                    <td colSpan={5} className="px-6 py-4">
                      <div className="text-sm">
                        <h4 className="font-medium text-gray-900 mb-2">Permissões de {user.nome}:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {user.permissions.map((permission, index) => (
                            <div key={index} className="bg-white rounded p-2 border">
                              <div className="font-medium text-gray-800">
                                {resourceLabels[permission.resource as keyof typeof resourceLabels]}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                {permission.actions.map(action => 
                                  actionLabels[action as keyof typeof actionLabels]
                                ).join(', ')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
          
          {adminUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhum usuário administrador encontrado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}