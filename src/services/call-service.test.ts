import { describe, it, expect, vi, beforeEach } from 'vitest';
import { webSocketClientMock } from '../../test/mocks/webSocketMock';
import { departmentAPIMock } from '../../test/mocks/dbClientMock';

// Mock de los módulos de dependencia
vi.mock('../lib/db/client', () => ({
  departmentAPI: departmentAPIMock
}));

vi.mock('./websocket-client', () => ({
  connectWebSocket: () => webSocketClientMock
}));

// Importar el módulo después de mockear sus dependencias
import { 
  startCall, 
  endCall, 
  rejectCall, 
  addIncomingCallListener, 
  removeIncomingCallListener,
  getCurrentCallState
} from './call-service';

describe('Call Service', () => {
  beforeEach(() => {
    // Limpiar mocks antes de cada test
    vi.clearAllMocks();
    
    // Resetear el estado del mock de WebSocket
    webSocketClientMock.reset();
  });

  describe('startCall', () => {
    it('debería iniciar una llamada a un departamento correctamente', async () => {
      // Preparar
      departmentAPIMock.getDepartmentById.mockResolvedValueOnce({
        id: 1,
        name: 'Departamento 101',
        status: 'Available'
      });
      
      // Ejecutar
      const result = await startCall({
        to: 1,
        from: 'Portero',
        roomName: 'test-room-123'
      });
      
      // Verificar
      expect(result).toBe(true);
      expect(departmentAPIMock.getDepartmentById).toHaveBeenCalledWith(1);
      expect(departmentAPIMock.setIncomingCall).toHaveBeenCalledWith(1, 'Portero', 'test-room-123');
    });

    it('debería fallar si el departamento no existe', async () => {
      // Preparar
      departmentAPIMock.getDepartmentById.mockResolvedValueOnce(null);
      
      // Ejecutar
      const result = await startCall({
        to: 999,
        from: 'Portero',
        roomName: 'test-room-456'
      });
      
      // Verificar
      expect(result).toBe(false);
      expect(departmentAPIMock.getDepartmentById).toHaveBeenCalledWith(999);
      expect(departmentAPIMock.setIncomingCall).not.toHaveBeenCalled();
    });

    it('debería fallar si el departamento está en estado ocupado', async () => {
      // Preparar
      departmentAPIMock.getDepartmentById.mockResolvedValueOnce({
        id: 2,
        name: 'Departamento 102',
        status: 'Busy'
      });
      
      // Ejecutar
      const result = await startCall({
        to: 2,
        from: 'Portero',
        roomName: 'test-room-789'
      });
      
      // Verificar
      expect(result).toBe(false);
      expect(departmentAPIMock.getDepartmentById).toHaveBeenCalledWith(2);
      expect(departmentAPIMock.setIncomingCall).not.toHaveBeenCalled();
    });
  });

  describe('endCall', () => {
    it('debería finalizar una llamada activa', async () => {
      // Configurar estado inicial
      const mockDepartmentId = 1;
      
      // Simular una llamada en curso
      departmentAPIMock.clearIncomingCall.mockResolvedValueOnce({
        id: mockDepartmentId,
        name: 'Departamento 101',
        status: 'Busy',
        incoming_call: null
      });
      
      // Ejecutar
      const result = await endCall();
      
      // Verificar
      expect(result).toBe(true);
    });
  });

  describe('rejectCall', () => {
    it('debería rechazar una llamada entrante', async () => {
      // Configurar estado inicial
      const mockDepartmentId = 3;
      
      // Simular una llamada entrante
      departmentAPIMock.clearIncomingCall.mockResolvedValueOnce({
        id: mockDepartmentId,
        name: 'Departamento 103',
        status: 'Available',
        incoming_call: null
      });
      
      // Ejecutar
      const result = await rejectCall();
      
      // Verificar
      expect(result).toBe(true);
    });
  });

  describe('call event listeners', () => {
    it('debería registrar y llamar a los listeners de llamada entrante', () => {
      // Preparar
      const mockListener = vi.fn();
      const callData = { from: 'Portero', roomName: 'test-room-123' };
      
      // Registrar listener
      const removeListener = addIncomingCallListener(mockListener);
      
      // Disparar evento
      webSocketClientMock.triggerEvent('incoming_call', callData);
      
      // Verificar
      expect(mockListener).toHaveBeenCalledWith(callData);
      
      // Quitar listener
      removeListener();
      
      // Disparar evento de nuevo, no debería llamar al listener
      webSocketClientMock.triggerEvent('incoming_call', callData);
      
      // El listener solo debería haber sido llamado una vez
      expect(mockListener).toHaveBeenCalledTimes(1);
    });
  });
});
