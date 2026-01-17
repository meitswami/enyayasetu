import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CourtPartyRole, ROLE_LABELS } from '@/types/court';
import { CalendarDays, Gavel } from 'lucide-react';
import { format, addDays } from 'date-fns';

interface DateRequestModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (date: Date, reason: string) => void;
  requestedBy: CourtPartyRole;
  caseTitle: string;
}

export const DateRequestModal: React.FC<DateRequestModalProps> = ({
  open,
  onClose,
  onConfirm,
  requestedBy,
  caseTitle,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    addDays(new Date(), 7)
  );
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (selectedDate) {
      onConfirm(selectedDate, reason);
      onClose();
    }
  };

  const minDate = addDays(new Date(), 1);
  const maxDate = addDays(new Date(), 180); // 6 months max

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-2 border-foreground shadow-[4px_4px_0_hsl(var(--foreground))]">
        <DialogHeader>
          <DialogTitle className="font-bangers text-xl flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            Request Adjournment Date
          </DialogTitle>
          <DialogDescription>
            Case: {caseTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Who is requesting */}
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <Gavel className="w-4 h-4" />
            <span className="text-sm">
              <strong>{ROLE_LABELS[requestedBy].en}</strong> is requesting a new date
            </span>
          </div>

          {/* Calendar */}
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < minDate || date > maxDate}
              className="rounded-md border-2 border-foreground pointer-events-auto"
            />
          </div>

          {/* Selected date display */}
          {selectedDate && (
            <div className="text-center p-3 bg-primary/10 rounded-lg">
              <p className="text-sm text-muted-foreground">Selected Date</p>
              <p className="font-bold text-lg">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label>Reason for Adjournment (Optional)</Label>
            <Textarea
              placeholder="Enter reason for requesting this date..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              variant="comic"
              onClick={handleConfirm}
              disabled={!selectedDate}
              className="flex-1"
            >
              Confirm Date
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
