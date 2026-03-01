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
  ChangeProcessStatusDto,
  ChangeTaskStatusDto,
  AssignTaskDto,
} from '../types/onboarding';
import { fetchWithAuth } from './api';

export const onboardingApi = {
  // ---- Processes ----
  getProcesses: (filter?: OnboardingProcessFilter): Promise<OnboardingProcessSummaryDto[]> => {
    const params = new URLSearchParams();
    if (filter?.type) params.append('type', filter.type);
    if (filter?.status) params.append('status', filter.status);
    if (filter?.employeeId) params.append('employeeId', filter.employeeId);
    if (filter?.verantwoordelijkeId) params.append('verantwoordelijkeId', filter.verantwoordelijkeId);
    if (filter?.search) params.append('search', filter.search);
    const queryString = params.toString();
    return fetchWithAuth<OnboardingProcessSummaryDto[]>(
      `/onboarding-processes${queryString ? `?${queryString}` : ''}`
    );
  },

  getProcessById: (id: string): Promise<OnboardingProcessDto> => {
    return fetchWithAuth<OnboardingProcessDto>(`/onboarding-processes/${id}`);
  },

  getProcessesByEmployee: (employeeId: string): Promise<OnboardingProcessSummaryDto[]> => {
    return fetchWithAuth<OnboardingProcessSummaryDto[]>(`/onboarding-processes/employee/${employeeId}`);
  },

  getMyProcesses: (): Promise<OnboardingProcessSummaryDto[]> => {
    return fetchWithAuth<OnboardingProcessSummaryDto[]>('/onboarding-processes/my-processes');
  },

  createProcess: (dto: CreateOnboardingProcessDto): Promise<OnboardingProcessDto> => {
    return fetchWithAuth<OnboardingProcessDto>('/onboarding-processes', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  createProcessFromTemplate: (dto: CreateProcessFromTemplateDto): Promise<OnboardingProcessDto> => {
    return fetchWithAuth<OnboardingProcessDto>('/onboarding-processes/from-template', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  updateProcess: (id: string, dto: UpdateOnboardingProcessDto): Promise<OnboardingProcessDto> => {
    return fetchWithAuth<OnboardingProcessDto>(`/onboarding-processes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  changeProcessStatus: (
    id: string,
    newStatus: OnboardingProcessStatus,
    reason?: string
  ): Promise<OnboardingProcessDto> => {
    const dto: ChangeProcessStatusDto = { nieuweStatus: newStatus, opmerking: reason };
    return fetchWithAuth<OnboardingProcessDto>(`/onboarding-processes/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  },

  deleteProcess: (id: string): Promise<void> => {
    return fetchWithAuth<void>(`/onboarding-processes/${id}`, {
      method: 'DELETE',
    });
  },

  getStatistics: (): Promise<OnboardingStatisticsDto> => {
    return fetchWithAuth<OnboardingStatisticsDto>('/onboarding-processes/statistics');
  },

  // ---- Tasks ----
  getTasksByProcess: (processId: string): Promise<OnboardingTaskDto[]> => {
    return fetchWithAuth<OnboardingTaskDto[]>(`/onboarding-tasks/process/${processId}`);
  },

  getMyTasks: (): Promise<OnboardingTaskDto[]> => {
    return fetchWithAuth<OnboardingTaskDto[]>('/onboarding-tasks/my-tasks');
  },

  getTaskById: (taskId: string): Promise<OnboardingTaskDto> => {
    return fetchWithAuth<OnboardingTaskDto>(`/onboarding-tasks/${taskId}`);
  },

  createTask: (dto: CreateOnboardingTaskDto): Promise<OnboardingTaskDto> => {
    return fetchWithAuth<OnboardingTaskDto>('/onboarding-tasks', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  updateTask: (taskId: string, dto: UpdateOnboardingTaskDto): Promise<OnboardingTaskDto> => {
    return fetchWithAuth<OnboardingTaskDto>(`/onboarding-tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  changeTaskStatus: (
    taskId: string,
    newStatus: OnboardingTaskStatus,
    notes?: string
  ): Promise<OnboardingTaskDto> => {
    const dto: ChangeTaskStatusDto = { nieuweStatus: newStatus, voltooiingNotities: notes };
    return fetchWithAuth<OnboardingTaskDto>(`/onboarding-tasks/${taskId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  },

  assignTask: (taskId: string, email: string): Promise<OnboardingTaskDto> => {
    const dto: AssignTaskDto = { email };
    return fetchWithAuth<OnboardingTaskDto>(`/onboarding-tasks/${taskId}/assign`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  },

  deleteTask: (taskId: string): Promise<void> => {
    return fetchWithAuth<void>(`/onboarding-tasks/${taskId}`, {
      method: 'DELETE',
    });
  },

  // ---- Templates ----
  getTemplates: (type?: string): Promise<OnboardingTemplateDto[]> => {
    const queryString = type ? `?type=${type}` : '';
    return fetchWithAuth<OnboardingTemplateDto[]>(`/onboarding-templates${queryString}`);
  },

  getTemplateById: (id: string): Promise<OnboardingTemplateDto> => {
    return fetchWithAuth<OnboardingTemplateDto>(`/onboarding-templates/${id}`);
  },

  createTemplate: (dto: CreateOnboardingTemplateDto): Promise<OnboardingTemplateDto> => {
    return fetchWithAuth<OnboardingTemplateDto>('/onboarding-templates', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  updateTemplate: (id: string, dto: UpdateOnboardingTemplateDto): Promise<OnboardingTemplateDto> => {
    return fetchWithAuth<OnboardingTemplateDto>(`/onboarding-templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  setTemplateDefault: (id: string): Promise<OnboardingTemplateDto> => {
    return fetchWithAuth<OnboardingTemplateDto>(`/onboarding-templates/${id}/set-default`, {
      method: 'PATCH',
    });
  },

  deleteTemplate: (id: string): Promise<void> => {
    return fetchWithAuth<void>(`/onboarding-templates/${id}`, {
      method: 'DELETE',
    });
  },
};
