import React, { useEffect, useRef, useState } from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import logger from '../services/logger';

interface JitsiCallProps {
  roomName: string;
  userName: string;
  onClose?: () => void;
  onError?: (error: Error) => void;
  onStart?: () => void;
}

/**
 * Componente para integrar videollamadas de Jitsi Meet
 */
export default function JitsiCall({ 
  roomName, 
  userName, 
  onClose, 
  onError, 
  onStart 
}: JitsiCallProps) {
  const apiRef = useRef<any>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApiReady = (api: any) => {
    apiRef.current = api;
    api.addEventListener('videoConferenceJoined', handleCallStarted);
    api.addEventListener('videoConferenceLeft', handleCallEnded);
    api.addEventListener('participantLeft', handleParticipantLeft);
    api.addEventListener('participantJoined', handleParticipantJoined);
    api.addEventListener('audioMuteStatusChanged', handleAudioStatusChange);
    api.addEventListener('videoMuteStatusChanged', handleVideoStatusChange);
  };

  const handleCallStarted = () => {
    logger.info(`Llamada iniciada en sala: ${roomName}`, 'JitsiCall');
    setIsCallActive(true);
    setError(null);
    onStart?.();
  };

  const handleCallEnded = () => {
    logger.info(`Llamada terminada en sala: ${roomName}`, 'JitsiCall');
    setIsCallActive(false);
    onClose?.();
  };

  const handleError = (err: Error) => {
    logger.error('Error en videollamada:', err, 'JitsiCall');
    setError(err.message);
    onError?.(err);
  };

  const handleParticipantJoined = (e: any) => {
    logger.info(`Participante unido a la llamada: ${e.id}`, 'JitsiCall');
  };

  const handleParticipantLeft = (e: any) => {
    logger.info(`Participante abandonó la llamada: ${e.id}`, 'JitsiCall');
  };

  const handleAudioStatusChange = (e: any) => {
    logger.debug(`Estado de audio cambiado: ${e.muted ? 'silenciado' : 'activo'}`, 'JitsiCall');
  };

  const handleVideoStatusChange = (e: any) => {
    logger.debug(`Estado de video cambiado: ${e.muted ? 'cámara apagada' : 'cámara encendida'}`, 'JitsiCall');
  };

  const hangUp = () => {
    if (apiRef.current) {
      try {
        apiRef.current.executeCommand('hangup');
      } catch (err) {
        logger.error('Error al finalizar llamada:', err, 'JitsiCall');
      }
    }
  };

  // Limpiar recursos cuando el componente se desmonta
  useEffect(() => {
    return () => {
      if (apiRef.current) {
        try {
          hangUp();
          apiRef.current = null;
        } catch (err) {
          logger.error('Error al limpiar recursos de Jitsi:', err, 'JitsiCall');
        }
      }
    };
  }, []);

  const jitsiContainerStyle = {
    width: '100%',
    height: '100%',
    position: 'relative' as const,
  };

  const errorContainerStyle = {
    padding: '1rem',
    backgroundColor: 'var(--color-error-light)',
    color: 'var(--color-error)',
    borderRadius: '0.25rem',
    margin: '1rem 0',
  };

  return (
    <div style={jitsiContainerStyle}>
      {error && (
        <div style={errorContainerStyle}>
          <p>Error en la videollamada: {error}</p>
          <button className="btn btn-secondary" onClick={() => window.location.reload()}>
            Reintentar
          </button>
        </div>
      )}
      
      <JitsiMeeting
        domain="meet.jit.si"
        roomName={roomName}
        userInfo={{ displayName: userName }}
        getIFrameRef={(iframeRef: HTMLIFrameElement) => {
          iframeRef.style.height = '100%';
          iframeRef.style.width = '100%';
        }}
        onApiReady={handleApiReady}
        onReadyToClose={handleCallEnded}
        configOverwrite={{
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          disableInviteFunctions: true,
          enableClosePage: false,
          prejoinPageEnabled: false,
          defaultLanguage: 'es',
          toolbarButtons: [
            'microphone', 'camera', 'hangup', 'fullscreen', 'chat'
          ],
          notifications: [
            'connection.CONNFAIL',
            'dialog.micNotSendingData',
            'dialog.cameraNotSendingData',
            'dialog.kickTitle',
            'dialog.suspendedTitle'
          ]
        }}
        interfaceConfigOverwrite={{
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
          SHOW_JITSI_WATERMARK: false,
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'hangup', 'fullscreen', 'chat'
          ],
        }}
        onError={handleError}
      />
    </div>
  );
}
