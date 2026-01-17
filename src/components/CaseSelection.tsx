import React, { useState } from 'react';
import { CaseCard } from './CaseCard';
import { CustomCaseForm } from './CustomCaseForm';
import { exampleCases, CaseData } from '@/data/exampleCases';
import { Button } from './ui/button';
import { ArrowLeft, BookOpen, FileEdit } from 'lucide-react';
import { cn } from '@/lib/utils';

type SelectionMode = 'example' | 'custom';

interface CaseSelectionProps {
  initialMode: SelectionMode;
  onBack: () => void;
  onCaseSelect: (caseData: CaseData) => void;
  onCustomCaseSubmit: (details: {
    title: string;
    description: string;
    plaintiff: string;
    defendant: string;
    evidence: string;
  }) => void;
  isLoading?: boolean;
}

export const CaseSelection: React.FC<CaseSelectionProps> = ({
  initialMode,
  onBack,
  onCaseSelect,
  onCustomCaseSubmit,
  isLoading = false,
}) => {
  const [mode, setMode] = useState<SelectionMode>(initialMode);
  const [selectedCase, setSelectedCase] = useState<CaseData | null>(null);

  return (
    <section className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="outline"
            onClick={onBack}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            BACK
          </Button>

          {/* Mode toggle */}
          <div className="flex gap-2 p-1 rounded-xl border-2 border-foreground bg-card">
            <button
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all',
                mode === 'example'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => setMode('example')}
            >
              <BookOpen className="w-4 h-4" />
              EXAMPLES
            </button>
            <button
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all',
                mode === 'custom'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => setMode('custom')}
            >
              <FileEdit className="w-4 h-4" />
              CUSTOM
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-12">
          <h2 className="font-bangers text-4xl md:text-6xl text-foreground mb-4">
            {mode === 'example' ? (
              <>📚 SELECT A <span className="text-primary">CASE</span></>
            ) : (
              <>✍️ FILE YOUR <span className="text-secondary">CASE</span></>
            )}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {mode === 'example'
              ? 'Choose from our collection of real-world inspired cases to begin the virtual hearing.'
              : 'Describe your case and let our AI analyze and simulate the court proceedings.'}
          </p>
        </div>

        {/* Content */}
        {mode === 'example' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exampleCases.map((caseData) => (
              <CaseCard
                key={caseData.id}
                caseData={caseData}
                onSelect={onCaseSelect}
                isSelected={selectedCase?.id === caseData.id}
              />
            ))}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <CustomCaseForm onSubmit={onCustomCaseSubmit} isLoading={isLoading} />
          </div>
        )}
      </div>
    </section>
  );
};
