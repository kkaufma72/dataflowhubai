/*
  # Add User Profiles Table
  
  1. New Tables
    - user_profiles: Stores user profile information
      - id: Primary key
      - user_id: References auth.users
      - email: User's email
      - full_name: User's full name
      - avatar_url: User's avatar URL
      - job_title: User's job title
      - company: User's company
      - bio: User's bio
      - location: User's location
      - website: User's website
      - social_links: User's social links
      - preferences: User's preferences
      - created_at: Timestamp of creation
      - updated_at: Timestamp of last update
  
  2. Security
    - Enable RLS
    - Add policies for user management
*/

-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email text,
  full_name text,
  avatar_url text,
  job_title text,
  company text,
  bio text,
  location text,
  website text,
  social_links jsonb DEFAULT '{}'::jsonb,
  preferences jsonb DEFAULT '{
    "theme": "light",
    "emailNotifications": true,
    "twoFactorAuth": false
  }'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT user_profiles_user_id_key UNIQUE (user_id)
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Create policies
CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create the function for updating the updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;

-- Create the trigger
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();