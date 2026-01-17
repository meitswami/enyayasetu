import { useEffect, useCallback } from 'react';

interface KeyboardShortcutsOptions {
  enabled?: boolean;
  onGavel?: () => void;
  onObjection?: () => void;
  onVerdict?: () => void;
  onEvidence?: () => void;
  onWitness?: () => void;
  onTension?: () => void;
  onSustained?: () => void;
  onOverruled?: () => void;
}

export const useKeyboardShortcuts = (options: KeyboardShortcutsOptions) => {
  const {
    enabled = true,
    onGavel,
    onObjection,
    onVerdict,
    onEvidence,
    onWitness,
    onTension,
    onSustained,
    onOverruled,
  } = options;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger if user is typing in an input
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      !enabled
    ) {
      return;
    }

    // Require Shift key to prevent accidental triggers
    if (!event.shiftKey) return;

    switch (event.key.toUpperCase()) {
      case 'G':
        event.preventDefault();
        onGavel?.();
        break;
      case 'O':
        event.preventDefault();
        onObjection?.();
        break;
      case 'V':
        event.preventDefault();
        onVerdict?.();
        break;
      case 'E':
        event.preventDefault();
        onEvidence?.();
        break;
      case 'W':
        event.preventDefault();
        onWitness?.();
        break;
      case 'T':
        event.preventDefault();
        onTension?.();
        break;
      case 'S':
        event.preventDefault();
        onSustained?.();
        break;
      case 'R':
        event.preventDefault();
        onOverruled?.();
        break;
    }
  }, [enabled, onGavel, onObjection, onVerdict, onEvidence, onWitness, onTension, onSustained, onOverruled]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    shortcuts: [
      { key: 'Shift+G', action: 'Gavel' },
      { key: 'Shift+O', action: 'Objection' },
      { key: 'Shift+V', action: 'Verdict' },
      { key: 'Shift+E', action: 'Evidence' },
      { key: 'Shift+W', action: 'Witness' },
      { key: 'Shift+T', action: 'Tension' },
      { key: 'Shift+S', action: 'Sustained' },
      { key: 'Shift+R', action: 'Overruled' },
    ],
  };
};
