import { test, expect } from '@playwright/test';

// Tests de regresión visual para elementos clave de la interfaz
test.describe('Pruebas de regresión visual', () => {
  test('Captura de pantalla de la página de inicio de sesión', async ({ page }) => {
    await page.goto('/');
    
    // Esperar a que la página esté completamente cargada
    await page.waitForLoadState('networkidle');
    
    // Tomar captura de pantalla de la página completa de login
    await page.screenshot({ 
      path: './test-results/screenshots/login-page.png',
      fullPage: true 
    });
    
    // También podemos capturar componentes específicos
    const selectorRolComponent = await page.locator('.selector-rol-container').first();
    await selectorRolComponent.screenshot({ 
      path: './test-results/screenshots/selector-rol-component.png' 
    });
  });
  
  test('Captura de formulario de portero', async ({ page }) => {
    await page.goto('/');
    
    // Esperar a que la página esté completamente cargada
    await page.waitForLoadState('networkidle');
    
    // Hacer clic en "Acceder como Portero"
    await page.getByText('Acceder como Portero').click();
    
    // Esperar a que aparezca el formulario
    await page.waitForSelector('form.portero-form');
    
    // Capturar el formulario
    const porterForm = await page.locator('form.portero-form').first();
    await porterForm.screenshot({ 
      path: './test-results/screenshots/portero-form.png' 
    });
  });
  
  test('Diseño responsivo en dispositivo móvil', async ({ page }) => {
    // Configurar viewport para emular dispositivo móvil
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Capturar versión móvil 
    await page.screenshot({ 
      path: './test-results/screenshots/mobile-login.png',
      fullPage: true 
    });
  });
});

// Tests para verificar estados visuales específicos del sistema de llamadas
test.describe('Estados visuales de la videollamada', () => {
  test.beforeEach(async ({ page }) => {
    // Iniciar sesión como portero para acceder a la funcionalidad de llamadas
    await page.goto('/');
    await page.getByText('Acceder como Portero').click();
    await page.getByLabel('Nombre:').fill('Portero Test');
    await page.getByText('Ingresar').click();
    
    // Verificar que estamos en la página correcta
    await expect(page).toHaveURL('/portero');
  });
  
  test('Interfaz de lista de departamentos', async ({ page }) => {
    // Esperar a que se cargue la lista de departamentos
    await page.waitForSelector('#departments-container:not(:empty)');
    
    // Capturar la lista de departamentos
    const departmentsList = await page.locator('#departments-container').first();
    await departmentsList.screenshot({ 
      path: './test-results/screenshots/departments-list.png' 
    });
  });
});
