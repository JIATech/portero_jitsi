import type { APIRoute } from 'astro';
import { departmentAPI, initializeDatabase } from '../../../lib/db/client';
import logger from '../../../services/logger';

/**
 * Endpoint para finalizar una llamada activa
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    
    // Validar datos requeridos
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
    
    // Guardar datos de la llamada para el registro
    const callerName = department.incoming_call?.from || 'Desconocido';
    const roomName = department.incoming_call?.room || 'unknown-room';
    
    // Limpiar la llamada del departamento
    const updatedDept = await departmentAPI.clearIncomingCall(deptId);
    
    if (!updatedDept) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Error al finalizar la llamada' 
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Actualizar el estado del departamento a disponible
    const availableDept = await departmentAPI.updateDepartmentStatus(deptId, 'Available');
    
    // Registrar en el log
    logger.info(`Llamada finalizada: ${callerName} con ${department.name} (${roomName})`, 'API:Call');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Llamada finalizada correctamente',
        department: availableDept || updatedDept
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    logger.error('Error al finalizar llamada', error as Error, 'API:Call');
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Error interno al finalizar llamada' 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
