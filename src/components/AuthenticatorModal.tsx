import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Shield, CheckCircle2, Copy, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getApiUrl } from '@/utils/apiUrl';

interface AuthenticatorModalProps {
  open: boolean;
  onVerified: () => void;
}

type ModalMode = 'checking' | 'setup' | 'setup-verify' | 'login' | 'success';

export const AuthenticatorModal: React.FC<AuthenticatorModalProps> = ({
  open,
  onVerified,
}) => {
  const [mode, setMode] = useState<ModalMode>('checking');
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [qrCode, setQrCode] = useState<string>('');
  const [manualEntryKey, setManualEntryKey] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [ownerName, setOwnerName] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      // Reset state when modal opens
      setOtp('');
      setFullName('');
      checkAuthStatus();
    }
  }, [open]);

  // Auto-verify when 6 digits are entered in login mode
  useEffect(() => {
    if (mode === 'login' && otp.length === 6 && fullName.trim() && !loading) {
      // Small delay to ensure all digits are registered
      const timeoutId = setTimeout(() => {
        if (otp.length === 6 && fullName.trim()) {
          verifyLogin();
        }
      }, 300);
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp, mode, fullName, loading]);

  // Auto-verify when 6 digits are entered in setup-verify mode
  useEffect(() => {
    if (mode === 'setup-verify' && otp.length === 6 && !loading) {
      // Small delay to ensure all digits are registered
      const timeoutId = setTimeout(() => {
        if (otp.length === 6) {
          verifySetup();
        }
      }, 300);
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp, mode, loading]);

  const checkAuthStatus = async () => {
    try {
      setMode('checking');
      
      const API_URL = getApiUrl();
      
      // Don't proceed if API_URL is localhost in production (likely misconfigured)
      if (API_URL.includes('localhost') && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        console.warn('[Authenticator] API URL points to localhost in production. Skipping 2FA check.');
        // Don't show modal if API is not reachable
        return;
      }
      
      const response = await fetch(`${API_URL}/api/authenticator/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.isSetup) {
        // 2FA already set up - go to verification
        setOwnerName(data.ownerName || '');
        setMode('login');
      } else {
        // Need to set up 2FA
        setMode('setup');
      }
    } catch (error: any) {
      console.error('Error checking auth status:', error);
      
      // If it's a network error or blocked request, don't show the modal
      // This prevents showing 2FA modal when API is not available
      if (
        error.message?.includes('Failed to fetch') ||
        error.message?.includes('ERR_BLOCKED') ||
        error.name === 'TypeError' ||
        !error.response // Network error, not API error
      ) {
        console.warn('[Authenticator] API unreachable. Skipping 2FA requirement.');
        // Don't show modal - API is likely not configured or not reachable
        // This allows the app to work without 2FA if backend is not available
        return;
      }
      
      toast({
        title: 'Error',
        description: 'Failed to check authentication status',
        variant: 'destructive',
      });
      // Only show setup mode if it's a real API error (not network error)
      setMode('setup');
    }
  };

  const generateQRCode = async () => {
    if (!fullName.trim()) {
      toast({
        title: 'Full Name Required',
        description: 'Please enter your full name',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/api/authenticator/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ownerName: fullName.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setQrCode(data.qrCode);
        setManualEntryKey(data.manualEntryKey);
        setBackupCodes(data.backupCodes || []);
        setMode('setup-verify');
        setOwnerName(fullName.trim());
      } else {
        if (data.secretExists) {
          // Secret exists but not verified - allow to proceed
          toast({
            title: 'Setup Already Started',
            description: 'Please verify your code to complete setup',
          });
          setMode('setup-verify');
        } else {
          throw new Error(data.error || 'Failed to generate QR code');
        }
      }
    } catch (error: any) {
      console.error('Error generating QR code:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate QR code',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const verifySetup = async () => {
    if (!otp || otp.length !== 6) {
      toast({
        title: 'Invalid Code',
        description: 'Please enter a 6-digit code',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/api/authenticator/verify-setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: otp }),
      });

      const data = await response.json();

      if (response.ok) {
        setMode('success');
        toast({
          title: 'Success',
          description: 'Authenticator successfully set up!',
        });
        
        // Show backup codes
        if (backupCodes.length > 0) {
          setTimeout(() => {
            toast({
              title: 'Backup Codes',
              description: `Save these codes: ${backupCodes.join(', ')}`,
              duration: 10000,
            });
          }, 1000);
        }
        
        // Allow access after a brief delay
        setTimeout(() => {
          onVerified();
        }, 2000);
      } else {
        throw new Error(data.error || 'Wrong passcode');
      }
    } catch (error: any) {
      console.error('Error verifying setup:', error);
      const errorMessage = error.message || 'Wrong passcode';
      toast({
        title: 'Wrong Passcode',
        description: errorMessage.includes('passcode') || errorMessage.includes('Invalid') 
          ? 'Wrong passcode. Please try again.' 
          : errorMessage,
        variant: 'destructive',
      });
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  const verifyLogin = async () => {
    if (!fullName.trim()) {
      toast({
        title: 'Full Name Required',
        description: 'Please enter your full name',
        variant: 'destructive',
      });
      return;
    }

    if (!otp || otp.length !== 6) {
      toast({
        title: 'Invalid Code',
        description: 'Please enter a 6-digit code',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/api/authenticator/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: otp,
          fullName: fullName.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMode('success');
        toast({
          title: 'Success',
          description: 'Authentication successful!',
        });
        
        // Allow access after a brief delay
        setTimeout(() => {
          onVerified();
        }, 1000);
      } else {
        throw new Error(data.error || 'Wrong passcode');
      }
    } catch (error: any) {
      console.error('Error verifying login:', error);
      const errorMessage = error.message || 'Wrong passcode';
      toast({
        title: 'Wrong Passcode',
        description: errorMessage.includes('passcode') || errorMessage.includes('Invalid') 
          ? 'Wrong passcode. Please try again.' 
          : errorMessage,
        variant: 'destructive',
      });
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Copied to clipboard',
    });
  };

  const renderContent = () => {
    if (mode === 'checking') {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Checking authentication status...</p>
        </div>
      );
    }

    if (mode === 'setup') {
      return (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Initial Setup Required</h3>
            <p className="text-sm text-muted-foreground">
              Set up Microsoft Authenticator to secure access to eNyayaSetu
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="owner-name">Your Full Name *</Label>
              <Input
                id="owner-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="mt-1"
                required
              />
            </div>

            <Button
              onClick={generateQRCode}
              disabled={!fullName.trim() || loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Generate QR Code
                </>
              )}
            </Button>
          </div>
        </div>
      );
    }

    if (mode === 'setup-verify') {
      return (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Set Up Microsoft Authenticator</h3>
            <p className="text-sm text-muted-foreground">
              Scan this QR code with Microsoft Authenticator or enter the key manually
            </p>
          </div>

          {qrCode ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="border-2 border-border rounded-lg p-4 bg-background">
                <img src={qrCode} alt="QR Code" className="w-64 h-64" />
              </div>

              <div className="w-full">
                <Label className="mb-2 block">Manual Entry Key</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={manualEntryKey}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(manualEntryKey)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
              <p className="text-sm text-muted-foreground">Loading QR code...</p>
            </div>
          )}

          <div className="space-y-4 border-t pt-4">
            <div>
              <Label className="text-base font-semibold mb-3 block">
                6-Digit Code from Microsoft Authenticator *
              </Label>
              <div className="bg-muted/30 rounded-lg p-4 mb-2">
                <p className="text-sm text-muted-foreground mb-3 text-center">
                  Open Microsoft Authenticator app on your phone and enter the 6-digit code shown there
                </p>
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={setOtp}
                  className="justify-center"
                >
                  <InputOTPGroup>
                    {[...Array(6)].map((_, i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                {otp.length > 0 && otp.length < 6 && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Enter {6 - otp.length} more digit{6 - otp.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>

            <Button
              onClick={verifySetup}
              disabled={otp.length !== 6 || loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Verify & Complete Setup
                </>
              )}
            </Button>
          </div>
        </div>
      );
    }

    if (mode === 'login') {
      return (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Authenticator Code Required</h3>
            <p className="text-sm text-muted-foreground">
              Please enter the 6-digit code from Microsoft Authenticator to access eNyayaSetu
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="full-name">Full Name *</Label>
              <Input
                id="full-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="mt-1"
                required
              />
            </div>

            <div className="border-t pt-4">
              <Label className="text-base font-semibold mb-3 block">
                6-Digit Code from Microsoft Authenticator *
              </Label>
              <div className="bg-muted/30 rounded-lg p-4 mb-2">
                <p className="text-sm text-muted-foreground mb-3 text-center">
                  Open Microsoft Authenticator app on your phone and enter the 6-digit code shown there
                </p>
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={setOtp}
                  className="justify-center"
                >
                  <InputOTPGroup>
                    {[...Array(6)].map((_, i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                {otp.length > 0 && otp.length < 6 && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Enter {6 - otp.length} more digit{6 - otp.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>

            <Button
              onClick={verifyLogin}
              disabled={!fullName.trim() || otp.length !== 6 || loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Verify & Access
                </>
              )}
            </Button>
          </div>
        </div>
      );
    }

    if (mode === 'success') {
      return (
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
          <h3 className="text-lg font-semibold">Authentication Successful!</h3>
          <p className="text-sm text-muted-foreground">Granting access...</p>
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </DialogTitle>
          <DialogDescription>
            {mode === 'setup' || mode === 'setup-verify'
              ? 'Set up Microsoft Authenticator to secure your access'
              : 'Enter your authenticator code to continue'}
          </DialogDescription>
        </DialogHeader>

        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};
