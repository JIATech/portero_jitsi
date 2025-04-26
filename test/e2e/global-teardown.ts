/**
 * Limpieza global para todas las pruebas E2E
 */
import type { FullConfig } from '@playwright/test';
import { teardownTestDatabase } from './setup/db-setup';

/**
 * Se ejecuta una vez después de todas las pruebas
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Iniciando limpieza global de recursos');
  
  // Limpiar recursos de base de datos
  await teardownTestDatabase();
  
  console.log('✅ Limpieza global completada');
}

export default globalTeardown;
