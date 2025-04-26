import type { APIRoute } from 'astro';
import { departmentAPI, initializeDatabase, notifyDepartmentChange } from '../../../lib/db/client';
import type { DepartmentRow } from '../../../lib/types/database';
import logger from '../../../services/logger';

/**
 * Endpoint para obtener un departamento específico por ID
 */
export const GET: APIRoute = async ({ params }) => {
  try {
    // Inicializar la base de datos SQLite
    await initializeDatabase();
    logger.info('Obteniendo información de departamento', 'API');

    const id = Number(params.id);
    
    if (isNaN(id)) {
      return new Response(JSON.stringify({ error: 'ID de departamento inválido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const department = await departmentAPI.getDepartmentById(id);
    
    if (!department) {
      return new Response(JSON.stringify({ error: 'Departamento no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify(department), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    logger.error(`Error al obtener departamento por ID`, error as Error, 'API');
    
    return new Response(JSON.stringify({ error: 'Error al obtener departamento' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * Endpoint para actualizar un departamento específico
 */
export const PATCH: APIRoute = async ({ params, request }) => {
  try {
    // Inicializar la base de datos SQLite
    await initializeDatabase();
    logger.info('Actualizando información de departamento', 'API');

    const id = Number(params.id);
    
    if (isNaN(id)) {
      return new Response(JSON.stringify({ error: 'ID de departamento inválido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const data = await request.json();
    const { name, password, status } = data;
    
    // Verificar que hay al menos un campo para actualizar
    if (name === undefined && password === undefined && status === undefined) {
      return new Response(JSON.stringify({ error: 'No se proporcionaron campos para actualizar' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    try {
      let updatedDepartment = null;
      
      // Actualizar perfil (nombre y/o contraseña)
      if (name !== undefined || password !== undefined) {
        try {
          // Usar la API de departamentos para actualizar el perfil
          updatedDepartment = await departmentAPI.updateDepartmentProfile(id, name, password);
          
          if (!updatedDepartment) {
            return new Response(
              JSON.stringify({ error: 'No se pudo actualizar el departamento' }),
              { status: 404 }
            );
          }
          
          // Notificar el cambio en tiempo real
          await notifyDepartmentChange('UPDATE', updatedDepartment);
          logger.info(`Perfil del departamento ${updatedDepartment.id} actualizado`, 'API');
        } catch (error) {
          logger.error('Error al actualizar perfil de departamento', error instanceof Error ? error : new Error(String(error)), 'API');
          return new Response(
            JSON.stringify({ error: 'Error al actualizar el departamento' }),
            { status: 500 }
          );
        }
      }
      
      // Actualizar estado
      if (status !== undefined) {
        if (!['Available', 'Busy', 'Away'].includes(status)) {
          return new Response(JSON.stringify({ error: 'Estado no válido' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        try {
          // Usar la API de departamentos para actualizar el estado
          updatedDepartment = await departmentAPI.updateDepartmentStatus(id, status);
          
          if (!updatedDepartment) {
            return new Response(
              JSON.stringify({ error: 'No se pudo actualizar el estado del departamento' }),
              { status: 404 }
            );
          }
          
          // Notificar el cambio en tiempo real
          await notifyDepartmentChange('UPDATE', updatedDepartment);
          logger.info(`Estado del departamento ${updatedDepartment.id} actualizado a ${status}`, 'API');
        } catch (error) {
          logger.error('Error al actualizar estado de departamento', error instanceof Error ? error : new Error(String(error)), 'API');
          return new Response(
            JSON.stringify({ error: 'Error al actualizar el estado del departamento' }),
            { status: 500 }
          );
        }
      }
      
      if (!updatedDepartment) {
        return new Response(JSON.stringify({ error: 'Departamento no encontrado' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify(updatedDepartment), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      // Manejar errores específicos del API
      const err = error as Error;
      
      if (err.message.includes('Ya existe un departamento con ese nombre')) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 409, // Conflict
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Error general
      throw error;
    }
  } catch (error) {
    logger.error(`Error al actualizar departamento`, error as Error, 'API');
    
    return new Response(JSON.stringify({ error: 'Error al actualizar departamento' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * Endpoint para manejar llamadas a un departamento
 */
export const POST: APIRoute = async ({ params, request }) => {
  try {
    // Inicializar la base de datos SQLite
    await initializeDatabase();
    logger.info('Procesando llamada para departamento', 'API');

    const id = Number(params.id);
    
    if (isNaN(id)) {
      return new Response(JSON.stringify({ error: 'ID de departamento inválido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const data = await request.json();
    const { action, from, room } = data;
    
    if (action === 'set_call') {
      // Validar campos requeridos para iniciar llamada
      if (!from || !room) {
        return new Response(JSON.stringify({ error: 'Campos "from" y "room" son requeridos' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Registrar llamada entrante
      const updatedDepartment = await departmentAPI.setIncomingCall(id, from, room);
      
      if (!updatedDepartment) {
        return new Response(JSON.stringify({ error: 'Departamento no encontrado' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      logger.info(`Llamada entrante registrada para departamento ID=${id}`, 'API');
      
      return new Response(JSON.stringify(updatedDepartment), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else if (action === 'clear_call') {
      // Eliminar llamada entrante
      const updatedDepartment = await departmentAPI.clearIncomingCall(id);
      
      if (!updatedDepartment) {
        return new Response(JSON.stringify({ error: 'Departamento no encontrado' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      logger.info(`Llamada entrante eliminada para departamento ID=${id}`, 'API');
      
      return new Response(JSON.stringify(updatedDepartment), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ error: 'Acción no válida' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    logger.error(`Error al manejar llamada`, error as Error, 'API');
    
    return new Response(JSON.stringify({ error: 'Error al manejar llamada' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
