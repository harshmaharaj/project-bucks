
-- Remove duplicate RLS policies on time_sessions table
DROP POLICY IF EXISTS "Users can view their own time sessions" ON public.time_sessions;
DROP POLICY IF EXISTS "Users can insert their own time sessions" ON public.time_sessions;
DROP POLICY IF EXISTS "Users can update their own time sessions" ON public.time_sessions;
DROP POLICY IF EXISTS "Users can delete their own time sessions" ON public.time_sessions;

-- Create consolidated RLS policies for time_sessions with better naming
CREATE POLICY "time_sessions_select_own" ON public.time_sessions
FOR SELECT 
USING (
  project_id IN (
    SELECT id FROM public.projects WHERE user_id = auth.uid()
  )
);

CREATE POLICY "time_sessions_insert_own" ON public.time_sessions
FOR INSERT 
WITH CHECK (
  project_id IN (
    SELECT id FROM public.projects WHERE user_id = auth.uid()
  )
);

CREATE POLICY "time_sessions_update_own" ON public.time_sessions
FOR UPDATE 
USING (
  project_id IN (
    SELECT id FROM public.projects WHERE user_id = auth.uid()
  )
);

CREATE POLICY "time_sessions_delete_own" ON public.time_sessions
FOR DELETE 
USING (
  project_id IN (
    SELECT id FROM public.projects WHERE user_id = auth.uid()
  )
);

-- Super admin policies for time_sessions
CREATE POLICY "time_sessions_super_admin_all" ON public.time_sessions
FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'));
