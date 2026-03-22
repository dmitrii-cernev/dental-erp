import { apiFetch } from './client';
import type { ServiceCreate, ServiceRead, ServiceUpdate } from '../types/api';

export const getServices = () => apiFetch<ServiceRead[]>('/services');
export const getService = (id: number) => apiFetch<ServiceRead>(`/services/${id}`);
export const createService = (data: ServiceCreate) =>
  apiFetch<ServiceRead>('/services', { method: 'POST', body: JSON.stringify(data) });
export const updateService = (id: number, data: ServiceUpdate) =>
  apiFetch<ServiceRead>(`/services/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteService = (id: number) =>
  apiFetch<void>(`/services/${id}`, { method: 'DELETE' });
