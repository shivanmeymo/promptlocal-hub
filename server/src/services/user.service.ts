import { getSupabaseClient, DbUser } from './supabase.service';

/**
 * User Mapping Service
 * 
 * PURPOSE: Map Firebase UID → Supabase UUID
 * 
 * FLOW:
 * 1. Check if user exists in Supabase by firebase_uid
 * 2. If exists: Return existing user
 * 3. If not: Create new user record in Supabase
 * 4. Return user with Supabase UUID
 * 
 * IMPORTANT: This is the single source of truth for user mapping.
 * All application tables reference users.id (UUID), not firebase_uid.
 */

interface UserInput {
  firebaseUid: string;
  email: string | null;
  displayName: string | null;
  photoUrl: string | null;
}

/**
 * Get existing user or create new user in Supabase
 * 
 * @param input - User information from Firebase token
 * @returns Supabase user with UUID
 */
export async function getOrCreateUser(input: UserInput): Promise<DbUser> {
  const supabase = getSupabaseClient();

  // Try to find existing user by firebase_uid
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('firebase_uid', input.firebaseUid)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('❌ Failed to fetch user:', fetchError);
    throw new Error('Failed to fetch user from database');
  }

  // User exists - update profile if needed
  if (existingUser) {
    console.log(`✅ Found existing user: ${existingUser.id}`);
    
    // Update profile if information changed
    const needsUpdate = 
      existingUser.email !== input.email ||
      existingUser.display_name !== input.displayName ||
      existingUser.photo_url !== input.photoUrl;

    if (needsUpdate) {
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          email: input.email,
          display_name: input.displayName,
          photo_url: input.photoUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingUser.id)
        .select()
        .single();

      if (updateError) {
        console.error('⚠️ Failed to update user profile:', updateError);
        return existingUser; // Return existing user even if update fails
      }

      console.log(`🔄 Updated user profile: ${updatedUser.id}`);
      return updatedUser;
    }

    return existingUser;
  }

  // User doesn't exist - create new user
  console.log(`➕ Creating new user for Firebase UID: ${input.firebaseUid}`);

  const { data: newUser, error: createError } = await supabase
    .from('users')
    .insert({
      firebase_uid: input.firebaseUid,
      email: input.email,
      display_name: input.displayName,
      photo_url: input.photoUrl,
    })
    .select()
    .single();

  if (createError) {
    console.error('❌ Failed to create user:', createError);
    throw new Error('Failed to create user in database');
  }

  console.log(`✅ Created new user: ${newUser.id}`);
  return newUser;
}

/**
 * Get user by Supabase UUID
 */
export async function getUserById(userId: string): Promise<DbUser | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // User not found
    }
    console.error('❌ Failed to fetch user by ID:', error);
    throw new Error('Failed to fetch user');
  }

  return data;
}

/**
 * Get user by Firebase UID
 */
export async function getUserByFirebaseUid(firebaseUid: string): Promise<DbUser | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('firebase_uid', firebaseUid)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // User not found
    }
    console.error('❌ Failed to fetch user by Firebase UID:', error);
    throw new Error('Failed to fetch user');
  }

  return data;
}
