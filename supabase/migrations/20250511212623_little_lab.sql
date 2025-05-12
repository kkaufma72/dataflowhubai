-- Check if bio column exists and add it if it doesn't
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'bio'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN bio text DEFAULT NULL;
  END IF;
END $$;