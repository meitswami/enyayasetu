-- Allow users to insert their own roles (needed for auto-assignment)
CREATE POLICY "Users can insert own roles" ON public.user_roles
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert admin role for existing superadmin user
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'superadmin@enyayasetu.test'
ON CONFLICT (user_id, role) DO NOTHING;