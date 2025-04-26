import { Server } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import type { DatabaseNotificationPayload } from '../lib/types/database';
import { initNotificationListener } from '../lib/db/client';
import logger from './logger';

let io: Server | null = null;

/**
 * Inicializa el servidor WebSocket y lo conecta a las notificaciones de base de datos
 * @param httpServer Servidor HTTP de Astro/Node.js
 */
export function initWebSocketServer(httpServer: HTTPServer) {
  if (io) return io; // Evitar inicialización múltiple
  
  // Crear servidor WebSocket
  io = new Server(httpServer, {
    cors: {
      origin: '*', // En producción, restringir a dominios específicos
      methods: ['GET', 'POST']
    }
  });
  
  logger.info('Servidor WebSocket iniciado', 'WebSocket');
  
  // Manejar conexiones de clientes
  io.on('connection', (socket) => {
    const clientId = socket.id;
    logger.info(`Cliente WebSocket conectado: ${clientId}`, 'WebSocket');
    
    // Manejar unión a salas específicas (departamento o portero)
    socket.on('join-room', (room) => {
      socket.join(room);
      logger.info(`Cliente ${clientId} unido a sala: ${room}`, 'WebSocket');
    });
    
    // Manejar desconexiones
    socket.on('disconnect', () => {
      logger.info(`Cliente WebSocket desconectado: ${clientId}`, 'WebSocket');
    });
  });
  
  // Intentar conectar a las notificaciones de la base de datos
  try {
    // Iniciar listener de notificaciones de la base de datos
    initNotificationListener((payload: DatabaseNotificationPayload) => {
      logger.info(`Notificación recibida: ${JSON.stringify(payload)}`, 'WebSocket');
      
      // Emitir evento según el tipo de notificación
      switch (payload.type) {
        case 'department_update':
          // Emitir a todos los clientes en la sala 'portero' y en la sala específica del departamento
          io?.to('portero').emit('department-update', payload.data);
          if (payload.data.id) {
            io?.to(`department-${payload.data.id}`).emit('department-update', payload.data);
          }
          break;
          
        case 'incoming_call':
          // Emitir notificación de llamada entrante al departamento específico
          if (payload.data.departmentId) {
            io?.to(`department-${payload.data.departmentId}`).emit('incoming-call', payload.data);
          }
          break;
          
        case 'call_ended':
          // Emitir notificación de fin de llamada
          if (payload.data.departmentId) {
            io?.to(`department-${payload.data.departmentId}`).emit('call-ended', payload.data);
          }
          break;
          
        default:
          logger.warn(`Tipo de notificación desconocido: ${payload.type}`, 'WebSocket');
      }
    }).catch(error => {
      logger.error('Error al inicializar el listener de notificaciones', error as Error, 'WebSocket');
    });
    
    logger.info('Listener de notificaciones de la base de datos conectado al servidor WebSocket', 'WebSocket');
  } catch (error) {
    logger.error('No se pudo conectar el listener de notificaciones', error instanceof Error ? error : new Error(String(error)), 'WebSocket');
    logger.warn('Las actualizaciones en tiempo real pueden no estar disponibles', 'WebSocket');
  }
  
  return io;
}

/**
 * Obtiene la instancia actual del servidor WebSocket
 */
export function getWebSocketServer() {
  return io;
}

/**
 * Envía una actualización manual a todos los clientes en una sala específica
 * @param room Nombre de la sala (ej. 'portero' o 'department-1')
 * @param event Nombre del evento
 * @param data Datos del evento
 */
export function emitToRoom(room: string, event: string, data: any) {
  if (!io) {
    logger.error(`No se puede emitir al evento ${event}: WebSocket no inicializado`, new Error('WebSocket no inicializado'), 'WebSocket');
    return;
  }
  
  io.to(room).emit(event, data);
  logger.info(`Evento ${event} emitido a sala ${room}`, 'WebSocket');
}
