/**
 * Cliente de base de datos para la aplicación Portero Virtual
 * Utiliza SQLite como base de datos principal por su simplicidad, robustez y facilidad de despliegue
 */

import Database from 'better-sqlite3';
import type { DepartmentRow, DatabaseNotificationPayload } from '../types/database';
import logger from '../../services/logger';
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';

// Configuración para SQLite
const sqlitePath = process.env.SQLITE_PATH || './data/local.db';
let sqliteDb: Database.Database | null = null;

/**
 * Inicializa la conexión a SQLite (base de datos principal)
 */
export async function initializeDatabase(): Promise<boolean> {
  try {
    // Verificar directorio de datos
    const dbDir = path.dirname(sqlitePath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
      logger.info(`Directorio de datos creado: ${dbDir}`, 'Database');
    }

    // Configuración y optimización de SQLite
    const sqliteOptions = { 
      verbose: process.env.SQL_DEBUG === 'true' ? console.log : undefined,
      fileMustExist: false // Crear archivo si no existe
    };

    // Cerrar conexión existente si hay una
    if (sqliteDb) {
      try {
        sqliteDb.close();
        logger.info('Conexión SQLite previa cerrada correctamente', 'Database');
      } catch (err) {
        logger.warn('Error al cerrar conexión SQLite previa (ignorado)', 'Database');
      }
    }

    // Conectar a la base de datos con opciones optimizadas
    sqliteDb = new Database(sqlitePath, sqliteOptions);
    logger.debug(`SQLite conectado a: ${sqlitePath}`, 'Database');
    
    // Activar WAL para mejor rendimiento y concurrencia
    sqliteDb.pragma('journal_mode = WAL');
    sqliteDb.pragma('synchronous = NORMAL');
    sqliteDb.pragma('foreign_keys = ON');
    
    // Crear tablas con índices
    sqliteDb.exec(`
      -- Tabla de departamentos
      CREATE TABLE IF NOT EXISTS departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        status TEXT DEFAULT 'Available' CHECK(status IN ('Available', 'Busy', 'Away')),
        incoming_call_from TEXT DEFAULT NULL,
        incoming_call_room TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Índice para búsquedas por nombre
      CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);
      
      -- Tabla de historial de llamadas
      CREATE TABLE IF NOT EXISTS call_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        caller_id TEXT NOT NULL,
        department_id INTEGER,
        room_id TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('connected', 'missed', 'rejected')),
        start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        end_time TIMESTAMP DEFAULT NULL,
        FOREIGN KEY (department_id) REFERENCES departments(id)
      );
      
      -- Índices para consultas frecuentes
      CREATE INDEX IF NOT EXISTS idx_call_history_department_id ON call_history(department_id);
      CREATE INDEX IF NOT EXISTS idx_call_history_status ON call_history(status);
    `);
    
    // Configurar declaraciones preparadas para mejor rendimiento
    prepareStatements();
    
    // Verificar si hay departamentos y agregar algunos ejemplos si está vacía
    const departmentCount = sqliteDb.prepare('SELECT COUNT(*) as count FROM departments').get() as { count: number };
    const count = departmentCount.count;
    
    if (count === 0) {
      logger.info('Inicializando datos de ejemplo en SQLite', 'Database');
      
      // Verificar nuevamente que sqliteDb no sea nulo
      if (!sqliteDb) {
        throw new Error('Error en la conexión a SQLite');
      }
      
      // Guardar una referencia local a sqliteDb para que TypeScript esté seguro de que no es nulo dentro de la función
      const db = sqliteDb;
      
      // Agregar departamentos de ejemplo en una transacción para asegurar atomicidad
      const transaction = db.transaction((departments) => {
        const insert = db.prepare('INSERT INTO departments (name, password, status) VALUES (?, ?, ?)');
        for (const dept of departments) {
          insert.run(dept.name, dept.password, dept.status);
        }
      });
      
      transaction([
        { name: 'Administración', password: 'admin123', status: 'Available' },
        { name: 'Ventas', password: 'ventas123', status: 'Available' },
        { name: 'Soporte', password: 'soporte123', status: 'Available' },
        { name: 'Recursos Humanos', password: 'rrhh123', status: 'Available' }
      ]);
    }
    
    logger.info(`SQLite inicializado con éxito (${count} departamentos existentes)`, 'Database');
    return true;
  } catch (error) {
    logger.error('Error al inicializar SQLite', error as Error, 'Database');
    return false;
  }
}

/**
 * Prepara las consultas SQL más frecuentes para mejorar el rendimiento
 */
