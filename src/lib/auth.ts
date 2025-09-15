// Sistema de autenticação para o admin
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
} from "firebase/auth";
import { auth } from "./firebase";

// Funções para gerenciar cookies
const setCookie = (name: string, value: string, days: number = 7) => {
  if (typeof window !== 'undefined') {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;`;
  }
};

const deleteCookie = (name: string) => {
  if (typeof window !== 'undefined') {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }
};

// Tipos de autenticação
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  displayName?: string;
}

// Serviço de autenticação
export class AuthService {
  private static instance: AuthService;
  private authState: AuthState = {
    user: null,
    loading: true,
    error: null,
  };
  private listeners: ((state: AuthState) => void)[] = [];

  private constructor() {
    // Escutar mudanças no estado de autenticação
    onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Usuário logado - salvar token no cookie
        try {
          const token = await firebaseUser.getIdToken();
          setCookie('admin-token', token, 7); // Token válido por 7 dias
        } catch (error) {
          console.error('Erro ao obter token:', error);
        }
      } else {
        // Usuário deslogado - remover token do cookie
        deleteCookie('admin-token');
      }
      
      this.authState = {
        user: firebaseUser ? this.mapFirebaseUser(firebaseUser) : null,
        loading: false,
        error: null,
      };
      this.notifyListeners();
    });
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private mapFirebaseUser(firebaseUser: FirebaseUser): AuthUser {
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      emailVerified: firebaseUser.emailVerified,
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.authState));
  }

  public subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    // Retornar função de unsubscribe
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public getCurrentState(): AuthState {
    return { ...this.authState };
  }

  public async login(credentials: LoginCredentials): Promise<AuthUser> {
    try {
      this.authState.loading = true;
      this.authState.error = null;
      this.notifyListeners();

      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      // Salvar token no cookie
      const token = await userCredential.user.getIdToken();
      setCookie('admin-token', token, 7);

      return this.mapFirebaseUser(userCredential.user);
    } catch (error: unknown) {
      const errorCode = error instanceof Error && 'code' in error ? (error as { code: string }).code : 'unknown';
      this.authState.error = this.getErrorMessage(errorCode);
      this.authState.loading = false;
      this.notifyListeners();
      throw new Error(this.authState.error);
    }
  }

  public async register(credentials: RegisterCredentials): Promise<AuthUser> {
    try {
      this.authState.loading = true;
      this.authState.error = null;
      this.notifyListeners();

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      // Atualizar displayName se fornecido
      if (credentials.displayName) {
        await updateProfile(userCredential.user, {
          displayName: credentials.displayName,
        });
      }

      return this.mapFirebaseUser(userCredential.user);
    } catch (error: unknown) {
      const errorCode = error instanceof Error && 'code' in error ? (error as { code: string }).code : 'unknown';
      this.authState.error = this.getErrorMessage(errorCode);
      this.authState.loading = false;
      this.notifyListeners();
      throw new Error(this.authState.error);
    }
  }

  public async logout(): Promise<void> {
    try {
      this.authState.loading = true;
      this.authState.error = null;
      this.notifyListeners();

      // Remover token do cookie
      deleteCookie('admin-token');
      
      await signOut(auth);
    } catch (error: unknown) {
      const errorCode = error instanceof Error && 'code' in error ? (error as { code: string }).code : 'unknown';
      this.authState.error = this.getErrorMessage(errorCode);
      this.authState.loading = false;
      this.notifyListeners();
      throw new Error(this.authState.error);
    }
  }

  public getCurrentUser(): AuthUser | null {
    return this.authState.user;
  }

  public isAuthenticated(): boolean {
    return this.authState.user !== null;
  }

  public isLoading(): boolean {
    return this.authState.loading;
  }

  public getError(): string | null {
    return this.authState.error;
  }

  public clearError(): void {
    this.authState.error = null;
    this.notifyListeners();
  }

  private getErrorMessage(errorCode: string): string {
    const errorMessages: Record<string, string> = {
      "auth/user-not-found": "Usuário não encontrado.",
      "auth/wrong-password": "Senha incorreta.",
      "auth/email-already-in-use": "Este email já está em uso.",
      "auth/weak-password": "A senha deve ter pelo menos 6 caracteres.",
      "auth/invalid-email": "Email inválido.",
      "auth/user-disabled": "Esta conta foi desabilitada.",
      "auth/too-many-requests":
        "Muitas tentativas. Tente novamente mais tarde.",
      "auth/network-request-failed": "Erro de conexão. Verifique sua internet.",
      "auth/invalid-credential": "Credenciais inválidas.",
      "auth/operation-not-allowed": "Operação não permitida.",
      "auth/requires-recent-login": "Por segurança, faça login novamente.",
    };

    return errorMessages[errorCode] || "Erro de autenticação. Tente novamente.";
  }
}

// Instância singleton
export const authService = AuthService.getInstance();

// Utilitários
export const requireAuth = (callback: () => void) => {
  if (authService.isAuthenticated()) {
    callback();
  } else {
    // Redirecionar para login ou mostrar modal
    console.warn("Usuário não autenticado");
  }
};

export const requireAdmin = (callback: () => void) => {
  const user = authService.getCurrentUser();
  if (user && user.email?.includes("@admin.")) {
    callback();
  } else {
    console.warn("Acesso negado: usuário não é admin");
  }
};
