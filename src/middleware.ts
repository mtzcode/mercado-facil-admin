import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rotas protegidas que precisam de autenticação
const protectedRoutes = ['/', '/clientes', '/produtos', '/categorias', '/pedidos', '/empresa'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Verificar se é uma rota protegida
  const isProtectedRoute = protectedRoutes.some(route => {
    if (route === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(route);
  });
  
  // Verificar se o usuário está autenticado através do token
  const token = request.cookies.get('admin-token')?.value;
  const isAuthenticated = !!token;
  
  // Se está tentando acessar uma rota protegida sem estar autenticado
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    // Adicionar a URL de retorno como parâmetro
    loginUrl.searchParams.set('returnUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Se está autenticado e tentando acessar a página de login, redirecionar para a raiz
  if (isAuthenticated && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  return NextResponse.next();
}

// Configurar em quais rotas o middleware deve ser executado
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};