function prepareStatements() {
  // Si estamos en una sesión de pruebas o no hay conexión, no preparamos las consultas
  if (!sqliteDb || process.env.NODE_ENV === 'test') return;
  
  try {
    // Volvemos a verificar que sqliteDb no sea null para satisfacer a TypeScript
    if (!sqliteDb) return;
    
    // Estas declaraciones preparadas mejoran significativamente el rendimiento
    // al reutilizar el plan de ejecución de la consulta
    sqliteDb.prepare('SELECT * FROM departments WHERE id = ?');
    sqliteDb.prepare('SELECT * FROM departments WHERE name = ?');
    sqliteDb.prepare('SELECT * FROM departments ORDER BY name');
    sqliteDb.prepare('UPDATE departments SET status = ? WHERE id = ?');
    sqliteDb.prepare('INSERT INTO call_history (caller_id, department_id, room_id, status) VALUES (?, ?, ?, ?)');
    
    logger.debug('Consultas SQL frecuentes preparadas', 'Database');
  } catch (error) {
    logger.warn(`Error al preparar consultas SQL: ${(error as Error).message}`, 'Database');
  }
}

/**
 * Ejecuta una consulta SQL en la base de datos
 */
export async function query(text: string, params: unknown[] = []): Promise<{ rows: unknown[] }> {
  if (!sqliteDb) {
    await initializeDatabase();
  }
  
  try {
    if (!sqliteDb) {
      throw new Error('No se pudo inicializar la conexión a SQLite');
    }
    
    // Adaptar la consulta SQL para SQLite
    const sqliteCompatibleText = text
      .replace(/NOW\(\)/gi, "datetime('now')")
      .replace(/RETURNING \*/gi, "");
    
    const isSelect = sqliteCompatibleText.trim().toUpperCase().startsWith('SELECT');
    
    if (isSelect) {
      // Para consultas SELECT, devolvemos los resultados como un array de objetos
      const stmt = sqliteDb.prepare(sqliteCompatibleText);
      const rows = stmt.all(...params);
      return { rows };
    } else {
      // Para consultas INSERT, UPDATE, DELETE, ejecutamos y retornamos filas afectadas
      const stmt = sqliteDb.prepare(sqliteCompatibleText);
      const info = stmt.run(...params);
      
      // Si es una inserción, intentamos devolver el elemento insertado
      if (sqliteCompatibleText.trim().toUpperCase().startsWith('INSERT')) {
        const lastId = info.lastInsertRowid;
        const table = sqliteCompatibleText.match(/INSERT\s+INTO\s+([^\s(]+)/i)?.[1];
        
        if (table && lastId) {
          const selectStmt = sqliteDb.prepare(`SELECT * FROM ${table} WHERE id = ?`);
          const rows = [selectStmt.get(lastId)];
          return { rows };
        }
      }
      
      return { rows: [] };
    }
  } catch (error) {
    logger.error(`Error en consulta SQLite: ${text}`, error as Error, 'Database');
    throw error;
  }
}

// Tipo para la función callback de notificaciones
type NotificationCallback = (payload: DatabaseNotificationPayload) => void;

// Almacenar los callbacks registrados
const notificationListeners: NotificationCallback[] = [];

/**
 * Inicializa un listener de notificaciones de la base de datos
 * @param callback Función a ejecutar cuando ocurre un cambio
 */
export async function initNotificationListener(callback: NotificationCallback): Promise<{ catch: (errHandler: (error: Error) => void) => void }> {
  // Registrar el callback
  notificationListeners.push(callback);
  
  // Retornar un objeto que simula una promesa con método catch para compatibilidad
  return {
    catch: (errHandler: (error: Error) => void) => {
      // No hay operaciones asíncronas que puedan fallar aquí
    }
  };
}

/**
 * Notifica un cambio en un departamento a través de eventos
 * Esta es una versión simplificada para notificar cambios en SQLite
 */
export async function notifyDepartmentChange(
  operation: 'INSERT' | 'UPDATE' | 'DELETE',
  record: DepartmentRow
): Promise<boolean> {
  logger.info(`Cambio en departamento: ${operation} para ID ${record.id}`, 'Database');
  
  // Crear el payload de notificación
  const payload: DatabaseNotificationPayload = {
    operation,
    record,
    type: 'department_update',
    data: {
      id: record.id,
      name: record.name,
      status: record.status
    }
  };
  
  // Notificar a todos los listeners registrados
  for (const listener of notificationListeners) {
    try {
      listener(payload);
    } catch (error) {
      logger.error('Error al notificar cambio de departamento', error instanceof Error ? error : new Error(String(error)), 'Database');
    }
  }
  
  return true;
}

// API para operaciones con departamentos
export const departmentAPI = {
  /**
   * Obtiene todos los departamentos
   */
  async getAllDepartments(): Promise<DepartmentRow[]> {
    const result = await query('SELECT * FROM departments ORDER BY name');
    return result.rows as DepartmentRow[];
  },

  /**
   * Obtiene un departamento por su ID
   */
  async getDepartmentById(id: number): Promise<DepartmentRow | null> {
    const result = await query('SELECT * FROM departments WHERE id = ?', [id]);
    return (result.rows.length > 0) ? result.rows[0] as DepartmentRow : null;
  },

  /**
   * Obtiene un departamento por su nombre
   */
  async getDepartmentByName(name: string): Promise<DepartmentRow | null> {
    const result = await query('SELECT * FROM departments WHERE name = ?', [name]);
    return (result.rows.length > 0) ? result.rows[0] as DepartmentRow : null;
  },

  /**
   * Crea un nuevo departamento
   */
  async createDepartment(name: string, password: string): Promise<DepartmentRow> {
    try {
      // Verificar si ya existe un departamento con ese nombre
      const existing = await this.getDepartmentByName(name);
      if (existing) {
        throw new Error(`Ya existe un departamento con el nombre '${name}'`);
      }
      
      // Crear el departamento
      const result = await query(
        'INSERT INTO departments (name, password, status) VALUES (?, ?, ?)',
        [name, password, 'Available']
      );
      
      // Notificar el cambio
      if (result.rows.length > 0) {
        await notifyDepartmentChange('INSERT', result.rows[0] as DepartmentRow);
      }
      
      return result.rows[0] as DepartmentRow;
    } catch (error) {
      logger.error(`Error al crear departamento: ${name}`, error as Error, 'Database');
      throw error;
    }
  },

  /**
   * Actualiza el estado de un departamento
   */
  async updateDepartmentStatus(id: number, status: 'Available' | 'Busy' | 'Away'): Promise<DepartmentRow | null> {
    const result = await query(
      'UPDATE departments SET status = ?, updated_at = datetime("now") WHERE id = ?',
      [status, id]
    );
    
    const updated = await this.getDepartmentById(id);
    if (updated) {
      await notifyDepartmentChange('UPDATE', updated);
    }
    
    return updated;
  },

  /**
   * Actualiza el perfil de un departamento (nombre y/o contraseña)
   */
  async updateDepartmentProfile(id: number, name?: string, password?: string): Promise<DepartmentRow | null> {
    // Verificar que el departamento existe
    const dept = await this.getDepartmentById(id);
    if (!dept) {
      return null;
    }
    
    // Verificar si el nuevo nombre ya está en uso
    if (name && name !== dept.name) {
      const existingWithName = await this.getDepartmentByName(name);
      if (existingWithName && existingWithName.id !== id) {
        throw new Error(`Ya existe un departamento con el nombre '${name}'`);
      }
    }
    
    // Construir la consulta de actualización
    let queryText = 'UPDATE departments SET updated_at = datetime("now")';
    const params: unknown[] = [];
    
    if (name) {
      queryText += ', name = ?';
      params.push(name);
    }
    
    if (password) {
      queryText += ', password = ?';
      params.push(password);
    }
    
    queryText += ' WHERE id = ?';
    params.push(id);
    
    // Ejecutar la actualización
    await query(queryText, params);
    
    // Obtener el departamento actualizado
    const updated = await this.getDepartmentById(id);
    if (updated) {
      await notifyDepartmentChange('UPDATE', updated);
    }
    
    return updated;
  },

  /**
   * Registra una llamada entrante para un departamento
   */
  async setIncomingCall(id: number, from: string, room: string): Promise<DepartmentRow | null> {
    const result = await query(
      'UPDATE departments SET incoming_call_from = ?, incoming_call_room = ?, updated_at = datetime("now") WHERE id = ?',
      [from, room, id]
    );
    
    const updated = await this.getDepartmentById(id);
    if (updated) {
      await notifyDepartmentChange('UPDATE', updated);
    }
    
    return updated;
  },

  /**
   * Elimina la llamada entrante de un departamento
   */
  async clearIncomingCall(id: number): Promise<DepartmentRow | null> {
    const result = await query(
      'UPDATE departments SET incoming_call_from = NULL, incoming_call_room = NULL, updated_at = datetime("now") WHERE id = ?',
      [id]
    );
    
    const updated = await this.getDepartmentById(id);
    if (updated) {
      await notifyDepartmentChange('UPDATE', updated);
    }
    
    return updated;
  },

  /**
   * Cuenta el número total de departamentos
   */
  async countDepartments(): Promise<number> {
    const result = await query('SELECT COUNT(*) as count FROM departments');
    return (result.rows[0] as { count: number }).count;
  }
};

// Inicialización automática
initializeDatabase().catch(err => {
  logger.error('Error al inicializar la base de datos', err, 'Database');
});
