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
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Ticket,
  Search,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Loader2,
  Calendar,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  max_discount_amount: number | null;
  min_purchase_amount: number;
  max_uses: number | null;
  used_count: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

export const PromoCodeManagement: React.FC = () => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [filteredPromoCodes, setFilteredPromoCodes] = useState<PromoCode[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPromoCode, setSelectedPromoCode] = useState<PromoCode | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    max_discount_amount: '',
    min_purchase_amount: '',
    max_uses: '',
    valid_from: '',
    valid_until: '',
    is_active: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = promoCodes.filter(
        (p) =>
          p.code.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      );
      setFilteredPromoCodes(filtered);
    } else {
      setFilteredPromoCodes(promoCodes);
    }
  }, [searchQuery, promoCodes]);

  const fetchPromoCodes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromoCodes(data || []);
      setFilteredPromoCodes(data || []);
    } catch (error: any) {
      console.error('Error fetching promo codes:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch promo codes.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.code || !formData.discount_value) {
      toast({
        title: 'Validation Error',
        description: 'Code and discount value are required.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('promo_codes')
        .insert({
          code: formData.code.toUpperCase(),
          description: formData.description || null,
          discount_type: formData.discount_type,
          discount_value: parseFloat(formData.discount_value),
          max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
          min_purchase_amount: formData.min_purchase_amount ? parseFloat(formData.min_purchase_amount) : 0,
          max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
          valid_from: formData.valid_from || new Date().toISOString(),
          valid_until: formData.valid_until || null,
          is_active: formData.is_active,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Promo code created successfully.',
      });

      setShowCreateModal(false);
      resetForm();
      fetchPromoCodes();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create promo code.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async () => {
    if (!selectedPromoCode) return;

    try {
      const { error } = await supabase
        .from('promo_codes')
        .update({
          description: formData.description || null,
          discount_type: formData.discount_type,
          discount_value: parseFloat(formData.discount_value),
          max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
          min_purchase_amount: formData.min_purchase_amount ? parseFloat(formData.min_purchase_amount) : 0,
          max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
          valid_from: formData.valid_from,
          valid_until: formData.valid_until || null,
          is_active: formData.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedPromoCode.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Promo code updated successfully.',
      });

      setShowEditModal(false);
      resetForm();
      fetchPromoCodes();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update promo code.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promo code?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Promo code deleted successfully.',
      });

      fetchPromoCodes();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete promo code.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (promoCode: PromoCode) => {
    try {
      const { error } = await supabase
        .from('promo_codes')
        .update({ is_active: !promoCode.is_active })
        .eq('id', promoCode.id);

      if (error) throw error;

      fetchPromoCodes();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to update promo code status.',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: '',
      max_discount_amount: '',
      min_purchase_amount: '',
      max_uses: '',
      valid_from: '',
      valid_until: '',
      is_active: true,
    });
  };

  const openEditModal = (promoCode: PromoCode) => {
    setSelectedPromoCode(promoCode);
    setFormData({
      code: promoCode.code,
      description: promoCode.description || '',
      discount_type: promoCode.discount_type,
      discount_value: promoCode.discount_value.toString(),
      max_discount_amount: promoCode.max_discount_amount?.toString() || '',
      min_purchase_amount: promoCode.min_purchase_amount.toString(),
      max_uses: promoCode.max_uses?.toString() || '',
      valid_from: new Date(promoCode.valid_from).toISOString().split('T')[0],
      valid_until: promoCode.valid_until ? new Date(promoCode.valid_until).toISOString().split('T')[0] : '',
      is_active: promoCode.is_active,
    });
    setShowEditModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="px-3 py-1">
            {filteredPromoCodes.length} Promo Codes
          </Badge>
          <Button variant="outline" size="sm" onClick={fetchPromoCodes}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add Promo Code
          </Button>
        </div>
      </div>

      {/* Promo Codes Table */}
      <div className="border-2 border-foreground rounded-xl overflow-hidden bg-card shadow-[4px_4px_0_hsl(var(--foreground))]">
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Min Purchase</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Valid From</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading promo codes...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredPromoCodes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No promo codes found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPromoCodes.map((promoCode) => (
                  <TableRow key={promoCode.id}>
                    <TableCell className="font-mono font-semibold">
                      {promoCode.code}
                    </TableCell>
                    <TableCell>
                      {promoCode.discount_type === 'percentage' ? (
                        <span>{promoCode.discount_value}%</span>
                      ) : (
                        <span>₹{promoCode.discount_value}</span>
                      )}
                      {promoCode.max_discount_amount && (
                        <span className="text-xs text-muted-foreground ml-1">
                          (max ₹{promoCode.max_discount_amount})
                        </span>
                      )}
                    </TableCell>
                    <TableCell>₹{promoCode.min_purchase_amount}</TableCell>
                    <TableCell>
                      {promoCode.used_count} / {promoCode.max_uses || '∞'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(promoCode.valid_from).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm">
                      {promoCode.valid_until ? new Date(promoCode.valid_until).toLocaleDateString() : 'No expiry'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={promoCode.is_active}
                          onCheckedChange={() => handleToggleActive(promoCode)}
                        />
                        <Badge variant={promoCode.is_active ? 'default' : 'secondary'}>
                          {promoCode.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(promoCode)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(promoCode.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={showCreateModal || showEditModal} onOpenChange={(open) => {
        if (!open) {
          setShowCreateModal(false);
          setShowEditModal(false);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {showCreateModal ? 'Create Promo Code' : 'Edit Promo Code'}
            </DialogTitle>
            <DialogDescription>
              {showCreateModal
                ? 'Create a new discount promo code'
                : `Edit promo code: ${selectedPromoCode?.code}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="PROMO2024"
                  disabled={showEditModal}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount_type">Discount Type *</Label>
                <Select
                  value={formData.discount_type}
                  onValueChange={(value) => setFormData({ ...formData, discount_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Promo code description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discount_value">Discount Value *</Label>
                <Input
                  id="discount_value"
                  type="number"
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                  placeholder={formData.discount_type === 'percentage' ? '10' : '100'}
                />
              </div>
              {formData.discount_type === 'percentage' && (
                <div className="space-y-2">
                  <Label htmlFor="max_discount_amount">Max Discount (₹)</Label>
                  <Input
                    id="max_discount_amount"
                    type="number"
                    value={formData.max_discount_amount}
                    onChange={(e) => setFormData({ ...formData, max_discount_amount: e.target.value })}
                    placeholder="500"
                  />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_purchase_amount">Min Purchase (₹)</Label>
                <Input
                  id="min_purchase_amount"
                  type="number"
                  value={formData.min_purchase_amount}
                  onChange={(e) => setFormData({ ...formData, min_purchase_amount: e.target.value })}
                  placeholder="1000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_uses">Max Uses (leave empty for unlimited)</Label>
                <Input
                  id="max_uses"
                  type="number"
                  value={formData.max_uses}
                  onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                  placeholder="100"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valid_from">Valid From *</Label>
                <Input
                  id="valid_from"
                  type="date"
                  value={formData.valid_from}
                  onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valid_until">Valid Until (optional)</Label>
                <Input
                  id="valid_until"
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={showCreateModal ? handleCreate : handleUpdate}>
              {showCreateModal ? 'Create' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

