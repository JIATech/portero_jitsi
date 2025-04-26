/**
 * Tipos para la estructura de la base de datos SQLite
 */

export interface DepartmentRow {
  id: number;
  name: string;
  password: string;
  status: 'Available' | 'Busy' | 'Away';
  incoming_call: { from: string; room: string } | null;
  created_at?: string; // Fecha de creación como string ISO
}

/**
 * Payload para las notificaciones en tiempo real
 */
export interface DatabaseNotificationPayload {
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  record: DepartmentRow;
  type: string;
  data: {
    id?: number;
    departmentId?: number;
    status?: string;
    name?: string;
    [key: string]: any;
  };
}

/**
 * Tipo para las llamadas entrantes
 */
export interface IncomingCall {
  from: string;
  room: string;
}

/**
 * Tipo para las entradas de log en la aplicación
 */
export interface LogEntry {
  id: number;
  timestamp: string;
  message: string;
  isError?: boolean;
}
