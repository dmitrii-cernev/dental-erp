import { apiFetch } from './client';
import type { LoginResponse, UserRead } from '../types/api';

export async function login(username: string, password: string): Promise<LoginResponse> {
  const body = new URLSearchParams({ username, password });
  return apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
}

export async function getMe(): Promise<UserRead> {
  return apiFetch<UserRead>('/users/me');
}
