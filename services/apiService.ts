// services/apiService.ts
// Axios-based API service for tasks and lists

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { 
  TaskDTO, 
  TaskListDTO, 
  GroupedTasks,
  CreateTaskInput, 
  UpdateTaskInput, 
  CreateListInput, 
  UpdateListInput,
  TaskQueryParams 
} from '@/types/task';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface ApiError {
  error: string;
  fields?: Record<string, string[]>;
}

export interface ApiErrorWithStatus extends Error {
  status?: number;
  fields?: Record<string, string[]>;
}

// ─── Token management ──────────────────────────────────────────────────────────
// Token getter will be set by the auth hook at runtime
let getAccessTokenCallback: () => Promise<string | null> | string | null = () => null;

/**
 * Set the callback function to retrieve the current access token.
 * This should be called from the auth provider/hook during initialization.
 */
export function setTokenGetter(callback: () => Promise<string | null> | string | null): void {
  getAccessTokenCallback = callback;
}

// ─── Axios instance ─────────────────────────────────────────────────────────────
const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '/',
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request interceptor ────────────────────────────────────────────────────────
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Get the current access token
    const token = await getAccessTokenCallback();
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ─── Response interceptor ───────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    // Format error for consistent handling
    const apiError: ApiErrorWithStatus = new Error(
      error.response?.data?.error ?? 'Something went wrong. Please try again.'
    );
    apiError.status = error.response?.status;
    apiError.fields = error.response?.data?.fields;
    
    return Promise.reject(apiError);
  }
);

// ─── API Response wrapper ───────────────────────────────────────────────────────
interface ApiResponse<T> {
  data: T;
  message?: string;
}

// ─── Task API ───────────────────────────────────────────────────────────────────

export const taskApi = {
  /**
   * Get all tasks for the current user
   * Returns tasks grouped by status by default
   */
  async getTasks(params?: TaskQueryParams): Promise<GroupedTasks | TaskDTO[]> {
    const response = await api.get<ApiResponse<GroupedTasks | TaskDTO[]>>('/api/tasks', { params });
    return response.data.data;
  },

  /**
   * Get a single task by ID
   */
  async getTask(taskId: string): Promise<TaskDTO> {
    const response = await api.get<ApiResponse<TaskDTO>>(`/api/tasks/${taskId}`);
    return response.data.data;
  },

  /**
   * Create a new task
   */
  async createTask(data: CreateTaskInput): Promise<TaskDTO> {
    const response = await api.post<ApiResponse<TaskDTO>>('/api/tasks', data);
    return response.data.data;
  },

  /**
   * Update an existing task (partial update)
   */
  async updateTask(taskId: string, data: UpdateTaskInput): Promise<TaskDTO> {
    const response = await api.patch<ApiResponse<TaskDTO>>(`/api/tasks/${taskId}`, data);
    return response.data.data;
  },

  /**
   * Toggle task completion status
   */
  async toggleTask(taskId: string): Promise<TaskDTO> {
    return this.updateTask(taskId, { toggle: true });
  },

  /**
   * Soft delete a task (can be undone)
   */
  async deleteTask(taskId: string): Promise<{ data: TaskDTO; message: string }> {
    const response = await api.delete<{ data: TaskDTO; message: string }>(`/api/tasks/${taskId}`);
    return response.data;
  },

  /**
   * Permanently delete a task (cannot be undone)
   */
  async permanentDeleteTask(taskId: string): Promise<void> {
    await api.delete(`/api/tasks/${taskId}`, { params: { permanent: 'true' } });
  },

  /**
   * Restore a soft-deleted task
   */
  async restoreTask(taskId: string): Promise<TaskDTO> {
    const response = await api.patch<ApiResponse<TaskDTO>>(`/api/tasks/${taskId}`, { restore: true });
    return response.data.data;
  },
};

// ─── List API ───────────────────────────────────────────────────────────────────

export const listApi = {
  /**
   * Get all lists for the current user
   */
  async getLists(): Promise<TaskListDTO[]> {
    const response = await api.get<ApiResponse<TaskListDTO[]>>('/api/lists');
    return response.data.data;
  },

  /**
   * Get a single list by ID
   */
  async getList(listId: string): Promise<TaskListDTO> {
    const response = await api.get<ApiResponse<TaskListDTO>>(`/api/lists/${listId}`);
    return response.data.data;
  },

  /**
   * Create a new list
   */
  async createList(data: CreateListInput): Promise<TaskListDTO> {
    const response = await api.post<ApiResponse<TaskListDTO>>('/api/lists', data);
    return response.data.data;
  },

  /**
   * Update an existing list (partial update)
   */
  async updateList(listId: string, data: UpdateListInput): Promise<TaskListDTO> {
    const response = await api.patch<ApiResponse<TaskListDTO>>(`/api/lists/${listId}`, data);
    return response.data.data;
  },

  /**
   * Delete a list
   */
  async deleteList(listId: string): Promise<void> {
    await api.delete(`/api/lists/${listId}`);
  },
};

export default api;