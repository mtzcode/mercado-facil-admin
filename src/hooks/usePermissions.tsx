'use client';

import { useState, useEffect } from 'react';
import { adminService } from '@/services/firestore';

interface PermissionState {
  loading: boolean;
  hasPermission: (resource: string, action: string) => boolean;
  checkPermission: (resource: string, action: string) => Promise<boolean>;
  adminId: string | null;
}

export function usePermissions(): PermissionState {
  const [adminId, setAdminId] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obter o adminId dos headers ou cookies
    const getAdminId = () => {
      // Primeiro, tentar obter dos headers (se disponível no lado do servidor)
      if (typeof window !== 'undefined') {
        // No lado do cliente, vamos obter do localStorage ou fazer uma requisição
        const storedAdminId = localStorage.getItem('admin-id');
        if (storedAdminId) {
          setAdminId(storedAdminId);
          return storedAdminId;
        }
      }
      return null;
    };

    const id = getAdminId();
    if (id) {
      setAdminId(id);
    }
    setLoading(false);
  }, []);

  const checkPermission = async (resource: string, action: string): Promise<boolean> => {
    if (!adminId) return false;
    
    const key = `${resource}:${action}`;
    
    // Verificar se já temos a permissão em cache
    if (permissions[key] !== undefined) {
      return permissions[key];
    }

    try {
      const hasPermission = await adminService.hasPermission(adminId, resource, action);
      
      // Armazenar no cache
      setPermissions(prev => ({
        ...prev,
        [key]: hasPermission
      }));
      
      return hasPermission;
    } catch (error) {
      console.error('Erro ao verificar permissão:', error);
      return false;
    }
  };

  const hasPermission = (resource: string, action: string): boolean => {
    const key = `${resource}:${action}`;
    return permissions[key] || false;
  };

  return {
    loading,
    hasPermission,
    checkPermission,
    adminId
  };
}

// Hook para verificar uma permissão específica
export function usePermission(resource: string, action: string) {
  const { checkPermission, loading, adminId } = usePermissions();
  const [allowed, setAllowed] = useState(false);
  const [permissionLoading, setPermissionLoading] = useState(true);

  useEffect(() => {
    if (!adminId || loading) return;

    const checkSpecificPermission = async () => {
      setPermissionLoading(true);
      try {
        const result = await checkPermission(resource, action);
        setAllowed(result);
      } catch (error) {
        console.error('Erro ao verificar permissão específica:', error);
        setAllowed(false);
      } finally {
        setPermissionLoading(false);
      }
    };

    checkSpecificPermission();
  }, [adminId, resource, action, loading, checkPermission]);

  return {
    allowed,
    loading: loading || permissionLoading,
    adminId
  };
}

// Componente para proteger elementos baseado em permissões
export function PermissionGuard({ 
  resource, 
  action, 
  children, 
  fallback = null 
}: { 
  resource: string; 
  action: string; 
  children: React.ReactNode; 
  fallback?: React.ReactNode; 
}) {
  const { allowed, loading } = usePermission(resource, action);

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>;
  }

  if (!allowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}