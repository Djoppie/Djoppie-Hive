import {
  employeesApi,
  type Employee,
  type CreateVolunteerDto,
  type UpdateVolunteerDto,
} from './api';

/**
 * Volunteer Service
 *
 * Specialized service for volunteer management with vrijwilliger-specific operations.
 */

export const volunteerService = {
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

  /**
   * Get a single volunteer by ID
   */
  async getVolunteer(id: string): Promise<Employee> {
    try {
      const employee = await employeesApi.getById(id);
      if (employee.employeeType !== 'Vrijwilliger') {
        throw new Error('Medewerker is geen vrijwilliger');
      }
      return employee;
    } catch (error) {
      console.error('Failed to fetch volunteer:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Kan vrijwilliger niet ophalen'
      );
    }
  },

  /**
   * Create a new volunteer
   */
  async createVolunteer(dto: CreateVolunteerDto): Promise<Employee> {
    try {
      // Ensure volunteer-specific fields are set correctly
      const volunteerDto: CreateVolunteerDto = {
        ...dto,
        employeeType: 'Vrijwilliger',
        arbeidsRegime: 'Vrijwilliger',
      };
      return await employeesApi.create(volunteerDto);
    } catch (error) {
      console.error('Failed to create volunteer:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Kan vrijwilliger niet aanmaken'
      );
    }
  },

  /**
   * Update an existing volunteer
   */
  async updateVolunteer(id: string, dto: UpdateVolunteerDto): Promise<Employee> {
    try {
      return await employeesApi.update(id, dto);
    } catch (error) {
      console.error('Failed to update volunteer:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Kan vrijwilliger niet bijwerken'
      );
    }
  },

  /**
   * Update volunteer-specific details (VOG, noodcontact, etc.)
   */
  async updateVolunteerDetails(
    id: string,
    details: {
      beschikbaarheid?: string;
      specialisaties?: string;
      noodContactNaam?: string;
      noodContactTelefoon?: string;
      vogDatum?: string;
      vogGeldigTot?: string;
    }
  ): Promise<Employee> {
    try {
      return await employeesApi.update(id, {
        vrijwilligerDetails: details,
      });
    } catch (error) {
      console.error('Failed to update volunteer details:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Kan vrijwilligersgegevens niet bijwerken'
      );
    }
  },

  /**
   * Delete a volunteer
   */
  async deleteVolunteer(id: string): Promise<void> {
    try {
      await employeesApi.delete(id);
    } catch (error) {
      console.error('Failed to delete volunteer:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Kan vrijwilliger niet verwijderen'
      );
    }
  },
};
