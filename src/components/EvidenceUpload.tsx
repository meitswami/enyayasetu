import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { EvidenceParty, CaseEvidence } from '@/types/court';
import { Upload, FileText, Image, Video, Music, File, X, Loader2, Hash } from 'lucide-react';

interface EvidenceUploadProps {
  caseId: string;
  userId: string;
  onUploadComplete: (evidence: CaseEvidence) => void;
  onAnalysisComplete?: (analysis: string) => void;
}

const FILE_TYPE_ICONS: Record<string, React.ReactNode> = {
  image: <Image className="w-8 h-8" />,
  video: <Video className="w-8 h-8" />,
  audio: <Music className="w-8 h-8" />,
  document: <FileText className="w-8 h-8" />,
  default: <File className="w-8 h-8" />,
};

const getFileCategory = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf') || mimeType.includes('document')) return 'document';
  return 'default';
};

// Simple hash function for demonstration
const calculateFileHash = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const EvidenceUpload: React.FC<EvidenceUploadProps> = ({
  caseId,
  userId,
  onUploadComplete,
  onAnalysisComplete,
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [providedBy, setProvidedBy] = useState<EvidenceParty>('prosecution');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast({
        title: 'No files selected',
        description: 'Please select at least one file to upload.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      for (const file of files) {
        // Calculate file hash for integrity verification
        const fileHash = await calculateFileHash(file);
        
        // Upload to storage
        const filePath = `${userId}/${caseId}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('evidence')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get signed URL for private bucket
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from('evidence')
          .createSignedUrl(filePath, 3600); // 1 hour expiry
        
        if (signedUrlError) throw signedUrlError;
        const fileUrl = signedUrlData.signedUrl;

        // Save evidence record
        const { data: evidenceData, error: dbError } = await supabase
          .from('case_evidence')
          .insert({
            case_id: caseId,
            file_name: file.name,
            file_type: file.type,
            file_url: filePath, // Store the path, generate signed URL on access
            file_hash: fileHash,
            provided_by: providedBy,
            description: description,
            uploaded_by: userId,
          })
          .select()
          .single();

        if (dbError) throw dbError;

        // Analyze the evidence with AI
        setIsAnalyzing(true);
        
        try {
          const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-evidence', {
            body: {
              fileName: file.name,
              fileType: file.type,
              description: description,
              providedBy: providedBy,
            },
          });

          if (!analysisError && analysisData?.analysis) {
            // Update evidence with analysis
            await supabase
              .from('case_evidence')
              .update({ ai_analysis: analysisData.analysis })
              .eq('id', evidenceData.id);

            if (onAnalysisComplete) {
              onAnalysisComplete(analysisData.analysis);
            }
          }
        } catch (analysisErr) {
          console.error('Analysis error:', analysisErr);
        }

        setIsAnalyzing(false);

        onUploadComplete({
          id: evidenceData.id,
          case_id: evidenceData.case_id,
          file_name: evidenceData.file_name,
          file_type: evidenceData.file_type,
          file_url: evidenceData.file_url,
          file_hash: evidenceData.file_hash,
          provided_by: evidenceData.provided_by as EvidenceParty,
          description: evidenceData.description,
          ai_analysis: evidenceData.ai_analysis,
          created_at: evidenceData.created_at,
        });
      }

      toast({
        title: 'Evidence Uploaded',
        description: `${files.length} file(s) uploaded successfully with hash verification.`,
      });

      // Reset form
      setFiles([]);
      setDescription('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload evidence.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border-2 border-foreground rounded-lg bg-card">
      <h3 className="font-bangers text-xl flex items-center gap-2">
        <Upload className="w-5 h-5 text-primary" />
        Upload Evidence
      </h3>

      <div className="space-y-4">
        {/* File drop zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-muted-foreground/50 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
        >
          <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">
            Click to upload or drag & drop files
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Supports: Images, Videos, Audio, PDFs, Documents
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
          />
        </div>

        {/* Selected files */}
        {files.length > 0 && (
          <div className="space-y-2">
            <Label>Selected Files ({files.length})</Label>
            <div className="grid gap-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    {FILE_TYPE_ICONS[getFileCategory(file.type)]}
                    <div>
                      <p className="text-sm font-medium truncate max-w-[200px]">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Party selection */}
        <div className="space-y-2">
          <Label>Evidence Provided By</Label>
          <Select
            value={providedBy}
            onValueChange={(v) => setProvidedBy(v as EvidenceParty)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="prosecution">Prosecution (PP)</SelectItem>
              <SelectItem value="defence">Defence Lawyer</SelectItem>
              <SelectItem value="court">Court</SelectItem>
              <SelectItem value="police">Police</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            placeholder="Describe the evidence and its relevance to the case..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        {/* Hash verification note */}
        <div className="flex items-start gap-2 p-3 bg-primary/10 rounded-lg">
          <Hash className="w-4 h-4 text-primary mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">SHA-256 Hash Verification</p>
            <p className="text-muted-foreground">
              All uploaded evidence will be cryptographically hashed for integrity verification.
            </p>
          </div>
        </div>

        {/* Upload button */}
        <Button
          variant="comic"
          onClick={handleUpload}
          disabled={files.length === 0 || isUploading || isAnalyzing}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing with AI...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload & Analyze Evidence
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
