/**
 * Backend API Database Adapter
 * 
 * PURPOSE: Implements IDatabaseAdapter interface using backend API
 * REPLACES: Direct Supabase access from frontend
 * 
 * ARCHITECTURE:
 * - Frontend → Backend API → Supabase
 * - Firebase token verification happens on backend
 * - No direct database access from frontend
 */

import type { IDatabaseAdapter, DatabaseError, Event, Profile } from '../interfaces';
import { apiClient } from '@/lib/api-client';

/**
 * Convert API error to DatabaseError
 */
function convertApiError(error?: string, message?: string): DatabaseError {
  return {
    code: 'api_error',
    message: message || error || 'An unknown error occurred',
    details: null,
  };
}

export class BackendDatabaseAdapter implements IDatabaseAdapter {
  /**
   * Get all events with optional filtering
   */
  async getEvents(options?: {
    userId?: string;
    status?: string;
    category?: string;
    limit?: number;
  }): Promise<{ data: Event[] | null; error: DatabaseError | null }> {
    try {
      // If userId is provided, get user's events
      if (options?.userId) {
        const response = await apiClient.events.getMine();
        
        if (response.error) {
          return {
            data: null,
            error: convertApiError(response.error, response.message),
          };
        }

        let events = response.data || [];

        // Apply client-side filters (backend doesn't support all filters yet)
        if (options.status) {
          events = events.filter(e => e.status === options.status);
        }
        if (options.category) {
          events = events.filter(e => e.category === options.category);
        }
        if (options.limit) {
          events = events.slice(0, options.limit);
        }

        return { data: events, error: null };
      }

      // Get all approved events (public)
      const response = await apiClient.events.getAll();
      
      if (response.error) {
        return {
          data: null,
          error: convertApiError(response.error, response.message),
        };
      }

      let events = response.data || [];

      // Apply client-side filters
      if (options?.category) {
        events = events.filter(e => e.category === options.category);
      }
      if (options?.limit) {
        events = events.slice(0, options.limit);
      }

      return { data: events, error: null };
    } catch (error) {
      return {
        data: null,
        error: {
          code: 'network_error',
          message: error instanceof Error ? error.message : 'Network error',
          details: null,
        },
      };
    }
  }

  /**
   * Get single event by ID
   */
  async getEvent(id: string): Promise<{ data: Event | null; error: DatabaseError | null }> {
    try {
      const response = await apiClient.events.getById(id);
      
      if (response.error) {
        return {
          data: null,
          error: convertApiError(response.error, response.message),
        };
      }

      return { data: response.data || null, error: null };
    } catch (error) {
      return {
        data: null,
        error: {
          code: 'network_error',
          message: error instanceof Error ? error.message : 'Network error',
          details: null,
        },
      };
    }
  }

  /**
   * Create new event
   */
  async createEvent(event: Omit<Event, 'id' | 'created_at' | 'updated_at'>): Promise<{
    data: Event | null;
    error: DatabaseError | null;
  }> {
    try {
      const response = await apiClient.events.create({
        title: event.title,
        description: event.description,
        start_date: event.start_date,
        end_date: event.end_date,
        location: event.location,
        latitude: event.latitude,
        longitude: event.longitude,
        image_url: event.image_url,
        category: event.category,
      });
      
      if (response.error) {
        return {
          data: null,
          error: convertApiError(response.error, response.message),
        };
      }

      return { data: response.data || null, error: null };
    } catch (error) {
      return {
        data: null,
        error: {
          code: 'network_error',
          message: error instanceof Error ? error.message : 'Network error',
          details: null,
        },
      };
    }
  }

  /**
   * Update existing event
   */
  async updateEvent(
    id: string,
    updates: Partial<Event>
  ): Promise<{ data: Event | null; error: DatabaseError | null }> {
    try {
      const response = await apiClient.events.update(id, updates);
      
      if (response.error) {
        return {
          data: null,
          error: convertApiError(response.error, response.message),
        };
      }

      return { data: response.data || null, error: null };
    } catch (error) {
      return {
        data: null,
        error: {
          code: 'network_error',
          message: error instanceof Error ? error.message : 'Network error',
          details: null,
        },
      };
    }
  }

  /**
   * Delete event
   */
  async deleteEvent(id: string): Promise<{ data: null; error: DatabaseError | null }> {
    try {
      const response = await apiClient.events.delete(id);
      
      if (response.error) {
        return {
          data: null,
          error: convertApiError(response.error, response.message),
        };
      }

      return { data: null, error: null };
    } catch (error) {
      return {
        data: null,
        error: {
          code: 'network_error',
          message: error instanceof Error ? error.message : 'Network error',
          details: null,
        },
      };
    }
  }

  /**
   * Get user profile (NOT IMPLEMENTED - profiles managed by backend)
   */
  async getProfile(userId: string): Promise<{ data: Profile | null; error: DatabaseError | null }> {
    console.warn('getProfile not implemented in backend adapter - profiles managed by backend');
    return {
      data: null,
      error: {
        code: 'not_implemented',
        message: 'Profile operations are managed by the backend',
        details: null,
      },
    };
  }

  /**
   * Update profile (NOT IMPLEMENTED - profiles managed by backend)
   */
  async updateProfile(
    userId: string,
    updates: Partial<Profile>
  ): Promise<{ data: Profile | null; error: DatabaseError | null }> {
    console.warn('updateProfile not implemented in backend adapter - profiles managed by backend');
    return {
      data: null,
      error: {
        code: 'not_implemented',
        message: 'Profile operations are managed by the backend',
        details: null,
      },
    };
  }

  /**
   * Generic query (NOT SUPPORTED - use backend API endpoints)
   */
  async query<T = any>(
    table: string,
    options?: any
  ): Promise<{ data: T[] | null; error: DatabaseError | null }> {
    console.warn('Generic query not supported in backend adapter - use specific API endpoints');
    return {
      data: null,
      error: {
        code: 'not_supported',
        message: 'Generic queries not supported - use specific API endpoints',
        details: null,
      },
    };
  }

  /**
   * Generic insert (NOT SUPPORTED - use backend API endpoints)
   */
  async insert<T = any>(
    table: string,
    data: Partial<T> | Partial<T>[]
  ): Promise<{ data: T | T[] | null; error: DatabaseError | null }> {
    console.warn('Generic insert not supported in backend adapter - use specific API endpoints');
    return {
      data: null,
      error: {
        code: 'not_supported',
        message: 'Generic insert not supported - use specific API endpoints',
        details: null,
      },
    };
  }

  /**
   * Generic update (NOT SUPPORTED - use backend API endpoints)
   */
  async update<T = any>(
    table: string,
    filters: Record<string, any>,
    updates: Partial<T>
  ): Promise<{ data: T[] | null; error: DatabaseError | null }> {
    console.warn('Generic update not supported in backend adapter - use specific API endpoints');
    return {
      data: null,
      error: {
        code: 'not_supported',
        message: 'Generic update not supported - use specific API endpoints',
        details: null,
      },
    };
  }

  /**
   * Generic delete (NOT SUPPORTED - use backend API endpoints)
   */
  async delete(
    table: string,
    filters: Record<string, any>
  ): Promise<{ error: DatabaseError | null }> {
    console.warn('Generic delete not supported in backend adapter - use specific API endpoints');
    return {
      error: {
        code: 'not_supported',
        message: 'Generic delete not supported - use specific API endpoints',
        details: null,
      },
    };
  }
}
