import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Wallet,
  Search,
  RefreshCw,
  Plus,
  Minus,
  Loader2,
  IndianRupee,
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface WalletRecord {
  id: string;
  user_id: string;
  balance: number;
  updated_at: string;
  user_email?: string;
}

export const WalletManagement: React.FC = () => {
  const [wallets, setWallets] = useState<WalletRecord[]>([]);
  const [filteredWallets, setFilteredWallets] = useState<WalletRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<WalletRecord | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchWallets();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = wallets.filter(
        (w) =>
          w.user_id.toLowerCase().includes(query) ||
          w.user_email?.toLowerCase().includes(query)
      );
      setFilteredWallets(filtered);
    } else {
      setFilteredWallets(wallets);
    }
  }, [searchQuery, wallets]);

  const fetchWallets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_wallets')
        .select('*')
        .order('balance', { ascending: false });

      if (error) throw error;
      setWallets(data || []);
      setFilteredWallets(data || []);
    } catch (error: any) {
      console.error('Error fetching wallets:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch wallets.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustBalance = async () => {
    if (!selectedWallet || !adjustmentAmount) {
      toast({
        title: 'Validation Error',
        description: 'Please enter an adjustment amount.',
        variant: 'destructive',
      });
      return;
    }

    const amount = parseFloat(adjustmentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid positive amount.',
        variant: 'destructive',
      });
      return;
    }

    if (adjustmentType === 'subtract' && selectedWallet.balance < amount) {
      toast({
        title: 'Validation Error',
        description: 'Insufficient balance for this adjustment.',
        variant: 'destructive',
      });
      return;
    }

    if (!adjustmentReason.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a reason for this adjustment.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const finalAmount = adjustmentType === 'add' ? amount : -amount;

      // Use the update_wallet_balance function
      const { error } = await supabase.rpc('update_wallet_balance', {
        p_user_id: selectedWallet.user_id,
        p_amount: finalAmount,
        p_transaction_type: 'admin_adjustment',
        p_description: adjustmentReason,
        p_reference_id: null,
        p_reference_type: 'admin_adjustment',
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Wallet balance ${adjustmentType === 'add' ? 'increased' : 'decreased'} by ₹${amount.toFixed(2)}.`,
      });

      setShowAdjustModal(false);
      setAdjustmentAmount('');
      setAdjustmentReason('');
      setSelectedWallet(null);
      fetchWallets();
    } catch (error: any) {
      console.error('Error adjusting balance:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to adjust wallet balance.',
        variant: 'destructive',
      });
    }
  };

  const totalBalance = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by user ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="px-3 py-1">
            <Wallet className="w-4 h-4 mr-1" />
            Total Balance: ₹{totalBalance.toFixed(2)}
          </Badge>
          <Badge variant="secondary" className="px-3 py-1">
            {filteredWallets.length} Wallets
          </Badge>
          <Button variant="outline" size="sm" onClick={fetchWallets}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Wallets Table */}
      <div className="border-2 border-foreground rounded-xl overflow-hidden bg-card shadow-[4px_4px_0_hsl(var(--foreground))]">
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>User ID</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading wallets...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredWallets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No wallets found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredWallets.map((wallet) => (
                  <TableRow key={wallet.id}>
                    <TableCell className="font-mono text-xs">
                      {wallet.user_id.substring(0, 8)}...
                    </TableCell>
                    <TableCell className="font-semibold text-lg">
                      <div className="flex items-center gap-1">
                        <IndianRupee className="w-4 h-4" />
                        {wallet.balance.toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(wallet.updated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedWallet(wallet);
                          setShowAdjustModal(true);
                        }}
                      >
                        Adjust
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {/* Adjust Balance Modal */}
      <Dialog open={showAdjustModal} onOpenChange={setShowAdjustModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Wallet Balance</DialogTitle>
            <DialogDescription>
              Adjust balance for user {selectedWallet?.user_id.substring(0, 8)}...
              <br />
              Current balance: ₹{selectedWallet?.balance.toFixed(2)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Adjustment Type</Label>
              <Select value={adjustmentType} onValueChange={(value: any) => setAdjustmentType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Add Money
                    </div>
                  </SelectItem>
                  <SelectItem value="subtract">
                    <div className="flex items-center gap-2">
                      <Minus className="w-4 h-4" />
                      Subtract Money
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={adjustmentAmount}
                onChange={(e) => setAdjustmentAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for adjustment..."
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                rows={3}
              />
            </div>
            {adjustmentAmount && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex justify-between">
                  <span>Current Balance:</span>
                  <span className="font-semibold">₹{selectedWallet?.balance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Adjustment:</span>
                  <span className={`font-semibold ${adjustmentType === 'add' ? 'text-green-600' : 'text-red-600'}`}>
                    {adjustmentType === 'add' ? '+' : '-'}₹{parseFloat(adjustmentAmount || '0').toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="font-semibold">New Balance:</span>
                  <span className="font-bold text-lg">
                    ₹{(
                      (selectedWallet?.balance || 0) +
                      (adjustmentType === 'add' ? 1 : -1) * parseFloat(adjustmentAmount || '0')
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdjustModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdjustBalance}>Apply Adjustment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

