import type { APIRoute } from 'astro';
import { departmentAPI, initializeDatabase } from '../../../lib/db/client';
import logger from '../../../services/logger';

/**
 * Endpoint para rechazar una llamada entrante
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { departmentId } = body;
    
    if (!departmentId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'ID de departamento requerido' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Inicializar base de datos SQLite
    await initializeDatabase();
    
    // Obtener información del departamento
    const deptId = parseInt(departmentId.toString());
    const department = await departmentAPI.getDepartmentById(deptId);
    
    if (!department) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Departamento no encontrado' 
        }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Verificar que tiene una llamada entrante
    if (!department.incoming_call) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No hay llamada entrante para rechazar' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Guardar datos de la llamada para el registro antes de limpiarla
    const fromName = department.incoming_call?.from || 'Desconocido';
    const roomName = department.incoming_call?.room || 'unknown-room';
    
    // Actualizar el departamento para eliminar la llamada entrante
    const updatedDept = await departmentAPI.clearIncomingCall(deptId);
    
    if (!updatedDept) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Error al rechazar la llamada' 
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Registrar información de la llamada rechazada
    logger.info(`Llamada rechazada: ${fromName} → ${department.name} (${roomName})`, 'API:Call');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Llamada rechazada correctamente'
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    logger.error('Error al rechazar llamada', error as Error, 'API:Call');
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Error interno al rechazar llamada' 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
