import logger from './logger';
import { connectWebSocket, joinRoom, onIncomingCall, onCallEnded } from './websocket-client';

interface CallOptions {
  fromId: number | string;
  fromName: string;
  toDepartmentId: number;
  toDepartmentName: string;
}

interface CallState {
  isInCall: boolean;
  activeCallData?: {
    roomName: string;
    remotePartyName: string;
    remotePartyId: number | string;
    startTime: Date;
    isIncoming: boolean;
  };
}

// State management
const callState: CallState = {
  isInCall: false,
  activeCallData: undefined
};

// Event listeners
const listeners: {
  onIncomingCall: Array<(from: string, roomName: string, departmentId: number) => void>;
  onCallEnded: Array<(roomName: string) => void>;
  onCallStarted: Array<(roomName: string, withParty: string) => void>;
} = {
  onIncomingCall: [],
  onCallEnded: [],
  onCallStarted: []
};

/**
 * Inicializa el servicio de llamadas y las suscripciones a eventos WebSocket
 * @param userType Tipo de usuario ('portero' o 'department')
 * @param id Identificador del usuario (solo necesario para departamentos)
 */
export function initCallService(userType: 'portero' | 'department', id?: number): void {
  try {
    // Conectar al WebSocket si aún no está conectado
    const socket = connectWebSocket();
    
    // Unirse a la sala correspondiente
    joinRoom(userType, id);
    
    // Suscribirse a eventos de llamadas entrantes
    onIncomingCall((callData) => {
      // Si ya estamos en una llamada, ignoramos la nueva
      if (callState.isInCall) {
        logger.warn(`Llamada entrante ignorada: ya existe una llamada activa`, 'CallService');
        return;
      }
      
      // Verificar que la llamada es para este usuario
      if (userType === 'department' && callData.departmentId !== id) {
        return;
      }
      
      logger.info(`Llamada entrante de ${callData.from} en sala ${callData.room}`, 'CallService');
      
      // Actualizar estado
      callState.isInCall = true;
      callState.activeCallData = {
        roomName: callData.room,
        remotePartyName: callData.from,
        remotePartyId: callData.fromId || 0,
        startTime: new Date(),
        isIncoming: true
      };
      
      // Notificar a los listeners
      notifyIncomingCall(callData.from, callData.room, callData.departmentId);
    });
    
    // Suscribirse a eventos de fin de llamada
    onCallEnded((callData) => {
      // Verificar que la llamada finalizada es la actual
      if (!callState.isInCall || !callState.activeCallData) {
        return;
      }
      
      // Verificar que es la misma sala
      if (callState.activeCallData.roomName !== callData.room) {
        return;
      }
      
      logger.info(`Llamada finalizada en sala ${callData.room}`, 'CallService');
      
      // Actualizar estado
      const roomName = callState.activeCallData.roomName;
      callState.isInCall = false;
      callState.activeCallData = undefined;
      
      // Notificar a los listeners
      notifyCallEnded(roomName);
    });
    
    logger.info(`Servicio de llamadas inicializado para ${userType}${id ? ` ${id}` : ''}`, 'CallService');
  } catch (error) {
    logger.error('Error al inicializar servicio de llamadas', error instanceof Error ? error : new Error(String(error)), 'CallService');
  }
}

/**
 * Inicia una llamada a un departamento
 * @param options Opciones de la llamada
 */
export async function startCall(options: CallOptions): Promise<boolean> {
  try {
    // Si ya estamos en una llamada, no permitimos iniciar otra
    if (callState.isInCall) {
      logger.warn('No se puede iniciar una llamada: ya existe una llamada activa', 'CallService');
      return false;
    }
    
    // Generar nombre de sala único
    const roomName = `portero_call_${options.fromId}_${options.toDepartmentId}_${Date.now()}`;
    
    // Enviar solicitud de llamada al servidor
    const response = await fetch('/api/call/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fromId: options.fromId,
        fromName: options.fromName,
        toDepartmentId: options.toDepartmentId,
        toDepartmentName: options.toDepartmentName,
        roomName
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      logger.error(`Error al iniciar llamada: ${error.message || 'Error desconocido'}`, 'CallService');
      return false;
    }
    
    // Actualizar estado
    callState.isInCall = true;
    callState.activeCallData = {
      roomName,
      remotePartyName: options.toDepartmentName,
      remotePartyId: options.toDepartmentId,
      startTime: new Date(),
      isIncoming: false
    };
    
    // Notificar a los listeners
    notifyCallStarted(roomName, options.toDepartmentName);
    
    logger.info(`Llamada iniciada a ${options.toDepartmentName} en sala ${roomName}`, 'CallService');
    return true;
  } catch (error) {
    logger.error('Error al iniciar llamada', error instanceof Error ? error : new Error(String(error)), 'CallService');
    return false;
  }
}

/**
 * Finaliza la llamada activa
 */
