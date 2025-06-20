
-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can access their own projects" ON public.projects;
DROP POLICY IF EXISTS "Super admins can access all projects" ON public.projects;
DROP POLICY IF EXISTS "Users can access their own time sessions" ON public.time_sessions;
DROP POLICY IF EXISTS "Super admins can access all time sessions" ON public.time_sessions;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;

-- Enable RLS on all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for regular users to access their own projects
CREATE POLICY "Users can access their own projects" 
ON public.projects 
FOR ALL 
TO authenticated
USING (auth.uid() = user_id);

-- Create policy for super admins to access all projects
CREATE POLICY "Super admins can access all projects" 
ON public.projects 
FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- Create policy for regular users to access their own time sessions
CREATE POLICY "Users can access their own time sessions" 
ON public.time_sessions 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = time_sessions.project_id 
    AND projects.user_id = auth.uid()
  )
);

-- Create policy for super admins to access all time sessions
CREATE POLICY "Super admins can access all time sessions" 
ON public.time_sessions 
FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- Allow users to see their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- Allow super admins to see all profiles
CREATE POLICY "Super admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));
