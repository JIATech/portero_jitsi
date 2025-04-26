import { vi } from 'vitest';
import type { Socket } from 'socket.io-client';

/**
 * Mock para emular el comportamiento del cliente de WebSocket
 * en entornos de prueba, permitiendo simular eventos y conexiones.
 */
export class WebSocketClientMock {
  private eventHandlers: Record<string, Array<(data: any) => void>> = {};
  private roomsJoined: string[] = [];
  connected: boolean = true;

  // Métodos para emular el comportamiento del cliente Socket.io
  on(event: string, callback: (data: any) => void) {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(callback);
    return this;
  }

  off(event: string, callback?: (data: any) => void) {
    if (!callback) {
      delete this.eventHandlers[event];
    } else if (this.eventHandlers[event]) {
      this.eventHandlers[event] = this.eventHandlers[event].filter(
        handler => handler !== callback
      );
    }
    return this;
  }

  emit(event: string, ...args: any[]) {
    return this;
  }

  // Método para simular recepción de eventos desde el servidor
  triggerEvent(event: string, data: any) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(callback => callback(data));
    }
  }

  // Mantener registro de las salas a las que se ha unido
  joinRoom(room: string) {
    this.roomsJoined.push(room);
    return this;
  }

  getRoomsJoined() {
    return [...this.roomsJoined];
  }

  // Simular desconexión
  disconnect() {
    this.connected = false;
    this.triggerEvent('disconnect', {});
    return this;
  }

  // Simular reconexión
  reconnect() {
    this.connected = true;
    this.triggerEvent('connect', {});
    return this;
  }

  // Resetear estado entre tests
  reset() {
    this.eventHandlers = {};
    this.roomsJoined = [];
    this.connected = true;
  }
}

// Crear instancia del mock
export const webSocketClientMock = new WebSocketClientMock();

// Funciones de mock para reemplazar las del servicio real
export const connectWebSocketMock = vi.fn().mockImplementation(() => webSocketClientMock as unknown as Socket);
export const joinRoomMock = vi.fn().mockImplementation((roomType: 'portero' | 'department', id?: number) => {
  const roomName = id ? `${roomType}_${id}` : roomType;
  webSocketClientMock.joinRoom(roomName);
});
export const onDepartmentUpdateMock = vi.fn().mockImplementation((callback: (update: any) => void) => {
  webSocketClientMock.on('department_update', callback);
  return () => webSocketClientMock.off('department_update', callback);
});
export const onIncomingCallMock = vi.fn().mockImplementation((callback: (callData: any) => void) => {
  webSocketClientMock.on('incoming_call', callback);
  return () => webSocketClientMock.off('incoming_call', callback);
});
export const onCallEndedMock = vi.fn().mockImplementation((callback: (callData: any) => void) => {
  webSocketClientMock.on('call_ended', callback);
  return () => webSocketClientMock.off('call_ended', callback);
});
