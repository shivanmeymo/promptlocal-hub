/**
 * Backend Configuration
 * 
 * NEW ARCHITECTURE:
 * - Firebase: Authentication ONLY (frontend uses Firebase Auth)
 * - Backend API: Verifies Firebase tokens, manages all database operations
 * - Supabase: Database ONLY (accessed through backend API)
 * 
 * SECURITY:
 * - Frontend NEVER accesses Supabase directly
 * - All database operations go through authenticated backend API
 * - Backend uses Supabase service role key (never exposed to frontend)
 * - Row Level Security (RLS) enabled on all Supabase tables
 */

export type BackendProvider = 'supabase' | 'firebase' | 'backend-api';

export const BACKEND_CONFIG = {
  // Authentication provider - Firebase (frontend)
  auth: 'firebase' as BackendProvider,
  
  // Database provider - Backend API (which uses Supabase internally)
  database: 'backend-api' as BackendProvider,
  
  // Storage provider - Backend API (which uses Supabase internally)
  storage: 'backend-api' as BackendProvider,
  
  // Serverless functions - Backend API
  functions: 'backend-api' as BackendProvider,
  
  // Real-time subscriptions - Not implemented yet
  realtime: 'supabase' as BackendProvider,
} as const;

/**
 * Backend API Configuration
 */
export const API_CONFIG = {
  // Backend API URL (default: http://localhost:3001)
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  
  // Timeout for API requests (milliseconds)
  timeout: 30000,
} as const;

/**
 * Firebase-specific features (Google ecosystem only)
 */
export const FIREBASE_FEATURES = {
  // Firebase Cloud Messaging for push notifications
  pushNotifications: true,
  
  // Google Analytics (if enabled)
  analytics: false,
} as const;
