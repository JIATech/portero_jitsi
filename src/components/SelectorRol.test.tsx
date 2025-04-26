import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SelectorRol from './SelectorRol';
import { departmentAPIMock } from '../../test/mocks/dbClientMock';

// Mock de los módulos de dependencia
vi.mock('../lib/db/client', () => ({
  departmentAPI: departmentAPIMock
}));

// Mock de navegación
const mockNavigate = vi.fn();
vi.mock('../services/navigation', () => ({
  navigateTo: (url: string) => mockNavigate(url)
}));

describe('SelectorRol Component', () => {
  beforeEach(() => {
    // Limpiar mocks y localStorage antes de cada test
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('muestra las opciones de selección de rol inicialmente', () => {
    render(<SelectorRol />);
    
    // Verificar que se muestran los botones de selección de rol
    expect(screen.getByText('Acceder como Portero')).toBeInTheDocument();
    expect(screen.getByText('Acceder como Departamento')).toBeInTheDocument();
  });

  it('muestra el formulario de portero cuando se selecciona rol de portero', () => {
    render(<SelectorRol />);
    
    // Seleccionar rol de portero
    fireEvent.click(screen.getByText('Acceder como Portero'));
    
    // Verificar que se muestra el formulario de portero
    expect(screen.getByText('Acceso de Portero')).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre:')).toBeInTheDocument();
    expect(screen.getByText('Ingresar')).toBeInTheDocument();
  });

  it('muestra el formulario de departamento cuando se selecciona rol de departamento', () => {
    render(<SelectorRol />);
    
    // Seleccionar rol de departamento
    fireEvent.click(screen.getByText('Acceder como Departamento'));
    
    // Verificar que se muestra el formulario de departamento
    expect(screen.getByText('Acceso de Departamento')).toBeInTheDocument();
    expect(screen.getByLabelText('Departamento:')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña:')).toBeInTheDocument();
    expect(screen.getByText('Ingresar')).toBeInTheDocument();
  });

  it('redirige a la vista de portero después de iniciar sesión exitosamente', async () => {
    render(<SelectorRol />);
    
    // Seleccionar rol de portero
    fireEvent.click(screen.getByText('Acceder como Portero'));
    
    // Completar formulario
    fireEvent.change(screen.getByLabelText('Nombre:'), { target: { value: 'Juan Portero' } });
    
    // Enviar formulario
    fireEvent.click(screen.getByText('Ingresar'));
    
    // Verificar redirección
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/portero');
      
      // Verificar localStorage
      const userSession = JSON.parse(localStorage.getItem('userSession') || '{}');
      expect(userSession.role).toBe('portero');
      expect(userSession.name).toBe('Juan Portero');
    });
  });

  it('autentica correctamente a un departamento y redirige', async () => {
    // Preparar
    departmentAPIMock.getDepartmentByName.mockResolvedValueOnce({
      id: 1,
      name: 'Departamento 101',
      password: '1234',
      status: 'Available'
    });
    
    render(<SelectorRol />);
    
    // Seleccionar rol de departamento
    fireEvent.click(screen.getByText('Acceder como Departamento'));
    
    // Completar formulario
    fireEvent.change(screen.getByLabelText('Departamento:'), { target: { value: 'Departamento 101' } });
    fireEvent.change(screen.getByLabelText('Contraseña:'), { target: { value: '1234' } });
    
    // Enviar formulario
    fireEvent.click(screen.getByText('Ingresar'));
    
    // Verificar redirección
    await waitFor(() => {
      expect(departmentAPIMock.getDepartmentByName).toHaveBeenCalledWith('Departamento 101');
      expect(mockNavigate).toHaveBeenCalledWith('/departamento');
      
      // Verificar localStorage
      const userSession = JSON.parse(localStorage.getItem('userSession') || '{}');
      expect(userSession.role).toBe('departamento');
      expect(userSession.id).toBe(1);
      expect(userSession.name).toBe('Departamento 101');
    });
  });

  it('muestra error cuando las credenciales del departamento son incorrectas', async () => {
    // Preparar
    departmentAPIMock.getDepartmentByName.mockResolvedValueOnce({
      id: 1,
      name: 'Departamento 101',
      password: '1234',
      status: 'Available'
    });
    
    render(<SelectorRol />);
    
    // Seleccionar rol de departamento
    fireEvent.click(screen.getByText('Acceder como Departamento'));
    
    // Completar formulario con contraseña incorrecta
    fireEvent.change(screen.getByLabelText('Departamento:'), { target: { value: 'Departamento 101' } });
    fireEvent.change(screen.getByLabelText('Contraseña:'), { target: { value: 'contraseña_incorrecta' } });
    
    // Enviar formulario
    fireEvent.click(screen.getByText('Ingresar'));
    
    // Verificar mensaje de error
    await waitFor(() => {
      expect(screen.getByText('Contraseña incorrecta')).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it('muestra error cuando el departamento no existe', async () => {
    // Preparar
    departmentAPIMock.getDepartmentByName.mockResolvedValueOnce(null);
    
    render(<SelectorRol />);
    
    // Seleccionar rol de departamento
    fireEvent.click(screen.getByText('Acceder como Departamento'));
    
    // Completar formulario con departamento inexistente
    fireEvent.change(screen.getByLabelText('Departamento:'), { target: { value: 'Departamento Inexistente' } });
    fireEvent.change(screen.getByLabelText('Contraseña:'), { target: { value: '1234' } });
    
    // Enviar formulario
    fireEvent.click(screen.getByText('Ingresar'));
    
    // Verificar mensaje de error
    await waitFor(() => {
      expect(screen.getByText('Departamento no encontrado')).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it('permite volver a la selección de rol', () => {
    render(<SelectorRol />);
    
    // Seleccionar rol de portero
    fireEvent.click(screen.getByText('Acceder como Portero'));
    
    // Verificar que estamos en la vista de portero
    expect(screen.getByText('Acceso de Portero')).toBeInTheDocument();
    
    // Volver a la selección de rol
    fireEvent.click(screen.getByText('Cambiar rol'));
    
    // Verificar que volvimos a la selección inicial
    expect(screen.getByText('Acceder como Portero')).toBeInTheDocument();
    expect(screen.getByText('Acceder como Departamento')).toBeInTheDocument();
  });
});
