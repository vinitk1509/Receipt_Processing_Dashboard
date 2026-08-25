import { api } from './axios'
import type { LoginRequest, RegisterRequest, User, AuthResponse } from '../types/index'

/**
 * Authentication API service.
 * Connects to: POST /api/auth/register, /api/auth/login, GET /api/auth/me
 */
export const authApi = {
  register: (payload: RegisterRequest) =>
    api.post<AuthResponse>('/api/auth/register', payload),

  login: (payload: LoginRequest) =>
    api.post<AuthResponse>('/api/auth/login', payload),

  me: () =>
    api.get<User>('/api/auth/me'),
}
