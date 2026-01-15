/**
 * Supabase Storage Adapter
 * Implements IStorageAdapter interface for Supabase Storage
 */

import type { IStorageAdapter, StorageError } from '../interfaces';
import { supabase } from '@/integrations/supabase/client';

/**
 * Supabase storage error type (simplified)
 */
interface SupabaseStorageError {
  statusCode?: string | number;
  message: string;
}

/**
 * Convert Supabase storage error to generic StorageError
 */
function convertSupabaseStorageError(error: SupabaseStorageError | null): StorageError | null {
  if (!error) return null;
  
  return {
    code: error.statusCode?.toString() || 'unknown',
    message: error.message || 'An unknown storage error occurred',
  };
}

export class SupabaseStorageAdapter implements IStorageAdapter {
  private defaultBucket = 'event-images'; // Change to your bucket name

  /**
   * Upload a file to storage
   */
  async upload(
    path: string,
    file: File,
    options?: { bucket?: string; contentType?: string }
  ): Promise<{ data: { path: string } | null; error: StorageError | null }> {
    try {
      const bucket = options?.bucket || this.defaultBucket;
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          contentType: options?.contentType || file.type,
          upsert: true,
        });

      if (error) {
        return {
          data: null,
          error: convertSupabaseStorageError(error),
        };
      }

      return {
        data: { path: data.path },
        error: null,
      };
    } catch (error: any) {
      console.error('Supabase storage upload error:', error);
      return {
        data: null,
        error: { code: 'unknown', message: error.message },
      };
    }
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(path: string, options?: { bucket?: string }): string {
    const bucket = options?.bucket || this.defaultBucket;
    
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  /**
   * Delete a file from storage
   */
  async delete(
    path: string,
    options?: { bucket?: string }
  ): Promise<{ error: StorageError | null }> {
    try {
      const bucket = options?.bucket || this.defaultBucket;
      
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      return {
        error: convertSupabaseStorageError(error),
      };
    } catch (error: any) {
      console.error('Supabase storage delete error:', error);
      return {
        error: { code: 'unknown', message: error.message },
      };
    }
  }

  /**
   * List files in a directory
   */
  async list(
    path: string,
    options?: { bucket?: string; limit?: number }
  ): Promise<{ data: Array<{ name: string; path: string }> | null; error: StorageError | null }> {
    try {
      const bucket = options?.bucket || this.defaultBucket;
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(path, {
          limit: options?.limit || 100,
        });

      if (error) {
        return {
          data: null,
          error: convertSupabaseStorageError(error),
        };
      }

      return {
        data: data?.map((file) => ({
          name: file.name,
          path: `${path}/${file.name}`,
        })) || null,
        error: null,
      };
    } catch (error: any) {
      console.error('Supabase storage list error:', error);
      return {
        data: null,
        error: { code: 'unknown', message: error.message },
      };
    }
  }
}
