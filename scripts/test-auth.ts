// Script de teste de autenticação para o admin
import { authService } from "../src/lib/auth";

async function testAuth() {
  console.log("=== TESTE DE AUTENTICAÇÃO ADMIN ===");

  try {
    // Testar estado inicial
    console.log("Estado inicial:", authService.getCurrentState());

    // Testar login (você precisará de credenciais válidas)
    console.log("\nTestando login...");
    console.log(
      'Para testar, use: authService.login({ email: "admin@test.com", password: "password" })'
    );

    // Testar logout
    console.log("\nTestando logout...");
    console.log("Para testar, use: authService.logout()");

    console.log("\n=== TESTE CONCLUÍDO ===");
  } catch (error) {
    console.error("Erro no teste:", error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  testAuth().catch(console.error);
}

export { testAuth };
