-- Create table for scenario versions
CREATE TABLE IF NOT EXISTS public.scenario_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID REFERENCES public.scenarios(id) ON DELETE CASCADE NOT NULL,
  version_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  analysis_data JSONB,
  rating TEXT,
  changes_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  user_id UUID NOT NULL,
  UNIQUE(scenario_id, version_number)
);

-- Enable RLS
ALTER TABLE public.scenario_versions ENABLE ROW LEVEL SECURITY;

-- Users can view their own scenario versions
CREATE POLICY "Users can view their own scenario versions"
ON public.scenario_versions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can create their own scenario versions
CREATE POLICY "Users can create their own scenario versions"
ON public.scenario_versions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own scenario versions
CREATE POLICY "Users can update their own scenario versions"
ON public.scenario_versions
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Users can delete their own scenario versions
CREATE POLICY "Users can delete their own scenario versions"
ON public.scenario_versions
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Create index for faster queries
CREATE INDEX idx_scenario_versions_scenario_id ON public.scenario_versions(scenario_id);
CREATE INDEX idx_scenario_versions_user_id ON public.scenario_versions(user_id);

-- Add trigger for automatic version numbering
CREATE OR REPLACE FUNCTION public.set_scenario_version_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO NEW.version_number
  FROM public.scenario_versions
  WHERE scenario_id = NEW.scenario_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_version_number_trigger
BEFORE INSERT ON public.scenario_versions
FOR EACH ROW
WHEN (NEW.version_number IS NULL)
EXECUTE FUNCTION public.set_scenario_version_number();