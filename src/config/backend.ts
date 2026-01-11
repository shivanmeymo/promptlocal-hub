/**
 * Backend Configuration
 * 
 * This file controls which backend provider to use for different services.
 * Change these values to switch between providers with minimal code changes.
 */

export type BackendProvider = 'supabase' | 'firebase';

export const BACKEND_CONFIG = {
  // Authentication provider
  auth: 'firebase' as BackendProvider,
  
  // Database provider
  database: 'supabase' as BackendProvider,
  
  // Storage provider (images, files)
  storage: 'supabase' as BackendProvider,
  
  // Serverless functions / Edge functions
  functions: 'supabase' as BackendProvider,
  
  // Real-time subscriptions
  realtime: 'supabase' as BackendProvider,
} as const;

/**
 * Feature flags for hybrid mode
 * When true, uses both providers simultaneously
 */
export const HYBRID_MODE = {
  // Sync user profiles to both databases
  syncUserProfiles: true,
  
  // Send emails through both providers
  dualEmailNotifications: false,
  
  // Store events in both databases
  dualEventStorage: false,
} as const;

/**
 * Migration helpers
 */
export const MIGRATION = {
  // Log all backend operations for debugging during migration
  logAllOperations: false,
  
  // Compare results between providers (slower but safer)
  validateMigration: false,
} as const;
