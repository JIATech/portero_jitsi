import type { APIRoute } from 'astro';
import { departmentAPI, initializeDatabase } from '../../../lib/db/client';
import logger from '../../../services/logger';

/**
 * Endpoint para obtener todos los departamentos
 */
export const GET: APIRoute = async () => {
  try {
    // Inicializar la base de datos SQLite
    await initializeDatabase();
    logger.info('Obteniendo listado de departamentos', 'API');

    const departments = await departmentAPI.getAllDepartments();
    
    return new Response(JSON.stringify(departments), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    logger.error('Error al obtener departamentos', error as Error, 'API');
    
    return new Response(JSON.stringify({ error: 'Error al obtener departamentos' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * Endpoint para crear un nuevo departamento
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // Inicializar la base de datos SQLite
    await initializeDatabase();
    logger.info('Procesando creación de departamento', 'API');

    const { name, password } = await request.json();
    
    // Validar campos requeridos
    if (!name || !password) {
      return new Response(JSON.stringify({ error: 'Nombre y contraseña son requeridos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    try {
      // Intentar crear departamento
      const department = await departmentAPI.createDepartment(name, password);
      
      logger.info(`Departamento creado: ${name}`, 'API');
      
      return new Response(JSON.stringify(department), {
        status: 201,
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
      
      if (err.message.includes('límite máximo de departamentos')) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 403, // Forbidden
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Error general
      throw error;
    }
  } catch (error) {
    logger.error('Error al crear departamento', error as Error, 'API');
    
    return new Response(JSON.stringify({ error: 'Error al crear departamento' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
