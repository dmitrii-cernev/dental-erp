import { apiFetch } from './client';
import type { WorkerRead, PersonBase } from '../types/api';

export const getWorkers = () => apiFetch<WorkerRead[]>('/workers');
export const getWorker = (id: number) => apiFetch<WorkerRead>(`/workers/${id}`);
export const createWorker = (data: PersonBase) =>
  apiFetch<WorkerRead>('/workers', { method: 'POST', body: JSON.stringify(data) });
export const updateWorker = (id: number, data: Partial<PersonBase>) =>
  apiFetch<WorkerRead>(`/workers/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteWorker = (id: number) =>
  apiFetch<void>(`/workers/${id}`, { method: 'DELETE' });
