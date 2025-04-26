import type { APIRoute } from 'astro';
import { departmentAPI, initializeDatabase, notifyDepartmentChange } from '../../../lib/db/client';
import logger from '../../../services/logger';
import type { DepartmentRow } from '../../../lib/types/database';

/**
 * Endpoint para iniciar una llamada a un departamento
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // Analizar el cuerpo de la solicitud
    const body = await request.json();
    
    // Validar datos requeridos
    const { fromId, fromName, toDepartmentId, roomName } = body;
    
    if (!fromId || !fromName || !toDepartmentId || !roomName) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Datos incompletos para iniciar llamada' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Inicializar base de datos
    await initializeDatabase();
    
    // Obtener información del departamento
    const departmentId = parseInt(toDepartmentId);
    const department = await departmentAPI.getDepartmentById(departmentId);
    
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
    
    // Verificar si el departamento está disponible
    if (department.status !== 'Available') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Departamento no disponible (${department.status})` 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Registrar llamada entrante para el departamento
    const updatedDepartment = await departmentAPI.setIncomingCall(
      departmentId, 
      fromName, 
      roomName
    );
    
    if (!updatedDepartment) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No se pudo actualizar el estado del departamento' 
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Notificar a través de WebSockets
    logger.info(`Llamada iniciada: ${fromName} → ${updatedDepartment.name} (${roomName})`, 'API:Call');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Llamada iniciada',
        room: roomName,
        department: updatedDepartment
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    logger.error('Error al iniciar llamada', error as Error, 'API:Call');
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Error interno al iniciar llamada' 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
