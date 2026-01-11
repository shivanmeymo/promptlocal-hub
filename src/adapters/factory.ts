/**
 * Backend Factory
 * 
 * Returns the appropriate adapter based on configuration.
 * 
 * ARCHITECTURE:
 * - Firebase: Authentication + Google ecosystem (OAuth, Cloud Messaging)
 * - Supabase: Database, Storage, Functions, Real-time
 * 
 * This hybrid approach leverages the best of both platforms:
 * ✅ Firebase Auth: Industry-leading authentication with Google OAuth
 * ✅ Supabase: Modern PostgreSQL database with real-time capabilities
 */

import { BACKEND_CONFIG } from '@/config/backend';
import type { 
  IAuthAdapter, 
  IDatabaseAdapter, 
  IStorageAdapter, 
  IFunctionsAdapter,
  IRealtimeAdapter 
} from './interfaces';

// Import adapters
import { FirebaseAuthAdapter } from './firebase/auth';
import { SupabaseAuthAdapter } from './supabase/auth';
import { SupabaseDatabaseAdapter } from './supabase/database';
import { SupabaseStorageAdapter } from './supabase/storage';
import { SupabaseFunctionsAdapter } from './supabase/functions';

// Singleton instances (lazy initialized)
let authAdapter: IAuthAdapter | null = null;
let databaseAdapter: IDatabaseAdapter | null = null;
let storageAdapter: IStorageAdapter | null = null;
let functionsAdapter: IFunctionsAdapter | null = null;

/**
 * Get Auth Adapter based on configuration
 * 
 * Default: Firebase (recommended for Google OAuth and authentication)
 */
export function getAuthAdapter(): IAuthAdapter {
  if (!authAdapter) {
    if (BACKEND_CONFIG.auth === 'firebase') {
      authAdapter = new FirebaseAuthAdapter();
    } else {
      authAdapter = new SupabaseAuthAdapter();
    }
    console.log(`✅ Auth Adapter initialized: ${BACKEND_CONFIG.auth}`);
  }
  return authAdapter;
}

/**
 * Get Database Adapter based on configuration
 * 
 * Default: Supabase (PostgreSQL database)
 * Note: Firebase Firestore adapter not implemented (not needed for this app)
 */
export function getDatabaseAdapter(): IDatabaseAdapter {
  if (!databaseAdapter) {
    if (BACKEND_CONFIG.database === 'firebase') {
      throw new Error(
        'Firebase Database is not supported. This app uses Supabase for database. ' +
        'Firebase is only for authentication and Google ecosystem features.'
      );
    } else {
      databaseAdapter = new SupabaseDatabaseAdapter();
    }
    console.log(`✅ Database Adapter initialized: ${BACKEND_CONFIG.database}`);
  }
  return databaseAdapter;
}

/**
 * Get Storage Adapter based on configuration
 * 
 * Default: Supabase (file storage for images, etc.)
 * Note: Firebase Storage adapter not implemented (not needed for this app)
 */
export function getStorageAdapter(): IStorageAdapter {
  if (!storageAdapter) {
    if (BACKEND_CONFIG.storage === 'firebase') {
      throw new Error(
        'Firebase Storage is not supported. This app uses Supabase for storage. ' +
        'Firebase is only for authentication and Google ecosystem features.'
      );
    } else {
      storageAdapter = new SupabaseStorageAdapter();
    }
    console.log(`✅ Storage Adapter initialized: ${BACKEND_CONFIG.storage}`);
  }
  return storageAdapter;
}

/**
 * Get Functions Adapter based on configuration
 * 
 * Default: Supabase (Edge Functions with Deno runtime)
 * Note: Firebase Cloud Functions adapter not implemented (not needed for this app)
 */
export function getFunctionsAdapter(): IFunctionsAdapter {
  if (!functionsAdapter) {
    if (BACKEND_CONFIG.functions === 'firebase') {
      throw new Error(
        'Firebase Functions are not supported. This app uses Supabase Edge Functions. ' +
        'Firebase is only for authentication and Google ecosystem features.'
      );
    } else {
      functionsAdapter = new SupabaseFunctionsAdapter();
    }
    console.log(`✅ Functions Adapter initialized: ${BACKEND_CONFIG.functions}`);
  }
  return functionsAdapter;
}

/**
 * Get Realtime Adapter based on configuration
 * 
 * Default: Supabase (real-time subscriptions)
 * Note: Firebase Realtime Database adapter not implemented (not needed for this app)
 */
export function getRealtimeAdapter(): IRealtimeAdapter {
  throw new Error(
    'Realtime adapter not yet implemented. ' +
    'When implemented, it will use Supabase for real-time features.'
  );
}

/**
 * Reset all adapters (useful for testing or switching providers at runtime)
 */
export function resetAdapters(): void {
  authAdapter = null;
  databaseAdapter = null;
  storageAdapter = null;
  functionsAdapter = null;
  console.log('🔄 All adapters reset');
}
