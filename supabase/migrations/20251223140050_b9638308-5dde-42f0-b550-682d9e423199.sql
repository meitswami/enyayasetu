-- Create admin role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table for secure role management
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own roles
CREATE POLICY "Users can view own roles" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

-- Create security definer function to check if user has a role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
$$;

-- Add policy for admins to view ALL cases
CREATE POLICY "Admins can view all cases" ON public.cases
FOR SELECT USING (public.is_admin());

-- Add policy for admins to view ALL case_intake_messages  
CREATE POLICY "Admins can view all intake messages" ON public.case_intake_messages
FOR SELECT USING (public.is_admin());

-- Add policy for admins to view ALL case_reports
CREATE POLICY "Admins can view all case reports" ON public.case_reports
FOR SELECT USING (public.is_admin());

-- Add policy for admins to view ALL case_evidence
CREATE POLICY "Admins can view all case evidence" ON public.case_evidence
FOR SELECT USING (public.is_admin());

-- Add policy for admins to view ALL hearing_sessions
CREATE POLICY "Admins can view all hearing sessions" ON public.hearing_sessions
FOR SELECT USING (public.is_admin());

-- Add policy for admins to view ALL profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (public.is_admin());