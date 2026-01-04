import { supabase } from './client';
import type { Tables, TablesInsert } from './types';

export type Profile = Tables<'profiles'>;
export type ContactMessage = Tables<'contact_messages'>;

// Profiles
export async function upsertProfile(profile: TablesInsert<'profiles'>) {
  const { error } = await supabase
    .from('profiles')
    .upsert(profile, { onConflict: 'user_id' });
  if (error) throw error;
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Contact messages
export async function submitContactMessage(input: TablesInsert<'contact_messages'>) {
  const { data, error } = await supabase
    .from('contact_messages')
    .insert(input)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

// Check if user is admin
export async function checkIsAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_admin', { uid: userId });
  if (error) return false;
  return !!data;
}

// User roles
export type UserRole = Tables<'user_roles'>;

export async function getUserRole(userId: string) {
  const { data, error } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}
