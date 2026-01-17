-- Fix 1: Prevent users from self-assigning admin role
-- Drop the current policy that allows self-insertion
DROP POLICY IF EXISTS "Users can insert own roles" ON user_roles;

-- Create a new policy that prevents admin role self-assignment
CREATE POLICY "Users can insert non-admin roles" 
ON user_roles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND role != 'admin');

-- Allow admins to assign any role
CREATE POLICY "Admins can assign any role" 
ON user_roles 
FOR INSERT 
WITH CHECK (public.is_admin());

-- Fix 2: Restrict court_sessions public exposure
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view session with court code" ON court_sessions;

-- Create a more restrictive policy - allow authenticated participants or case owners
CREATE POLICY "Participants can view court sessions" 
ON court_sessions 
FOR SELECT 
USING (
  -- Case owners can always see their sessions
  EXISTS (
    SELECT 1 FROM cases 
    WHERE cases.id = court_sessions.case_id 
    AND cases.user_id = auth.uid()
  )
  -- Session participants can view
  OR EXISTS (
    SELECT 1 FROM court_participants
    WHERE court_participants.session_id = court_sessions.id
    AND court_participants.user_id = auth.uid()
  )
  -- Admins can view all
  OR public.is_admin()
);