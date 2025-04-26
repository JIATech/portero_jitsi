/**
 * Configuración de base de datos SQLite en memoria para pruebas E2E
 */
import { initializeDatabase } from '../../../src/lib/db/client';
import logger from '../../../src/services/logger';

/**
 * Inicializa una base de datos SQLite en memoria con datos de prueba
 */
export async function setupTestDatabase() {
  try {
    // La ruta a SQLite en memoria está definida en .env.test como :memory:
    const initialized = await initializeDatabase();
    
    if (!initialized) {
      throw new Error('No se pudo inicializar la base de datos para pruebas');
    }
    
    logger.info('Base de datos SQLite en memoria inicializada para tests', 'Test');
    return true;
  } catch (error) {
    logger.error(`Error preparando la base de datos para tests:`, error instanceof Error ? error : new Error(String(error)), 'Test');
    return false;
  }
}

/**
 * Limpia los recursos de la base de datos después de las pruebas
 */
export async function teardownTestDatabase() {
  // En SQLite en memoria, no es necesario hacer una limpieza explícita
  // ya que la memoria se libera cuando termina el proceso
  logger.info('Limpieza de base de datos completada', 'Test');
  return true;
}
