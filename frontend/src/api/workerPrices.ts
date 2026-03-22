import { apiFetch } from './client';
import type { WorkerPriceRead } from '../types/api';

export const getWorkerPrices = (workerId: number) =>
  apiFetch<WorkerPriceRead[]>(`/workers/${workerId}/prices`);

export const upsertWorkerPrice = (workerId: number, serviceId: number, price: string) =>
  apiFetch<WorkerPriceRead>(`/workers/${workerId}/prices/${serviceId}`, {
    method: 'PUT',
    body: JSON.stringify({ price }),
  });

export const deleteWorkerPrice = (workerId: number, serviceId: number) =>
  apiFetch<void>(`/workers/${workerId}/prices/${serviceId}`, { method: 'DELETE' });
