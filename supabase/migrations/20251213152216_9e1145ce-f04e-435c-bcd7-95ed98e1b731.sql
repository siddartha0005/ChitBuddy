-- Update handle_new_user function to include phone
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Get role from metadata, default to 'member'
  user_role := COALESCE(
    (NEW.raw_user_meta_data ->> 'role')::app_role,
    'member'::app_role
  );

  -- Insert profile with phone
  INSERT INTO public.profiles (id, name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.phone),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'phone', NEW.phone)
  );
  
  -- Assign role from metadata
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  RETURN NEW;
END;
$$;