import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { appConfig } from '../config';

/**
 * Supabase Service
 * 
 * PURPOSE: Database operations using Supabase PostgreSQL.
 * Uses SERVICE ROLE KEY - this runs ONLY on the backend.
 * 
 * IMPORTANT: The frontend NEVER accesses Supabase directly.
 * All database operations go through this backend API.
 */

let supabaseClient: SupabaseClient | null = null;

export function initializeSupabase(): void {
  if (supabaseClient) {
    console.log('✅ Supabase client already initialized');
    return;
  }

  try {
    supabaseClient = createClient(
      appConfig.supabase.url,
      appConfig.supabase.serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    console.log('✅ Supabase client initialized (Service Role)');
  } catch (error) {
    console.error('❌ Failed to initialize Supabase client:', error);
    throw error;
  }
}

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    throw new Error('Supabase client not initialized. Call initializeSupabase() first.');
  }
  return supabaseClient;
}

/**
 * Database Types
 */

export interface DbUser {
  id: string; // UUID
  firebase_uid: string;
  email: string | null;
  display_name: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbEvent {
  id: string;
  user_id: string; // References users.id (UUID)
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  latitude: number;
  longitude: number;
  image_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  category: string;
  created_at: string;
  updated_at: string;
}
