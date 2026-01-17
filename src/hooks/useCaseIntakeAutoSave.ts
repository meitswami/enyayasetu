import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CourtPartyRole } from '@/types/court';

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

interface UseCaseIntakeAutoSaveProps {
  userId: string;
  userRole: CourtPartyRole;
}

export const useCaseIntakeAutoSave = ({ userId, userRole }: UseCaseIntakeAutoSaveProps) => {
  const [draftCaseId, setDraftCaseId] = useState<string | null>(null);
  const [draftCaseNumber, setDraftCaseNumber] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const savedMessageIds = useRef<Set<string>>(new Set());

  // Create draft case on first load
  const initializeDraftCase = useCallback(async () => {
    if (isInitialized || draftCaseId) return draftCaseId;

    try {
      const caseNumber = `DRAFT-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      
      const { data, error } = await supabase
        .from('cases')
        .insert({
          user_id: userId,
          case_number: caseNumber,
          title: 'Draft Case - In Progress',
          description: 'Case intake in progress. Details will be updated as conversation continues.',
          plaintiff: 'To be determined',
          defendant: 'To be determined',
          category: 'Draft',
          user_role: userRole,
          ai_processing_status: 'draft',
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      setDraftCaseId(data.id);
      setDraftCaseNumber(caseNumber);
      setIsInitialized(true);
      console.log('Draft case created:', data.id);
      return data.id;
    } catch (error) {
      console.error('Failed to create draft case:', error);
      return null;
    }
  }, [userId, userRole, isInitialized, draftCaseId]);

  // Save a single message immediately - returns true if saved successfully
  const saveMessage = useCallback(async (message: Message, caseId?: string): Promise<boolean> => {
    const targetCaseId = caseId || draftCaseId;
    
    // Skip if already saved
    if (savedMessageIds.current.has(message.id)) {
      return true;
    }

    if (!targetCaseId) {
      console.warn('No case ID available for saving message');
      return false;
    }

    try {
      const { error } = await supabase
        .from('case_intake_messages')
        .insert({
          case_id: targetCaseId,
          user_id: userId,
          role: message.role,
          message: message.content,
          message_type: message.type,
          file_url: message.fileUrl || null,
        });

      if (error) throw error;
      
      savedMessageIds.current.add(message.id);
      console.log('Message saved:', message.id);
      return true;
    } catch (error) {
      console.error('Failed to save message:', error);
      return false;
    }
  }, [draftCaseId, userId]);

  // Update case context/details
  const updateCaseContext = useCallback(async (context: CaseContext) => {
    if (!draftCaseId) return;

    try {
      const updateData: Record<string, unknown> = {};
      
      if (context.summary) updateData.description = context.summary;
      if (context.summary) updateData.title = context.summary.substring(0, 200);
      if (context.parties?.complainant) updateData.plaintiff = context.parties.complainant;
      if (context.parties?.accused) updateData.defendant = context.parties.accused;
      if (context.documentType) updateData.category = context.documentType;
      if (context.callbackNumber) updateData.callback_number = context.callbackNumber;
      if (context.relation) updateData.uploaded_by_relation = context.uploadedBy === 'other' ? context.relation : 'Self';
      if (context.involvedPersonStatus) updateData.involved_person_status = context.involvedPersonStatus;

      if (Object.keys(updateData).length === 0) return;

      const { error } = await supabase
        .from('cases')
        .update(updateData)
        .eq('id', draftCaseId);

      if (error) throw error;
      console.log('Case context updated');
    } catch (error) {
      console.error('Failed to update case context:', error);
    }
  }, [draftCaseId]);

  // Finalize case - change from draft to active
  const finalizeCase = useCallback(async (context: CaseContext) => {
    if (!draftCaseId) return null;

    try {
      const finalCaseNumber = `CASE-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      
      const { data, error } = await supabase
        .from('cases')
        .update({
          case_number: finalCaseNumber,
          title: context.summary || 'New Case',
          description: context.summary,
          plaintiff: context.parties?.complainant || 'To be determined',
          defendant: context.parties?.accused || 'To be determined',
          category: context.documentType || 'Custom Case',
          callback_number: context.callbackNumber,
          uploaded_by_relation: context.uploadedBy === 'other' ? context.relation : 'Self',
          involved_person_status: context.involvedPersonStatus,
          ai_processing_status: 'processing',
          processing_eta: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        })
        .eq('id', draftCaseId)
        .select()
        .single();

      if (error) throw error;
      
      setDraftCaseNumber(finalCaseNumber);
      console.log('Case finalized:', data.id);
      return { id: data.id, caseNumber: finalCaseNumber };
    } catch (error) {
      console.error('Failed to finalize case:', error);
      return null;
    }
  }, [draftCaseId]);

  // Link to existing case (for duplicates)
  const linkToExistingCase = useCallback(async (existingCaseId: string) => {
    // If we have a draft case, we can delete it or mark it as superseded
    if (draftCaseId && draftCaseId !== existingCaseId) {
      try {
        await supabase
          .from('cases')
          .delete()
          .eq('id', draftCaseId);
        console.log('Draft case deleted, linking to existing case:', existingCaseId);
      } catch (error) {
        console.error('Failed to delete draft case:', error);
      }
    }
    
    setDraftCaseId(existingCaseId);
    savedMessageIds.current.clear(); // Clear saved messages to allow re-saving to new case
  }, [draftCaseId]);

  return {
    draftCaseId,
    draftCaseNumber,
    isInitialized,
    initializeDraftCase,
    saveMessage,
    updateCaseContext,
    finalizeCase,
    linkToExistingCase,
  };
};
