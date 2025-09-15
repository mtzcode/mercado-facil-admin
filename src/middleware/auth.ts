// Middleware de autenticação para o admin
import { NextRequest, NextResponse } from "next/server";
import { authService } from "../lib/auth";

export function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rotas que não precisam de autenticação
  const publicRoutes = ["/login", "/api/auth"];

  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Verificar se o usuário está autenticado
  const user = authService.getCurrentUser();

  if (!user) {
    // Redirecionar para login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Verificar se é admin (opcional - baseado no email)
  if (!user.email?.includes("@admin.")) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return NextResponse.next();
}

// Hook para verificar autenticação em componentes
export function useRequireAuth() {
  const user = authService.getCurrentUser();
  const loading = authService.isLoading();

  if (loading) {
    return { user: null, loading: true, error: null };
  }

  if (!user) {
    return { user: null, loading: false, error: "Usuário não autenticado" };
  }

  if (!user.email?.includes("@admin.")) {
    return {
      user: null,
      loading: false,
      error: "Acesso negado: usuário não é admin",
    };
  }

  return { user, loading: false, error: null };
}
