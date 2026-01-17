import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, Play, Pause, Gavel, Users, MessageSquare, 
  FileText, Calendar, Hand, UserPlus, Copy, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCourtSession } from './hooks/useCourtSession';
import { useAIJudge } from './hooks/useAIJudge';
import { useCourtroomAudio } from './hooks/useCourtroomAudio';
import { useDramaticStingers } from './hooks/useDramaticStingers';
import { useParticipantReactions } from './hooks/useParticipantReactions';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { ParticipantsList } from './ParticipantsList';
import { HandRaisePanel } from './HandRaisePanel';
import { EvidencePanel } from './EvidencePanel';
import { DateExtensionPanel } from './DateExtensionPanel';
import { TranscriptPanel } from './TranscriptPanel';
import { ComicCourtroomScene } from './ComicCourtroomScene';
import { JoinCourtModal } from './JoinCourtModal';
import { WitnessPanel } from './WitnessPanel';
import { VideoRecorder } from './VideoRecorder';
import { VoiceInput } from './VoiceInput';
import { AudioControls } from './AudioControls';
import { ReactionButtons } from './ReactionButtons';
import SoundEffectPanel from './SoundEffectPanel';
import ObjectionOverlay from './ObjectionOverlay';
import VerdictOverlay from './VerdictOverlay';
import JudgeRulingOverlay from './JudgeRulingOverlay';
import { TTSSettings, useTTSSettings } from '@/components/TTSSettings';
import { useBrowserTTS, type Language as TTSLanguage, type SpeakerType } from '@/hooks/useBrowserTTS';
import { ParticipantRole, CourtTranscript } from './types';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { HearingTimer } from '@/components/HearingTimer';
import { useHearingLogger } from '@/hooks/useHearingLogger';

interface LiveCourtroomProps {
  sessionId: string;
}

