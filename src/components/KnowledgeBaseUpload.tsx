import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, Upload, Loader2, FileText, X } from 'lucide-react';

interface KnowledgeBaseUploadProps {
  userId: string;
  onUploadComplete?: () => void;
}

export const KnowledgeBaseUpload: React.FC<KnowledgeBaseUploadProps> = ({
  userId,
  onUploadComplete,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState('indian_law');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title) {
      toast({
        title: 'Title Required',
        description: 'Please enter a title for the knowledge base entry.',
        variant: 'destructive',
      });
      return;
    }

    if (!content && !file) {
      toast({
        title: 'Content Required',
        description: 'Please enter content or upload a file.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      let fileUrl = null;
      let fileType = null;

      // Upload file if provided
      if (file) {
        const filePath = `${userId}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('knowledge-base')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('knowledge-base')
          .getPublicUrl(filePath);

        fileUrl = urlData.publicUrl;
        fileType = file.type;
      }

      // Save to database
      const { error: dbError } = await supabase
        .from('knowledge_base')
        .insert({
          user_id: userId,
          title,
          content,
          file_url: fileUrl,
          file_type: fileType,
          category,
        });

      if (dbError) throw dbError;

      toast({
        title: 'Knowledge Base Updated',
        description: 'Your document has been added to the knowledge base.',
      });

      // Reset form
      setTitle('');
      setContent('');
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onUploadComplete?.();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to add to knowledge base.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border-2 border-foreground rounded-lg bg-card">
      <h3 className="font-bangers text-xl flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-primary" />
        Upload to Knowledge Base
      </h3>

      <p className="text-sm text-muted-foreground">
        Add Indian Acts, Laws, Rules, or legal documents for better AI processing.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="kb-title">Title *</Label>
          <Input
            id="kb-title"
            placeholder="e.g., Indian Penal Code Section 420"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label>Category</Label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full h-10 px-3 rounded-md border-2 border-foreground bg-background"
          >
            <option value="indian_law">Indian Law</option>
            <option value="ipc">Indian Penal Code</option>
            <option value="crpc">Code of Criminal Procedure</option>
            <option value="evidence_act">Indian Evidence Act</option>
            <option value="constitution">Constitution of India</option>
            <option value="case_law">Case Law / Precedents</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <Label htmlFor="kb-content">Content</Label>
          <Textarea
            id="kb-content"
            placeholder="Paste the legal text, section, or notes here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
          />
        </div>

        {/* File upload */}
        <div className="space-y-2">
          <Label>Or Upload Document</Label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-muted-foreground/50 rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
          >
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <FileText className="w-5 h-5" />
                <span className="text-sm">{file.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Click to upload PDF or document
                </p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt"
            />
          </div>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          variant="comic"
          className="w-full"
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <BookOpen className="w-4 h-4 mr-2" />
              Add to Knowledge Base
            </>
          )}
        </Button>
      </form>
    </div>
  );
};
