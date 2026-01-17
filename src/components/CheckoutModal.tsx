import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Wallet, CreditCard, IndianRupee, Loader2, Check, Info } from 'lucide-react';
import { WalletTopUp } from './WalletTopUp';

interface Addon {
  id: string;
  code: string;
  name: string;
  description: string;
  price: number;
}

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  caseId: string;
  onPaymentComplete: (sessionId: string) => void;
}

const COURT_HEARING_FEE = 1200;
const AI_LAWYER_FEE = 500;

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  open,
  onClose,
  caseId,
  onPaymentComplete,
}) => {
  const [lawyerType, setLawyerType] = useState<'ai_lawyer' | 'actual_lawyer' | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'gateway'>('wallet');
  const [walletBalance, setWalletBalance] = useState(0);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [activeGateway, setActiveGateway] = useState<'razorpay' | 'phonepe' | null>(null);
  const [callbackNumber, setCallbackNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTopUp, setShowTopUp] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchWalletBalance();
      fetchAddons();
      fetchActiveGateway();
    }
  }, [open]);

  const fetchWalletBalance = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setWalletBalance(data?.balance || 0);
    } catch (error: any) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  const fetchAddons = async () => {
    try {
      const { data, error } = await supabase
        .from('addons')
        .select('*')
        .eq('status', 'active')
        .order('price', { ascending: true });

      if (error) throw error;
      setAddons(data || []);
    } catch (error: any) {
      console.error('Error fetching addons:', error);
    }
  };

  const fetchActiveGateway = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_gateway_settings')
        .select('gateway')
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setActiveGateway(data?.gateway || null);
    } catch (error: any) {
      console.error('Error fetching active gateway:', error);
    }
  };

  const calculateTotal = () => {
    let total = COURT_HEARING_FEE;
    if (lawyerType === 'ai_lawyer') {
      total += AI_LAWYER_FEE;
    }
    selectedAddons.forEach(addonId => {
      const addon = addons.find(a => a.id === addonId);
      if (addon) total += addon.price;
    });
    return total - promoDiscount;
  };

  const toggleAddon = (addonId: string) => {
    setSelectedAddons(prev => 
      prev.includes(addonId) 
        ? prev.filter(id => id !== addonId)
        : [...prev, addonId]
    );
  };

  const handlePromoCodeApply = async () => {
    if (!promoCode.trim()) return;

    try {
      const totalBeforeDiscount = calculateTotal();
      // This would be validated on the server, but we can check format here
      toast({
        title: 'Promo Code',
        description: 'Promo code will be validated during payment.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleCheckout = async () => {
    if (!lawyerType) {
      toast({
        title: 'Selection Required',
        description: 'Please select a lawyer option (AI Lawyer or Actual Lawyer).',
        variant: 'destructive',
      });
      return;
    }

    if (lawyerType === 'actual_lawyer' && !callbackNumber.trim()) {
      toast({
        title: 'Mobile Number Required',
        description: 'Please provide your mobile number for Actual Lawyer consultation.',
        variant: 'destructive',
      });
      return;
    }

    const total = calculateTotal();
    const paymentNeeded = lawyerType === 'ai_lawyer' ? total : COURT_HEARING_FEE;

    // Check if wallet has enough balance
    if (paymentMethod === 'wallet' && walletBalance < paymentNeeded) {
      toast({
        title: 'Insufficient Balance',
        description: `Your wallet balance is ₹${walletBalance.toFixed(2)}. Please top up or use payment gateway.`,
        variant: 'destructive',
      });
      return;
    }

    // Check if payment gateway is available
    if (paymentMethod === 'gateway' && !activeGateway) {
      toast({
        title: 'Payment Gateway Not Available',
        description: 'No payment gateway is currently active. Please use wallet or contact support.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Create payment
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-payment', {
          body: {
          amount: paymentNeeded,
          gateway: paymentMethod === 'wallet' ? 'wallet' : activeGateway,
          type: 'hearing_payment',
          case_id: caseId,
          lawyer_type: lawyerType,
          addon_ids: selectedAddons,
          promo_code: promoCode || null,
          callback_number: lawyerType === 'actual_lawyer' ? callbackNumber : null,
        },
      });

      if (paymentError) throw paymentError;

      if (paymentData?.status === 'completed') {
        // Payment successful, create hearing session
        await createHearingSession(paymentData.payment_id);
      } else if (paymentData?.payment_id) {
        // Redirect to payment gateway (for Razorpay/PhonePe)
        // In production, this would open payment gateway URL
        toast({
          title: 'Payment Pending',
          description: 'Redirecting to payment gateway...',
        });
        // TODO: Implement payment gateway redirect
        // window.location.href = paymentData.payment_url;
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: 'Payment Failed',
        description: error.message || 'Failed to process payment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createHearingSession = async (paymentId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Generate court code
      const courtCode = Math.random().toString(36).substring(2, 10).toUpperCase();

      const total = calculateTotal();
      const sessionData: any = {
        case_id: caseId,
        court_code: courtCode,
        status: 'scheduled',
        payment_status: 'completed',
        payment_id: paymentId,
        court_hearing_fee: COURT_HEARING_FEE,
        lawyer_type: lawyerType,
        total_fee: total,
        payment_method: paymentMethod === 'wallet' ? 'wallet' : activeGateway,
      };

      if (lawyerType === 'ai_lawyer') {
        sessionData.ai_lawyer_fee = AI_LAWYER_FEE;
      } else {
        sessionData.actual_lawyer_consultation_requested = true;
        sessionData.actual_lawyer_callback_number = callbackNumber;
      }

      const { data: session, error: sessionError } = await supabase
        .from('court_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Create addon records for all selected addons
      if (selectedAddons.length > 0) {
        const addonRecords = selectedAddons.map(addonId => {
          const addon = addons.find(a => a.id === addonId);
          return {
            case_id: caseId,
            hearing_session_id: session.id,
            addon_id: addonId,
            user_id: user.id,
            price: addon?.price || 0,
            payment_id: paymentId,
          };
        });
        await supabase.from('case_addons').insert(addonRecords);
      }

      toast({
        title: 'Payment Successful!',
        description: `Court session created. Code: ${courtCode}`,
      });

      onPaymentComplete(session.id);
      onClose();
    } catch (error: any) {
      throw error;
    }
  };

  const paymentNeeded = lawyerType === 'ai_lawyer' ? calculateTotal() : COURT_HEARING_FEE;
  const canPayWithWallet = walletBalance >= paymentNeeded;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Checkout - Court Hearing
            </DialogTitle>
            <DialogDescription>
              Complete payment to start your court hearing session
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Current Wallet Balance */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Wallet Balance</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold flex items-center gap-1">
                    <IndianRupee className="w-5 h-5" />
                    {walletBalance.toFixed(2)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTopUp(true)}
                  >
                    Top Up
                  </Button>
                </div>
              </div>
            </div>

            {/* Lawyer Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Select Lawyer (Required - Choose One)</Label>
              <RadioGroup value={lawyerType || ''} onValueChange={(value: any) => setLawyerType(value)}>
                <div className="flex items-start space-x-3 p-4 border-2 rounded-lg hover:border-primary transition-colors">
                  <RadioGroupItem value="ai_lawyer" id="ai_lawyer" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="ai_lawyer" className="cursor-pointer">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold">AI Lawyer</span>
                        <Badge>₹{AI_LAWYER_FEE}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Immediate availability, AI-powered assistance
                      </p>
                    </Label>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 border-2 rounded-lg hover:border-primary transition-colors">
                  <RadioGroupItem value="actual_lawyer" id="actual_lawyer" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="actual_lawyer" className="cursor-pointer">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold">Actual Lawyer</span>
                        <Badge variant="outline">Variable</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Consultation required, team will call with quote
                      </p>
                      {lawyerType === 'actual_lawyer' && (
                        <Input
                          placeholder="Enter mobile number"
                          value={callbackNumber}
                          onChange={(e) => setCallbackNumber(e.target.value)}
                          className="mt-2"
                        />
                      )}
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Add-on Selection */}
            {addons.length > 0 && (
              <div className="space-y-3">
                <Label className="text-base font-semibold">Add-ons (Optional - Each can be selected once)</Label>
                <div className="space-y-2">
                  {addons.map((addon) => {
                    const isSelected = selectedAddons.includes(addon.id);
                    return (
                      <div 
                        key={addon.id} 
                        className={`flex items-start space-x-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                          isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => toggleAddon(addon.id)}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleAddon(addon.id)}
                          className="mt-1 w-4 h-4"
                        />
                        <Label className="cursor-pointer flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium">{addon.name}</span>
                              <p className="text-sm text-muted-foreground">{addon.description}</p>
                            </div>
                            <Badge variant={isSelected ? "default" : "secondary"}>₹{addon.price}</Badge>
                          </div>
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Promo Code */}
            <div className="space-y-2">
              <Label>Promo Code (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                />
                <Button variant="outline" onClick={handlePromoCodeApply}>
                  Apply
                </Button>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Payment Method</Label>
              <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                <div className={`flex items-center space-x-3 p-4 border-2 rounded-lg ${canPayWithWallet ? 'hover:border-primary' : 'opacity-50'}`}>
                  <RadioGroupItem value="wallet" id="wallet" disabled={!canPayWithWallet} />
                  <Label htmlFor="wallet" className={`cursor-pointer flex-1 ${!canPayWithWallet && 'cursor-not-allowed'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4" />
                        <span>Wallet</span>
                      </div>
                      {!canPayWithWallet && (
                        <Badge variant="destructive">Insufficient Balance</Badge>
                      )}
                    </div>
                  </Label>
                </div>

                <div className={`flex items-center space-x-3 p-4 border-2 rounded-lg ${activeGateway ? 'hover:border-primary' : 'opacity-50'}`}>
                  <RadioGroupItem value="gateway" id="gateway" disabled={!activeGateway} />
                  <Label htmlFor="gateway" className={`cursor-pointer flex-1 ${!activeGateway && 'cursor-not-allowed'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        <span>{activeGateway ? activeGateway.charAt(0).toUpperCase() + activeGateway.slice(1) : 'Payment Gateway'}</span>
                      </div>
                      {!activeGateway && (
                        <Badge variant="destructive">Not Available</Badge>
                      )}
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Price Summary */}
            <div className="border-2 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span>Court Hearing Fee</span>
                <span className="font-semibold">₹{COURT_HEARING_FEE}</span>
              </div>
              {lawyerType === 'ai_lawyer' && (
                <div className="flex justify-between">
                  <span>AI Lawyer Fee</span>
                  <span className="font-semibold">₹{AI_LAWYER_FEE}</span>
                </div>
              )}
              {lawyerType === 'actual_lawyer' && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Actual Lawyer Fee</span>
                  <span>Variable (consultation required)</span>
                </div>
              )}
              {selectedAddons.length > 0 && selectedAddons.map(addonId => {
                const addon = addons.find(a => a.id === addonId);
                return addon ? (
                  <div key={addonId} className="flex justify-between">
                    <span>Add-on: {addon.name}</span>
                    <span className="font-semibold">₹{addon.price}</span>
                  </div>
                ) : null;
              })}
              {promoDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Promo Code Discount</span>
                  <span>-₹{promoDiscount}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Amount to Pay Now</span>
                <span className="text-primary">
                  ₹{paymentNeeded.toFixed(2)}
                </span>
              </div>
              {lawyerType === 'actual_lawyer' && (
                <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-950 rounded text-sm text-blue-900 dark:text-blue-100">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>You'll pay ₹{COURT_HEARING_FEE} now. Actual Lawyer fees will be communicated after consultation.</span>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleCheckout} disabled={loading || !lawyerType}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Pay ₹{paymentNeeded.toFixed(2)}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <WalletTopUp
        open={showTopUp}
        onClose={() => {
          setShowTopUp(false);
          fetchWalletBalance();
        }}
        currentBalance={walletBalance}
        onBalanceUpdate={setWalletBalance}
      />
    </>
  );
};

