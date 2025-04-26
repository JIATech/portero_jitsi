/**
 * Configuración global para todas las pruebas E2E
 */
import type { FullConfig } from '@playwright/test';
import { setupTestDatabase } from './setup/db-setup';

/**
 * Se ejecuta una vez antes de todas las pruebas
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Iniciando configuración global para pruebas E2E');
  
  // Inicializar la base de datos SQLite en memoria para tests
  const dbSetupResult = await setupTestDatabase();
  
  if (!dbSetupResult) {
    console.error('❌ Error crítico: No se pudo inicializar la base de datos de prueba');
    process.exit(1);
  }
  
  console.log('✅ Base de datos SQLite en memoria inicializada correctamente');
  console.log('✅ Configuración global completada');
}

export default globalSetup;
