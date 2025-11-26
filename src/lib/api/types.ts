/**
 * 🔌 API CLIENT TYPES
 * TypeScript types for unified API client
 */

import { z } from 'zod';

export interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

export interface RequestConfig<TSchema extends z.ZodTypeAny = z.ZodTypeAny> {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  params?: Record<string, string | number | boolean>;
  schema?: TSchema;
  timeout?: number;
  retries?: number;
  signal?: AbortSignal;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Headers;
  ok: boolean;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
}

export type RequestInterceptor = (
  url: string,
  config: RequestConfig
) => Promise<{ url: string; config: RequestConfig }> | { url: string; config: RequestConfig };

export type ResponseInterceptor = <T>(
  response: ApiResponse<T>
) => Promise<ApiResponse<T>> | ApiResponse<T>;

export type ErrorInterceptor = (
  error: ApiError
) => Promise<never> | never;
