/**
 * Backend API Client
 * 
 * PURPOSE: Single point of contact between frontend and backend API
 * 
 * ARCHITECTURE:
 * - Frontend uses Firebase Auth to get ID token
 * - Frontend sends token with every API request
 * - Backend verifies token and performs database operations
 * - Frontend NEVER accesses Supabase directly
 */

import { getAuth } from 'firebase/auth';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * API Response types
 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  details?: any;
}

/**
 * Event types
 */
export interface Event {
  id: string;
  user_id: string;
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
  users?: {
    id: string;
    display_name: string | null;
    photo_url: string | null;
  };
}

export interface CreateEventInput {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  latitude: number;
  longitude: number;
  image_url?: string | null;
  category: string;
}

export type UpdateEventInput = Partial<CreateEventInput>;

/**
 * Get Firebase ID token for authenticated requests
 */
async function getIdToken(): Promise<string> {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    const token = await user.getIdToken();
    return token;
  } catch (error) {
    console.error('Failed to get ID token:', error);
    throw new Error('Failed to get authentication token');
  }
}

/**
 * Generic API request function
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Get Firebase ID token if user is authenticated (for protected routes)
    let headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add Authorization header if not explicitly excluded
    if (options.headers && 'Authorization' in options.headers) {
      // Use provided Authorization header
    } else {
      try {
        const token = await getIdToken();
        headers = {
          ...headers,
          Authorization: `Bearer ${token}`,
        };
      } catch (error) {
        // If getting token fails, continue without it (for public endpoints)
        console.warn('No authentication token available');
      }
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        error: data.error || 'Request failed',
        message: data.message,
        details: data.details,
      };
    }

    return data;
  } catch (error) {
    console.error('API request failed:', error);
    return {
      error: 'Network error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * API Client
 */
export const apiClient = {
  // Health check
  health: () => apiRequest<{ status: string; timestamp: string }>('/api/health'),

  // Events endpoints
  events: {
    // Get all approved events (public)
    getAll: () => 
      apiRequest<Event[]>('/api/events', {
        headers: { Authorization: '' }, // Public endpoint, no auth needed
      }),

    // Get single event
    getById: (id: string) => 
      apiRequest<Event>(`/api/events/${id}`, {
        headers: { Authorization: '' }, // Public endpoint
      }),

    // Get current user's events (requires auth)
    getMine: () => 
      apiRequest<Event[]>('/api/events/user/me'),

    // Create event (requires auth)
    create: (event: CreateEventInput) =>
      apiRequest<Event>('/api/events', {
        method: 'POST',
        body: JSON.stringify(event),
      }),

    // Update event (requires auth)
    update: (id: string, event: UpdateEventInput) =>
      apiRequest<Event>(`/api/events/${id}`, {
        method: 'PUT',
        body: JSON.stringify(event),
      }),

    // Delete event (requires auth)
    delete: (id: string) =>
      apiRequest<void>(`/api/events/${id}`, {
        method: 'DELETE',
      }),
  },
};

/**
 * Example usage in components:
 * 
 * // Get all events
 * const { data, error } = await apiClient.events.getAll();
 * 
 * // Create event
 * const { data, error } = await apiClient.events.create({
 *   title: 'My Event',
 *   description: 'Event description',
 *   start_date: '2024-01-01T10:00:00Z',
 *   end_date: '2024-01-01T12:00:00Z',
 *   location: 'Stockholm',
 *   latitude: 59.3293,
 *   longitude: 18.0686,
 *   category: 'music',
 * });
 */
