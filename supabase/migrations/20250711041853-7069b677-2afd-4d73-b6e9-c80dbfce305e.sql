-- Create a function to safely delete a user and all their related data
CREATE OR REPLACE FUNCTION public.delete_user_and_data(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only super admins can call this function
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'Access denied. Only super admins can delete users.';
  END IF;
  
  -- Delete from auth.users (this will cascade to all related tables)
  DELETE FROM auth.users WHERE id = _user_id;
  
  -- Return true if deletion was successful
  RETURN FOUND;
END;
$$;