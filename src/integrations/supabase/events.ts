import { supabase } from './client';
import type { Tables, TablesInsert, TablesUpdate } from './types';

export type Event = Tables<'events'>;
export type EventInsert = TablesInsert<'events'>;
export type EventUpdate = TablesUpdate<'events'>;

// Events - list all approved public events
export async function listPublicEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'approved')
    .order('start_date', { ascending: true });
  if (error) throw error;
  return data;
}

// Events - list events owned by a specific user
export async function listMyEvents(userId: string) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('user_id', userId)
    .order('start_date', { ascending: true });
  if (error) throw error;
  return data;
}

// Create a new event
export async function createEvent(input: EventInsert) {
  const { data, error } = await supabase
    .from('events')
    .insert(input)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

// Update an existing event
export async function updateEvent(id: string, patch: EventUpdate) {
  const { data, error } = await supabase
    .from('events')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

// Delete an event
export async function deleteEvent(id: string) {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// Event Notifications
export type EventNotification = Tables<'event_notifications'>;

export async function createNotification(input: TablesInsert<'event_notifications'>) {
  const { data, error } = await supabase
    .from('event_notifications')
    .insert(input)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function listMyNotifications(userId: string) {
  const { data, error } = await supabase
    .from('event_notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}
