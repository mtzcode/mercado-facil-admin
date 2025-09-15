// Script de migração para o admin
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  writeBatch,
  addDoc,
} from "firebase/firestore";
import { db } from "../src/lib/firebase";

interface MigrationResult {
  success: boolean;
  message: string;
  recordsUpdated: number;
  errors: string[];
}

export class DataMigration {
  private batch = writeBatch(db);
  private batchCount = 0;
  private readonly BATCH_SIZE = 500;

  // Migrar clientes para users
  async migrateClientesToUsers(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      message: "",
      recordsUpdated: 0,
      errors: [],
    };

    try {
      console.log("Iniciando migração de clientes para users...");

      // Buscar todos os clientes
      const clientesSnapshot = await getDocs(collection(db, "clientes"));

      for (const clienteDoc of clientesSnapshot.docs) {
        try {
          const clienteData = clienteDoc.data();

          // Criar documento na coleção users
          const userRef = doc(collection(db, "users"), clienteDoc.id);
          this.batch.set(userRef, {
            ...clienteData,
            telefone: clienteData.whatsapp || clienteData.telefone,
            // Manter compatibilidade
            whatsapp: clienteData.whatsapp || clienteData.telefone,
            updatedAt: new Date(),
          });

          this.batchCount++;

          if (this.batchCount >= this.BATCH_SIZE) {
            await this.batch.commit();
            this.batch = writeBatch(db);
            this.batchCount = 0;
            console.log(`Migrados ${result.recordsUpdated} registros...`);
          }

          result.recordsUpdated++;
        } catch (error: any) {
          result.errors.push(
            `Erro ao migrar cliente ${clienteDoc.id}: ${error.message}`
          );
        }
      }

      // Commit do batch final
      if (this.batchCount > 0) {
        await this.batch.commit();
      }

      result.success = true;
      result.message = `Migração concluída: ${result.recordsUpdated} clientes migrados para users`;
      console.log(result.message);
    } catch (error: any) {
      result.success = false;
      result.message = `Erro na migração: ${error.message}`;
      result.errors.push(error.message);
    }

    return result;
  }

  // Migrar pedidos para usar userId
  async migratePedidosToUserId(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      message: "",
      recordsUpdated: 0,
      errors: [],
    };

    try {
      console.log("Iniciando migração de pedidos para userId...");

      // Buscar pedidos que ainda usam clienteId ou usuarioId
      const pedidosSnapshot = await getDocs(collection(db, "pedidos"));

      for (const pedidoDoc of pedidosSnapshot.docs) {
        try {
          const pedidoData = pedidoDoc.data();

          // Se já tem userId, pular
          if (pedidoData.userId) {
            continue;
          }

          // Determinar userId baseado em clienteId ou usuarioId
          const userId = pedidoData.clienteId || pedidoData.usuarioId;

          if (!userId) {
            result.errors.push(
              `Pedido ${pedidoDoc.id} não tem clienteId nem usuarioId`
            );
            continue;
          }

          // Atualizar pedido com userId
          const pedidoRef = doc(db, "pedidos", pedidoDoc.id);
          this.batch.update(pedidoRef, {
            userId,
            updatedAt: new Date(),
          });

          this.batchCount++;

          if (this.batchCount >= this.BATCH_SIZE) {
            await this.batch.commit();
            this.batch = writeBatch(db);
            this.batchCount = 0;
            console.log(`Migrados ${result.recordsUpdated} pedidos...`);
          }

          result.recordsUpdated++;
        } catch (error: any) {
          result.errors.push(
            `Erro ao migrar pedido ${pedidoDoc.id}: ${error.message}`
          );
        }
      }

      // Commit do batch final
      if (this.batchCount > 0) {
        await this.batch.commit();
      }

      result.success = true;
      result.message = `Migração concluída: ${result.recordsUpdated} pedidos atualizados com userId`;
      console.log(result.message);
    } catch (error: any) {
      result.success = false;
      result.message = `Erro na migração: ${error.message}`;
      result.errors.push(error.message);
    }

    return result;
  }

  // Executar todas as migrações
  async runAllMigrations(): Promise<MigrationResult[]> {
    console.log("Iniciando migração completa dos dados...");

    const results: MigrationResult[] = [];

    // 1. Migrar clientes para users
    results.push(await this.migrateClientesToUsers());

    // 2. Migrar pedidos para userId
    results.push(await this.migratePedidosToUserId());

    console.log("Migração completa finalizada!");
    console.log("Resultados:", results);

    return results;
  }
}

// Função para executar migração
export async function runMigration(): Promise<void> {
  const migration = new DataMigration();
  const results = await migration.runAllMigrations();

  console.log("=== RESULTADOS DA MIGRAÇÃO ===");
  results.forEach((result, index) => {
    console.log(`Migração ${index + 1}:`);
    console.log(`  Sucesso: ${result.success}`);
    console.log(`  Mensagem: ${result.message}`);
    console.log(`  Registros atualizados: ${result.recordsUpdated}`);
    if (result.errors.length > 0) {
      console.log(`  Erros: ${result.errors.join(", ")}`);
    }
    console.log("---");
  });
}

// Executar se chamado diretamente
if (require.main === module) {
  runMigration().catch(console.error);
}
