-- Create leads table for email capture
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    source TEXT NOT NULL DEFAULT 'unknown',
    metadata JSONB DEFAULT '{}',
    email_sequence_step INTEGER DEFAULT 0,
    converted_at TIMESTAMPTZ,
    unsubscribed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);

-- Index for unconverted leads (for email campaigns)
CREATE INDEX IF NOT EXISTS idx_leads_unconverted ON public.leads(converted_at) WHERE converted_at IS NULL;

-- Index for email sequence
CREATE INDEX IF NOT EXISTS idx_leads_sequence ON public.leads(email_sequence_step) WHERE converted_at IS NULL;

-- RLS policies
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Allow insert from anonymous (for landing page captures)
CREATE POLICY "Allow anonymous lead capture" ON public.leads
    FOR INSERT TO anon
    WITH CHECK (true);

-- Allow service role full access (for email campaigns)
CREATE POLICY "Service role full access" ON public.leads
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Add activation fields to user_profiles if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'activation_milestones') THEN
        ALTER TABLE public.user_profiles ADD COLUMN activation_milestones JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'activation_score') THEN
        ALTER TABLE public.user_profiles ADD COLUMN activation_score INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'is_activated') THEN
        ALTER TABLE public.user_profiles ADD COLUMN is_activated BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'last_activity') THEN
        ALTER TABLE public.user_profiles ADD COLUMN last_activity TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Create index for activation tracking
CREATE INDEX IF NOT EXISTS idx_user_profiles_activation ON public.user_profiles(is_activated, activation_score);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS leads_updated_at ON public.leads;
CREATE TRIGGER leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION update_leads_updated_at();

-- Comment for documentation
COMMENT ON TABLE public.leads IS 'Captured email leads from landing page, exit intent popups, etc.';
COMMENT ON COLUMN public.leads.source IS 'Where the lead came from: exit_popup, newsletter, fred_demo, partial_signup, waitlist';
COMMENT ON COLUMN public.leads.metadata IS 'Additional info: UTM params, pages viewed, actions taken';
COMMENT ON COLUMN public.leads.email_sequence_step IS 'Current step in nurture email sequence (0-6)';

