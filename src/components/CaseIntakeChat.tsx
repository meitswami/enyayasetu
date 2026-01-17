import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CourtPartyRole } from '@/types/court';
import { 
  Send, Mic, MicOff, Upload, FileText, 
  Loader2, Phone, ArrowLeft, Scale, Info, Plus, Languages, Save
} from 'lucide-react';
import logo from '@/assets/logo.png';
import { IdentityVerification } from './IdentityVerification';
import { useElevenLabsSTT, STTLanguage } from '@/hooks/useElevenLabsSTT';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCaseIntakeAutoSave } from '@/hooks/useCaseIntakeAutoSave';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type: 'text' | 'voice' | 'file_upload' | 'ocr_result' | 'duplicate_found';
  fileUrl?: string;
  fileName?: string;
  actions?: { label: string; action: string }[];
}

interface CaseContext {
  documentType?: string;
  caseNumber?: string;
  parties?: { complainant?: string; accused?: string };
  sections?: string[];
  summary?: string;
  uploadedBy?: 'self' | 'other';
  relation?: string;
  involvedPersonStatus?: string;
  currentStatus?: string;
  lastHearingDate?: string;
  callbackNumber?: string;
}

interface MatchedCase {
  id: string;
  case_number: string;
  title: string;
  plaintiff: string;
  defendant: string;
  category: string;
  status: string;
  uploaded_by_relation?: string;
  created_at: string;
}

type IntakeStep = 
  | 'initial' 
  | 'document_uploaded' 
  | 'duplicate_found'
  | 'identity_verification'
  | 'relation_check' 
  | 'details' 
  | 'status_check' 
  | 'processing' 
  | 'complete';

interface CaseIntakeChatProps {
  userId: string;
  userRole: CourtPartyRole;
  onComplete: (caseId: string) => void;
  onBack: () => void;
}

const languageLabels: Record<STTLanguage, { label: string; flag: string }> = {
  en: { label: 'English', flag: '🇬🇧' },
  hi: { label: 'हिंदी', flag: '🇮🇳' },
  hinglish: { label: 'Hinglish', flag: '🇮🇳🇬🇧' },
};

