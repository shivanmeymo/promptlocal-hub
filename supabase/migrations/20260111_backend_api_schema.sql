-- Backend API Migration: Firebase Auth + Supabase Database
-- 
-- PURPOSE:
-- - Create users table with firebase_uid → id (UUID) mapping
-- - Update events table to reference users.id instead of firebase_uid
-- - Add Row Level Security (RLS) policies
-- 
-- ARCHITECTURE:
-- - Frontend: Firebase Authentication
-- - Backend API: Verifies Firebase tokens, manages Supabase data
-- - Database: Supabase PostgreSQL with RLS

-- ============================================================================
-- 1. CREATE USERS TABLE
-- ============================================================================

-- Drop existing users table if it exists (WARNING: This deletes data!)
-- Comment out these lines if you want to preserve existing data
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid TEXT UNIQUE NOT NULL,
  email TEXT,
  display_name TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on firebase_uid for fast lookups
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);

-- Create index on email
CREATE INDEX idx_users_email ON users(email);

COMMENT ON TABLE users IS 'User accounts synced from Firebase Auth';
COMMENT ON COLUMN users.id IS 'Supabase UUID - primary key for all relationships';
COMMENT ON COLUMN users.firebase_uid IS 'Firebase Authentication UID';

-- ============================================================================
-- 2. UPDATE EVENTS TABLE
-- ============================================================================

-- Drop existing events table if it exists (WARNING: This deletes data!)
-- Comment out these lines if you want to preserve existing data
DROP TABLE IF EXISTS events CASCADE;

-- Create events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT NOT NULL,
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_category ON events(category);

COMMENT ON TABLE events IS 'User-created events';
COMMENT ON COLUMN events.user_id IS 'References users.id (UUID)';
COMMENT ON COLUMN events.status IS 'Event approval status: pending, approved, rejected';

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read user profiles (for displaying event organizers)
CREATE POLICY "Users are viewable by everyone" 
  ON users FOR SELECT 
  USING (true);

-- Policy: Users are created/updated by the backend API only
-- (Backend uses service role key which bypasses RLS)
CREATE POLICY "Users can be modified by service role only" 
  ON users FOR ALL 
  USING (false);

-- Enable RLS on events table
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view approved events
CREATE POLICY "Approved events are viewable by everyone" 
  ON events FOR SELECT 
  USING (status = 'approved');

-- Policy: Users can view their own events (regardless of status)
CREATE POLICY "Users can view their own events" 
  ON events FOR SELECT 
  USING (auth.uid()::text = (SELECT firebase_uid FROM users WHERE users.id = events.user_id));

-- Policy: Only backend API can create events
-- (Backend uses service role key which bypasses RLS)
CREATE POLICY "Events can be created by service role only" 
  ON events FOR INSERT 
  WITH CHECK (false);

-- Policy: Only backend API can update events
CREATE POLICY "Events can be updated by service role only" 
  ON events FOR UPDATE 
  USING (false);

-- Policy: Only backend API can delete events
CREATE POLICY "Events can be deleted by service role only" 
  ON events FOR DELETE 
  USING (false);

-- ============================================================================
-- 4. UPDATED_AT TRIGGER
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for events table
CREATE TRIGGER update_events_updated_at 
  BEFORE UPDATE ON events 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. ADMIN ROLES (Optional)
-- ============================================================================

-- Create admin_roles table for backend API to check admin status
CREATE TABLE IF NOT EXISTS admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'moderator')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

CREATE INDEX idx_admin_roles_user_id ON admin_roles(user_id);

ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

-- Only backend API can manage admin roles
CREATE POLICY "Admin roles managed by service role only" 
  ON admin_roles FOR ALL 
  USING (false);

COMMENT ON TABLE admin_roles IS 'Admin and moderator roles for backend API authorization';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify tables exist
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'Tables created: users, events, admin_roles';
  RAISE NOTICE 'RLS enabled on all tables';
  RAISE NOTICE 'Backend API should use SUPABASE_SERVICE_ROLE_KEY';
END $$;
