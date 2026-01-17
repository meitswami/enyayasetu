import React, { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { FileText, Send, Sparkles } from 'lucide-react';

interface CustomCaseFormProps {
  onSubmit: (caseDetails: {
    title: string;
    description: string;
    plaintiff: string;
    defendant: string;
    evidence: string;
  }) => void;
  isLoading?: boolean;
}

export const CustomCaseForm: React.FC<CustomCaseFormProps> = ({
  onSubmit,
  isLoading = false,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [plaintiff, setPlaintiff] = useState('');
  const [defendant, setDefendant] = useState('');
  const [evidence, setEvidence] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ title, description, plaintiff, defendant, evidence });
  };

  const isValid = title.trim() && description.trim() && plaintiff.trim() && defendant.trim();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="comic-panel p-6 bg-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
            <FileText className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-bangers text-2xl text-foreground">FILE YOUR CASE</h3>
            <p className="text-sm text-muted-foreground">Enter case details for AI analysis</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-foreground font-bold">
              Case Title *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Property Dispute - Land Ownership"
              className="mt-1 border-2 border-foreground bg-background text-foreground"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="plaintiff" className="text-foreground font-bold">
                Plaintiff Name *
              </Label>
              <Input
                id="plaintiff"
                value={plaintiff}
                onChange={(e) => setPlaintiff(e.target.value)}
                placeholder="Name of complainant"
                className="mt-1 border-2 border-foreground bg-background text-foreground"
              />
            </div>
            <div>
              <Label htmlFor="defendant" className="text-foreground font-bold">
                Defendant Name *
              </Label>
              <Input
                id="defendant"
                value={defendant}
                onChange={(e) => setDefendant(e.target.value)}
                placeholder="Name of accused"
                className="mt-1 border-2 border-foreground bg-background text-foreground"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description" className="text-foreground font-bold">
              Case Description *
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the case in detail. Include what happened, when it happened, the dispute, and what resolution is being sought..."
              className="mt-1 min-h-[150px] border-2 border-foreground bg-background text-foreground"
            />
          </div>

          <div>
            <Label htmlFor="evidence" className="text-foreground font-bold">
              Available Evidence (Optional)
            </Label>
            <Textarea
              id="evidence"
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              placeholder="List any evidence available: documents, witnesses, records, etc."
              className="mt-1 min-h-[100px] border-2 border-foreground bg-background text-foreground"
            />
          </div>
        </div>
      </div>

      <Button
        type="submit"
        variant="comic"
        size="xl"
        className="w-full"
        disabled={!isValid || isLoading}
      >
        {isLoading ? (
          <>
            <Sparkles className="w-5 h-5 animate-spin" />
            AI IS ANALYZING...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            BEGIN VIRTUAL HEARING
          </>
        )}
      </Button>
    </form>
  );
};
