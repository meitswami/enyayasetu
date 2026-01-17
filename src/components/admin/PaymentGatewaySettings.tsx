import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  CreditCard,
  RefreshCw,
  Settings,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface GatewaySetting {
  id: string;
  gateway: string;
  is_active: boolean;
  api_key: string | null;
  api_secret: string | null;
  merchant_id: string | null;
  salt_key: string | null;
  salt_index: string | null;
  test_mode: boolean;
  updated_at: string;
}

export const PaymentGatewaySettings: React.FC = () => {
  const [gateways, setGateways] = useState<GatewaySetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [showPhonePeModal, setShowPhonePeModal] = useState(false);
  const [razorpayData, setRazorpayData] = useState({
    api_key: '',
    api_secret: '',
    test_mode: true,
  });
  const [phonepeData, setPhonepeData] = useState({
    merchant_id: '',
    salt_key: '',
    salt_index: '',
    test_mode: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchGateways();
  }, []);

  const fetchGateways = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payment_gateway_settings')
        .select('*')
        .order('gateway');

      if (error) throw error;
      setGateways(data || []);
      
      // Pre-fill forms if data exists
      const razorpay = data?.find(g => g.gateway === 'razorpay');
      const phonepe = data?.find(g => g.gateway === 'phonepe');
      
      if (razorpay) {
        setRazorpayData({
          api_key: razorpay.api_key || '',
          api_secret: razorpay.api_secret || '',
          test_mode: razorpay.test_mode ?? true,
        });
      }
      
      if (phonepe) {
        setPhonepeData({
          merchant_id: phonepe.merchant_id || '',
          salt_key: phonepe.salt_key || '',
          salt_index: phonepe.salt_index || '',
          test_mode: phonepe.test_mode ?? true,
        });
      }
    } catch (error: any) {
      console.error('Error fetching gateway settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch payment gateway settings.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleGateway = async (gatewayId: string, currentStatus: boolean) => {
    if (currentStatus) {
      // Deactivating
      try {
        const { error } = await supabase
          .from('payment_gateway_settings')
          .update({ is_active: false })
          .eq('id', gatewayId);

        if (error) throw error;
        fetchGateways();
      } catch (error: any) {
        toast({
          title: 'Error',
          description: 'Failed to deactivate gateway.',
          variant: 'destructive',
        });
      }
    } else {
      // Activating - will be handled by database trigger to deactivate others
      try {
        const { error } = await supabase
          .from('payment_gateway_settings')
          .update({ is_active: true })
          .eq('id', gatewayId);

        if (error) throw error;
        fetchGateways();
        toast({
          title: 'Success',
          description: 'Payment gateway activated. Other gateways have been deactivated.',
        });
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to activate gateway.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleSaveRazorpay = async () => {
    if (!razorpayData.api_key || !razorpayData.api_secret) {
      toast({
        title: 'Validation Error',
        description: 'API Key and API Secret are required.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data: existing } = await supabase
        .from('payment_gateway_settings')
        .select('id')
        .eq('gateway', 'razorpay')
        .single();

      if (existing) {
        const { error } = await supabase
          .from('payment_gateway_settings')
          .update({
            api_key: razorpayData.api_key,
            api_secret: razorpayData.api_secret,
            test_mode: razorpayData.test_mode,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('payment_gateway_settings')
          .insert({
            gateway: 'razorpay',
            api_key: razorpayData.api_key,
            api_secret: razorpayData.api_secret,
            test_mode: razorpayData.test_mode,
            is_active: false,
          });

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: 'Razorpay settings saved successfully.',
      });

      setShowRazorpayModal(false);
      fetchGateways();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save Razorpay settings.',
        variant: 'destructive',
      });
    }
  };

  const handleSavePhonePe = async () => {
    if (!phonepeData.merchant_id || !phonepeData.salt_key || !phonepeData.salt_index) {
      toast({
        title: 'Validation Error',
        description: 'Merchant ID, Salt Key, and Salt Index are required.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data: existing } = await supabase
        .from('payment_gateway_settings')
        .select('id')
        .eq('gateway', 'phonepe')
        .single();

      if (existing) {
        const { error } = await supabase
          .from('payment_gateway_settings')
          .update({
            merchant_id: phonepeData.merchant_id,
            salt_key: phonepeData.salt_key,
            salt_index: phonepeData.salt_index,
            test_mode: phonepeData.test_mode,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('payment_gateway_settings')
          .insert({
            gateway: 'phonepe',
            merchant_id: phonepeData.merchant_id,
            salt_key: phonepeData.salt_key,
            salt_index: phonepeData.salt_index,
            test_mode: phonepeData.test_mode,
            is_active: false,
          });

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: 'PhonePe settings saved successfully.',
      });

      setShowPhonePeModal(false);
      fetchGateways();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save PhonePe settings.',
        variant: 'destructive',
      });
    }
  };

  const razorpay = gateways.find(g => g.gateway === 'razorpay');
  const phonepe = gateways.find(g => g.gateway === 'phonepe');
  const activeGateway = gateways.find(g => g.is_active);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payment Gateway Settings</h2>
          <p className="text-sm text-muted-foreground">
            Configure payment gateways. Only one gateway can be active at a time.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchGateways}>
          <RefreshCw className="w-4 h-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Active Gateway Alert */}
      {activeGateway && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Active Gateway</AlertTitle>
          <AlertDescription>
            <strong>{activeGateway.gateway.toUpperCase()}</strong> is currently active.
            Activating another gateway will automatically deactivate this one.
          </AlertDescription>
        </Alert>
      )}

      {/* Gateways */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Razorpay */}
        <div className="border-2 border-foreground rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Razorpay</h3>
              <p className="text-sm text-muted-foreground">Razorpay payment gateway</p>
            </div>
            <Badge variant={razorpay?.is_active ? 'default' : 'secondary'}>
              {razorpay?.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Status</span>
              <Switch
                checked={razorpay?.is_active || false}
                onCheckedChange={() => razorpay && handleToggleGateway(razorpay.id, razorpay.is_active)}
                disabled={!razorpay?.api_key || !razorpay?.api_secret}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Test Mode</span>
              <Badge variant="outline">
                {razorpay?.test_mode ? 'Yes' : 'No'}
              </Badge>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowRazorpayModal(true)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Configure Razorpay
          </Button>
        </div>

        {/* PhonePe */}
        <div className="border-2 border-foreground rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">PhonePe</h3>
              <p className="text-sm text-muted-foreground">PhonePe payment gateway</p>
            </div>
            <Badge variant={phonepe?.is_active ? 'default' : 'secondary'}>
              {phonepe?.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Status</span>
              <Switch
                checked={phonepe?.is_active || false}
                onCheckedChange={() => phonepe && handleToggleGateway(phonepe.id, phonepe.is_active)}
                disabled={!phonepe?.merchant_id || !phonepe?.salt_key || !phonepe?.salt_index}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Test Mode</span>
              <Badge variant="outline">
                {phonepe?.test_mode ? 'Yes' : 'No'}
              </Badge>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowPhonePeModal(true)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Configure PhonePe
          </Button>
        </div>
      </div>

      {/* Razorpay Configuration Modal */}
      <Dialog open={showRazorpayModal} onOpenChange={setShowRazorpayModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Razorpay</DialogTitle>
            <DialogDescription>
              Enter your Razorpay API credentials
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="razorpay_api_key">API Key *</Label>
              <Input
                id="razorpay_api_key"
                type="password"
                value={razorpayData.api_key}
                onChange={(e) => setRazorpayData({ ...razorpayData, api_key: e.target.value })}
                placeholder="rzp_test_..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="razorpay_api_secret">API Secret *</Label>
              <Input
                id="razorpay_api_secret"
                type="password"
                value={razorpayData.api_secret}
                onChange={(e) => setRazorpayData({ ...razorpayData, api_secret: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={razorpayData.test_mode}
                onCheckedChange={(checked) => setRazorpayData({ ...razorpayData, test_mode: checked })}
              />
              <Label>Test Mode</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRazorpayModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRazorpay}>Save Settings</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PhonePe Configuration Modal */}
      <Dialog open={showPhonePeModal} onOpenChange={setShowPhonePeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure PhonePe</DialogTitle>
            <DialogDescription>
              Enter your PhonePe merchant credentials
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="phonepe_merchant_id">Merchant ID *</Label>
              <Input
                id="phonepe_merchant_id"
                value={phonepeData.merchant_id}
                onChange={(e) => setPhonepeData({ ...phonepeData, merchant_id: e.target.value })}
                placeholder="MERCHANTUAT"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phonepe_salt_key">Salt Key *</Label>
              <Input
                id="phonepe_salt_key"
                type="password"
                value={phonepeData.salt_key}
                onChange={(e) => setPhonepeData({ ...phonepeData, salt_key: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phonepe_salt_index">Salt Index *</Label>
              <Input
                id="phonepe_salt_index"
                value={phonepeData.salt_index}
                onChange={(e) => setPhonepeData({ ...phonepeData, salt_index: e.target.value })}
                placeholder="1"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={phonepeData.test_mode}
                onCheckedChange={(checked) => setPhonepeData({ ...phonepeData, test_mode: checked })}
              />
              <Label>Test Mode</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPhonePeModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePhonePe}>Save Settings</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

