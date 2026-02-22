import {
  employeesApi,
  type Employee,
  type CreateEmployeeDto,
  type UpdateEmployeeDto,
  type EmployeeFilter,
} from './api';

/**
 * Employee Service
 *
 * Provides employee management operations with proper error handling.
 */

export const employeeService = {
  /**
   * Get all employees with optional filtering
   */
  async getEmployees(filter?: EmployeeFilter): Promise<Employee[]> {
    try {
      return await employeesApi.getAll(filter);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Kan medewerkers niet ophalen'
      );
    }
  },

  /**
   * Get a single employee by ID
   */
  async getEmployee(id: string): Promise<Employee> {
    try {
      return await employeesApi.getById(id);
    } catch (error) {
      console.error('Failed to fetch employee:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Kan medewerker niet ophalen'
      );
    }
  },

  /**
   * Create a new employee
   */
  async createEmployee(dto: CreateEmployeeDto): Promise<Employee> {
    try {
      return await employeesApi.create(dto);
    } catch (error) {
      console.error('Failed to create employee:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Kan medewerker niet aanmaken'
      );
    }
  },

  /**
   * Update an existing employee
   */
  async updateEmployee(id: string, dto: UpdateEmployeeDto): Promise<Employee> {
    try {
      return await employeesApi.update(id, dto);
    } catch (error) {
      console.error('Failed to update employee:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Kan medewerker niet bijwerken'
      );
    }
  },

  /**
   * Delete an employee
   */
  async deleteEmployee(id: string): Promise<void> {
    try {
      await employeesApi.delete(id);
    } catch (error) {
      console.error('Failed to delete employee:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Kan medewerker niet verwijderen'
      );
    }
  },

  /**
   * Search employees by query string
   */
  async searchEmployees(query: string): Promise<Employee[]> {
    try {
      if (!query || query.trim().length < 2) {
        return [];
      }
      return await employeesApi.search(query.trim());
    } catch (error) {
      console.error('Failed to search employees:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Kan medewerkers niet zoeken'
      );
    }
  },

  /**
   * Get employees by dienst (service/department)
   */
  async getEmployeesByDienst(dienstId: string): Promise<Employee[]> {
    try {
      return await employeesApi.getByDienst(dienstId);
    } catch (error) {
      console.error('Failed to fetch employees by dienst:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Kan medewerkers per dienst niet ophalen'
      );
    }
  },

  /**
   * Get all volunteers
   */
  async getVolunteers(): Promise<Employee[]> {
    try {
      return await employeesApi.getVolunteers();
    } catch (error) {
      console.error('Failed to fetch volunteers:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Kan vrijwilligers niet ophalen'
      );
    }
  },
};