export const LiveCourtroom: React.FC<LiveCourtroomProps> = ({ sessionId }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useLanguage();
  
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSpeakingId, setCurrentSpeakingId] = useState<string | undefined>();
  const [chatMessage, setChatMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [processingAI, setProcessingAI] = useState(false);
  const [ambianceVolume, setAmbianceVolume] = useState(0.15);
  const [activeWitness, setActiveWitness] = useState<{ name: string; isActive: boolean } | null>(null);
  const [showObjection, setShowObjection] = useState(false);
  const [objectionSpeaker, setObjectionSpeaker] = useState<string | undefined>();
  const [showVerdict, setShowVerdict] = useState(false);
  const [verdictType, setVerdictType] = useState<'guilty' | 'not_guilty' | 'dismissed' | null>(null);
  const [showRuling, setShowRuling] = useState(false);
  const [rulingType, setRulingType] = useState<'sustained' | 'overruled' | null>(null);
  const [hearingLogId, setHearingLogId] = useState<string | null>(null);

  const court = useCourtSession(sessionId, user?.id);
  const logger = useHearingLogger(hearingLogId, sessionId);
  
  // TTS settings
  const ttsSettings = useTTSSettings();
  const browserTTS = useBrowserTTS();
  
  const aiJudge = useAIJudge({
    caseDetails: court.caseDetails,
    addAITranscript: court.addAITranscript,
  });

  // Audio hooks
  const courtroomAudio = useCourtroomAudio({
    enableAmbiance: true,
    ambianceVolume,
    effectsVolume: 0.5,
  });

  // Dramatic stingers
  const stingers = useDramaticStingers({ volume: 0.6, enabled: !isMuted });

  // Reactions hook
  const { reactions, sendReaction, getReactionFor } = useParticipantReactions({
    sessionId,
    participantId: court.currentParticipant?.id,
    participantName: court.currentParticipant?.participant_name,
    role: court.currentParticipant?.role,
  });

  const isJudge = court.currentParticipant?.role === 'judge' || 
                  court.currentParticipant?.is_ai === true;

  // Check if user needs to join
  useEffect(() => {
    if (!court.loading && !court.currentParticipant && user) {
      setShowJoinModal(true);
    }
  }, [court.loading, court.currentParticipant, user]);

  // Handle gavel sound when judge speaks
  const handleJudgeSpeaks = useCallback(() => {
    courtroomAudio.playGavel();
  }, [courtroomAudio]);

  // Handle objection stinger with overlay
  const handleObjection = useCallback((speaker?: string) => {
    stingers.playObjection();
    setObjectionSpeaker(speaker);
    setShowObjection(true);
  }, [stingers]);

  // Manual sound effect triggers
  const handleManualObjection = useCallback(() => {
    handleObjection(court.currentParticipant?.participant_name);
  }, [handleObjection, court.currentParticipant]);

  // Handle evidence stinger
  const handleEvidence = useCallback(() => {
    stingers.playEvidence();
  }, [stingers]);

  // Handle witness stinger
  const handleWitness = useCallback(() => {
    stingers.playWitness();
  }, [stingers]);

  // Handle sustained ruling
  const handleSustained = useCallback(() => {
    courtroomAudio.playGavel();
    setRulingType('sustained');
    setShowRuling(true);
  }, [courtroomAudio]);

  // Handle overruled ruling
  const handleOverruled = useCallback(() => {
    courtroomAudio.playGavel();
    setRulingType('overruled');
    setShowRuling(true);
  }, [courtroomAudio]);

  // Handle verdict announcement
  const handleVerdictOverlay = useCallback((type: 'guilty' | 'not_guilty' | 'dismissed') => {
    stingers.playVerdict();
    setVerdictType(type);
    setShowVerdict(true);
  }, [stingers]);

  // Keyboard shortcuts for sound effects
  useKeyboardShortcuts({
    enabled: court.session?.status === 'in_progress' && !processingAI,
    onGavel: courtroomAudio.playGavel,
    onObjection: handleManualObjection,
    onVerdict: stingers.playVerdict,
    onEvidence: handleEvidence,
    onWitness: handleWitness,
    onTension: stingers.playTension,
    onSustained: handleSustained,
    onOverruled: handleOverruled,
  });

  // Listen for witness being called
  useEffect(() => {
    const latestTranscript = court.transcripts[court.transcripts.length - 1];
    if (latestTranscript?.message) {
      const msg = latestTranscript.message.toLowerCase();
      // Detect when witness is called
      if (msg.includes('call') && msg.includes('witness')) {
        // Extract witness name (simple extraction)
        const witnessMatch = latestTranscript.message.match(/call\s+(\w+\s?\w*)\s+(?:as\s+)?(?:a\s+)?witness/i);
        const witnessName = witnessMatch?.[1] || 'Witness';
        setActiveWitness({ name: witnessName, isActive: true });
      } else if (msg.includes('witness is dismissed') || msg.includes('step down')) {
        setActiveWitness(prev => prev ? { ...prev, isActive: false } : null);
      }
    }
  }, [court.transcripts]);

  // Speak text using selected TTS engine
  const speakText = useCallback(async (text: string, speakerRole: string) => {
    if (isMuted) return;
    
    setIsSpeaking(true);
    
    // Use browser TTS if selected or as fallback
    if (ttsSettings.engine === 'browser') {
      try {
        const mappedRole = speakerRole as SpeakerType;
        const mappedLang = language as TTSLanguage;
        await browserTTS.speak(text, mappedRole, mappedLang);
      } catch (err) {
        console.warn('Browser TTS error:', err);
      } finally {
        setIsSpeaking(false);
      }
      return;
    }
    
    // Try ElevenLabs if selected
    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { 
          text, 
          speaker: speakerRole,
          language,
          speechRate: ttsSettings.speechRate
        },
      });

      if (error || data?.error) {
        console.warn('ElevenLabs TTS failed, falling back to browser:', error || data?.error);
        const mappedRole = speakerRole as SpeakerType;
        const mappedLang = language as TTSLanguage;
        await browserTTS.speak(text, mappedRole, mappedLang);
        return;
      }

      if (data?.audioContent) {
        const audio = new Audio(`data:audio/mpeg;base64,${data.audioContent}`);
        audio.onended = () => setIsSpeaking(false);
        audio.onerror = async () => {
          console.warn('Audio playback failed, using browser fallback');
          const mappedRole = speakerRole as SpeakerType;
          const mappedLang = language as TTSLanguage;
          await browserTTS.speak(text, mappedRole, mappedLang);
        };
        await audio.play();
      } else {
        setIsSpeaking(false);
      }
    } catch (err) {
      console.warn('TTS error, using browser fallback:', err);
      const mappedRole = speakerRole as SpeakerType;
      const mappedLang = language as TTSLanguage;
      await browserTTS.speak(text, mappedRole, mappedLang);
    }
  }, [isMuted, language, ttsSettings.engine, ttsSettings.speechRate, browserTTS]);

  // Auto-speak new transcripts
  useEffect(() => {
    if (court.transcripts.length > 0 && isPlaying) {
      const latest = court.transcripts[court.transcripts.length - 1];
      if (latest.speaker_role === 'judge' && !isMuted) {
        setCurrentSpeakingId(latest.id);
        speakText(latest.message, latest.speaker_role);
      }
    }
  }, [court.transcripts.length, isPlaying, isMuted]);

  // Handle joining session
  const handleJoin = async (name: string, role: ParticipantRole) => {
    await court.joinSession(name, role);
    setShowJoinModal(false);
    toast.success(`Joined as ${role}`);
  };

  // Start the court session
  const handleStartSession = async () => {
    if (court.session?.status !== 'in_progress') {
      await court.updateSessionStatus('in_progress');
    }
    
    // Start logging
    if (court.session && court.caseDetails && user) {
      const logId = await logger.startHearingLog({
        sessionId: sessionId,
        caseId: court.session.case_id,
        userId: user.id,
        paymentId: court.session.payment_id || undefined,
        paymentTransactionNumber: undefined, // Will be populated from payment
        invoiceId: court.session.invoice_id || undefined,
        lawyerType: court.session.lawyer_type as 'ai_lawyer' | 'actual_lawyer' | undefined,
        aiLawyerId: court.session.lawyer_type === 'ai_lawyer' ? 'ai_judge' : undefined,
        actualLawyerId: court.session.actual_lawyer_id || undefined,
        actualLawyerEmail: court.session.actual_lawyer_email || undefined,
        actualLawyerName: undefined, // Will be populated if available
        videoRecordingId: undefined, // Will be set when recording starts
        videoRecordingUrl: court.session.video_recording_url || undefined,
      });
      if (logId) {
        setHearingLogId(logId);
        await logger.updateHearingLog({ status: 'in_progress' });
      }
    }
    
    // Log participant joining
    if (court.currentParticipant) {
      await logger.logParticipantActivity({
        participantId: court.currentParticipant.id,
        userId: court.currentParticipant.user_id || undefined,
        participantName: court.currentParticipant.participant_name,
        participantRole: court.currentParticipant.role,
        isAi: court.currentParticipant.is_ai || false,
        isRealPerson: !court.currentParticipant.is_ai,
        activityType: 'joined',
        activityDescription: `Joined as ${court.currentParticipant.role}`,
      });
    }
    
    // Start ambiance when session starts
    courtroomAudio.startAmbiance();
    
    setProcessingAI(true);
    await aiJudge.startSession();
    setProcessingAI(false);
    setIsPlaying(true);
  };

  // Handle chat message submit
  const handleChatSubmit = async () => {
    if (!chatMessage.trim() || !court.currentParticipant) return;

    await court.addTranscript(chatMessage.trim(), 'speech');
    
    // If AI should respond
    if (court.currentParticipant.role !== 'judge') {
      setProcessingAI(true);
      await aiJudge.respondToSpeech(court.currentParticipant, chatMessage.trim());
      setProcessingAI(false);
    }
    
    setChatMessage('');
  };

  // Handle hand raise
  const handleRaiseHand = async (reason: string) => {
    await court.raiseHand(reason);
  };

  // Handle responding to hand raise (AI Judge auto-evaluates)
  const handleRespondToHand = async (raiseId: string, allowed: boolean) => {
    const raise = court.handRaises.find(h => h.id === raiseId);
    if (!raise) return;

    setProcessingAI(true);
    const decision = await aiJudge.evaluateHandRaise(raise);
    if (decision) {
      await court.respondToHandRaise(raiseId, decision.allowed, decision.response);
    }
    setProcessingAI(false);
  };

  // Handle date extension request
  const handleRequestDate = async (reason: string, requestedDate?: string) => {
    await court.requestDateExtension(reason, requestedDate);
  };

  // Handle date decision (AI Judge auto-evaluates)
  const handleDecideDate = async (requestId: string, approved: boolean, decision: string) => {
    const request = court.dateRequests.find(r => r.id === requestId);
    if (!request) return;

    setProcessingAI(true);
    const aiDecision = await aiJudge.evaluateDateRequest(request);
    if (aiDecision) {
      await court.decideDateRequest(
        requestId, 
        aiDecision.approved, 
        aiDecision.decision,
        aiDecision.nextDate
      );
      
      if (!aiDecision.approved) {
        // Continue the session
        toast.info('Request denied. Proceedings continue.');
      } else {
        // Adjourn if approved
        await court.updateSessionStatus('adjourned', aiDecision.decision);
      }
    }
    setProcessingAI(false);
  };

  // Handle evidence upload
  const handleUploadEvidence = async (file: File) => {
    setIsUploading(true);
    const uploadStartTime = Date.now();
    const documentId = `doc_${Date.now()}_${file.name}`;
    
    logger.startDocumentProcessing(documentId);
    
    const evidence = await court.uploadEvidence(file);
    
    if (evidence && court.currentParticipant) {
      const processingDuration = Math.floor((Date.now() - uploadStartTime) / 1000);
      
      // Log evidence submission
      await logger.logEvidence({
        evidenceSubmissionId: evidence.id,
        submittedByParticipantId: court.currentParticipant.id,
        submittedByUserId: court.currentParticipant.user_id || undefined,
        submittedByName: court.currentParticipant.participant_name,
        submittedByRole: court.currentParticipant.role,
        submittedBySide: court.currentParticipant.role === 'prosecutor' ? 'plaintiff' : 
                        court.currentParticipant.role === 'defence_lawyer' ? 'defendant' : 'other',
        evidenceType: file.type.includes('image') ? 'image' :
                      file.type.includes('video') ? 'video' :
                      file.type.includes('audio') ? 'audio' :
                      file.type.includes('pdf') ? 'document' : 'other',
        fileName: file.name,
        fileUrl: evidence.file_url,
        fileType: file.type,
        fileSizeBytes: file.size,
        ocrText: evidence.ocr_text || undefined,
        processingDurationSeconds: processingDuration,
        judgeDecision: evidence.accepted_by_judge === true ? 'accepted' :
                      evidence.accepted_by_judge === false ? 'rejected' : 'pending',
      });
      
      // Log document processing steps
      if (evidence.ocr_text) {
        await logger.logDocumentProcessing(
          evidence.id,
          file.name,
          file.type,
          evidence.file_url,
          'ocr',
          documentId
        );
      }
      
      // AI Judge analyzes the evidence
      setProcessingAI(true);
      const analysisStartTime = Date.now();
      await aiJudge.analyzeEvidence(evidence);
      const analysisDuration = Math.floor((Date.now() - analysisStartTime) / 1000);
      
      await court.decideEvidence(evidence.id, true);
      
      // Log AI analysis processing
      await logger.logDocumentProcessing(
        evidence.id,
        file.name,
        file.type,
        evidence.file_url,
        'ai_analysis',
        documentId
      );
      
      setProcessingAI(false);
    }
    
    setIsUploading(false);
  };

  // Handle evidence decision
  const handleAcceptEvidence = async (evidenceId: string, accepted: boolean) => {
    await court.decideEvidence(evidenceId, accepted);
  };

  // End session with verdict
  const handleDeliverVerdict = async () => {
    setProcessingAI(true);
    // Show verdict overlay (for now default to not_guilty, AI will determine actual verdict)
    handleVerdictOverlay('not_guilty');
    await aiJudge.makeDecision();
    await court.updateSessionStatus('completed');
    
    // Update hearing log
    if (hearingLogId && court.session) {
      await logger.updateHearingLog({
        status: 'completed',
        hearingEndedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        completionReason: 'Verdict delivered',
      });
    }
    
    courtroomAudio.stopAmbiance();
    setProcessingAI(false);
    setIsPlaying(false);
  };

  // Adjourn session
  const handleAdjourn = async () => {
    setProcessingAI(true);
    await aiJudge.adjournSession();
    await court.updateSessionStatus('adjourned');
    
    // Update hearing log
    if (hearingLogId && court.session) {
      await logger.updateHearingLog({
        status: 'adjourned',
        hearingEndedAt: new Date().toISOString(),
        adjournedAt: new Date().toISOString(),
        adjournmentReason: court.session.adjournment_reason || 'Session adjourned',
      });
    }
    
    courtroomAudio.stopAmbiance();
    setProcessingAI(false);
    setIsPlaying(false);
  };

  // Copy court code
  const copyCourtCode = () => {
    if (court.session?.court_code) {
      navigator.clipboard.writeText(court.session.court_code);
      toast.success('Court code copied!');
    }
  };

  // Toggle mute (both TTS and effects)
  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    courtroomAudio.toggleMute();
  };

  // Handle ambiance toggle
  const handleToggleAmbiance = () => {
    if (courtroomAudio.isAmbiancePlaying) {
      courtroomAudio.stopAmbiance();
    } else {
      courtroomAudio.startAmbiance();
    }
  };

  // Handle volume change
  const handleVolumeChange = (volume: number) => {
    setAmbianceVolume(volume);
    courtroomAudio.setAmbianceVolume(volume);
  };

  const availableRoles: ParticipantRole[] = [
    'defence_lawyer', 'accused', 'victim', 'victim_family', 
    'accused_family', 'witness', 'audience'
  ];

  if (court.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b-4 border-foreground bg-card shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              
              <div>
                <div className="flex items-center gap-2">
                  <Gavel className="w-5 h-5 text-primary" />
                  <h1 className="font-bangers text-xl text-foreground">
                    {court.caseDetails?.title || 'Court Session'}
                  </h1>
                </div>
                <p className="text-xs text-muted-foreground">
                  {court.caseDetails?.case_number}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Hearing Timer */}
              <HearingTimer isActive={court.session?.status === 'in_progress'} />

              {/* Sound Effect Panel */}
              <SoundEffectPanel
                onPlayGavel={courtroomAudio.playGavel}
                onPlayObjection={handleManualObjection}
                onPlayVerdict={stingers.playVerdict}
                onPlayEvidence={stingers.playEvidence}
                onPlayWitness={stingers.playWitness}
                onPlayTension={stingers.playTension}
                onPlaySustained={handleSustained}
                onPlayOverruled={handleOverruled}
                disabled={processingAI}
              />

              {/* TTS Settings */}
              <TTSSettings
                currentEngine={ttsSettings.engine}
                onEngineChange={ttsSettings.setEngine}
                speechRate={ttsSettings.speechRate}
                onSpeechRateChange={ttsSettings.setSpeechRate}
              />

              {/* Audio Controls */}
              <AudioControls
                isAmbiancePlaying={courtroomAudio.isAmbiancePlaying}
                isMuted={isMuted}
                ambianceVolume={ambianceVolume}
                onToggleAmbiance={handleToggleAmbiance}
                onToggleMute={handleToggleMute}
                onVolumeChange={handleVolumeChange}
              />

              {/* Video Recorder */}
              <VideoRecorder 
                sessionId={sessionId}
                userId={user?.id}
                isSessionActive={court.session?.status === 'in_progress'}
              />

              {/* Court Code */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted border-2 border-foreground">
                <span className="text-xs text-muted-foreground">Code:</span>
                <span className="font-mono font-bold">{court.session?.court_code}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyCourtCode}>
                  <Copy className="w-3 h-3" />
                </Button>
              </div>

              {/* Status */}
              <Badge variant={court.session?.status === 'in_progress' ? 'default' : 'secondary'}>
                {court.session?.status?.replace('_', ' ')}
              </Badge>

              {/* Participants count */}
              <div className="flex items-center gap-1 text-sm">
                <Users className="w-4 h-4" />
                {court.participants.filter(p => p.is_active).length}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Comic Courtroom */}
          <div className="lg:col-span-2 space-y-4">
            {/* Case Info Banner */}
            <div className="p-4 rounded-xl border-4 border-foreground bg-gradient-to-r from-primary/20 via-card to-secondary/20 shadow-[4px_4px_0_hsl(var(--foreground))]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Plaintiff</p>
                  <p className="font-bold text-primary">{court.caseDetails?.plaintiff}</p>
                </div>
                <div className="font-bangers text-3xl text-muted-foreground">VS</div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Defendant</p>
                  <p className="font-bold text-destructive">{court.caseDetails?.defendant}</p>
                </div>
              </div>
            </div>

            {/* Comic Courtroom Scene */}
            <ComicCourtroomScene
              currentTranscript={court.transcripts.length > 0 ? court.transcripts[court.transcripts.length - 1] : null}
              isSpeaking={isSpeaking}
              characters={{
                judge: 'Hon. AI Judge',
                prosecutor: 'Public Prosecutor',
                defence: 'Defence Counsel',
                accused: court.caseDetails?.defendant?.split(' ')[0] || 'Accused',
              }}
              onTypingComplete={() => setCurrentSpeakingId(undefined)}
              onJudgeSpeaks={handleJudgeSpeaks}
              onObjection={handleObjection}
              onEvidence={handleEvidence}
              onWitness={handleWitness}
              reactions={reactions}
              getReactionFor={getReactionFor}
              activeWitness={activeWitness}
            />

            {/* Reaction Buttons */}
            {court.currentParticipant && court.session?.status === 'in_progress' && (
              <div className="p-3 rounded-xl border-4 border-foreground bg-card shadow-[4px_4px_0_hsl(var(--foreground))]">
                <p className="text-xs text-muted-foreground text-center mb-2">React to the proceedings:</p>
                <ReactionButtons 
                  onReaction={sendReaction}
                  disabled={processingAI}
                />
              </div>
            )}

            {/* Transcript History (collapsible) */}
            {court.transcripts.length > 1 && (
              <details className="p-4 rounded-xl border-4 border-foreground bg-card shadow-[4px_4px_0_hsl(var(--foreground))]">
                <summary className="font-bangers text-lg cursor-pointer flex items-center gap-2">
                  📜 Transcript History ({court.transcripts.length} entries)
                </summary>
                <div className="mt-4">
                  <TranscriptPanel 
                    transcripts={court.transcripts}
                    currentSpeakingId={currentSpeakingId}
                  />
                </div>
              </details>
            )}

            {/* Chat Input */}
            {court.currentParticipant && court.session?.status === 'in_progress' && (
              <div className="flex gap-2">
                <Input
                  placeholder="Type your statement to the court..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit()}
                  disabled={processingAI}
                  className="border-2 border-foreground"
                />
                <VoiceInput 
                  onTranscript={(text) => {
                    setChatMessage(text);
                  }}
                  disabled={processingAI}
                />
                <Button onClick={handleChatSubmit} disabled={!chatMessage.trim() || processingAI} variant="comic">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Speak
                </Button>
              </div>
            )}

            {/* Control Bar */}
            <div className="flex items-center justify-center gap-4 p-4 rounded-xl border-4 border-foreground bg-card shadow-[4px_4px_0_hsl(var(--foreground))]">
              {court.session?.status === 'scheduled' && (
                <Button variant="comic" size="lg" onClick={handleStartSession} disabled={processingAI}>
                  {processingAI ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Play className="w-5 h-5 mr-2" />
                  )}
                  Start Session
                </Button>
              )}

              {court.session?.status === 'in_progress' && (
                <>
                  <Button 
                    variant="secondary"
                    onClick={handleAdjourn}
                    disabled={processingAI}
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    Adjourn
                  </Button>

                  <Button 
                    variant="comic"
                    onClick={handleDeliverVerdict}
                    disabled={processingAI}
                  >
                    <Gavel className="w-4 h-4 mr-2" />
                    Deliver Verdict
                  </Button>
                </>
              )}

              {(court.session?.status === 'completed' || court.session?.status === 'adjourned') && (
                <div className="text-center">
                  <Badge variant="outline" className="text-lg py-2 px-4">
                    Session {court.session.status === 'completed' ? 'Completed' : 'Adjourned'}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Participants */}
            <div className="p-4 rounded-xl border-4 border-foreground bg-card shadow-[4px_4px_0_hsl(var(--foreground))]">
              <ParticipantsList 
                participants={court.participants}
                currentUserId={user?.id}
              />
            </div>

            {/* Actions Tabs */}
            <div className="p-4 rounded-xl border-4 border-foreground bg-card shadow-[4px_4px_0_hsl(var(--foreground))]">
              <Tabs defaultValue="hand">
                <TabsList className="w-full">
                  <TabsTrigger value="hand" className="flex-1">
                    <Hand className="w-4 h-4" />
                  </TabsTrigger>
                  <TabsTrigger value="witness" className="flex-1">
                    <UserPlus className="w-4 h-4" />
                  </TabsTrigger>
                  <TabsTrigger value="evidence" className="flex-1">
                    <FileText className="w-4 h-4" />
                  </TabsTrigger>
                  <TabsTrigger value="date" className="flex-1">
                    <Calendar className="w-4 h-4" />
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="hand" className="mt-4">
                  <HandRaisePanel
                    handRaises={court.handRaises}
                    currentParticipant={court.currentParticipant || undefined}
                    isJudge={isJudge}
                    onRaiseHand={handleRaiseHand}
                    onRespondToHand={handleRespondToHand}
                  />
                </TabsContent>

                <TabsContent value="evidence" className="mt-4">
                  <EvidencePanel
                    evidence={court.evidence}
                    currentParticipant={court.currentParticipant || undefined}
                    isJudge={isJudge}
                    onUploadEvidence={handleUploadEvidence}
                    onAcceptEvidence={handleAcceptEvidence}
                    isUploading={isUploading}
                  />
                </TabsContent>

                <TabsContent value="witness" className="mt-4">
                  <WitnessPanel
                    witnessRequests={court.witnessRequests}
                    currentParticipant={court.currentParticipant || undefined}
                    isJudge={isJudge}
                    onRequestWitness={court.requestWitness}
                    onRespondToWitness={async (id, summoned) => {
                      const req = court.witnessRequests.find(w => w.id === id);
                      if (req) {
                        setProcessingAI(true);
                        const decision = await aiJudge.evaluateWitnessRequest({
                          id: req.id,
                          witnessName: req.witness_name,
                          description: req.witness_description,
                          relevance: req.relevance,
                          requesterName: req.requester?.participant_name || 'Unknown',
                          role: req.requester?.role || 'unknown',
                        });
                        if (decision) {
                          await court.respondToWitnessRequest(id, decision.summoned, decision.response);
                        }
                        setProcessingAI(false);
                      }
                    }}
                    onWitnessTestified={court.markWitnessTestified}
                    isProcessing={processingAI}
                  />
                </TabsContent>

                <TabsContent value="date" className="mt-4">
                  <DateExtensionPanel
                    dateRequests={court.dateRequests}
                    currentParticipant={court.currentParticipant || undefined}
                    isJudge={isJudge}
                    onRequestDate={handleRequestDate}
                    onDecideDate={handleDecideDate}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      {/* Join Modal */}
      <JoinCourtModal
        open={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onJoin={handleJoin}
        courtCode={court.session?.court_code || ''}
        caseName={court.caseDetails?.title || 'Court Session'}
        availableRoles={availableRoles}
      />

      {/* Objection Overlay */}
      <ObjectionOverlay
        show={showObjection}
        speaker={objectionSpeaker}
        onComplete={() => setShowObjection(false)}
      />

      {/* Verdict Overlay */}
      <VerdictOverlay
        show={showVerdict}
        verdict={verdictType}
        onComplete={() => setShowVerdict(false)}
      />

      {/* Judge Ruling Overlay (Sustained/Overruled) */}
      <JudgeRulingOverlay
        show={showRuling}
        ruling={rulingType}
        onComplete={() => setShowRuling(false)}
      />
    </div>
  );
};
