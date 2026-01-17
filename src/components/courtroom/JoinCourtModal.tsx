import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ParticipantRole } from './types';
import { Scale, Users, User, Shield } from 'lucide-react';

interface JoinCourtModalProps {
  open: boolean;
  onClose: () => void;
  onJoin: (name: string, role: ParticipantRole) => void;
  courtCode: string;
  caseName: string;
  availableRoles: ParticipantRole[];
}

const roleLabels: Record<ParticipantRole, { label: string; icon: React.ElementType }> = {
  judge: { label: 'Judge', icon: Scale },
  prosecutor: { label: 'Prosecutor', icon: Shield },
  defence_lawyer: { label: 'Defence Lawyer', icon: Scale },
  accused: { label: 'Accused', icon: User },
  victim: { label: 'Victim', icon: User },
  victim_family: { label: 'Victim Family', icon: Users },
  accused_family: { label: 'Accused Family', icon: Users },
  witness: { label: 'Witness', icon: User },
  audience: { label: 'Audience', icon: Users },
};

export const JoinCourtModal: React.FC<JoinCourtModalProps> = ({
  open,
  onClose,
  onJoin,
  courtCode,
  caseName,
  availableRoles,
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState<ParticipantRole>('audience');

  const handleJoin = () => {
    if (name.trim() && role) {
      onJoin(name.trim(), role);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-bangers text-2xl">
            Join Court Session
          </DialogTitle>
          <DialogDescription>
            Court Code: <span className="font-mono font-bold">{courtCode}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-sm text-muted-foreground">Case:</p>
            <p className="font-medium">{caseName}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              placeholder="Enter your name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Your Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as ParticipantRole)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((r) => {
                  const config = roleLabels[r];
                  const Icon = config.icon;
                  return (
                    <SelectItem key={r} value={r}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {config.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleJoin} disabled={!name.trim()}>
            Join Session
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
