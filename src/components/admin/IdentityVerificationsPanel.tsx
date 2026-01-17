import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { notifyVerificationStatus } from '@/hooks/useNotifications';
import {
  Shield,
  User,
  Eye,
  Check,
  X,
  RefreshCw,
  FileText,
  Camera,
  Percent,
} from 'lucide-react';
import { format } from 'date-fns';

interface IdentityVerification {
  id: string;
  user_id: string;
  case_id: string;
  full_name: string;
  father_name: string;
  phone_number: string;
  email: string;
  relation_to_case: string;
  id_document_type: string;
  id_document_url: string;
  selfie_url: string;
  intent: string;
  face_match_percentage?: number;
  verification_status: string;
  admin_notes?: string;
  created_at: string;
  reviewed_at?: string;
}

export const IdentityVerificationsPanel: React.FC = () => {
  const [verifications, setVerifications] = useState<IdentityVerification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState<IdentityVerification | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [signedIdUrl, setSignedIdUrl] = useState<string | null>(null);
  const [signedSelfieUrl, setSignedSelfieUrl] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchVerifications();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('verification-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'identity_verifications',
        },
        () => {
          fetchVerifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchVerifications = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('identity_verifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVerifications(data || []);
    } catch (error) {
      console.error('Error fetching verifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate signed URLs when a verification is selected
  useEffect(() => {
    const generateSignedUrls = async () => {
      if (!selectedVerification) {
        setSignedIdUrl(null);
        setSignedSelfieUrl(null);
        return;
      }

      try {
        // Check if URLs are already full URLs (legacy) or paths
        const isIdPath = !selectedVerification.id_document_url.startsWith('http');
        const isSelfiePath = !selectedVerification.selfie_url.startsWith('http');

        if (isIdPath) {
          const { data: idData } = await supabase.storage
            .from('evidence')
            .createSignedUrl(selectedVerification.id_document_url, 3600);
          setSignedIdUrl(idData?.signedUrl || null);
        } else {
          setSignedIdUrl(selectedVerification.id_document_url);
        }

        if (isSelfiePath) {
          const { data: selfieData } = await supabase.storage
            .from('evidence')
            .createSignedUrl(selectedVerification.selfie_url, 3600);
          setSignedSelfieUrl(selfieData?.signedUrl || null);
        } else {
          setSignedSelfieUrl(selectedVerification.selfie_url);
        }
      } catch (error) {
        console.error('Error generating signed URLs:', error);
      }
    };

    generateSignedUrls();
  }, [selectedVerification]);

  const handleDecision = async (approved: boolean) => {
    if (!selectedVerification) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('identity_verifications')
        .update({
          verification_status: approved ? 'approved' : 'rejected',
          admin_notes: adminNotes,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', selectedVerification.id);

      if (error) throw error;

      // Send in-app notification to user
      if (selectedVerification.user_id) {
        await notifyVerificationStatus(
          selectedVerification.user_id,
          selectedVerification.case_id,
          approved ? 'approved' : 'rejected',
          adminNotes
        );
      }

      // Try to send email notification (will silently fail if not configured)
      try {
        await supabase.functions.invoke('send-verification-email', {
          body: {
            action: 'send-verification-status',
            email: selectedVerification.email,
            recipientName: selectedVerification.full_name,
            verificationStatus: approved ? 'approved' : 'rejected',
            adminNotes: adminNotes,
          },
        });
      } catch (emailError) {
        console.log('Email notification skipped (not configured):', emailError);
      }

      toast({
        title: approved ? 'Verification Approved' : 'Verification Rejected',
        description: `Identity verification for ${selectedVerification.full_name} has been ${approved ? 'approved' : 'rejected'}.`,
      });

      setSelectedVerification(null);
      setAdminNotes('');
      fetchVerifications();
    } catch (error) {
      console.error('Error updating verification:', error);
      toast({
        title: 'Error',
        description: 'Failed to update verification status.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const pendingCount = verifications.filter(v => v.verification_status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Identity Verifications
          {pendingCount > 0 && (
            <Badge variant="destructive">{pendingCount} pending</Badge>
          )}
        </h2>
        <Button variant="outline" size="sm" onClick={fetchVerifications}>
          <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Verifications Table */}
      <div className="border-2 border-foreground rounded-xl overflow-hidden bg-card shadow-[4px_4px_0_hsl(var(--foreground))]">
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Submitted</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Father's Name</TableHead>
                <TableHead>Relation</TableHead>
                <TableHead>ID Type</TableHead>
                <TableHead>Face Match</TableHead>
                <TableHead>Intent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : verifications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No verification requests yet
                  </TableCell>
                </TableRow>
              ) : (
                verifications.map((v) => (
                  <TableRow key={v.id} className={v.verification_status === 'pending' ? 'bg-amber-50 dark:bg-amber-950/20' : ''}>
                    <TableCell className="text-xs">
                      {format(new Date(v.created_at), 'MMM d, HH:mm')}
                    </TableCell>
                    <TableCell className="font-medium">{v.full_name}</TableCell>
                    <TableCell>{v.father_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{v.relation_to_case}</Badge>
                    </TableCell>
                    <TableCell className="capitalize">{v.id_document_type.replace('_', ' ')}</TableCell>
                    <TableCell>
                      {v.face_match_percentage != null ? (
                        <Badge className={v.face_match_percentage >= 70 ? 'bg-green-500' : 'bg-amber-500'}>
                          <Percent className="w-3 h-3 mr-1" />
                          {Math.round(v.face_match_percentage)}%
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="capitalize">{v.intent.replace('_', ' ')}</TableCell>
                    <TableCell>{getStatusBadge(v.verification_status)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedVerification(v)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {/* Verification Detail Modal */}
      <Dialog open={!!selectedVerification} onOpenChange={() => setSelectedVerification(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Identity Verification Review
            </DialogTitle>
          </DialogHeader>

          {selectedVerification && (
            <div className="space-y-6">
              {/* Personal Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                  <p className="font-semibold">{selectedVerification.full_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Father's Name</label>
                  <p className="font-semibold">{selectedVerification.father_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <p>{selectedVerification.phone_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p>{selectedVerification.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Relation to Case</label>
                  <Badge variant="outline">{selectedVerification.relation_to_case}</Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Intent</label>
                  <Badge>{selectedVerification.intent.replace('_', ' ')}</Badge>
                </div>
              </div>

              {/* Documents */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="font-medium capitalize">
                      {selectedVerification.id_document_type.replace('_', ' ')}
                    </span>
                  </div>
                  {signedIdUrl ? (
                    <a
                      href={signedIdUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" /> View Document
                    </a>
                  ) : (
                    <span className="text-sm text-muted-foreground">Loading...</span>
                  )}
                </div>
                <div className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Camera className="w-4 h-4 text-primary" />
                    <span className="font-medium">Selfie</span>
                    {selectedVerification.face_match_percentage != null && (
                      <Badge className={selectedVerification.face_match_percentage >= 70 ? 'bg-green-500' : 'bg-amber-500'}>
                        {Math.round(selectedVerification.face_match_percentage)}% match
                      </Badge>
                    )}
                  </div>
                  {signedSelfieUrl ? (
                    <a
                      href={signedSelfieUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" /> View Selfie
                    </a>
                  ) : (
                    <span className="text-sm text-muted-foreground">Loading...</span>
                  )}
                </div>
              </div>

              {/* Admin Notes */}
              {selectedVerification.verification_status === 'pending' && (
                <div>
                  <label className="text-sm font-medium">Admin Notes</label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about this verification..."
                    className="mt-1"
                  />
                </div>
              )}

              {/* Existing Admin Notes */}
              {selectedVerification.admin_notes && (
                <div className="bg-muted p-3 rounded-lg">
                  <label className="text-sm font-medium">Previous Notes</label>
                  <p className="text-sm mt-1">{selectedVerification.admin_notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              {selectedVerification.verification_status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleDecision(false)}
                    disabled={isProcessing}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleDecision(true)}
                    disabled={isProcessing}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
