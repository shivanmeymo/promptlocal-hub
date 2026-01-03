import { supabase } from './client';

// Profiles
export async function upsertProfile(profile: { user_id: string; display_name?: string; avatar_url?: string; locale?: string; }) {
  const { error } = await supabase
    .from('profiles', { schema: 'app' })
    .upsert(profile, { onConflict: 'user_id' });
  if (error) throw error;
}

// Templates
export async function listPublicTemplates() {
  const { data, error } = await supabase
    .from('templates', { schema: 'app' })
    .select('*')
    .eq('is_public', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function listMyTemplates(userId: string) {
  const { data, error } = await supabase
    .from('templates', { schema: 'app' })
    .select('*')
    .eq('owner_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createTemplate(input: { owner_id: string; title: string; description?: string; content: Record<string, any>; is_public?: boolean; }) {
  const { data, error } = await supabase
    .from('templates', { schema: 'app' })
    .insert(input)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateTemplate(id: string, patch: Partial<{ title: string; description?: string; content: Record<string, any>; is_public?: boolean; version: number; }>) {
  const { data, error } = await supabase
    .from('templates', { schema: 'app' })
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function softDeleteTemplate(id: string) {
  const { error } = await supabase.rpc('soft_delete_template', { t_id: id });
  if (error) throw error;
}

// Favorites
export async function toggleFavorite(templateId: string, userId: string) {
  const { data: exists } = await supabase
    .from('template_favorites', { schema: 'app' })
    .select('*')
    .eq('user_id', userId)
    .eq('template_id', templateId)
    .maybeSingle();

  if (exists) {
    const { error } = await supabase
      .from('template_favorites', { schema: 'app' })
      .delete()
      .eq('user_id', userId)
      .eq('template_id', templateId);
    if (error) throw error;
    return { favored: false };
  } else {
    const { error } = await supabase
      .from('template_favorites', { schema: 'app' })
      .insert({ user_id: userId, template_id: templateId });
    if (error) throw error;
    return { favored: true };
  }
}

// Contact submit
export async function submitContact(input: { subject: string; message: string; name?: string; email?: string; meta?: Record<string, any>; }) {
  const { data, error } = await supabase.rpc('submit_contact', {
    p_subject: input.subject,
    p_message: input.message,
    p_name: input.name ?? null,
    p_email: input.email ?? null,
    p_meta: input.meta ?? {},
  });
  if (error) throw error;
  return data as number; // new id
}
