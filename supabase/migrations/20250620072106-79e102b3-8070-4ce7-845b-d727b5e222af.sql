
-- Add foreign key constraint to ensure referential integrity between time_sessions and projects
ALTER TABLE public.time_sessions 
ADD CONSTRAINT fk_time_sessions_project_id 
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

-- Enable Row Level Security on time_sessions table
ALTER TABLE public.time_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for time_sessions to ensure users can only access their own sessions
CREATE POLICY "Users can view their own time sessions" 
ON public.time_sessions 
FOR SELECT 
USING (
  project_id IN (
    SELECT id FROM public.projects WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own time sessions" 
ON public.time_sessions 
FOR INSERT 
WITH CHECK (
  project_id IN (
    SELECT id FROM public.projects WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own time sessions" 
ON public.time_sessions 
FOR UPDATE 
USING (
  project_id IN (
    SELECT id FROM public.projects WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own time sessions" 
ON public.time_sessions 
FOR DELETE 
USING (
  project_id IN (
    SELECT id FROM public.projects WHERE user_id = auth.uid()
  )
);
