/**
 * Supabase Functions Adapter
 * Implements IFunctionsAdapter interface for Supabase Edge Functions
 */

import type { IFunctionsAdapter, FunctionsError } from '../interfaces';
import { supabase } from '@/integrations/supabase/client';
import type { FunctionsHttpError, FunctionsRelayError, FunctionsFetchError } from '@supabase/supabase-js';

/**
 * Convert Supabase functions error to generic FunctionsError
 */
function convertSupabaseFunctionsError(
  error: FunctionsHttpError | FunctionsRelayError | FunctionsFetchError | null
): FunctionsError | null {
  if (!error) return null;
  
  return {
    code: 'context' in error ? error.context?.status?.toString() : 'unknown',
    message: error.message || 'An unknown functions error occurred',
  };
}

export class SupabaseFunctionsAdapter implements IFunctionsAdapter {
  /**
   * Invoke a serverless function
   */
  async invoke<TRequest = any, TResponse = any>(
    functionName: string,
    options?: {
      body?: TRequest;
      headers?: Record<string, string>;
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    }
  ): Promise<{ data: TResponse | null; error: FunctionsError | null }> {
    try {
      const { data, error } = await supabase.functions.invoke<TResponse>(functionName, {
        body: options?.body,
        headers: options?.headers,
        method: options?.method,
      });

      if (error) {
        return {
          data: null,
          error: convertSupabaseFunctionsError(error),
        };
      }

      return {
        data,
        error: null,
      };
    } catch (error: any) {
      console.error(`Supabase function invoke error (${functionName}):`, error);
      return {
        data: null,
        error: { code: 'unknown', message: error.message },
      };
    }
  }

  /**
   * Invoke function using direct fetch (for cases where supabase.functions.invoke doesn't work)
   */
  async invokeDirect<TRequest = any, TResponse = any>(
    functionName: string,
    options?: {
      body?: TRequest;
      headers?: Record<string, string>;
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    }
  ): Promise<{ data: TResponse | null; error: FunctionsError | null }> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase URL or Anon Key not configured');
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/${functionName}`,
        {
          method: options?.method || 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            ...options?.headers,
          },
          body: options?.body ? JSON.stringify(options.body) : undefined,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        return {
          data: null,
          error: {
            code: response.status.toString(),
            message: errorText || `HTTP ${response.status}: ${response.statusText}`,
          },
        };
      }

      const data = await response.json();

      return {
        data: data as TResponse,
        error: null,
      };
    } catch (error: any) {
      console.error(`Supabase direct function invoke error (${functionName}):`, error);
      return {
        data: null,
        error: { code: 'unknown', message: error.message },
      };
    }
  }
}
