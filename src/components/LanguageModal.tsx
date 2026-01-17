import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { Globe, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LanguageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const languages: { code: Language; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'hinglish', name: 'Hinglish', nativeName: 'Hindi + English' },
];

export const LanguageModal: React.FC<LanguageModalProps> = ({ open, onOpenChange }) => {
  const { language, setLanguage, t } = useLanguage();

  const handleSelect = (lang: Language) => {
    setLanguage(lang);
  };

  const handleContinue = () => {
    localStorage.setItem('ecourt-language-selected', 'true');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md comic-panel border-4 border-foreground shadow-[8px_8px_0_hsl(var(--foreground))]">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <Globe className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="font-bangers text-3xl text-center">
            {t('lang.title')}
          </DialogTitle>
          <DialogDescription className="text-center font-comic">
            {t('lang.subtitle')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={cn(
                'flex items-center justify-between p-4 rounded-xl border-2 transition-all',
                'hover:border-primary hover:bg-primary/5',
                language === lang.code
                  ? 'border-primary bg-primary/10 shadow-[4px_4px_0_hsl(var(--primary))]'
                  : 'border-muted-foreground/30'
              )}
            >
              <div className="text-left">
                <p className="font-bold text-foreground">{lang.nativeName}</p>
                {lang.code !== 'en' && (
                  <p className="text-sm text-muted-foreground">{lang.name}</p>
                )}
              </div>
              {language === lang.code && (
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>

        <Button
          variant="comic"
          size="lg"
          onClick={handleContinue}
          className="w-full"
        >
          {t('lang.continue')}
        </Button>
      </DialogContent>
    </Dialog>
  );
};
