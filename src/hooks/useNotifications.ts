import { supabase } from '@/integrations/supabase/client';

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'hand_raise' | 'session_status' | 'date_request' | 'witness_summon' | 'verification';
  relatedCaseId?: string;
  relatedSessionId?: string;
}

export const createNotification = async ({
  userId,
  title,
  message,
  type,
  relatedCaseId,
  relatedSessionId,
}: CreateNotificationParams) => {
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    title,
    message,
    type,
    related_case_id: relatedCaseId,
    related_session_id: relatedSessionId,
  });

  if (error) {
    console.error('Failed to create notification:', error);
  }

  return !error;
};

// Notify when hand raise is approved
export const notifyHandRaiseApproved = async (
  userId: string,
  sessionId: string,
  response: string
) => {
  return createNotification({
    userId,
    title: 'Hand Raise Approved',
    message: `The judge has approved your hand raise: "${response}"`,
    type: 'hand_raise',
    relatedSessionId: sessionId,
  });
};

// Notify when witness is summoned
export const notifyWitnessSummoned = async (
  userId: string,
  sessionId: string,
  witnessName: string
) => {
  return createNotification({
    userId,
    title: 'Witness Summoned',
    message: `Witness "${witnessName}" has been summoned to testify.`,
    type: 'witness_summon',
    relatedSessionId: sessionId,
  });
};

// Notify when session status changes
export const notifySessionStatusChange = async (
  userId: string,
  sessionId: string,
  status: string
) => {
  const statusMessages: Record<string, string> = {
    active: 'The court session has started.',
    adjourned: 'The court session has been adjourned.',
    completed: 'The court session has ended.',
  };

  return createNotification({
    userId,
    title: 'Session Status Update',
    message: statusMessages[status] || `Session status changed to: ${status}`,
    type: 'session_status',
    relatedSessionId: sessionId,
  });
};

// Notify when date request is decided
export const notifyDateRequestDecision = async (
  userId: string,
  sessionId: string,
  approved: boolean,
  reason?: string
) => {
  return createNotification({
    userId,
    title: approved ? 'Date Request Approved' : 'Date Request Denied',
    message: approved
      ? `Your request for a new hearing date has been approved.${reason ? ` ${reason}` : ''}`
      : `Your request for a new hearing date was denied.${reason ? ` Reason: ${reason}` : ''}`,
    type: 'date_request',
    relatedSessionId: sessionId,
  });
};

// Notify when identity verification status changes
export const notifyVerificationStatus = async (
  userId: string,
  caseId: string,
  status: 'approved' | 'rejected',
  adminNotes?: string
) => {
  return createNotification({
    userId,
    title: status === 'approved' ? 'Verification Approved' : 'Verification Rejected',
    message:
      status === 'approved'
        ? 'Your identity has been verified. You can now access the case information.'
        : `Your identity verification was rejected.${adminNotes ? ` Notes: ${adminNotes}` : ''}`,
    type: 'verification',
    relatedCaseId: caseId,
  });
};
