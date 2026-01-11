import { Request, Response, NextFunction } from 'express';
import { verifyFirebaseToken } from '../services/firebase.service';
import { getOrCreateUser } from '../services/user.service';

/**
 * Authentication Middleware
 * 
 * FLOW:
 * 1. Extract Firebase ID token from Authorization header
 * 2. Verify token using Firebase Admin SDK
 * 3. Get or create user in Supabase (map firebase_uid → user UUID)
 * 4. Attach user info to request object
 * 
 * SECURITY:
 * - All protected routes must use this middleware
 * - Frontend sends: Authorization: Bearer <firebase-id-token>
 * - Backend verifies and maps to Supabase user
 */

// Extend Express Request to include authenticated user
export interface AuthenticatedRequest extends Request {
  user?: {
    firebaseUid: string;
    supabaseUserId: string; // UUID
    email: string | null;
    displayName: string | null;
    photoUrl: string | null;
  };
}

/**
 * Middleware to authenticate requests using Firebase tokens
 */
export async function authenticateRequest(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header. Expected: Bearer <token>',
      });
      return;
    }

    const idToken = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify Firebase token
    const decodedToken = await verifyFirebaseToken(idToken);
    
    console.log(`🔐 Token verified for user: ${decodedToken.uid}`);

    // Get or create user in Supabase
    const supabaseUser = await getOrCreateUser({
      firebaseUid: decodedToken.uid,
      email: decodedToken.email || null,
      displayName: decodedToken.name || null,
      photoUrl: decodedToken.picture || null,
    });

    // Attach user info to request
    req.user = {
      firebaseUid: decodedToken.uid,
      supabaseUserId: supabaseUser.id,
      email: supabaseUser.email,
      displayName: supabaseUser.display_name,
      photoUrl: supabaseUser.photo_url,
    };

    console.log(`✅ User authenticated: ${supabaseUser.id} (${supabaseUser.email})`);
    
    next();
  } catch (error) {
    console.error('❌ Authentication failed:', error);
    
    res.status(401).json({
      error: 'Unauthorized',
      message: error instanceof Error ? error.message : 'Authentication failed',
    });
  }
}

/**
 * Optional authentication middleware
 * Adds user info if token is present, but doesn't block if missing
 */
export async function optionalAuthentication(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      await authenticateRequest(req, res, next);
    } else {
      next();
    }
  } catch (error) {
    // Don't block the request if optional auth fails
    console.warn('⚠️ Optional authentication failed:', error);
    next();
  }
}
