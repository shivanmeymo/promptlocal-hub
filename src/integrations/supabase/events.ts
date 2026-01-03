import { supabase } from './client';

export type EventVisibility = 'public'|'unlisted'|'private';
export type EventStatus = 'draft'|'published'|'cancelled';
export type EventRole = 'owner'|'host'|'editor'|'viewer'|'attendee';
export type NotificationType = 'reminder'|'update'|'cancellation'|'custom';
export type NotificationChannel = 'email'|'push'|'sms'|'in_app';

// Events
export async function listPublicEvents() {
  const { data, error } = await supabase
    .from('events', { schema: 'app' })
    .select('*')
    .eq('visibility', 'public')
    .is('deleted_at', null)
    .order('starts_at', { ascending: true });
  if (error) throw error; return data;
}

export async function listMyEvents(userId: string) {
  const { data, error } = await supabase
    .from('events', { schema: 'app' })
    .select('*')
    .eq('owner_id', userId)
    .is('deleted_at', null)
    .order('starts_at', { ascending: true });
  if (error) throw error; return data;
}

export async function createEvent(input: {
  owner_id: string;
  title: string;
  description?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  starts_at: string; // ISO
  ends_at?: string; // ISO
  timezone?: string;
  visibility?: EventVisibility;
  status?: EventStatus;
  capacity?: number;
  cover_url?: string;
  tags?: string[];
}) {
  const { data, error } = await supabase
    .from('events', { schema: 'app' })
    .insert(input)
    .select('*')
    .single();
  if (error) throw error; return data;
}

export async function updateEvent(id: string, patch: Partial<{ title: string; description?: string; location?: string; latitude?: number; longitude?: number; starts_at: string; ends_at?: string; timezone?: string; visibility?: EventVisibility; status?: EventStatus; capacity?: number; cover_url?: string; tags?: string[]; }>) {
  const { data, error } = await supabase
    .from('events', { schema: 'app' })
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error; return data;
}

export async function softDeleteEvent(id: string) {
  const { error } = await supabase
    .from('events', { schema: 'app' })
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

// Roles
export async function assignRole(eventId: string, userId: string, role: EventRole) {
  const { error } = await supabase
    .from('events_public_profiles_user_roles', { schema: 'app' })
    .insert({ event_id: eventId, user_id: userId, role });
  if (error) throw error;
}

export async function removeRole(eventId: string, userId: string, role: EventRole) {
  const { error } = await supabase
    .from('events_public_profiles_user_roles', { schema: 'app' })
    .delete()
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .eq('role', role);
  if (error) throw error;
}

export async function listEventRoles(eventId: string) {
  const { data, error } = await supabase
    .from('events_public_profiles_user_roles', { schema: 'app' })
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });
  if (error) throw error; return data;
}

// Notifications
export async function createNotification(input: { event_id: string; user_id?: string; type: NotificationType; channel: NotificationChannel; payload?: Record<string, any>; scheduled_for?: string; }) {
  const { data, error } = await supabase
    .from('event_notifications', { schema: 'app' })
    .insert(input)
    .select('*')
    .single();
  if (error) throw error; return data;
}

export async function listMyNotifications(userId: string) {
  const { data, error } = await supabase
    .from('event_notifications', { schema: 'app' })
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error; return data;
}
