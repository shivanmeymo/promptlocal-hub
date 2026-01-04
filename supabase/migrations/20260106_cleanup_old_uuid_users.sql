-- =====================================================
-- CLEANUP: Remove old UUID-format users
-- Run this to clean up users created before Firebase migration
-- =====================================================

-- Delete old users with UUID format (before Firebase migration)
DELETE FROM profiles 
WHERE user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Verify remaining profiles (should only have Firebase UIDs)
SELECT user_id, email, created_at 
FROM profiles 
ORDER BY created_at DESC;
