import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LiveCourtroom } from '@/components/courtroom/LiveCourtroom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Gavel, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

const Court = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [searchParams] = useSearchParams();
  const codeFromUrl = searchParams.get('code');
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [sessionExists, setSessionExists] = useState(false);
  const [resolvedSessionId, setResolvedSessionId] = useState<string | null>(sessionId || null);
  const [joinCode, setJoinCode] = useState(codeFromUrl || '');
  const [joiningByCode, setJoiningByCode] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast.error('Please login to access court');
      navigate('/auth');
      return;
    }

    // If code provided in URL, try to join
    if (codeFromUrl && !sessionId) {
      handleJoinByCode(codeFromUrl);
      return;
    }

    if (sessionId) {
      checkSession(sessionId);
    } else {
      setLoading(false);
    }
  }, [sessionId, authLoading, isAuthenticated, codeFromUrl]);

  const checkSession = async (id: string) => {
    const { data, error } = await supabase
      .from('court_sessions')
      .select('id')
      .eq('id', id)
      .single();

    if (error || !data) {
      toast.error('Court session not found');
      setSessionExists(false);
    } else {
      setSessionExists(true);
      setResolvedSessionId(data.id);
    }
    setLoading(false);
  };

  const handleJoinByCode = async (code?: string) => {
    const codeToUse = code || joinCode;
    if (!codeToUse.trim()) return;

    setJoiningByCode(true);
    
    const { data, error } = await supabase
      .from('court_sessions')
      .select('id')
      .eq('court_code', codeToUse.toUpperCase().trim())
      .single();

    if (error || !data) {
      toast.error('Invalid court code');
      setJoiningByCode(false);
      setLoading(false);
      return;
    }

    setResolvedSessionId(data.id);
    setSessionExists(true);
    setLoading(false);
    setJoiningByCode(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  // If session exists (from URL param or code), show the courtroom
  if (resolvedSessionId && sessionExists) {
    return <LiveCourtroom sessionId={resolvedSessionId} />;
  }

  // Otherwise show join by code screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full">
        <div className="p-8 rounded-xl border-4 border-foreground bg-card shadow-[8px_8px_0_hsl(var(--foreground))]">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 border-4 border-primary flex items-center justify-center">
              <Gavel className="w-10 h-10 text-primary" />
            </div>
            <h1 className="font-bangers text-3xl text-foreground mb-2">
              Join Court Session
            </h1>
            <p className="text-muted-foreground">
              Enter the court code to join a live hearing
            </p>
          </div>

          <div className="space-y-4">
            <Input
              placeholder="Enter Court Code (e.g., ABC12345)"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="text-center font-mono text-lg tracking-widest"
              maxLength={8}
            />

            <Button 
              variant="comic" 
              className="w-full"
              onClick={() => handleJoinByCode()}
              disabled={!joinCode.trim() || joiningByCode}
            >
              {joiningByCode ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Gavel className="w-5 h-5 mr-2" />
                  Join Session
                </>
              )}
            </Button>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Court;
