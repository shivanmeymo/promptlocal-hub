/**
 * Backend Factory
 * 
 * Returns the appropriate adapter based on configuration.
 * This is the single point where you choose your backend provider.
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
 */
export function getDatabaseAdapter(): IDatabaseAdapter {
  if (!databaseAdapter) {
    if (BACKEND_CONFIG.database === 'firebase') {
      // TODO: Implement FirebaseDatabaseAdapter (Firestore)
      throw new Error('Firebase Database adapter not yet implemented. Currently only Supabase is supported.');
    } else {
      databaseAdapter = new SupabaseDatabaseAdapter();
    }
    console.log(`✅ Database Adapter initialized: ${BACKEND_CONFIG.database}`);
  }
  return databaseAdapter;
}

/**
 * Get Storage Adapter based on configuration
 */
export function getStorageAdapter(): IStorageAdapter {
  if (!storageAdapter) {
    if (BACKEND_CONFIG.storage === 'firebase') {
      // TODO: Implement FirebaseStorageAdapter
      throw new Error('Firebase Storage adapter not yet implemented. Currently only Supabase is supported.');
    } else {
      storageAdapter = new SupabaseStorageAdapter();
    }
    console.log(`✅ Storage Adapter initialized: ${BACKEND_CONFIG.storage}`);
  }
  return storageAdapter;
}

/**
 * Get Functions Adapter based on configuration
 */
export function getFunctionsAdapter(): IFunctionsAdapter {
  if (!functionsAdapter) {
    if (BACKEND_CONFIG.functions === 'firebase') {
      // TODO: Implement FirebaseFunctionsAdapter
      throw new Error('Firebase Functions adapter not yet implemented. Currently only Supabase is supported.');
    } else {
      functionsAdapter = new SupabaseFunctionsAdapter();
    }
    console.log(`✅ Functions Adapter initialized: ${BACKEND_CONFIG.functions}`);
  }
  return functionsAdapter;
}

/**
 * Get Realtime Adapter based on configuration
 */
export function getRealtimeAdapter(): IRealtimeAdapter {
  // TODO: Implement realtime adapters for both providers
  throw new Error('Realtime adapter not yet implemented.');
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
