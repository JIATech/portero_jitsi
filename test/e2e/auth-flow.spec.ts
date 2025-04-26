import { test, expect } from '@playwright/test';

// Flujo básico de autenticación y navegación
test.describe('Flujo de autenticación y navegación', () => {
  // Reiniciar contexto de navegador para cada test
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Acceso como Portero y navegación básica', async ({ page }) => {
    // Verificar que estamos en la página de inicio
    await expect(page).toHaveTitle(/Inicio de Sesión/);
    
    // Seleccionar rol de portero
    await page.getByText('Acceder como Portero').click();
    
    // Verificar que se muestra el formulario
    await expect(page.getByText('Acceso de Portero')).toBeVisible();
    
    // Completar y enviar el formulario
    await page.getByLabel('Nombre:').fill('Portero Prueba');
    await page.getByText('Ingresar').click();
    
    // Verificar redirección a la página de portero
    await expect(page).toHaveURL('/portero');
    await expect(page).toHaveTitle(/Panel del Portero/);
    
    // Verificar elementos clave en la interfaz de portero
    await expect(page.getByText('Lista de Departamentos')).toBeVisible();
    await expect(page.getByText('Llamadas Activas')).toBeVisible();
    
    // Cerrar sesión
    await page.getByText('Cerrar Sesión').click();
    
    // Verificar que volvemos a la página de inicio
    await expect(page).toHaveURL('/');
  });
  
  test('Acceso fallido como Departamento con credenciales incorrectas', async ({ page }) => {
    // Verificar que estamos en la página de inicio
    await expect(page).toHaveTitle(/Inicio de Sesión/);
    
    // Seleccionar rol de departamento
    await page.getByText('Acceder como Departamento').click();
    
    // Verificar que se muestra el formulario
    await expect(page.getByText('Acceso de Departamento')).toBeVisible();
    
    // Completar el formulario con credenciales incorrectas
    await page.getByLabel('Departamento:').fill('Departamento Inexistente');
    await page.getByLabel('Contraseña:').fill('1234');
    await page.getByText('Ingresar').click();
    
    // Verificar que se muestra un mensaje de error
    await expect(page.getByText('Departamento no encontrado')).toBeVisible();
    
    // Seguimos en la misma página
    await expect(page).toHaveURL('/');
  });
  
  test('Navegación a registro de departamento', async ({ page }) => {
    // Verificar que estamos en la página de inicio
    await expect(page).toHaveTitle(/Inicio de Sesión/);
    
    // Seleccionar rol de departamento
    await page.getByText('Acceder como Departamento').click();
    
    // Verificar que se muestra el formulario
    await expect(page.getByText('Acceso de Departamento')).toBeVisible();
    
    // Hacer clic en "Registrar nuevo departamento"
    await page.getByText('Registrar nuevo departamento').click();
    
    // Verificar que estamos en la página de registro
    await expect(page).toHaveURL('/registro-departamento');
    await expect(page.getByText('Registro de Departamento')).toBeVisible();
    
    // Verificar que el formulario de registro está disponible
    await expect(page.getByLabel('Nombre del departamento:')).toBeVisible();
    await expect(page.getByLabel('Contraseña:')).toBeVisible();
    await expect(page.getByLabel('Confirmar contraseña:')).toBeVisible();
  });
});

// Test para verificar la base de datos dual (requiere que Docker esté en ejecución)
test.describe('Funcionalidades de base de datos', () => {
  test('Recuperación de lista de departamentos', async ({ page }) => {
    // Iniciar sesión como portero
    await page.goto('/');
    await page.getByText('Acceder como Portero').click();
    await page.getByLabel('Nombre:').fill('Portero Test DB');
    await page.getByText('Ingresar').click();
    
    // Verificar que estamos en la página del portero
    await expect(page).toHaveURL('/portero');
    
    // Esperar a que la lista de departamentos se cargue
    await expect(page.locator('#departments-container')).not.toContainText('Cargando departamentos...');
    
    // Verificar que se muestran departamentos en la lista
    // Nota: Este test asume que hay departamentos en la base de datos
    // Si Docker está ejecutándose con los datos de ejemplo, debería haber al menos uno
    await expect(page.locator('#departments-container')).not.toContainText('No hay departamentos disponibles');
  });
});
