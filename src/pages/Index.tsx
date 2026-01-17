import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeroSection } from '@/components/HeroSection';
import { CaseSelection } from '@/components/CaseSelection';
import { CourtHearing } from '@/components/CourtHearing';
import { RoleSelectionModal } from '@/components/RoleSelectionModal';
import { CaseIntakeChat } from '@/components/CaseIntakeChat';
import { YourCasesSection } from '@/components/YourCasesSection';
import { AuthenticatorModal } from '@/components/AuthenticatorModal';
import { WalletBalance } from '@/components/WalletBalance';
import { CaseData, generateCustomCase } from '@/data/exampleCases';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { CourtPartyRole } from '@/types/court';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, User, LayoutDashboard, Gavel, IndianRupee } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { getApiUrl } from '@/utils/apiUrl';

type AppView = 'home' | 'role-select' | 'selection' | 'intake-chat' | 'hearing';
type SelectionMode = 'example' | 'custom';

const Index = () => {
  const [view, setView] = useState<AppView>('home');
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('example');
  const [selectedCase, setSelectedCase] = useState<CaseData | null>(null);
  const [selectedRole, setSelectedRole] = useState<CourtPartyRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [isAuthenticatedVerified, setIsAuthenticatedVerified] = useState(false);
  const [showAuthenticatorModal, setShowAuthenticatorModal] = useState(false);
  
  const { toast } = useToast();
  const { user, isAuthenticated, signOut, loading } = useAuth();
  const { setLanguage } = useLanguage();
  const navigate = useNavigate();

  // Check session storage on mount
  useEffect(() => {
    const checkSessionAuth = async () => {
      // First check if session is verified
      const authSession = sessionStorage.getItem('authenticator_session');
      if (authSession === 'verified') {
        setIsAuthenticatedVerified(true);
        setShowAuthenticatorModal(false);
        return;
      }

      // If not verified, check if 2FA is actually required (API available)
      // Only show modal if API is reachable and 2FA is configured
      try {
        const API_URL = getApiUrl();
        
        // Don't show modal if API is localhost in production
        if (API_URL.includes('localhost') && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
          console.warn('[Index] API URL points to localhost in production. Skipping 2FA.');
          setIsAuthenticatedVerified(true); // Allow access without 2FA
          setShowAuthenticatorModal(false);
          return;
        }

        // Quick check if API is reachable
        const response = await fetch(`${API_URL}/api/authenticator/status`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          const data = await response.json();
          // Only show modal if 2FA is actually set up
          if (data.isSetup !== undefined) {
            setShowAuthenticatorModal(true);
          } else {
            // API works but 2FA not configured - allow access
            setIsAuthenticatedVerified(true);
            setShowAuthenticatorModal(false);
          }
        } else {
          // API returned error - assume 2FA not required
          setIsAuthenticatedVerified(true);
          setShowAuthenticatorModal(false);
        }
      } catch (error) {
        // API unreachable - don't require 2FA (allows app to work without backend)
        console.warn('[Index] Authenticator API unreachable. Allowing access without 2FA.');
        setIsAuthenticatedVerified(true);
        setShowAuthenticatorModal(false);
      }
    };

    checkSessionAuth();

    // Listen for storage changes (when tab is opened/closed)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authenticator_session') {
        const authSession = sessionStorage.getItem('authenticator_session');
        if (authSession === 'verified') {
          setIsAuthenticatedVerified(true);
          setShowAuthenticatorModal(false);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleSelectExampleCases = () => {
    if (!isAuthenticated) {
      toast({
        title: 'Login Required',
        description: 'Please login to access the courtroom.',
      });
      navigate('/auth');
      return;
    }
    setSelectionMode('example');
    setShowRoleModal(true);
  };

  const handleSelectCustomCase = () => {
    if (!isAuthenticated) {
      toast({
        title: 'Login Required',
        description: 'Please login to file a new case.',
      });
      navigate('/auth');
      return;
    }
    setSelectionMode('custom');
    setShowRoleModal(true);
  };

  const handleRoleSelect = (language: Language, role: CourtPartyRole) => {
    setLanguage(language);
    setSelectedRole(role);
    setShowRoleModal(false);
    
    if (selectionMode === 'example') {
      setView('selection');
    } else {
      // For custom cases, go to the AI intake chat
      setView('intake-chat');
    }
  };

  const handleBack = () => {
    if (view === 'hearing') {
      setView('selection');
      setSelectedCase(null);
    } else if (view === 'intake-chat') {
      setView('home');
      setSelectedRole(null);
    } else if (view === 'selection') {
      setView('home');
      setSelectedRole(null);
    } else {
      setView('home');
    }
  };

  const handleCaseSelect = (caseData: CaseData) => {
    setSelectedCase(caseData);
    setView('hearing');
    toast({
      title: "Case Selected!",
      description: `Beginning hearing for: ${caseData.title}`,
    });
  };

  const handleIntakeComplete = (caseId: string) => {
    toast({
      title: "Case Filed Successfully!",
      description: "Your case is being processed by AI. You will receive a callback.",
    });
    // Could navigate to hearing or show a waiting screen
    setView('home');
  };

  const handleCustomCaseSubmit = async (details: {
    title: string;
    description: string;
    plaintiff: string;
    defendant: string;
    evidence: string;
  }) => {
    setIsLoading(true);
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const customCase: CaseData = {
      id: `CASE-CUSTOM-${Date.now()}`,
      title: details.title,
      year: new Date().getFullYear(),
      category: 'Custom Case',
      summary: details.description,
      plaintiff: details.plaintiff,
      defendant: details.defendant,
      evidence: details.evidence ? details.evidence.split(',').map(e => e.trim()) : ['User submitted evidence'],
      legalIssues: ['To be analyzed', 'Pending review'],
      status: 'pending',
    };
    
    setSelectedCase(customCase);
    setIsLoading(false);
    setView('hearing');
    
    toast({
      title: "Case Filed Successfully!",
      description: "AI analysis complete. Beginning virtual hearing...",
    });
  };

  const handleLogout = async () => {
    await signOut();
    // Clear session storage
    sessionStorage.removeItem('authenticator_session');
    setIsAuthenticatedVerified(false);
    setShowAuthenticatorModal(true);
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
  };

  const handleAuthenticatorVerified = () => {
    // Store in sessionStorage (clears when tab closes)
    sessionStorage.setItem('authenticator_session', 'verified');
    setIsAuthenticatedVerified(true);
    setShowAuthenticatorModal(false);
  };

  return (
    <main className="min-h-screen bg-background relative">
      {/* Blur overlay when authenticator not verified */}
      {!isAuthenticatedVerified && (
        <div className="fixed inset-0 z-40 backdrop-blur-md bg-background/80" />
      )}

      {/* Authenticator Modal */}
      <AuthenticatorModal
        open={showAuthenticatorModal && !isAuthenticatedVerified}
        onVerified={handleAuthenticatorVerified}
      />

      {/* Main Content - Blurred when not verified */}
      <div className={!isAuthenticatedVerified ? 'blur-sm pointer-events-none' : ''}>
      {/* Auth Header */}
      {view === 'home' && (
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/pricing')}>
            <IndianRupee className="w-4 h-4 mr-2" />
            Pricing
          </Button>
          {isAuthenticated ? (
            <>
              <WalletBalance />
              <span className="text-sm text-muted-foreground hidden sm:block">
                <User className="w-4 h-4 inline mr-1" />
                {user?.email}
              </span>
              <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
                <LayoutDashboard className="w-4 h-4 mr-2" />
                My Cases
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button variant="comic" size="sm" onClick={() => navigate('/auth')}>
              <LogIn className="w-4 h-4 mr-2" />
              Login
            </Button>
          )}
        </div>
      )}

      {view === 'home' && (
        <>
          <HeroSection
            onSelectExampleCases={handleSelectExampleCases}
            onSelectCustomCase={handleSelectCustomCase}
          />
          
          {/* Your Cases Section - Only shown when logged in */}
          {isAuthenticated && user && (
            <YourCasesSection userId={user.id} />
          )}

          {/* Join Court by Code Section */}
          {isAuthenticated && (
            <section className="py-12 px-4 bg-muted/30">
              <div className="max-w-md mx-auto text-center">
                <h3 className="font-bangers text-2xl text-foreground mb-4 flex items-center justify-center gap-2">
                  <Gavel className="w-6 h-6 text-primary" />
                  Join a Court Session
                </h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter Court Code"
                    className="text-center font-mono tracking-widest"
                    maxLength={8}
                    id="court-code-input"
                  />
                  <Button 
                    variant="comic"
                    onClick={() => {
                      const code = (document.getElementById('court-code-input') as HTMLInputElement)?.value;
                      if (code) navigate(`/court?code=${code}`);
                    }}
                  >
                    Join
                  </Button>
                </div>
              </div>
            </section>
          )}
        </>
      )}
      
      {view === 'selection' && (
        <CaseSelection
          initialMode={selectionMode}
          onBack={handleBack}
          onCaseSelect={handleCaseSelect}
          onCustomCaseSubmit={handleCustomCaseSubmit}
          isLoading={isLoading}
        />
      )}

      {view === 'intake-chat' && user && selectedRole && (
        <CaseIntakeChat
          userId={user.id}
          userRole={selectedRole}
          onComplete={handleIntakeComplete}
          onBack={handleBack}
        />
      )}
      
      {view === 'hearing' && selectedCase && (
        <CourtHearing
          caseData={selectedCase}
          onBack={handleBack}
        />
      )}

      {/* Role Selection Modal */}
      <RoleSelectionModal
        open={showRoleModal}
        onSelect={handleRoleSelect}
      />
      
      <Toaster />
      </div>
    </main>
  );
};

export default Index;
