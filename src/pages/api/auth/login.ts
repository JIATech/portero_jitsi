import type { APIRoute } from 'astro';
import { departmentAPI, initializeDatabase } from '../../../lib/db/client';
import type { DepartmentRow } from '../../../lib/types/database';
import logger from '../../../services/logger';

/**
 * Endpoint para manejar la autenticación de usuarios (portero o departamento)
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // Inicializar la base de datos SQLite
    await initializeDatabase();
    logger.info('Procesando solicitud de autenticación', 'Auth');

    const { userType, name, password } = await request.json();
    
    logger.info(`Intento de inicio de sesión como: ${userType}`, 'Auth');
    
    if (userType === 'portero') {
      // Validación para el portero (contraseña fija)
      if (password !== 'admin') {
        return new Response(JSON.stringify({ error: 'Contraseña incorrecta para el portero' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      logger.info('Inicio de sesión exitoso como Portero', 'Auth');
      
      return new Response(JSON.stringify({ 
        success: true, 
        role: 'portero'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else if (userType === 'departamento') {
      if (!name) {
        return new Response(JSON.stringify({ error: 'Nombre de departamento requerido' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Buscar departamento por nombre
      const department = await departmentAPI.getDepartmentByName(name);
      
      if (!department) {
        return new Response(JSON.stringify({ error: 'No se encontró ningún departamento con ese nombre' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Validar contraseña
      if (department.password !== password) {
        return new Response(JSON.stringify({ error: 'Contraseña incorrecta para el departamento' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      logger.info(`Inicio de sesión exitoso como Departamento: ${department.name}`, 'Auth');
      
      return new Response(JSON.stringify({ 
        success: true, 
        role: 'departamento',
        id: department.id,
        name: department.name,
        status: department.status
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ error: 'Tipo de usuario no válido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    logger.error('Error en endpoint de login', error as Error, 'Auth');
    
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
