import { apiFetch } from './client';
import type { ClientRead, PersonBase } from '../types/api';

export const getClients = () => apiFetch<ClientRead[]>('/clients');
export const getClient = (id: number) => apiFetch<ClientRead>(`/clients/${id}`);
export const createClient = (data: PersonBase) =>
  apiFetch<ClientRead>('/clients', { method: 'POST', body: JSON.stringify(data) });
export const updateClient = (id: number, data: Partial<PersonBase>) =>
  apiFetch<ClientRead>(`/clients/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteClient = (id: number) =>
  apiFetch<void>(`/clients/${id}`, { method: 'DELETE' });
