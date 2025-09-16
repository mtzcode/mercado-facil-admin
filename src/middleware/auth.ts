import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Inicializar Firebase Admin apenas se não estiver inicializado
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore();

export async function authMiddleware(request: NextRequest) {
  const token = request.cookies.get("admin-token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);
    
    // Verificar se é um usuário admin válido no banco de dados
    const adminDoc = await db
      .collection("admin_users")
      .where("email", "==", decodedToken.email)
      .where("ativo", "==", true)
      .limit(1)
      .get();
    
    if (adminDoc.empty) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
    
    const adminData = adminDoc.docs[0].data();
    
    // Verificar se a conta está ativa
    if (!adminData.ativo) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    // Adicionar informações do usuário aos headers
    const response = NextResponse.next();
    response.headers.set("x-user-id", decodedToken.uid);
    response.headers.set("x-user-email", decodedToken.email || "");
    response.headers.set("x-admin-id", adminDoc.docs[0].id);
    response.headers.set("x-admin-role", adminData.role);
    response.headers.set("x-admin-permissions", JSON.stringify(adminData.permissions));
    
    return response;
  } catch (error) {
    console.error("Erro na verificação do token:", error);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

// Hook para verificar autenticação em componentes
export function useRequireAuth() {
  // TODO: Implementar hook de autenticação quando necessário
  return { user: null, loading: false, error: null };
}
