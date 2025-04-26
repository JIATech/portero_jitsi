import express from 'express';
import { createServer } from 'http';
import { initWebSocketServer } from './services/websocket';
import logger from './services/logger';

// El handler de SSR se importa dinámicamente en tiempo de ejecución
// porque se genera después del build de Astro
let ssrHandler: any;

// Crear servidor Express y HTTP para agregar WebSockets
const app = express();
const server = createServer(app);

// Inicializar WebSockets en el servidor HTTP
initWebSocketServer(server);

// Middleware para registrar solicitudes
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.info(`${req.method} ${req.url}`, 'Server');
  next();
});

// Importar dinámicamente el handler de SSR de Astro
(async () => {
  try {
    // Intentamos importar el handler desde la ubicación donde Astro lo genera
    const { handler } = await import('./entry.mjs');
    ssrHandler = handler;
    
    // Usar el handler de SSR de Astro para todas las rutas
    app.use(ssrHandler);
    
    // Iniciar el servidor en el puerto configurado
    const port = process.env.PORT || 3000;
    server.listen(port, () => {
      logger.info(`Servidor iniciado en http://localhost:${port}`, 'Server');
      logger.info('WebSockets activados para actualizaciones en tiempo real', 'Server');
    });
  } catch (error) {
    logger.error('Error al iniciar el servidor:', error instanceof Error ? error : new Error(String(error)), 'Server');
    process.exit(1);
  }
})();

// El servidor se inicia después de importar el handler de SSR

export { app, server };
