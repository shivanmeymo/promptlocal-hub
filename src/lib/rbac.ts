/**
 * Role-Based Access Control (RBAC) Utility
 * 
 * Since RLS is disabled, we implement authorization checks at the application level.
 * This utility queries the user_roles table to determine user permissions.
 */

import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'moderator' | 'user';

/**
 * Check if a user has a specific role
 * @param userId - Firebase UID of the user
 * @param role - Role to check for
 * @returns True if user has the role, false otherwise
 */
export async function hasRole(userId: string, role: UserRole): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', role)
      .single();

    if (error) {
      // If no row found, user doesn't have this role
      if (error.code === 'PGRST116') return false;
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking user role:', error);
    return false;
  }
}

/**
 * Get all roles for a user
 * @param userId - Firebase UID of the user
 * @returns Array of roles the user has
 */
export async function getUserRoles(userId: string): Promise<UserRole[]> {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (error) throw error;

    return (data || []).map(row => row.role as UserRole);
  } catch (error) {
    console.error('Error fetching user roles:', error);
    return [];
  }
}

/**
 * Check if user is an admin
 * @param userId - Firebase UID of the user
 * @returns True if user is an admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  return await hasRole(userId, 'admin');
}

/**
 * Check if user is an organizer, moderator, or admin
 * @param userId - Firebase UID of the user
 * @returns True if user can create and manage events
 */
export async function canCreateEvents(userId: string): Promise<boolean> {
  const roles = await getUserRoles(userId);
  return roles.includes('admin') || roles.includes('moderator');
}

/**
 * Require specific role (throws error if user doesn't have it)
 * Use this in API calls or protected operations
 * 
 * @param userId - Firebase UID of the user
 * @param requiredRole - Role required for the operation
 * @throws Error if user doesn't have the required role
 */
export async function requireRole(userId: string, requiredRole: UserRole): Promise<void> {
  const hasRequiredRole = await hasRole(userId, requiredRole);
  
  if (!hasRequiredRole) {
    throw new Error(`Unauthorized: This operation requires '${requiredRole}' role`);
  }
}

/**
 * Require admin role (throws error if not admin)
 * @param userId - Firebase UID of the user
 * @throws Error if user is not an admin
 */
export async function requireAdmin(userId: string): Promise<void> {
  return await requireRole(userId, 'admin');
}

/**
 * Grant a role to a user
 * Note: This should only be called by admins
 * 
 * @param userId - Firebase UID of the user
 * @param role - Role to grant
 * @returns True if role was granted successfully
 */
export async function grantRole(userId: string, role: UserRole): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error granting role:', error);
    return false;
  }
}

/**
 * Revoke a role from a user
 * Note: This should only be called by admins
 * 
 * @param userId - Firebase UID of the user
 * @param role - Role to revoke
 * @returns True if role was revoked successfully
 */
export async function revokeRole(userId: string, role: UserRole): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', role);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error revoking role:', error);
    return false;
  }
}
