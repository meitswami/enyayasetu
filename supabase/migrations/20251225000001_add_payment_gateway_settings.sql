-- Payment Gateway Settings Table
-- Only one payment gateway can be active at a time

CREATE TABLE public.payment_gateway_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway public.payment_gateway NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT false,
  api_key TEXT,
  api_secret TEXT,
  merchant_id TEXT,
  salt_key TEXT,
  salt_index TEXT,
  webhook_url TEXT,
  test_mode BOOLEAN DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  CONSTRAINT only_one_active CHECK (
    NOT EXISTS (
      SELECT 1 FROM public.payment_gateway_settings 
      WHERE is_active = true AND id != payment_gateway_settings.id
    ) OR is_active = false
  )
);

-- Create index
CREATE INDEX idx_payment_gateway_settings_active ON public.payment_gateway_settings(is_active);

-- Enable RLS
ALTER TABLE public.payment_gateway_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can view/manage payment gateway settings
CREATE POLICY "Admins can view payment gateway settings" ON public.payment_gateway_settings
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can manage payment gateway settings" ON public.payment_gateway_settings
  FOR ALL USING (public.is_admin());

-- Function to ensure only one gateway is active
CREATE OR REPLACE FUNCTION public.enforce_single_active_gateway()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- If setting a gateway to active, deactivate all others
  IF NEW.is_active = true THEN
    UPDATE public.payment_gateway_settings
    SET is_active = false, updated_at = now()
    WHERE gateway != NEW.gateway AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER enforce_single_active_gateway_trigger
  BEFORE INSERT OR UPDATE ON public.payment_gateway_settings
  FOR EACH ROW
  WHEN (NEW.is_active = true)
  EXECUTE FUNCTION public.enforce_single_active_gateway();

-- Insert default entries (both inactive)
INSERT INTO public.payment_gateway_settings (gateway, is_active) VALUES
  ('razorpay', false),
  ('phonepe', false)
ON CONFLICT (gateway) DO NOTHING;

