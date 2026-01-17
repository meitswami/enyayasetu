import React from 'react';
import { CaseData } from '@/data/exampleCases';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Calendar, FileText, Scale, Users } from 'lucide-react';

interface CaseCardProps {
  caseData: CaseData;
  onSelect: (caseData: CaseData) => void;
  isSelected?: boolean;
}

export const CaseCard: React.FC<CaseCardProps> = ({
  caseData,
  onSelect,
  isSelected = false,
}) => {
  const categoryColors: Record<string, string> = {
    'Property Law': 'bg-amber-500',
    'Criminal Law': 'bg-red-500',
    'Family Law': 'bg-pink-500',
    'Environmental Law': 'bg-green-500',
    'Intellectual Property': 'bg-purple-500',
    'Labor Law': 'bg-blue-500',
    'Medical Negligence': 'bg-teal-500',
    'Cyber Crime': 'bg-indigo-500',
    'Consumer Protection': 'bg-orange-500',
    'Defamation': 'bg-rose-500',
  };

  return (
    <div
      className={cn(
        'relative p-6 rounded-xl border-4 border-foreground transition-all duration-300 cursor-pointer hover-lift',
        'bg-card shadow-[4px_4px_0_hsl(var(--foreground))]',
        isSelected && 'ring-4 ring-primary scale-105'
      )}
      onClick={() => onSelect(caseData)}
    >
      {/* Category badge */}
      <div
        className={cn(
          'absolute -top-3 -right-3 px-3 py-1 rounded-full border-2 border-foreground text-xs font-bold text-white',
          categoryColors[caseData.category] || 'bg-muted'
        )}
      >
        {caseData.category}
      </div>

      {/* Case ID */}
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-4 h-4 text-primary" />
        <span className="text-sm font-mono text-muted-foreground">{caseData.id}</span>
      </div>

      {/* Title */}
      <h3 className="font-bangers text-xl text-foreground mb-2 leading-tight">
        {caseData.title}
      </h3>

      {/* Year */}
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Filed: {caseData.year}</span>
      </div>

      {/* Summary */}
      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
        {caseData.summary}
      </p>

      {/* Parties */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-lawyer" />
          <span className="text-xs text-muted-foreground">
            <strong className="text-foreground">Plaintiff:</strong> {caseData.plaintiff}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-prosecutor" />
          <span className="text-xs text-muted-foreground">
            <strong className="text-foreground">Defendant:</strong> {caseData.defendant}
          </span>
        </div>
      </div>

      {/* Evidence count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground">
            {caseData.evidence.length} pieces of evidence
          </span>
        </div>

        <Button
          variant="comic"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(caseData);
          }}
        >
          START HEARING
        </Button>
      </div>
    </div>
  );
};
