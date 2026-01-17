import React, { useRef, useState } from 'react';
import { EvidenceSubmission, CourtParticipant } from './types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, Upload, Image, File, Check, X, 
  Eye, Loader2, AlertCircle 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface EvidencePanelProps {
  evidence: EvidenceSubmission[];
  currentParticipant?: CourtParticipant;
  isJudge: boolean;
  onUploadEvidence: (file: File) => Promise<void>;
  onAcceptEvidence: (evidenceId: string, accepted: boolean) => void;
  isUploading: boolean;
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({
  evidence,
  currentParticipant,
  isJudge,
  onUploadEvidence,
  onAcceptEvidence,
  isUploading,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceSubmission | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onUploadEvidence(file);
      e.target.value = '';
    }
  };

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return Image;
    if (type.includes('pdf')) return FileText;
    return File;
  };

  const pendingEvidence = evidence.filter(e => e.accepted_by_judge === null);
  const acceptedEvidence = evidence.filter(e => e.accepted_by_judge === true);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bangers text-lg text-foreground flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Evidence
        </h3>
        <Badge variant="outline">{evidence.length} submitted</Badge>
      </div>

      {/* Upload button */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
        className="hidden"
      />
      
      <Button
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="w-full"
      >
        {isUploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing with OCR...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            Upload Evidence
          </>
        )}
      </Button>

      {/* Pending evidence (for judge) */}
      {isJudge && pendingEvidence.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-amber-600">Pending Review:</p>
          {pendingEvidence.map(ev => {
            const Icon = getFileIcon(ev.file_type);
            return (
              <div 
                key={ev.id} 
                className="p-3 rounded-lg border-2 border-amber-500 bg-amber-500/10"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Icon className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{ev.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        By: {ev.participant?.participant_name || 'Unknown'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedEvidence(ev)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => onAcceptEvidence(ev.id, true)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onAcceptEvidence(ev.id, false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {ev.ocr_text && (
                  <div className="mt-2 p-2 rounded bg-background/50 text-xs max-h-20 overflow-y-auto">
                    <p className="font-medium text-muted-foreground mb-1">OCR Extract:</p>
                    {ev.ocr_text.slice(0, 200)}...
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Accepted evidence list */}
      {acceptedEvidence.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-green-600">Accepted Evidence:</p>
          {acceptedEvidence.map(ev => {
            const Icon = getFileIcon(ev.file_type);
            return (
              <div 
                key={ev.id}
                className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 cursor-pointer hover:bg-green-500/20"
                onClick={() => setSelectedEvidence(ev)}
              >
                <Icon className="w-4 h-4 text-green-600" />
                <span className="text-sm truncate flex-1">{ev.file_name}</span>
                <Check className="w-4 h-4 text-green-600" />
              </div>
            );
          })}
        </div>
      )}

      {/* Evidence detail dialog */}
      <Dialog open={!!selectedEvidence} onOpenChange={() => setSelectedEvidence(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedEvidence?.file_name}</DialogTitle>
          </DialogHeader>
          
          {selectedEvidence && (
            <div className="space-y-4">
              {selectedEvidence.file_type.includes('image') && (
                <img 
                  src={selectedEvidence.file_url} 
                  alt={selectedEvidence.file_name}
                  className="w-full rounded-lg"
                />
              )}
              
              {selectedEvidence.file_type.includes('pdf') && (
                <iframe 
                  src={selectedEvidence.file_url}
                  className="w-full h-96 rounded-lg"
                />
              )}
              
              {selectedEvidence.ocr_text && (
                <div className="p-4 rounded-lg bg-muted">
                  <h4 className="font-bold mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    OCR Extracted Text
                  </h4>
                  <p className="text-sm whitespace-pre-wrap">{selectedEvidence.ocr_text}</p>
                </div>
              )}
              
              {selectedEvidence.ai_analysis && (
                <div className="p-4 rounded-lg bg-primary/10">
                  <h4 className="font-bold mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    AI Analysis
                  </h4>
                  <p className="text-sm">{selectedEvidence.ai_analysis}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
