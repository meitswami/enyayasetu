import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Square, Download, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VideoRecorderProps {
  sessionId: string;
  userId?: string;
  isSessionActive: boolean;
  onRecordingUrlSaved?: (url: string) => void;
}

export const VideoRecorder: React.FC<VideoRecorderProps> = ({
  sessionId,
  userId,
  isSessionActive,
  onRecordingUrlSaved,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = useCallback(async () => {
    try {
      // Get screen and audio
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'browser' },
        audio: true,
      });

      // Try to get microphone audio
      let audioStream: MediaStream | null = null;
      try {
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (e) {
        console.log('Microphone not available');
      }

      // Combine streams
      const tracks = [...displayStream.getTracks()];
      if (audioStream) {
        tracks.push(...audioStream.getAudioTracks());
      }

      const combinedStream = new MediaStream(tracks);
      streamRef.current = combinedStream;

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp9,opus',
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        await saveRecording(blob);
      };

      // Handle stream end
      displayStream.getVideoTracks()[0].onended = () => {
        stopRecording();
      };

      mediaRecorder.start(1000); // Record in 1-second chunks
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      toast.success('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording. Please allow screen sharing.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      
      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      setIsRecording(false);
    }
  }, [isRecording]);

  const saveRecording = async (blob: Blob) => {
    if (!userId) {
      toast.error('You must be logged in to save recordings');
      return;
    }
    
    setIsSaving(true);
    try {
      // Use userId as folder to match storage RLS policy
      const fileName = `${userId}/${sessionId}_${Date.now()}_court_recording.webm`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('court-recordings')
        .upload(fileName, blob, {
          contentType: 'video/webm',
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get signed URL since bucket is private
      const { data: signedData, error: signedError } = await supabase.storage
        .from('court-recordings')
        .createSignedUrl(fileName, 60 * 60 * 24 * 7); // 7 days expiry

      if (signedError) throw signedError;
      
      const recordingUrl = signedData.signedUrl;

      // Update session with recording URL
      const { error: updateError } = await supabase
        .from('court_sessions')
        .update({ video_recording_url: recordingUrl })
        .eq('id', sessionId);

      if (updateError) {
        console.error('Session update error:', updateError);
        throw updateError;
      }

      setRecordedUrl(recordingUrl);
      onRecordingUrlSaved?.(recordingUrl);
      toast.success('Recording saved successfully');
    } catch (error: any) {
      console.error('Error saving recording:', error);
      toast.error(`Failed to save recording: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-stop when session ends
  useEffect(() => {
    if (!isSessionActive && isRecording) {
      stopRecording();
    }
  }, [isSessionActive, isRecording, stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="flex items-center gap-2">
      {isRecording ? (
        <>
          <Badge variant="destructive" className="animate-pulse">
            <div className="w-2 h-2 rounded-full bg-white mr-2 animate-pulse" />
            REC {formatTime(recordingTime)}
          </Badge>
          <Button
            size="sm"
            variant="destructive"
            onClick={stopRecording}
            disabled={isSaving}
          >
            <Square className="w-4 h-4 mr-2" />
            Stop
          </Button>
        </>
      ) : isSaving ? (
        <Badge variant="secondary">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Saving...
        </Badge>
      ) : (
        <>
          <Button
            size="sm"
            variant="outline"
            onClick={startRecording}
            disabled={!isSessionActive}
          >
            <Video className="w-4 h-4 mr-2" />
            Record
          </Button>
          {recordedUrl && (
            <Button
              size="sm"
              variant="ghost"
              asChild
            >
              <a href={recordedUrl} target="_blank" rel="noopener noreferrer">
                <Download className="w-4 h-4" />
              </a>
            </Button>
          )}
        </>
      )}
    </div>
  );
};
