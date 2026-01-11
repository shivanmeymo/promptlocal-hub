/**
 * Backend Configuration
 * 
 * This file controls which backend provider to use for different services.
 * 
 * IMPORTANT: Firebase is ONLY used for:
 * 1. Authentication (Google OAuth, Email/Password)
 * 2. Cloud Messaging (Push Notifications)
 * 
 * All other services (database, storage, functions) use Supabase.
 * This architecture leverages:
 * - Firebase: Best-in-class authentication & Google ecosystem integration
 * - Supabase: PostgreSQL database, storage, edge functions, real-time features
 */

export type BackendProvider = 'supabase' | 'firebase';

export const BACKEND_CONFIG = {
  // Authentication provider - Firebase for best Google OAuth support
  auth: 'firebase' as BackendProvider,
  
  // Database provider - Supabase (PostgreSQL)
  database: 'supabase' as BackendProvider,
  
  // Storage provider - Supabase for images and files
  storage: 'supabase' as BackendProvider,
  
  // Serverless functions - Supabase Edge Functions (Deno runtime)
  functions: 'supabase' as BackendProvider,
  
  // Real-time subscriptions - Supabase
  realtime: 'supabase' as BackendProvider,
} as const;

/**
 * Feature flags for hybrid mode
 * 
 * NOTE: This app runs in hybrid mode by design:
 * - Firebase handles authentication
 * - Supabase handles everything else
 * - User profiles are automatically synced from Firebase to Supabase
 */
export const HYBRID_MODE = {
  // Sync user profiles from Firebase Auth to Supabase database
  // This must remain TRUE for the app to work correctly
  syncUserProfiles: true,
  
  // Send emails through both providers (not implemented)
  dualEmailNotifications: false,
  
  // Store events in both databases (not needed - Supabase only)
  dualEventStorage: false,
} as const;

/**
 * Firebase-specific features (Google ecosystem)
 */
export const FIREBASE_FEATURES = {
  // Firebase Cloud Messaging for push notifications
  pushNotifications: true,
  
  // Google Analytics (if enabled)
  analytics: false,
  
  // Firebase Performance Monitoring (if enabled)
  performanceMonitoring: false,
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