export async function endCall(): Promise<boolean> {
  try {
    // Si no hay llamada activa, no hacemos nada
    if (!callState.isInCall || !callState.activeCallData) {
      logger.warn('No hay llamada activa para finalizar', 'CallService');
      return false;
    }
    
    const roomName = callState.activeCallData.roomName;
    
    // Enviar solicitud de fin de llamada al servidor
    const response = await fetch('/api/call/end', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        roomName
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      logger.error(`Error al finalizar llamada: ${error.message || 'Error desconocido'}`, 'CallService');
      return false;
    }
    
    // Actualizar estado
    callState.isInCall = false;
    callState.activeCallData = undefined;
    
    // Notificar a los listeners
    notifyCallEnded(roomName);
    
    logger.info(`Llamada finalizada en sala ${roomName}`, 'CallService');
    return true;
  } catch (error) {
    logger.error('Error al finalizar llamada', error instanceof Error ? error : new Error(String(error)), 'CallService');
    return false;
  }
}

/**
 * Acepta una llamada entrante
 */
export function acceptCall(): boolean {
  // Si no hay llamada entrante, no hacemos nada
  if (!callState.isInCall || !callState.activeCallData || !callState.activeCallData.isIncoming) {
    logger.warn('No hay llamada entrante para aceptar', 'CallService');
    return false;
  }
  
  const roomName = callState.activeCallData.roomName;
  const fromName = callState.activeCallData.remotePartyName;
  
  // Notificar a los listeners
  notifyCallStarted(roomName, fromName);
  
  logger.info(`Llamada aceptada de ${fromName} en sala ${roomName}`, 'CallService');
  return true;
}

/**
 * Rechaza una llamada entrante
 */
export async function rejectCall(): Promise<boolean> {
  try {
    // Si no hay llamada entrante, no hacemos nada
    if (!callState.isInCall || !callState.activeCallData || !callState.activeCallData.isIncoming) {
      logger.warn('No hay llamada entrante para rechazar', 'CallService');
      return false;
    }
    
    const roomName = callState.activeCallData.roomName;
    
    // Enviar solicitud de rechazo de llamada al servidor
    const response = await fetch('/api/call/reject', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        roomName
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      logger.error(`Error al rechazar llamada: ${error.message || 'Error desconocido'}`, 'CallService');
      return false;
    }
    
    // Actualizar estado
    callState.isInCall = false;
    callState.activeCallData = undefined;
    
    // Notificar a los listeners
    notifyCallEnded(roomName);
    
    logger.info(`Llamada rechazada en sala ${roomName}`, 'CallService');
    return true;
  } catch (error) {
    logger.error('Error al rechazar llamada', error instanceof Error ? error : new Error(String(error)), 'CallService');
    return false;
  }
}

/**
 * Obtiene el estado actual de la llamada
 */
export function getCallState(): CallState {
  return { ...callState };
}

/**
 * Registra un listener para eventos de llamada entrante
 * @param listener Función a ejecutar cuando se recibe una llamada
 */
export function addIncomingCallListener(
  listener: (from: string, roomName: string, departmentId: number) => void
): () => void {
  listeners.onIncomingCall.push(listener);
  return () => {
    const index = listeners.onIncomingCall.indexOf(listener);
    if (index !== -1) {
      listeners.onIncomingCall.splice(index, 1);
    }
  };
}

/**
 * Registra un listener para eventos de fin de llamada
 * @param listener Función a ejecutar cuando finaliza una llamada
 */
export function addCallEndedListener(
  listener: (roomName: string) => void
): () => void {
  listeners.onCallEnded.push(listener);
  return () => {
    const index = listeners.onCallEnded.indexOf(listener);
    if (index !== -1) {
      listeners.onCallEnded.splice(index, 1);
    }
  };
}

/**
 * Registra un listener para eventos de inicio de llamada
 * @param listener Función a ejecutar cuando inicia una llamada
 */
export function addCallStartedListener(
  listener: (roomName: string, withParty: string) => void
): () => void {
  listeners.onCallStarted.push(listener);
  return () => {
    const index = listeners.onCallStarted.indexOf(listener);
    if (index !== -1) {
      listeners.onCallStarted.splice(index, 1);
    }
  };
}

// Funciones internas para notificar a los listeners
function notifyIncomingCall(from: string, roomName: string, departmentId: number): void {
  listeners.onIncomingCall.forEach(listener => {
    try {
      listener(from, roomName, departmentId);
    } catch (error) {
      logger.error('Error en listener de llamada entrante', error instanceof Error ? error : new Error(String(error)), 'CallService');
    }
  });
}

function notifyCallEnded(roomName: string): void {
  listeners.onCallEnded.forEach(listener => {
    try {
      listener(roomName);
    } catch (error) {
      logger.error('Error en listener de fin de llamada', error instanceof Error ? error : new Error(String(error)), 'CallService');
    }
  });
}

function notifyCallStarted(roomName: string, withParty: string): void {
  listeners.onCallStarted.forEach(listener => {
    try {
      listener(roomName, withParty);
    } catch (error) {
      logger.error('Error en listener de inicio de llamada', error instanceof Error ? error : new Error(String(error)), 'CallService');
    }
  });
}
