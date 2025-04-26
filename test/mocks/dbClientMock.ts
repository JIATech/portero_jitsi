import { vi } from 'vitest';
import type { DepartmentRow } from '../../src/lib/types';

// Datos de ejemplo para los mocks
const sampleDepartments: DepartmentRow[] = [
  {
    id: 1,
    name: 'Departamento 101',
    status: 'Available',
    password: '1234',
    incoming_call: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    name: 'Departamento 102',
    status: 'Busy',
    password: '1234',
    incoming_call: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    name: 'Departamento 103',
    status: 'Away',
    password: '1234',
    incoming_call: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Contador para IDs autogenerados
let nextId = 4;

// Simulación de base de datos en memoria
class MockDatabaseClient {
  departments: DepartmentRow[] = [...sampleDepartments];

  // Método para resetear el estado entre tests
  reset() {
    this.departments = [...sampleDepartments];
    nextId = 4;
  }

  // Métodos para operaciones CRUD de departamentos
  async getAllDepartments(): Promise<DepartmentRow[]> {
    return [...this.departments];
  }

  async getDepartmentById(id: number): Promise<DepartmentRow | null> {
    return this.departments.find(dept => dept.id === id) || null;
  }

  async getDepartmentByName(name: string): Promise<DepartmentRow | null> {
    return this.departments.find(dept => dept.name === name) || null;
  }

  async createDepartment(name: string, password: string): Promise<DepartmentRow> {
    const newDepartment: DepartmentRow = {
      id: nextId++,
      name,
      password,
      status: 'Available',
      incoming_call: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.departments.push(newDepartment);
    return newDepartment;
  }

  async updateDepartmentStatus(id: number, status: 'Available' | 'Busy' | 'Away'): Promise<DepartmentRow | null> {
    const department = await this.getDepartmentById(id);
    if (!department) return null;
    
    department.status = status;
    department.updated_at = new Date().toISOString();
    return department;
  }

  async updateDepartmentProfile(id: number, name?: string, password?: string): Promise<DepartmentRow | null> {
    const department = await this.getDepartmentById(id);
    if (!department) return null;
    
    if (name) department.name = name;
    if (password) department.password = password;
    department.updated_at = new Date().toISOString();
    return department;
  }

  async setIncomingCall(id: number, from: string, room: string): Promise<DepartmentRow | null> {
    const department = await this.getDepartmentById(id);
    if (!department) return null;
    
    department.incoming_call = { from, room, timestamp: new Date().toISOString() };
    department.updated_at = new Date().toISOString();
    return department;
  }

  async clearIncomingCall(id: number): Promise<DepartmentRow | null> {
    const department = await this.getDepartmentById(id);
    if (!department) return null;
    
    department.incoming_call = null;
    department.updated_at = new Date().toISOString();
    return department;
  }

  async countDepartments(): Promise<number> {
    return this.departments.length;
  }
}

// Crear instancia del mock
export const mockDatabaseClient = new MockDatabaseClient();

// Crear mocks para las funciones de la base de datos
export const departmentAPIMock = {
  getAllDepartments: vi.fn().mockImplementation(() => mockDatabaseClient.getAllDepartments()),
  getDepartmentById: vi.fn().mockImplementation((id: number) => mockDatabaseClient.getDepartmentById(id)),
  getDepartmentByName: vi.fn().mockImplementation((name: string) => mockDatabaseClient.getDepartmentByName(name)),
  createDepartment: vi.fn().mockImplementation((name: string, password: string) => 
    mockDatabaseClient.createDepartment(name, password)),
  updateDepartmentStatus: vi.fn().mockImplementation((id: number, status: 'Available' | 'Busy' | 'Away') => 
    mockDatabaseClient.updateDepartmentStatus(id, status)),
  updateDepartmentProfile: vi.fn().mockImplementation((id: number, name?: string, password?: string) => 
    mockDatabaseClient.updateDepartmentProfile(id, name, password)),
  setIncomingCall: vi.fn().mockImplementation((id: number, from: string, room: string) => 
    mockDatabaseClient.setIncomingCall(id, from, room)),
  clearIncomingCall: vi.fn().mockImplementation((id: number) => 
    mockDatabaseClient.clearIncomingCall(id)),
  countDepartments: vi.fn().mockImplementation(() => mockDatabaseClient.countDepartments())
};