export const CaseIntakeChat: React.FC<CaseIntakeChatProps> = ({
  userId,
  userRole,
  onComplete,
  onBack,
}) => {
  const { language, setLanguage } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [step, setStep] = useState<IntakeStep>('initial');
  const [caseContext, setCaseContext] = useState<CaseContext>({});
  const [caseId, setCaseId] = useState<string | null>(null);
  const [matchedCases, setMatchedCases] = useState<MatchedCase[]>([]);
  const [selectedExistingCase, setSelectedExistingCase] = useState<MatchedCase | null>(null);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationIntent, setVerificationIntent] = useState<'know_more' | 'add_info'>('add_info');
  const [verificationRelation, setVerificationRelation] = useState<string>('Unknown');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  // Auto-save hook for real-time message persistence
  const {
    draftCaseId,
    draftCaseNumber,
    isInitialized,
    initializeDraftCase,
    saveMessage,
    updateCaseContext,
    finalizeCase,
    linkToExistingCase,
  } = useCaseIntakeAutoSave({ userId, userRole });

  // ElevenLabs STT for real-time transcription with multilingual support
  const elevenLabsSTT = useElevenLabsSTT({
    onTranscript: (text, isFinal) => {
      if (isFinal && text.trim()) {
        // Stop listening and send the transcribed text
        elevenLabsSTT.stopListening();
        addMessageAndSave({
          role: 'user',
          content: `🎤 "${text}"`,
          type: 'voice',
        });
        getAIResponse(text, step);
      }
    },
    language: language as STTLanguage,
  });

  // Sync STT language with app language
  useEffect(() => {
    if (elevenLabsSTT.currentLanguage !== language) {
      elevenLabsSTT.changeLanguage(language as STTLanguage);
    }
  }, [language]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Initialize draft case on component mount
  useEffect(() => {
    const init = async () => {
      const newCaseId = await initializeDraftCase();
      if (newCaseId) {
        setCaseId(newCaseId);
        toast({
          title: '💾 Auto-save Enabled',
          description: 'Your conversation will be saved automatically.',
        });
      }
    };
    init();
  }, []);

  // Initial greeting - save it too
  useEffect(() => {
    const initialMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `🙏 Namaste! Welcome to eNyayaSetu - Digital Bridge of Justice.

I am your AI legal assistant. I will help you file your case in our virtual courtroom.

To begin, please upload your FIR (First Information Report), SIR (Station Investigation Report), or FR (Final Report) document. You can upload a PDF or image.

📎 Click the upload button below to select your document.`,
      type: 'text',
    };
    setMessages([initialMessage]);
    
    // Save initial message once draft case is ready
    if (draftCaseId) {
      saveMessage(initialMessage, draftCaseId);
    }
  }, [draftCaseId]);

  // Helper to add message and save immediately with toast notification
  const addMessageAndSave = useCallback(async (message: Omit<Message, 'id'>) => {
    const newMessage = { ...message, id: Date.now().toString() + Math.random().toString(36).substr(2, 5) };
    setMessages(prev => [...prev, newMessage]);
    
    // Save to database immediately and show toast
    if (draftCaseId) {
      const saved = await saveMessage(newMessage, draftCaseId);
      if (saved) {
        // Show brief "Saved" toast
        toast({
          title: '✓ Saved',
          description: 'Message saved',
          duration: 1500,
        });
      }
    }
    
    return newMessage;
  }, [draftCaseId, saveMessage, toast]);

  // Legacy addMessage for compatibility (will be replaced)
  const addMessage = (message: Omit<Message, 'id'>) => {
    return addMessageAndSave(message);
  };

  const getAIResponse = async (userMessage: string, currentStep: IntakeStep) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('case-intake-chat', {
        body: {
          messages: [...messages, { role: 'user', content: userMessage }].map(m => ({
            role: m.role,
            content: m.content
          })),
          caseContext,
          step: currentStep,
        },
      });

      if (error) throw error;

      addMessage({
        role: 'assistant',
        content: data.reply,
        type: 'text',
      });

      // Determine next step based on current step
      updateStepFromResponse(currentStep, userMessage);
      
    } catch (error: any) {
      console.error('AI response error:', error);
      toast({
        title: 'Error',
        description: 'Failed to get AI response. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkForDuplicateCases = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-duplicate-case', {
        body: {
          caseNumber: caseContext.caseNumber,
          parties: caseContext.parties,
          summary: caseContext.summary,
          userId,
        },
      });

      if (error) throw error;

      if (data.isDuplicate && data.matchedCases.length > 0) {
        setMatchedCases(data.matchedCases);
        setStep('duplicate_found');
        
        const matchedCase = data.matchedCases[0];
        
        addMessage({
          role: 'assistant',
          content: `⚠️ **This Case Already Exists in eNyayaSetu!**

We found a matching case in our system:

**Case Number:** ${matchedCase.case_number}
**Plaintiff:** ${matchedCase.plaintiff}
**Defendant:** ${matchedCase.defendant}
**Status:** ${matchedCase.status}
**Originally Filed By:** ${matchedCase.uploaded_by_relation || 'Self'}

---

**Who are you?** Please tell us your relation to this case so we can verify your identity.

After verification, you can:
• 📖 **Know More** - View complete case details and updates
• ➕ **Add More Info** - Submit additional evidence or information`,
          type: 'duplicate_found',
          actions: [
            { label: '👤 I am the Victim', action: 'relation_victim' },
            { label: '⚖️ I am the Accused', action: 'relation_accused' },
            { label: '👨‍👩‍👧 Family Member', action: 'relation_family' },
            { label: '📋 Legal Representative', action: 'relation_legal' },
            { label: '➕ File as New Case', action: 'new_case' },
          ],
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Duplicate check error:', error);
      return false;
    }
  };

  const handleDuplicateAction = async (action: string) => {
    // Handle relation selection
    if (action.startsWith('relation_')) {
      const relationType = action.replace('relation_', '');
      const relationLabels: Record<string, string> = {
        victim: 'Victim',
        accused: 'Accused',
        family: 'Family Member',
        legal: 'Legal Representative',
      };
      
      setVerificationRelation(relationLabels[relationType] || 'Unknown');
      setCaseContext(prev => ({ ...prev, relation: relationLabels[relationType] }));
      setSelectedExistingCase(matchedCases[0]);
      setCaseId(matchedCases[0].id);
      
      addMessage({
        role: 'assistant',
        content: `You've identified yourself as: **${relationLabels[relationType]}**

The original case was filed by: **${matchedCases[0].uploaded_by_relation || 'Self'}**

To proceed, we need to verify your identity. This ensures that only authorized persons can access or modify case information.

**What would you like to do?**`,
        type: 'text',
        actions: [
          { label: '📖 Know More About Case', action: 'know_more' },
          { label: '➕ Add More Info to Case', action: 'add_info' },
        ],
      });
      return;
    }
    
    if (action === 'know_more' && matchedCases.length > 0) {
      setSelectedExistingCase(matchedCases[0]);
      setCaseId(matchedCases[0].id);
      setVerificationIntent('know_more');
      
      addMessage({
        role: 'assistant',
        content: `To **view detailed case information**, we need to verify your identity first.

Please complete the verification process:
1. 📋 Provide your personal details
2. 📄 Upload your ID (Aadhar Card, Driving License, or Passport)
3. 📸 Take a live selfie photo with face recognition

Once verified by our Super Admin, you'll get full access to case details.`,
        type: 'text',
      });
      
      setStep('identity_verification');
      setShowVerification(true);
    } else if (action === 'add_info' && matchedCases.length > 0) {
      setSelectedExistingCase(matchedCases[0]);
      setCaseId(matchedCases[0].id);
      setVerificationIntent('add_info');
      
      addMessage({
        role: 'assistant',
        content: `To **add information to case ${matchedCases[0].case_number}**, we need to verify your identity.

Please complete the verification process:
1. 📋 Provide your personal details
2. 📄 Upload your ID (Aadhar Card, Driving License, or Passport)
3. 📸 Take a live selfie photo with face recognition

Once our Super Admin approves your verification, you can add evidence, documents, or other information to this case.`,
        type: 'text',
      });
      
      setStep('identity_verification');
      setShowVerification(true);
    } else if (action === 'view_details' && matchedCases.length > 0) {
      addMessage({
        role: 'assistant',
        content: `📋 **Case Details: ${matchedCases[0].case_number}**

**Title:** ${matchedCases[0].title}
**Plaintiff:** ${matchedCases[0].plaintiff}
**Defendant:** ${matchedCases[0].defendant}
**Category:** ${matchedCases[0].category}
**Status:** ${matchedCases[0].status}
**Filed On:** ${new Date(matchedCases[0].created_at).toLocaleDateString()}
**Filed By:** ${matchedCases[0].uploaded_by_relation || 'Self'}

Would you like to add more information to this case or file a new one?`,
        type: 'text',
        actions: [
          { label: '📝 Add More Info', action: 'add_info' },
          { label: '➕ File as New Case', action: 'new_case' },
        ],
      });
    } else if (action === 'new_case') {
      setMatchedCases([]);
      setStep('document_uploaded');
      addMessage({
        role: 'assistant',
        content: `Alright, we'll file this as a **new case**.

Now, please tell me - are you the person directly involved in this case, or are you filing on behalf of someone else?`,
        type: 'text',
      });
    }
  };

  const updateStepFromResponse = (currentStep: IntakeStep, userMessage: string) => {
    const lowerMessage = userMessage.toLowerCase();
    
    switch (currentStep) {
      case 'document_uploaded':
        if (lowerMessage.includes('self') || lowerMessage.includes('myself') || lowerMessage.includes('i am')) {
          const newContext = { ...caseContext, uploadedBy: 'self' as const };
          setCaseContext(newContext);
          updateCaseContext(newContext);
          setStep('details');
        } else if (lowerMessage.includes('other') || lowerMessage.includes('someone') || lowerMessage.includes('family')) {
          const newContext = { ...caseContext, uploadedBy: 'other' as const };
          setCaseContext(newContext);
          updateCaseContext(newContext);
          setStep('relation_check');
        }
        break;
      case 'relation_check':
        const relationContext = { ...caseContext, relation: userMessage };
        setCaseContext(relationContext);
        updateCaseContext(relationContext);
        setStep('details');
        break;
      case 'details':
        setStep('status_check');
        break;
      case 'status_check':
        setStep('processing');
        break;
      case 'processing':
        if (userMessage.match(/\d{10}/)) {
          const finalContext = { ...caseContext, callbackNumber: userMessage };
          setCaseContext(finalContext);
          setStep('complete');
          finalizeCaseRecord(finalContext);
        }
        break;
    }
  };

  // Finalize the draft case into an active case
  const finalizeCaseRecord = async (context: CaseContext) => {
    try {
      const result = await finalizeCase(context);
      
      if (!result) throw new Error('Failed to finalize case');

      addMessage({
        role: 'assistant',
        content: `✅ Your case has been successfully registered!

📋 Case Number: ${result.caseNumber}

⏱️ Estimated Processing Time: ~15 minutes

📞 We will call you back on ${context.callbackNumber} once the AI has analyzed your case and prepared the courtroom.

💾 All your conversation (${messages.length}+ messages) has been saved!

Thank you for using eNyayaSetu. Justice will be served! ⚖️`,
        type: 'text',
      });

      setTimeout(() => {
        onComplete(result.id);
      }, 5000);

    } catch (error: any) {
      console.error('Case finalization error:', error);
      toast({
        title: 'Error',
        description: 'Failed to finalize case. Your data is still saved as draft.',
        variant: 'destructive',
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf';

      if (isImage || isPdf) {
        validFiles.push(file);
      }
    }

    if (validFiles.length === 0) {
      toast({
        title: 'Invalid Files',
        description: 'Please upload PDF or image files only.',
        variant: 'destructive',
      });
      return;
    }

    // Show files being uploaded
    const fileNames = validFiles.map(f => f.name).join(', ');
    addMessage({
      role: 'user',
      content: `📎 Uploaded ${validFiles.length} file(s): ${fileNames}`,
      type: 'file_upload',
      fileName: fileNames,
    });

    setIsLoading(true);

    try {
      addMessage({
        role: 'assistant',
        content: `📄 Processing ${validFiles.length} document(s) with OCR... Please wait.`,
        type: 'text',
      });

      const allOcrResults: Array<{
        fileName: string;
        documentType?: string;
        caseNumber?: string;
        parties?: { complainant?: string; accused?: string };
        sections?: string[];
        summary?: string;
      }> = [];

      // Process each file
      for (const file of validFiles) {
        // Convert file to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Call OCR function
        const { data: ocrData, error: ocrError } = await supabase.functions.invoke('ocr-document', {
          body: {
            imageBase64: base64,
            mimeType: file.type,
            fileName: file.name,
          },
        });

        if (ocrError) {
          console.error(`OCR error for ${file.name}:`, ocrError);
          continue;
        }

        allOcrResults.push({
          fileName: file.name,
          documentType: ocrData.document_type,
          caseNumber: ocrData.case_number,
          parties: ocrData.parties,
          sections: ocrData.sections_invoked,
          summary: ocrData.summary,
        });
      }

      if (allOcrResults.length === 0) {
        addMessage({
          role: 'assistant',
          content: 'I had trouble reading your documents. Could you please try uploading again, or describe your case in your own words?',
          type: 'text',
        });
        return;
      }

      // Combine results from all files
      const combinedParties: { complainant?: string; accused?: string } = {};
      const combinedSections: string[] = [];
      const combinedSummaries: string[] = [];
      let mainCaseNumber: string | undefined;
      let mainDocType: string | undefined;

      for (const result of allOcrResults) {
        if (result.caseNumber && !mainCaseNumber) mainCaseNumber = result.caseNumber;
        if (result.documentType && !mainDocType) mainDocType = result.documentType;
        if (result.parties?.complainant && !combinedParties.complainant) {
          combinedParties.complainant = result.parties.complainant;
        }
        if (result.parties?.accused && !combinedParties.accused) {
          combinedParties.accused = result.parties.accused;
        }
        if (result.sections) {
          combinedSections.push(...result.sections.filter(s => !combinedSections.includes(s)));
        }
        if (result.summary) {
          combinedSummaries.push(`**${result.fileName}:** ${result.summary}`);
        }
      }

      // Update case context with combined OCR results and save to DB
      const newContext = {
        ...caseContext,
        documentType: mainDocType,
        caseNumber: mainCaseNumber,
        parties: combinedParties,
        sections: combinedSections,
        summary: combinedSummaries.join('\n\n'),
      };
      setCaseContext(newContext);
      updateCaseContext(newContext);

      // Show combined OCR results
      const ocrMessage = `📋 **Document Analysis Complete** (${allOcrResults.length} file(s) processed)

${allOcrResults.map((result, idx) => `**File ${idx + 1}: ${result.fileName}**
• Type: ${result.documentType || 'Legal Document'}
${result.caseNumber ? `• Case Number: ${result.caseNumber}` : ''}
${result.parties?.complainant ? `• Complainant: ${result.parties.complainant}` : ''}
${result.parties?.accused ? `• Accused: ${result.parties.accused}` : ''}
${result.sections?.length ? `• Sections: ${result.sections.join(', ')}` : ''}
`).join('\n')}

🔍 Checking for existing cases in our system...`;

      addMessage({
        role: 'assistant',
        content: ocrMessage,
        type: 'ocr_result',
      });

      // Check for duplicates after a short delay for UX
      setTimeout(async () => {
        const hasDuplicate = await checkForDuplicateCases();
        
        if (!hasDuplicate) {
          setStep('document_uploaded');
          addMessage({
            role: 'assistant',
            content: `✅ No existing case found. We'll proceed with filing a new case.

Now, please tell me - are you the person directly involved in this case, or are you filing on behalf of someone else?`,
            type: 'text',
          });
        }
      }, 1000);

    } catch (error: any) {
      console.error('File upload error:', error);
      addMessage({
        role: 'assistant',
        content: 'I had trouble reading your document. Could you please try uploading again, or describe your case in your own words?',
        type: 'text',
      });
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = inputText.trim();
    setInputText('');

    addMessage({
      role: 'user',
      content: userMessage,
      type: 'text',
    });

    await getAIResponse(userMessage, step);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        
        addMessage({
          role: 'user',
          content: '🎤 [Voice message recorded]',
          type: 'voice',
        });

        toast({
          title: 'Voice Recorded',
          description: 'Voice input captured. Processing...',
        });

        await getAIResponse('I have provided voice input with additional details about my case.', step);
      };

      mediaRecorder.start();
      setIsRecording(true);

      toast({
        title: 'Recording',
        description: 'Speak now... Click stop when done.',
      });
    } catch (error) {
      console.error('Recording error:', error);
      toast({
        title: 'Microphone Error',
        description: 'Could not access microphone. Please check permissions.',
        variant: 'destructive',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleVerificationComplete = () => {
    setShowVerification(false);
    addMessage({
      role: 'assistant',
      content: `✅ **Identity Verification Submitted!**

Your verification documents have been uploaded and will be reviewed by our backend team.

Once verified, you'll be able to add more information to case **${selectedExistingCase?.case_number}**.

📞 We will contact you shortly. Thank you for your patience!`,
      type: 'text',
    });
    setStep('complete');
  };

  // Show verification flow if active
  if (showVerification && caseId) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <div className="flex items-center gap-4 p-4 border-b-2 border-foreground bg-card">
          <Button variant="ghost" size="sm" onClick={() => setShowVerification(false)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <img src={logo} alt="eNyayaSetu" className="w-10 h-10" />
          <div>
            <h1 className="font-bangers text-xl">
              <span className="text-primary">eNyaya</span>
              <span className="text-secondary">Setu</span>
            </h1>
            <p className="text-xs text-muted-foreground">Identity Verification</p>
          </div>
        </div>
        <IdentityVerification
          caseId={caseId}
          userId={userId}
          intent={verificationIntent}
          relationToCase={verificationRelation}
          onComplete={handleVerificationComplete}
          onCancel={() => setShowVerification(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b-2 border-foreground bg-card">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <img src={logo} alt="eNyayaSetu" className="w-10 h-10" />
        <div>
          <h1 className="font-bangers text-xl">
            <span className="text-primary">eNyaya</span>
            <span className="text-secondary">Setu</span>
          </h1>
          <p className="text-xs text-muted-foreground">AI Case Intake Assistant</p>
        </div>
        
        {/* Auto-save indicator */}
        {isInitialized && (
          <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
            <Save className="w-3 h-3 mr-1" />
            Auto-saving
          </Badge>
        )}
        
        {/* Language Selector for STT */}
        <div className="ml-auto flex items-center gap-2">
          <Select 
            value={language} 
            onValueChange={(val) => setLanguage(val as STTLanguage)}
          >
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <Languages className="w-3 h-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(languageLabels).map(([key, { label, flag }]) => (
                <SelectItem key={key} value={key}>
                  <span className="flex items-center gap-2 text-xs">
                    <span>{flag}</span>
                    <span>{label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Scale className="w-6 h-6 text-primary" />
        </div>
      </div>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4 max-w-2xl mx-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-4 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-card border-2 border-foreground rounded-bl-sm shadow-[2px_2px_0_hsl(var(--foreground))]'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                
                {/* Action buttons for duplicate case flow */}
                {message.actions && message.actions.length > 0 && (
                  <div className="flex flex-col gap-2 mt-4">
                    {message.actions.map((action, idx) => (
                      <Button
                        key={idx}
                        variant={action.action === 'add_info' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleDuplicateAction(action.action)}
                        className="justify-start"
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}
                
                {message.type === 'voice' && (
                  <span className="text-xs opacity-70 mt-1 block">🎤 Voice Message</span>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-card border-2 border-foreground rounded-2xl rounded-bl-sm p-4 shadow-[2px_2px_0_hsl(var(--foreground))]">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t-2 border-foreground p-4 bg-card">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            {/* File Upload */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || step === 'complete' || step === 'duplicate_found'}
            >
              <Upload className="w-4 h-4" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Voice Recording with ElevenLabs STT */}
            <Button
              variant={elevenLabsSTT.isListening ? 'destructive' : 'outline'}
              size="icon"
              onClick={() => {
                if (elevenLabsSTT.isListening) {
                  elevenLabsSTT.stopListening();
                } else {
                  elevenLabsSTT.startListening();
                }
              }}
              disabled={isLoading || step === 'complete' || step === 'duplicate_found' || elevenLabsSTT.isConnecting}
            >
              {elevenLabsSTT.isConnecting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : elevenLabsSTT.isListening ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </Button>

            {/* Text Input */}
            <Input
              placeholder={
                step === 'processing' 
                  ? 'Enter your callback number...' 
                  : step === 'duplicate_found'
                  ? 'Select an option above...'
                  : 'Type your message...'
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading || step === 'complete' || step === 'duplicate_found'}
              className="flex-1"
            />

            {/* Send Button */}
            <Button
              variant="comic"
              size="icon"
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isLoading || step === 'complete' || step === 'duplicate_found'}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {/* Quick Actions */}
          {step === 'processing' && (
            <div className="flex items-center gap-2 mt-3 justify-center">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Enter your 10-digit phone number for callback
              </span>
            </div>
          )}

          {/* Real-time transcript display */}
          {elevenLabsSTT.isListening && (
            <div className="mt-3 p-3 bg-muted/50 rounded-lg border border-border">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm text-muted-foreground">
                  {elevenLabsSTT.partialTranscript || 'Listening...'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
