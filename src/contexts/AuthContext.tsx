'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { adminService } from '@/services/firestore';
import { AdminUser } from '@/types';

interface AuthContextType {
  user: User | null;
  adminUser: AdminUser | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (resource: string, action: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          // Buscar dados do admin user
          const adminData = await adminService.getByEmail(firebaseUser.email!);
          setAdminUser(adminData);
          
          // Armazenar adminId no localStorage para uso nos hooks
          if (adminData?.id) {
            localStorage.setItem('admin-id', adminData.id);
          }
        } catch (error) {
          console.error('Erro ao buscar dados do admin:', error);
          setAdminUser(null);
        }
      } else {
        setAdminUser(null);
        localStorage.removeItem('admin-id');
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    // Implementar login se necessário
    throw new Error('Login deve ser implementado');
  };

  const logout = async () => {
    await auth.signOut();
    setUser(null);
    setAdminUser(null);
    localStorage.removeItem('admin-id');
  };

  const hasPermission = async (resource: string, action: string): Promise<boolean> => {
    if (!adminUser?.id) return false;
    return await adminService.hasPermission(adminUser.id, resource, action);
  };

  const value = {
    user,
    adminUser,
    loading,
    login,
    logout,
    hasPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

// Hook para verificar se o usuário está autenticado
export function useRequireAuth() {
  const { user, adminUser, loading } = useAuth();
  
  useEffect(() => {
    if (!loading && (!user || !adminUser)) {
      // Redirecionar para login se não estiver autenticado
      window.location.href = '/login';
    }
  }, [user, adminUser, loading]);

  return { user, adminUser, loading };
}