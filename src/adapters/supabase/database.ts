/**
 * Supabase Database Adapter
 * Implements IDatabaseAdapter interface for Supabase PostgreSQL
 */

import type { IDatabaseAdapter, DatabaseError, QueryOptions, Event, Profile } from '../interfaces';
import { supabase } from '@/integrations/supabase/client';
import type { PostgrestError } from '@supabase/supabase-js';

/**
 * Convert Supabase error to generic DatabaseError
 */
function convertSupabaseError(error: PostgrestError | null): DatabaseError | null {
  if (!error) return null;
  
  return {
    code: error.code || 'unknown',
    message: error.message || 'An unknown database error occurred',
    details: error.details,
  };
}

export class SupabaseDatabaseAdapter implements IDatabaseAdapter {
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
      let query = supabase
        .from('events')
        .select('*')
        .order('start_date', { ascending: true });

      // Apply filters
      if (options?.userId) {
        query = query.eq('user_id', options.userId);
      }
      if (options?.status) {
        query = query.eq('status', options.status as any);
      }
      if (options?.category) {
        query = query.eq('category', options.category as any);
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      return {
        data: data as Event[] | null,
        error: convertSupabaseError(error),
      };
    } catch (error: any) {
      console.error('Supabase getEvents error:', error);
      return {
        data: null,
        error: { code: 'unknown', message: error.message },
      };
    }
  }

  /**
   * Get a single event by ID
   */
  async getEvent(id: string): Promise<{ data: Event | null; error: DatabaseError | null }> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      return {
        data: data as Event | null,
        error: convertSupabaseError(error),
      };
    } catch (error: any) {
      console.error('Supabase getEvent error:', error);
      return {
        data: null,
        error: { code: 'unknown', message: error.message },
      };
    }
  }

  /**
   * Create a new event
   */
  async createEvent(event: Partial<Event>): Promise<{ data: Event | null; error: DatabaseError | null }> {
    try {
      const { data, error } = await supabase
        .from('events')
        .insert([event as any])
        .select()
        .single();

      return {
        data: data as Event | null,
        error: convertSupabaseError(error),
      };
    } catch (error: any) {
      console.error('Supabase createEvent error:', error);
      return {
        data: null,
        error: { code: 'unknown', message: error.message },
      };
    }
  }

  /**
   * Update an existing event
   */
  async updateEvent(id: string, updates: Partial<Event>): Promise<{ data: Event | null; error: DatabaseError | null }> {
    try {
      const { data, error } = await supabase
        .from('events')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      return {
        data: data as Event | null,
        error: convertSupabaseError(error),
      };
    } catch (error: any) {
      console.error('Supabase updateEvent error:', error);
      return {
        data: null,
        error: { code: 'unknown', message: error.message },
      };
    }
  }

  /**
   * Delete an event
   */
  async deleteEvent(id: string): Promise<{ error: DatabaseError | null }> {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      return {
        error: convertSupabaseError(error),
      };
    } catch (error: any) {
      console.error('Supabase deleteEvent error:', error);
      return {
        error: { code: 'unknown', message: error.message },
      };
    }
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<{ data: Profile | null; error: DatabaseError | null }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      return {
        data: data as Profile | null,
        error: convertSupabaseError(error),
      };
    } catch (error: any) {
      console.error('Supabase getProfile error:', error);
      return {
        data: null,
        error: { code: 'unknown', message: error.message },
      };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<Profile>): Promise<{ data: Profile | null; error: DatabaseError | null }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates as any)
        .eq('user_id', userId)
        .select()
        .single();

      return {
        data: data as Profile | null,
        error: convertSupabaseError(error),
      };
    } catch (error: any) {
      console.error('Supabase updateProfile error:', error);
      return {
        data: null,
        error: { code: 'unknown', message: error.message },
      };
    }
  }

  /**
   * Generic query method for custom queries
   */
  async query<T = any>(
    table: string,
    options?: QueryOptions
  ): Promise<{ data: T[] | null; error: DatabaseError | null }> {
    try {
      // Use any to avoid deep type instantiation
      const client = supabase as any;
      let query = client.from(table).select(options?.select || '*');

      // Apply filters
      if (options?.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      // Apply ordering
      if (options?.orderBy) {
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.ascending ?? true,
        });
      }

      // Apply limit
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      return {
        data: data as T[] | null,
        error: convertSupabaseError(error),
      };
    } catch (error: any) {
      console.error('Supabase query error:', error);
      return {
        data: null,
        error: { code: 'unknown', message: error.message },
      };
    }
  }

  /**
   * Generic insert method
   */
  async insert<T = any>(
    table: string,
    data: Partial<T> | Partial<T>[]
  ): Promise<{ data: T | T[] | null; error: DatabaseError | null }> {
    try {
      const insertData = Array.isArray(data) ? data : [data];
      const { data: result, error } = await (supabase as any)
        .from(table)
        .insert(insertData)
        .select();

      return {
        data: Array.isArray(data) ? (result as T[]) : (result?.[0] as T),
        error: convertSupabaseError(error),
      };
    } catch (error: any) {
      console.error('Supabase insert error:', error);
      return {
        data: null,
        error: { code: 'unknown', message: error.message },
      };
    }
  }

  /**
   * Generic update method
   */
  async update<T = any>(
    table: string,
    filters: Record<string, any>,
    updates: Partial<T>
  ): Promise<{ data: T[] | null; error: DatabaseError | null }> {
    try {
      // Use any to avoid deep type instantiation
      const client = supabase as any;
      let query = client.from(table).update(updates);

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      const { data, error } = await query.select();

      return {
        data: data as T[] | null,
        error: convertSupabaseError(error),
      };
    } catch (error: any) {
      console.error('Supabase update error:', error);
      return {
        data: null,
        error: { code: 'unknown', message: error.message },
      };
    }
  }

  /**
   * Generic delete method
   */
  async delete(
    table: string,
    filters: Record<string, any>
  ): Promise<{ error: DatabaseError | null }> {
    try {
      // Use any to avoid deep type instantiation
      const client = supabase as any;
      let query = client.from(table).delete();

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      const { error } = await query;

      return {
        error: convertSupabaseError(error),
      };
    } catch (error: any) {
      console.error('Supabase delete error:', error);
      return {
        error: { code: 'unknown', message: error.message },
      };
    }
  }
}
