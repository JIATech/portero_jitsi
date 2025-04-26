/**
 * Servicio de logging centralizado para la aplicación
 * Versión universal compatible con navegador y Node.js
 */

// Detectar si estamos en un entorno de navegador
const isBrowser = typeof window !== 'undefined';

// Niveles de log soportados con sus colores en consola
enum LogLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG'
}

// Colores para la consola
const COLORS = {
  INFO: '\x1b[36m',   // Cian
  WARNING: '\x1b[33m', // Amarillo
  ERROR: '\x1b[31m',   // Rojo
  DEBUG: '\x1b[35m',   // Magenta
  RESET: '\x1b[0m'
};

class Logger {
  constructor() {
    // Constructor vacío
  }

  /**
   * Formatea un mensaje de log con timestamp ISO
   */
  private formatLogMessage(level: LogLevel, message: string, context?: string, error?: Error): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';
    const errorStr = error ? `\n${error.stack || error.message}` : '';
    
    return `[${timestamp}][${level}]${contextStr} ${message}${errorStr}`;
  }

  /**
   * Registra un mensaje de nivel INFO
   */
  public info(message: string, context?: string): void {
    const formattedMessage = this.formatLogMessage(LogLevel.INFO, message, context);
    
    if (isBrowser) {
      console.info(`%c${formattedMessage}`, 'color: #36a3f7');
    } else {
      console.info(`${COLORS.INFO}${formattedMessage}${COLORS.RESET}`);
    }
  }

  /**
   * Registra un mensaje de nivel WARNING
   */
  public warn(message: string, context?: string): void {
    const formattedMessage = this.formatLogMessage(LogLevel.WARNING, message, context);
    
    if (isBrowser) {
      console.warn(`%c${formattedMessage}`, 'color: #f7b500');
    } else {
      console.warn(`${COLORS.WARNING}${formattedMessage}${COLORS.RESET}`);
    }
  }

  /**
   * Registra un mensaje de nivel ERROR
   */
  public error(message: string, error?: Error, context?: string): void {
    const formattedMessage = this.formatLogMessage(LogLevel.ERROR, message, context, error);
    
    if (isBrowser) {
      console.error(`%c${formattedMessage}`, 'color: #f03e3e');
    } else {
      console.error(`${COLORS.ERROR}${formattedMessage}${COLORS.RESET}`);
    }
  }

  /**
   * Registra un mensaje de nivel DEBUG
   */
  public debug(message: string, context?: string): void {
    const formattedMessage = this.formatLogMessage(LogLevel.DEBUG, message, context);
    
    if (isBrowser) {
      console.debug(`%c${formattedMessage}`, 'color: #ae3ec9');
    } else {
      console.debug(`${COLORS.DEBUG}${formattedMessage}${COLORS.RESET}`);
    }
  }
}

// Instancia singleton del logger
const logger = new Logger();

export default logger;
