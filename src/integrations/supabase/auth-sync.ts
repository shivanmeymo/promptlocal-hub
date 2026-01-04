/**
 * Firebase-Supabase Integration
 * 
 * This file manages syncing Firebase Auth users to Supabase database.
 * RLS is DISABLED - security is handled at application level.
 * 
 * For production: Implement Firebase token verification in Supabase Edge Functions.
 * See AUTHENTICATION_GUIDE.md for details.
 */
import { supabase } from './client';

// NOTE: syncFirebaseAuthWithSupabase() removed - RLS is disabled
// All authentication is handled by Firebase
// Supabase is used purely for data storage

/**
 * Get or create user profile in Supabase
 * This syncs Firebase Auth user with Supabase data
 */
export const syncUserProfile = async (
  firebaseUid: string,
  email: string,
  displayName?: string | null,
  photoURL?: string | null
) => {
  console.log('🔄 Syncing user profile to Supabase:', { firebaseUid, email, displayName });
  
  // Check if profile exists
  const { data: existingProfile, error: checkError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', firebaseUid)
    .maybeSingle();

  if (checkError) {
    console.error('❌ Error checking existing profile:', checkError);
    return { data: null, error: checkError };
  }

  if (existingProfile) {
    console.log('✅ Profile exists, updating...');
    // Update existing profile
    const { data, error } = await supabase
      .from('profiles')
      .update({
        email,
        full_name: displayName,
        avatar_url: photoURL,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', firebaseUid)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error updating profile:', error);
    } else {
      console.log('✅ Profile updated successfully:', data);
    }
    
    return { data, error };
  } else {
    console.log('➕ Creating new profile...');
    // Create new profile
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        user_id: firebaseUid,
        email,
        full_name: displayName,
        avatar_url: photoURL,
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error creating profile:', error);
    } else {
      console.log('✅ Profile created successfully:', data);
    }
    
    return { data, error };
  }
};

/**
 * Delete user profile from Supabase
 */
export const deleteUserProfile = async (firebaseUid: string) => {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('user_id', firebaseUid);
  
  return { error };
};
