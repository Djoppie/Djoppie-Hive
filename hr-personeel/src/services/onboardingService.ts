import { onboardingApi } from './onboardingApi';
import type {
  OnboardingProcessDto,
  OnboardingProcessSummaryDto,
  CreateOnboardingProcessDto,
  UpdateOnboardingProcessDto,
  OnboardingProcessFilter,
  CreateProcessFromTemplateDto,
  OnboardingTaskDto,
  CreateOnboardingTaskDto,
  UpdateOnboardingTaskDto,
  OnboardingTemplateDto,
  CreateOnboardingTemplateDto,
  UpdateOnboardingTemplateDto,
  OnboardingStatisticsDto,
  OnboardingProcessStatus,
  OnboardingTaskStatus,
} from '../types/onboarding';

/**
 * Onboarding Service
 *
 * Provides onboarding/offboarding workflow operations with proper error handling.
 */

export const onboardingService = {
  // ============================================
  // Process Operations
  // ============================================

  /**
   * Get all processes with optional filtering
   */
  async getProcesses(filter?: OnboardingProcessFilter): Promise<OnboardingProcessSummaryDto[]> {
    try {
      return await onboardingApi.getProcesses(filter);
    } catch (error) {
      console.error('Failed to fetch onboarding processes:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Kan onboarding processen niet ophalen'
      );
    }
  },

  /**
   * Get a single process by ID with all tasks
   */
  async getProcess(id: string): Promise<OnboardingProcessDto> {
    try {
      return await onboardingApi.getProcessById(id);
    } catch (error) {
      console.error('Failed to fetch onboarding process:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Kan onboarding proces niet ophalen'
      );
    }
  },

  /**
   * Get processes for a specific employee
   */
  async getProcessesByEmployee(employeeId: string): Promise<OnboardingProcessSummaryDto[]> {
    try {
      return await onboardingApi.getProcessesByEmployee(employeeId);
    } catch (error) {
      console.error('Failed to fetch processes for employee:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Kan processen voor medewerker niet ophalen'
      );
    }
  },

  /**
   * Get processes assigned to the current user
   */
  async getMyProcesses(): Promise<OnboardingProcessSummaryDto[]> {
    try {
      return await onboardingApi.getMyProcesses();
    } catch (error) {
      console.error('Failed to fetch my processes:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Kan mijn processen niet ophalen'
      );
    }
  },

  /**
   * Create a new process
   */
  async createProcess(dto: CreateOnboardingProcessDto): Promise<OnboardingProcessDto> {
    try {
      return await onboardingApi.createProcess(dto);
    } catch (error) {
      console.error('Failed to create onboarding process:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Kan onboarding proces niet aanmaken'
      );
    }
  },

  /**
   * Create a process from a template
   */
  async createProcessFromTemplate(dto: CreateProcessFromTemplateDto): Promise<OnboardingProcessDto> {
    try {
      return await onboardingApi.createProcessFromTemplate(dto);
    } catch (error) {
      console.error('Failed to create process from template:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Kan proces vanuit template niet aanmaken'
      );
    }
  },

  /**
   * Update an existing process
   */
  async updateProcess(id: string, dto: UpdateOnboardingProcessDto): Promise<OnboardingProcessDto> {
    try {
      return await onboardingApi.updateProcess(id, dto);
    } catch (error) {
      console.error('Failed to update onboarding process:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Kan onboarding proces niet bijwerken'
      );
    }
  },

  /**
   * Change process status
   */
  async changeProcessStatus(
    id: string,
    newStatus: OnboardingProcessStatus,
    reason?: string
  ): Promise<OnboardingProcessDto> {
    try {
      return await onboardingApi.changeProcessStatus(id, newStatus, reason);
    } catch (error) {
      console.error('Failed to change process status:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Kan status niet wijzigen'
      );
    }
  },

  /**
   * Delete a process (soft delete)
   */
  async deleteProcess(id: string): Promise<void> {
    try {
      await onboardingApi.deleteProcess(id);
    } catch (error) {
      console.error('Failed to delete onboarding process:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Kan onboarding proces niet verwijderen'
      );
    }
  },

  /**
   * Get statistics
   */
  async getStatistics(): Promise<OnboardingStatisticsDto> {
    try {
      return await onboardingApi.getStatistics();
    } catch (error) {
      console.error('Failed to fetch onboarding statistics:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Kan statistieken niet ophalen'
      );
    }
  },

  // ============================================
  // Task Operations
  // ============================================

  /**
   * Get all tasks for a process
   */
  async getTasksByProcess(processId: string): Promise<OnboardingTaskDto[]> {
    try {
      return await onboardingApi.getTasksByProcess(processId);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Kan taken niet ophalen'
      );
    }
  },

  /**
   * Get tasks assigned to the current user
   */
  async getMyTasks(): Promise<OnboardingTaskDto[]> {
    try {
      return await onboardingApi.getMyTasks();
    } catch (error) {
      console.error('Failed to fetch my tasks:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Kan mijn taken niet ophalen'
      );
    }
  },

  /**
   * Get a single task by ID
   */
  async getTask(taskId: string): Promise<OnboardingTaskDto> {
    try {
      return await onboardingApi.getTaskById(taskId);
    } catch (error) {
      console.error('Failed to fetch task:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Kan taak niet ophalen'
      );
    }
  },

  /**
   * Create a new task
   */
  async createTask(dto: CreateOnboardingTaskDto): Promise<OnboardingTaskDto> {
    try {
      return await onboardingApi.createTask(dto);
    } catch (error) {
      console.error('Failed to create task:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Kan taak niet aanmaken'
      );
    }
  },

  /**
   * Update an existing task
   */
  async updateTask(
    taskId: string,
    dto: UpdateOnboardingTaskDto
  ): Promise<OnboardingTaskDto> {
    try {
      return await onboardingApi.updateTask(taskId, dto);
    } catch (error) {
      console.error('Failed to update task:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Kan taak niet bijwerken'
      );
    }
  },

  /**
   * Change task status
   */
  async changeTaskStatus(
    taskId: string,
    newStatus: OnboardingTaskStatus,
    notes?: string
  ): Promise<OnboardingTaskDto> {
    try {
      return await onboardingApi.changeTaskStatus(taskId, newStatus, notes);
    } catch (error) {
      console.error('Failed to change task status:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Kan taakstatus niet wijzigen'
      );
    }
  },

  /**
   * Assign a task to someone
   */
  async assignTask(taskId: string, email: string): Promise<OnboardingTaskDto> {
    try {
      return await onboardingApi.assignTask(taskId, email);
    } catch (error) {
      console.error('Failed to assign task:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Kan taak niet toewijzen'
      );
    }
  },

  /**
   * Delete a task
   */
  async deleteTask(taskId: string): Promise<void> {
    try {
      await onboardingApi.deleteTask(taskId);
    } catch (error) {
      console.error('Failed to delete task:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Kan taak niet verwijderen'
      );
    }
  },

  // ============================================
  // Template Operations
  // ============================================

  /**
   * Get all templates
   */
  async getTemplates(type?: string): Promise<OnboardingTemplateDto[]> {
    try {
      return await onboardingApi.getTemplates(type);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Kan templates niet ophalen'
      );
    }
  },

  /**
   * Get a single template by ID
   */
  async getTemplate(id: string): Promise<OnboardingTemplateDto> {
    try {
      return await onboardingApi.getTemplateById(id);
    } catch (error) {
      console.error('Failed to fetch template:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Kan template niet ophalen'
      );
    }
  },

  /**
   * Create a new template
   */
  async createTemplate(dto: CreateOnboardingTemplateDto): Promise<OnboardingTemplateDto> {
    try {
      return await onboardingApi.createTemplate(dto);
    } catch (error) {
      console.error('Failed to create template:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Kan template niet aanmaken'
      );
    }
  },

  /**
   * Update an existing template
   */
  async updateTemplate(id: string, dto: UpdateOnboardingTemplateDto): Promise<OnboardingTemplateDto> {
    try {
      return await onboardingApi.updateTemplate(id, dto);
    } catch (error) {
      console.error('Failed to update template:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Kan template niet bijwerken'
      );
    }
  },

  /**
   * Set a template as default
   */
  async setTemplateDefault(id: string): Promise<OnboardingTemplateDto> {
    try {
      return await onboardingApi.setTemplateDefault(id);
    } catch (error) {
      console.error('Failed to set template as default:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Kan template niet als standaard instellen'
      );
    }
  },

  /**
   * Delete a template (soft delete)
   */
  async deleteTemplate(id: string): Promise<void> {
    try {
      await onboardingApi.deleteTemplate(id);
    } catch (error) {
      console.error('Failed to delete template:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Kan template niet verwijderen'
      );
    }
  },
};
