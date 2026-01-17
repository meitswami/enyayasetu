import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { CourtPartyRole, ROLE_LABELS, HUMAN_CONTROLLED_ROLES, AI_CONTROLLED_ROLES } from '@/types/court';
import { Scale, Users, Gavel, ShieldCheck, User, UserCheck, Radio, Languages } from 'lucide-react';

interface RoleSelectionModalProps {
  open: boolean;
  onSelect: (language: Language, role: CourtPartyRole) => void;
}

const ROLE_ICONS: Partial<Record<CourtPartyRole, React.ReactNode>> = {
  audience: <Users className="w-5 h-5" />,
  judge: <Gavel className="w-5 h-5" />,
  steno: <Radio className="w-5 h-5" />,
  public_prosecutor: <ShieldCheck className="w-5 h-5" />,
  defence_lawyer: <Scale className="w-5 h-5" />,
  accused: <User className="w-5 h-5" />,
  victim: <UserCheck className="w-5 h-5" />,
  victim_family: <Users className="w-5 h-5" />,
  accused_family: <Users className="w-5 h-5" />,
  police_staff: <ShieldCheck className="w-5 h-5" />,
};

export const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({ open, onSelect }) => {
  const { language: currentLanguage, setLanguage, t } = useLanguage();
  const [step, setStep] = useState<'language' | 'role'>('language');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(currentLanguage);
  const [selectedRole, setSelectedRole] = useState<CourtPartyRole | null>(null);

  const handleLanguageSelect = (lang: Language) => {
    setSelectedLanguage(lang);
    setLanguage(lang);
    setStep('role');
  };

  const handleRoleSelect = (role: CourtPartyRole) => {
    setSelectedRole(role);
  };

  const handleConfirm = () => {
    if (selectedRole) {
      onSelect(selectedLanguage, selectedRole);
    }
  };

  const getRoleLabel = (role: CourtPartyRole) => {
    const labels = ROLE_LABELS[role];
    switch (selectedLanguage) {
      case 'hi':
        return labels.hi;
      case 'hinglish':
        return labels.hinglish;
      default:
        return labels.en;
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-foreground shadow-[4px_4px_0_hsl(var(--foreground))]">
        <DialogHeader>
          <DialogTitle className="font-bangers text-2xl text-center flex items-center justify-center gap-2">
            {step === 'language' ? (
              <>
                <Languages className="w-6 h-6 text-primary" />
                {t('lang.title')}
              </>
            ) : (
              <>
                <Scale className="w-6 h-6 text-primary" />
                Select Your Role
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-center">
            {step === 'language' 
              ? t('lang.subtitle')
              : 'Choose which side you want to participate from in the courtroom'
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'language' ? (
          <div className="grid gap-3 mt-4">
            {(['en', 'hi', 'hinglish'] as Language[]).map((lang) => (
              <Button
                key={lang}
                variant={selectedLanguage === lang ? 'comic' : 'outline'}
                size="lg"
                onClick={() => handleLanguageSelect(lang)}
                className="w-full justify-start text-left h-auto py-4"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {lang === 'en' ? '🇬🇧' : lang === 'hi' ? '🇮🇳' : '🌐'}
                  </span>
                  <div>
                    <div className="font-bold">
                      {lang === 'en' ? 'English' : lang === 'hi' ? 'हिंदी (Hindi)' : 'Hinglish'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {lang === 'en' 
                        ? 'Court proceedings in English' 
                        : lang === 'hi' 
                        ? 'कोर्ट कार्यवाही हिंदी में'
                        : 'Mixed Hindi and English'}
                    </div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            {/* Human-controlled roles */}
            <div>
              <h3 className="font-bold text-sm text-muted-foreground mb-2 uppercase tracking-wide">
                👤 Your Role (You will participate)
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {HUMAN_CONTROLLED_ROLES.map((role) => (
                  <Button
                    key={role}
                    variant={selectedRole === role ? 'comic' : 'outline'}
                    size="sm"
                    onClick={() => handleRoleSelect(role)}
                    className="justify-start h-auto py-3"
                  >
                    <span className="mr-2">{ROLE_ICONS[role]}</span>
                    <span className="text-sm">{getRoleLabel(role)}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* AI-controlled roles info */}
            <div className="bg-muted/50 rounded-lg p-4 border-2 border-dashed border-muted-foreground/30">
              <h3 className="font-bold text-sm text-muted-foreground mb-2 uppercase tracking-wide">
                🤖 AI-Controlled Roles (Virtual)
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                These roles will be played by AI based on Indian Acts, Laws & Rules:
              </p>
              <div className="flex flex-wrap gap-2">
                {AI_CONTROLLED_ROLES.map((role) => (
                  <span
                    key={role}
                    className="px-2 py-1 bg-secondary/20 rounded text-xs font-medium"
                  >
                    {getRoleLabel(role)}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setStep('language')}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                variant="comic"
                onClick={handleConfirm}
                disabled={!selectedRole}
                className="flex-1"
              >
                Start Hearing
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
