/**
 * Backend Adapter Interfaces
 * 
 * Define common interfaces that both Firebase and Supabase must implement.
 * This allows switching providers with minimal code changes.
 */

// Auth Adapter Interface
export interface IAuthAdapter {
  signIn(email: string, password: string): Promise<{ user: any; error?: any }>;
  signUp(email: string, password: string): Promise<{ user: any; error?: any }>;
  signOut(): Promise<void>;
  getCurrentUser(): any | null;
  onAuthStateChanged(callback: (user: any | null) => void): () => void;
  sendPasswordResetEmail(email: string): Promise<void>;
}

// Database Adapter Interface
export interface IDatabaseAdapter {
  // Events
  getEvents(filters?: any): Promise<any[]>;
  getEvent(id: string): Promise<any>;
  createEvent(data: any): Promise<any>;
  updateEvent(id: string, data: any): Promise<any>;
  deleteEvent(id: string): Promise<void>;
  
  // Profiles
  getProfile(userId: string): Promise<any>;
  updateProfile(userId: string, data: any): Promise<any>;
  
  // Generic query
  query(table: string, filters?: any): Promise<any[]>;
  insert(table: string, data: any): Promise<any>;
  update(table: string, id: string, data: any): Promise<any>;
  delete(table: string, id: string): Promise<void>;
}

// Storage Adapter Interface
export interface IStorageAdapter {
  upload(bucket: string, path: string, file: File): Promise<{ url: string; error?: any }>;
  getPublicUrl(bucket: string, path: string): string;
  delete(bucket: string, path: string): Promise<void>;
}

// Functions Adapter Interface
export interface IFunctionsAdapter {
  invoke(functionName: string, data: any): Promise<{ data?: any; error?: any }>;
}

// Realtime Adapter Interface
export interface IRealtimeAdapter {
  subscribe(channel: string, callback: (payload: any) => void): () => void;
}
