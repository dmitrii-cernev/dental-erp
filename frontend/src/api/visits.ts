import { apiFetch } from './client';
import type { VisitRead, VisitCreate, VisitUpdate, VisitFilters } from '../types/api';

export const getVisits = (filters?: VisitFilters) =>
  apiFetch<VisitRead[]>('/visits', { params: filters as Record<string, string | number | undefined> });
export const getVisit = (id: number) => apiFetch<VisitRead>(`/visits/${id}`);
export const createVisit = (data: VisitCreate) =>
  apiFetch<VisitRead>('/visits', { method: 'POST', body: JSON.stringify(data) });
export const updateVisit = (id: number, data: VisitUpdate) =>
  apiFetch<VisitRead>(`/visits/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteVisit = (id: number) =>
  apiFetch<void>(`/visits/${id}`, { method: 'DELETE' });
