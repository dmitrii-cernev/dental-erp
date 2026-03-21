import { apiFetch } from './client';
import type { DashboardStats } from '../types/api';

export const getDashboardStats = () => apiFetch<DashboardStats>('/dashboard/stats');
