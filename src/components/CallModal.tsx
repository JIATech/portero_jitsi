import React, { useState, useEffect } from 'react';
import JitsiCall from './JitsiCall';

interface CallModalProps {
  isOpen: boolean;
  roomName: string;
  userName: string;
  displayName: string;
  isIncoming?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  onEnd?: () => void;
  onClose: () => void;
}

/**
 * Modal para mostrar llamadas entrantes o salientes
 */
export default function CallModal({ 
  isOpen,
  roomName, 
  userName,
  displayName,
  isIncoming = false, 
  onAccept, 
  onReject, 
  onEnd,
  onClose
}: CallModalProps) {
  const [isCallActive, setIsCallActive] = useState(false);
  const [showingAnswerButtons, setShowingAnswerButtons] = useState(isIncoming);
  
  // Reiniciar estados cuando cambia isOpen
  useEffect(() => {
    if (isOpen) {
      // Agregar clase al body para prevenir scroll
      document.body.classList.add('overflow-hidden');
      setShowingAnswerButtons(isIncoming);
    }
    
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isOpen, isIncoming]);
  
  // Manejadores de eventos
  const handleAnswer = () => {
    setShowingAnswerButtons(false);
    setIsCallActive(true);
    onAccept?.();
  };
  
  const handleReject = () => {
    onReject?.();
    onClose();
  };
  
  const handleEnd = () => {
    onEnd?.();
    onClose();
  };
  
  const handleCallError = (error: Error) => {
    console.error("Error en llamada:", error.message);
    setTimeout(() => {
      onClose();
    }, 5000);
  };
  
  // Si el modal no está abierto, no renderizamos nada
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4 text-center">
        
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" 
          onClick={!isCallActive ? handleReject : handleEnd}
          aria-hidden="true"
        ></div>
        
        {/* Contenido del modal */}
        <div 
          className="relative inline-block bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all w-full max-w-lg sm:my-8"
          style={{ height: isCallActive ? '80vh' : 'auto' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-primary text-white px-4 py-3 flex justify-between items-center">
            <h3 className="text-lg font-medium">
              {isIncoming
                ? showingAnswerButtons
                  ? `Llamada entrante de ${displayName}`
                  : `Llamada con ${displayName}`
                : isCallActive
                  ? `Llamada con ${displayName}`
                  : `Llamando a ${displayName}...`
              }
            </h3>
            <button 
              className="bg-transparent border-0 text-white text-xl cursor-pointer p-1"
              onClick={onClose} 
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>
          
          <div className={isCallActive ? 'h-full' : 'p-6'}>
            {showingAnswerButtons ? (
              <div className="p-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.716 3 6V5z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg font-medium text-gray-900">
                      Llamada entrante
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Está recibiendo una llamada de {displayName}.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={handleAnswer}
                  >
                    Contestar
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={handleReject}
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            ) : isCallActive ? (
              <div className="h-full">
                <JitsiCall
                  roomName={roomName}
                  userName={userName}
                  onClose={handleEnd}
                  onError={handleCallError}
                  onStart={() => setIsCallActive(true)}
                />
              </div>
            ) : (
              <div className="text-center p-4">
                <p className="mb-4">Llamando, por favor espere...</p>
                <div className="flex justify-center">
                  <button 
                    className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm"
                    onClick={handleEnd}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
