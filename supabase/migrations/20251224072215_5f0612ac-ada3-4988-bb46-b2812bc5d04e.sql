-- Drop the existing restrictive admin policy
DROP POLICY IF EXISTS "Admins can view all cases" ON public.cases;

-- Create a new PERMISSIVE admin policy (PERMISSIVE is the default)
CREATE POLICY "Admins can view all cases"
ON public.cases
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Also fix admin policies on related tables that have the same issue

-- case_intake_messages
DROP POLICY IF EXISTS "Admins can view all intake messages" ON public.case_intake_messages;
CREATE POLICY "Admins can view all intake messages"
ON public.case_intake_messages
FOR SELECT
TO authenticated
USING (public.is_admin());

-- case_reports
DROP POLICY IF EXISTS "Admins can view all case reports" ON public.case_reports;
CREATE POLICY "Admins can view all case reports"
ON public.case_reports
FOR SELECT
TO authenticated
USING (public.is_admin());

-- case_evidence
DROP POLICY IF EXISTS "Admins can view all case evidence" ON public.case_evidence;
CREATE POLICY "Admins can view all case evidence"
ON public.case_evidence
FOR SELECT
TO authenticated
USING (public.is_admin());

-- hearing_sessions
DROP POLICY IF EXISTS "Admins can view all hearing sessions" ON public.hearing_sessions;
CREATE POLICY "Admins can view all hearing sessions"
ON public.hearing_sessions
FOR SELECT
TO authenticated
USING (public.is_admin());

-- profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin());