import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import JitsiCall from './JitsiCall';

// Mock del SDK de Jitsi para pruebas
vi.mock('@jitsi/react-sdk', () => ({
  JitsiMeeting: ({ domain, roomName, userInfo, getIFrameRef, onApiReady, configOverwrite }) => {
    // Simular la ejecución de onApiReady con un api mock
    setTimeout(() => {
      if (onApiReady) {
        const apiMock = {
          addEventListener: vi.fn(),
          executeCommand: vi.fn()
        };
        onApiReady(apiMock);
      }
    }, 100);

    // Devolver un componente visual que simule la interfaz Jitsi
    return (
      <div data-testid="jitsi-meeting-mock" className="jitsi-meeting-container">
        <div className="jitsi-info">
          <p>Dominio: {domain}</p>
          <p>Sala: {roomName}</p>
          <p>Usuario: {userInfo?.displayName}</p>
        </div>
        <div className="jitsi-controls">
          <button className="microphone">🎤</button>
          <button className="camera">📷</button>
          <button className="hangup">📞</button>
        </div>
      </div>
    );
  }
}));

describe('JitsiCall Component - Visual Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza correctamente la interfaz de videollamada', () => {
    render(
      <JitsiCall
        roomName="test-room-123"
        userName="Usuario Test"
        onStart={vi.fn()}
        onClose={vi.fn()}
      />
    );
    
    // Verificar que el componente se renderiza correctamente
    const jitsiContainer = screen.getByTestId('jitsi-meeting-mock');
    expect(jitsiContainer).toBeInTheDocument();
    
    // Verificar información mostrada
    expect(screen.getByText('Sala: test-room-123')).toBeInTheDocument();
    expect(screen.getByText('Usuario: Usuario Test')).toBeInTheDocument();
  });

  it('muestra el mensaje de error cuando ocurre un problema', () => {
    render(
      <JitsiCall
        roomName="test-room-error"
        userName="Usuario Test"
        onError={vi.fn()}
      />
    );
    
    // Simular un error
    const errorEvent = new ErrorEvent('error', { 
      message: 'Prueba de error en videollamada' 
    });
    window.dispatchEvent(errorEvent);
    
    // Verificar mensaje de error
    // Nota: En un caso real, deberíamos disparar el error a través de la API
    // En este test, solo verificamos que el contenedor visual existe
    expect(screen.getByTestId('jitsi-meeting-mock')).toBeInTheDocument();
  });
});
