-- Add ML Experiments Table for Experiment Tracking Feature
-- This enables MLflow-style experiment logging and comparison

CREATE TABLE IF NOT EXISTS public.ml_experiments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID NOT NULL,
    model_name TEXT NOT NULL,
    dataset_id UUID REFERENCES public.datasets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
    parameters JSONB DEFAULT '{}'::jsonb,
    metrics JSONB DEFAULT '{}'::jsonb,
    artifacts JSONB DEFAULT '{}'::jsonb,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    notes TEXT,
    parent_experiment_id UUID REFERENCES public.ml_experiments(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ml_experiments_user_id ON public.ml_experiments(user_id);
CREATE INDEX IF NOT EXISTS idx_ml_experiments_dataset_id ON public.ml_experiments(dataset_id);
CREATE INDEX IF NOT EXISTS idx_ml_experiments_status ON public.ml_experiments(status);
CREATE INDEX IF NOT EXISTS idx_ml_experiments_created_at ON public.ml_experiments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ml_experiments_tags ON public.ml_experiments USING GIN(tags);

-- Enable Row Level Security
ALTER TABLE public.ml_experiments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own experiments"
    ON public.ml_experiments FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own experiments"
    ON public.ml_experiments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own experiments"
    ON public.ml_experiments FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own experiments"
    ON public.ml_experiments FOR DELETE
    USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_ml_experiments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ml_experiments_updated_at
    BEFORE UPDATE ON public.ml_experiments
    FOR EACH ROW
    EXECUTE FUNCTION update_ml_experiments_updated_at();

-- Add comment
COMMENT ON TABLE public.ml_experiments IS 'Tracks all ML model training experiments for reproducibility and comparison';
