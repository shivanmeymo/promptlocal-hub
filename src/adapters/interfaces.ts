/**
 * Backend Adapter Interfaces
 * 
 * Define common interfaces that both Firebase and Supabase must implement.
 * This allows switching providers with minimal code changes.
 */

// Generic types
export interface AuthUser {
  id: string;
  uid: string; // Alias for id (Firebase compatibility)
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  providerData: any[];
}

export interface AuthError {
  code: string;
  message: string;
}

export interface DatabaseError {
  code: string;
  message: string;
  details?: string;
}

export interface StorageError {
  code: string;
  message: string;
}

export interface FunctionsError {
  code: string;
  message: string;
}

export type AuthStateCallback = (user: AuthUser | null) => void;

export interface QueryOptions {
  select?: string;
  filters?: Record<string, any>;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
}

export interface Event {
  id?: string;
  user_id?: string;
  user_id_firebase_backup?: string;
  title?: string;
  description?: string;
  start_date?: string;
  start_time?: string;
  end_date?: string;
  end_time?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  category?: string;
  other_category?: string | null;
  is_free?: boolean;
  price?: number | null;
  is_online?: boolean;
  is_recurring?: boolean;
  recurring_pattern?: string | null;
  image_url?: string | null;
  status?: string;
  organizer_name?: string;
  organizer_email?: string;
  organizer_description?: string | null;
  organizer_website?: string | null;
  created_at?: string;
  updated_at?: string;
  approved_at?: string | null;
  approved_by?: string | null;
  admin_notes?: string | null;
}

export interface Profile {
  id?: string;
  user_id: string;
  full_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Auth Adapter Interface
export interface IAuthAdapter {
  signUp(email: string, password: string, metadata?: { displayName?: string }): Promise<{ user: AuthUser | null; error: AuthError | null }>;
  signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: AuthError | null }>;
  signInWithGoogle(): Promise<{ user: AuthUser | null; error: AuthError | null }>;
  signOut(): Promise<{ error: AuthError | null }>;
  getCurrentUser(): AuthUser | null;
  onAuthStateChanged(callback: AuthStateCallback): () => void;
  sendPasswordResetEmail(email: string): Promise<{ error: AuthError | null }>;
  updatePassword(newPassword: string): Promise<{ error: AuthError | null }>;
  linkPassword(password: string): Promise<{ error: AuthError | null }>;
  deleteAccount(): Promise<{ error: AuthError | null }>;
}

// Database Adapter Interface
export interface IDatabaseAdapter {
  // Events
  getEvents(options?: {
    userId?: string;
    status?: string;
    category?: string;
    limit?: number;
  }): Promise<{ data: Event[] | null; error: DatabaseError | null }>;
  getEvent(id: string): Promise<{ data: Event | null; error: DatabaseError | null }>;
  createEvent(event: Partial<Event>): Promise<{ data: Event | null; error: DatabaseError | null }>;
  updateEvent(id: string, updates: Partial<Event>): Promise<{ data: Event | null; error: DatabaseError | null }>;
  deleteEvent(id: string): Promise<{ error: DatabaseError | null }>;
  
  // Profiles
  getProfile(userId: string): Promise<{ data: Profile | null; error: DatabaseError | null }>;
  updateProfile(userId: string, updates: Partial<Profile>): Promise<{ data: Profile | null; error: DatabaseError | null }>;
  
  // Generic methods
  query<T = any>(table: string, options?: QueryOptions): Promise<{ data: T[] | null; error: DatabaseError | null }>;
  insert<T = any>(table: string, data: Partial<T> | Partial<T>[]): Promise<{ data: T | T[] | null; error: DatabaseError | null }>;
  update<T = any>(table: string, filters: Record<string, any>, updates: Partial<T>): Promise<{ data: T[] | null; error: DatabaseError | null }>;
  delete(table: string, filters: Record<string, any>): Promise<{ error: DatabaseError | null }>;
}

// Storage Adapter Interface
export interface IStorageAdapter {
  upload(path: string, file: File, options?: { bucket?: string; contentType?: string }): Promise<{ data: { path: string } | null; error: StorageError | null }>;
  getPublicUrl(path: string, options?: { bucket?: string }): string;
  delete(path: string, options?: { bucket?: string }): Promise<{ error: StorageError | null }>;
}

// Functions Adapter Interface
export interface IFunctionsAdapter {
  invoke<TRequest = any, TResponse = any>(
    functionName: string,
    options?: {
      body?: TRequest;
      headers?: Record<string, string>;
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    }
  ): Promise<{ data: TResponse | null; error: FunctionsError | null }>;
}

// Realtime Adapter Interface
export interface IRealtimeAdapter {
  subscribe(channel: string, callback: (payload: any) => void): () => void;
}
