import { io, Socket } from 'socket.io-client';
import logger from './logger';

// Definición del tiempo de espera para reconexión progresiva
const RECONNECTION_DELAYS = [1000, 2000, 5000, 10000, 30000]; // milisegundos

interface DepartmentUpdate {
  id: number;
  name: string;
  status: 'Available' | 'Busy' | 'Away';
  [key: string]: any;
}

interface CallEvent {
  departmentId: number;
  from: string;
  room: string;
  timestamp: string;
  [key: string]: any;
}

// Opciones singleton para el cliente
let socket: Socket | null = null;
let isConnecting = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Inicializa y conecta el cliente WebSocket
 * @returns El cliente Socket.io
 */
export function connectWebSocket(): Socket {
  if (socket) return socket;
  if (isConnecting) {
    logger.debug('Conexión WebSocket ya en progreso', 'WebSocketClient');
    return getOrCreateSocketStub();
  }
  
  isConnecting = true;
  clearReconnectTimer();

  try {
    // Determina la URL del servidor WebSocket basado en la URL actual
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}`;
    
    logger.info(`Conectando a WebSocket: ${wsUrl}`, 'WebSocketClient');
    
    // Crear instancia de Socket.io
    socket = io(wsUrl, {
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      timeout: 10000,
      transports: ['websocket', 'polling']
    });
    
    // Configurar manejadores de eventos básicos
    socket.on('connect', () => {
      logger.info('Conectado al servidor WebSocket', 'WebSocketClient');
      reconnectAttempts = 0;
      isConnecting = false;
    });
    
    socket.on('connect_error', (error) => {
      logger.error('Error de conexión WebSocket', error instanceof Error ? error : new Error(String(error)), 'WebSocketClient');
      reconnectAttempts++;
      
      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        logger.warn(`Máximo de reconexiones (${MAX_RECONNECT_ATTEMPTS}) alcanzado`, 'WebSocketClient');
        return;
      }
      
      // Programar reconexión con retardo progresivo
      const delay = RECONNECTION_DELAYS[Math.min(reconnectAttempts - 1, RECONNECTION_DELAYS.length - 1)];
      logger.info(`Reintentando conexión en ${delay}ms (intento ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`, 'WebSocketClient');
      
      clearReconnectTimer();
      reconnectTimer = setTimeout(() => {
        if (socket) {
          socket.connect();
        }
      }, delay);
    });
    
    socket.on('disconnect', (reason) => {
      logger.warn(`Desconectado del servidor WebSocket: ${reason}`, 'WebSocketClient');
      if (reason === 'io server disconnect') {
        // Reconectar manualmente si el servidor cerró la conexión
        socket?.connect();
      }
    });
    
    return socket;
  } catch (error) {
    isConnecting = false;
    logger.error('Error al inicializar WebSocket', error instanceof Error ? error : new Error(String(error)), 'WebSocketClient');
    throw error;
  }
}

/**
 * Registra una sala específica para recibir actualizaciones
 * @param roomType Tipo de sala ('portero' o 'department')
 * @param id Identificador (solo para departamentos)
 */
export function joinRoom(roomType: 'portero' | 'department', id?: number): void {
  if (!socket) {
    logger.error('Intentando unirse a una sala sin conexión WebSocket', new Error('No hay conexión WebSocket activa'), 'WebSocketClient');
    return;
  }
  
  const room = roomType === 'portero' ? 'portero' : `department-${id}`;
  socket.emit('join-room', room);
  logger.info(`Unido a sala WebSocket: ${room}`, 'WebSocketClient');
}

/**
 * Registra un manejador para actualizaciones de departamentos
 * @param callback Función a llamar cuando se recibe una actualización
 * @returns Función para cancelar la suscripción
 */
export function onDepartmentUpdate(callback: (update: DepartmentUpdate) => void): () => void {
  if (!socket) {
    logger.error('Intentando suscribirse a eventos sin conexión WebSocket', new Error('No hay conexión WebSocket activa'), 'WebSocketClient');
    return () => {};
  }
  
  socket.on('department-update', callback);
  
  // Retornar función para cancelar suscripción
  return () => {
    socket?.off('department-update', callback);
  };
}

/**
 * Registra un manejador para eventos de llamada entrante
 * @param callback Función a llamar cuando se recibe una llamada
 * @returns Función para cancelar la suscripción
 */
export function onIncomingCall(callback: (call: CallEvent) => void): () => void {
  if (!socket) {
    logger.error('Intentando suscribirse a eventos sin conexión WebSocket', new Error('No hay conexión WebSocket activa'), 'WebSocketClient');
    return () => {};
  }
  
  socket.on('incoming-call', callback);
  
  // Retornar función para cancelar suscripción
  return () => {
    socket?.off('incoming-call', callback);
  };
}

/**
 * Registra un manejador para eventos de fin de llamada
 * @param callback Función a llamar cuando termina una llamada
 * @returns Función para cancelar la suscripción
 */
export function onCallEnded(callback: (call: CallEvent) => void): () => void {
  if (!socket) {
    logger.error('Intentando suscribirse a eventos sin conexión WebSocket', new Error('No hay conexión WebSocket activa'), 'WebSocketClient');
    return () => {};
  }
  
  socket.on('call-ended', callback);
  
  // Retornar función para cancelar suscripción
  return () => {
    socket?.off('call-ended', callback);
  };
}

/**
 * Desconecta el cliente WebSocket
 */
export function disconnectWebSocket(): void {
  if (!socket) return;
  
  clearReconnectTimer();
  socket.disconnect();
  socket = null;
  isConnecting = false;
  reconnectAttempts = 0;
  logger.info('Cliente WebSocket desconectado', 'WebSocketClient');
}

/**
 * Limpia el temporizador de reconexión si existe
 */
function clearReconnectTimer(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

/**
 * Crea un objeto Socket stub para devolver cuando hay una conexión en progreso
 * Esto evita errores cuando se intenta usar el socket antes de que esté listo
 */
function getOrCreateSocketStub(): Socket {
  // Crear un objeto que imita la interfaz de Socket pero no hace nada
  const socketStub = {
    on: () => (() => {}),
    off: () => (() => {}),
    emit: () => false,
    connect: () => {},
    disconnect: () => {}
  } as unknown as Socket;
  
  return socketStub;
}
