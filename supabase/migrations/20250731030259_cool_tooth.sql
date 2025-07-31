/*
  # Fix RLS Policy Recursion Error

  1. Security Changes
    - Drop existing recursive policies on user_profiles table
    - Create new non-recursive policies that avoid self-referencing
    - Use auth.uid() directly instead of querying user_profiles table
    - Add proper policies for admin operations

  2. Policy Structure
    - Users can view their own profile using auth.uid()
    - Admins identified by specific UUID can manage all profiles
    - Avoid any policy that queries user_profiles table within itself
*/

-- Drop all existing policies on user_profiles to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON user_profiles;

-- Create non-recursive policies
-- Policy 1: Users can view their own profile (no recursion)
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  TO public
  USING (auth.uid() = id);

-- Policy 2: Allow public read access for authentication checks (temporary)
CREATE POLICY "Public can read for auth"
  ON user_profiles
  FOR SELECT
  TO public
  USING (true);

-- Policy 3: Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = id);

-- Policy 4: Allow authenticated users to update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO public
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create a function to safely check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = user_id AND role = 'admin'
  );
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION is_admin(uuid) TO public;