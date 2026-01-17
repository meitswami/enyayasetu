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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Package,
  Search,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Loader2,
  IndianRupee,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Addon {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price: number;
  status: string;
  max_per_case: number;
  features: any;
  created_at: string;
  updated_at: string;
}

export const AddonsManagement: React.FC = () => {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [filteredAddons, setFilteredAddons] = useState<Addon[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAddon, setSelectedAddon] = useState<Addon | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    price: '',
    status: 'active',
    max_per_case: '1',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchAddons();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = addons.filter(
        (a) =>
          a.code.toLowerCase().includes(query) ||
          a.name.toLowerCase().includes(query) ||
          a.description?.toLowerCase().includes(query)
      );
      setFilteredAddons(filtered);
    } else {
      setFilteredAddons(addons);
    }
  }, [searchQuery, addons]);

  const fetchAddons = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('addons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAddons(data || []);
      setFilteredAddons(data || []);
    } catch (error: any) {
      console.error('Error fetching addons:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch addons.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.code || !formData.name || !formData.price) {
      toast({
        title: 'Validation Error',
        description: 'Code, name, and price are required.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('addons')
        .insert({
          code: formData.code,
          name: formData.name,
          description: formData.description || null,
          price: parseFloat(formData.price),
          status: formData.status,
          max_per_case: parseInt(formData.max_per_case),
          features: { features: [] },
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Add-on created successfully.',
      });

      setShowCreateModal(false);
      resetForm();
      fetchAddons();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create add-on.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async () => {
    if (!selectedAddon) return;

    try {
      const { error } = await supabase
        .from('addons')
        .update({
          name: formData.name,
          description: formData.description || null,
          price: parseFloat(formData.price),
          status: formData.status,
          max_per_case: parseInt(formData.max_per_case),
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedAddon.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Add-on updated successfully.',
      });

      setShowEditModal(false);
      resetForm();
      fetchAddons();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update add-on.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this add-on?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('addons')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Add-on deleted successfully.',
      });

      fetchAddons();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete add-on.',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      price: '',
      status: 'active',
      max_per_case: '1',
    });
  };

  const openEditModal = (addon: Addon) => {
    setSelectedAddon(addon);
    setFormData({
      code: addon.code,
      name: addon.name,
      description: addon.description || '',
      price: addon.price.toString(),
      status: addon.status,
      max_per_case: addon.max_per_case.toString(),
    });
    setShowEditModal(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      active: 'default',
      inactive: 'secondary',
      archived: 'outline',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by code, name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="px-3 py-1">
            {filteredAddons.length} Add-ons
          </Badge>
          <Button variant="outline" size="sm" onClick={fetchAddons}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add Add-on
          </Button>
        </div>
      </div>

      {/* Add-ons Table */}
      <div className="border-2 border-foreground rounded-xl overflow-hidden bg-card shadow-[4px_4px_0_hsl(var(--foreground))]">
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Max per Case</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading add-ons...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredAddons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No add-ons found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAddons.map((addon) => (
                  <TableRow key={addon.id}>
                    <TableCell className="font-mono font-semibold">
                      {addon.code}
                    </TableCell>
                    <TableCell className="font-medium">{addon.name}</TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {addon.description || 'N/A'}
                    </TableCell>
                    <TableCell className="font-semibold flex items-center gap-1">
                      <IndianRupee className="w-4 h-4" />
                      {addon.price.toFixed(2)}
                    </TableCell>
                    <TableCell>{addon.max_per_case}</TableCell>
                    <TableCell>{getStatusBadge(addon.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(addon)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(addon.id)}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {showCreateModal ? 'Create Add-on' : 'Edit Add-on'}
            </DialogTitle>
            <DialogDescription>
              {showCreateModal
                ? 'Create a new add-on'
                : `Edit add-on: ${selectedAddon?.code}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="addon_code"
                  disabled={showEditModal}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="250.00"
                  step="0.01"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Add-on Name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add-on description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_per_case">Max per Case</Label>
                <Input
                  id="max_per_case"
                  type="number"
                  value={formData.max_per_case}
                  onChange={(e) => setFormData({ ...formData, max_per_case: e.target.value })}
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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

