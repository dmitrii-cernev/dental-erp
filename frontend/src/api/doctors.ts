import { apiFetch } from './client';
import type { DoctorRead, PersonBase } from '../types/api';

export const getDoctors = () => apiFetch<DoctorRead[]>('/doctors');
export const getDoctor = (id: number) => apiFetch<DoctorRead>(`/doctors/${id}`);
export const createDoctor = (data: PersonBase) =>
  apiFetch<DoctorRead>('/doctors', { method: 'POST', body: JSON.stringify(data) });
export const updateDoctor = (id: number, data: Partial<PersonBase>) =>
  apiFetch<DoctorRead>(`/doctors/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteDoctor = (id: number) =>
  apiFetch<void>(`/doctors/${id}`, { method: 'DELETE' });
