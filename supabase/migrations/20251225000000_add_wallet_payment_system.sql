-- Wallet and Payment System Migration
-- This migration adds wallet, transactions, payments, invoices, promo codes, and add-ons support

-- Create enum for transaction types
CREATE TYPE public.transaction_type AS ENUM (
  'wallet_topup',
  'hearing_payment',
  'addon_payment',
  'refund',
  'admin_adjustment'
);

-- Create enum for payment status
CREATE TYPE public.payment_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed',
  'refunded',
  'cancelled'
);

-- Create enum for payment gateway
CREATE TYPE public.payment_gateway AS ENUM (
  'razorpay',
  'phonepe',
  'wallet',
  'manual'
);

-- Create enum for invoice status
CREATE TYPE public.invoice_status AS ENUM (
  'draft',
  'generated',
  'sent',
  'paid',
  'cancelled'
);

-- Create enum for addon status
CREATE TYPE public.addon_status AS ENUM (
  'active',
  'inactive',
  'archived'
);

-- Create user_wallets table
CREATE TABLE public.user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
  currency TEXT DEFAULT 'INR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create transactions table (wallet transactions)
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type public.transaction_type NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  balance_before DECIMAL(10, 2) NOT NULL,
  balance_after DECIMAL(10, 2) NOT NULL,
  description TEXT,
  reference_id UUID, -- Links to payments, invoices, etc.
  reference_type TEXT, -- 'payment', 'invoice', 'hearing_session', etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) -- Admin who created (for admin adjustments)
);

-- Create payments table (payment gateway transactions)
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  gateway public.payment_gateway NOT NULL,
  status public.payment_status NOT NULL DEFAULT 'pending',
  gateway_transaction_id TEXT, -- External gateway transaction ID
  gateway_order_id TEXT, -- Gateway order ID
  gateway_payment_id TEXT, -- Gateway payment ID
  gateway_signature TEXT, -- For verification
  metadata JSONB, -- Additional gateway-specific data
  failure_reason TEXT,
  refund_amount DECIMAL(10, 2) DEFAULT 0.00,
  refund_reason TEXT,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Create invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES public.payments(id),
  amount DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) DEFAULT 0.00,
  discount_amount DECIMAL(10, 2) DEFAULT 0.00,
  total_amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status public.invoice_status NOT NULL DEFAULT 'draft',
  invoice_data JSONB, -- Line items, description, etc.
  pdf_url TEXT, -- Generated PDF URL
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create promo_codes table
CREATE TABLE public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL,
  max_discount_amount DECIMAL(10, 2), -- For percentage discounts
  min_purchase_amount DECIMAL(10, 2) DEFAULT 0.00,
  max_uses INTEGER, -- NULL = unlimited
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create promo_code_usage table (track who used which code)
CREATE TABLE public.promo_code_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES public.payments(id),
  invoice_id UUID REFERENCES public.invoices(id),
  discount_amount DECIMAL(10, 2) NOT NULL,
  used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(promo_code_id, user_id, payment_id) -- Prevent duplicate usage per payment
);

-- Create addons table
CREATE TABLE public.addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE, -- e.g., 'ai_lawyer_assistant'
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status public.addon_status NOT NULL DEFAULT 'active',
  max_per_case INTEGER DEFAULT 1, -- Maximum allowed per case/hearing
  features JSONB, -- Feature list
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create case_addons table (add-ons applied to cases/hearings)
CREATE TABLE public.case_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  hearing_session_id UUID REFERENCES public.court_sessions(id) ON DELETE CASCADE,
  addon_id UUID NOT NULL REFERENCES public.addons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL, -- Price at time of purchase
  payment_id UUID REFERENCES public.payments(id),
  invoice_id UUID REFERENCES public.invoices(id),
  is_active BOOLEAN DEFAULT true,
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add payment tracking columns to court_sessions
ALTER TABLE public.court_sessions 
  ADD COLUMN payment_status public.payment_status DEFAULT 'pending',
  ADD COLUMN payment_id UUID REFERENCES public.payments(id),
  ADD COLUMN invoice_id UUID REFERENCES public.invoices(id),
  ADD COLUMN court_hearing_fee DECIMAL(10, 2) DEFAULT 1200.00,
  ADD COLUMN lawyer_type TEXT CHECK (lawyer_type IN ('ai_lawyer', 'actual_lawyer')),
  ADD COLUMN ai_lawyer_fee DECIMAL(10, 2) DEFAULT 500.00,
  ADD COLUMN actual_lawyer_fee DECIMAL(10, 2),
  ADD COLUMN actual_lawyer_id TEXT,
  ADD COLUMN actual_lawyer_email TEXT,
  ADD COLUMN actual_lawyer_otp TEXT,
  ADD COLUMN actual_lawyer_otp_expires_at TIMESTAMPTZ,
  ADD COLUMN actual_lawyer_consultation_requested BOOLEAN DEFAULT false,
  ADD COLUMN actual_lawyer_callback_number TEXT,
  ADD COLUMN total_fee DECIMAL(10, 2) DEFAULT 1200.00,
  ADD COLUMN payment_method public.payment_gateway,
  ADD COLUMN hearing_started BOOLEAN DEFAULT false;

-- Create indexes for better query performance
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_reference ON public.transactions(reference_id, reference_type);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_gateway_transaction_id ON public.payments(gateway_transaction_id);
CREATE INDEX idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX idx_invoices_payment_id ON public.invoices(payment_id);
CREATE INDEX idx_invoices_invoice_number ON public.invoices(invoice_number);
CREATE INDEX idx_promo_code_usage_user_id ON public.promo_code_usage(user_id);
CREATE INDEX idx_promo_code_usage_promo_code_id ON public.promo_code_usage(promo_code_id);
CREATE INDEX idx_case_addons_case_id ON public.case_addons(case_id);
CREATE INDEX idx_case_addons_hearing_session_id ON public.case_addons(hearing_session_id);
CREATE INDEX idx_case_addons_user_id ON public.case_addons(user_id);

-- Enable RLS on all tables
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_code_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_addons ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_wallets
CREATE POLICY "Users can view own wallet" ON public.user_wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallet" ON public.user_wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet" ON public.user_wallets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets" ON public.user_wallets
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update all wallets" ON public.user_wallets
  FOR UPDATE USING (public.is_admin());

-- RLS Policies for transactions
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions" ON public.transactions
  FOR SELECT USING (public.is_admin());

CREATE POLICY "System can insert transactions" ON public.transactions
  FOR INSERT WITH CHECK (true); -- Handled by triggers/functions

-- RLS Policies for payments
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments" ON public.payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments" ON public.payments
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update all payments" ON public.payments
  FOR UPDATE USING (public.is_admin());

-- RLS Policies for invoices
CREATE POLICY "Users can view own invoices" ON public.invoices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all invoices" ON public.invoices
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update all invoices" ON public.invoices
  FOR UPDATE USING (public.is_admin());

-- RLS Policies for promo_codes
CREATE POLICY "Anyone can view active promo codes" ON public.promo_codes
  FOR SELECT USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));

CREATE POLICY "Admins can view all promo codes" ON public.promo_codes
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can manage promo codes" ON public.promo_codes
  FOR ALL USING (public.is_admin());

-- RLS Policies for promo_code_usage
CREATE POLICY "Users can view own promo code usage" ON public.promo_code_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all promo code usage" ON public.promo_code_usage
  FOR SELECT USING (public.is_admin());

-- RLS Policies for addons
CREATE POLICY "Anyone can view active addons" ON public.addons
  FOR SELECT USING (status = 'active');

CREATE POLICY "Admins can view all addons" ON public.addons
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can manage addons" ON public.addons
  FOR ALL USING (public.is_admin());

-- RLS Policies for case_addons
CREATE POLICY "Users can view own case addons" ON public.case_addons
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own case addons" ON public.case_addons
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all case addons" ON public.case_addons
  FOR SELECT USING (public.is_admin());

-- Function to automatically create wallet for new users
CREATE OR REPLACE FUNCTION public.create_user_wallet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_wallets (user_id, balance)
  VALUES (NEW.id, 0.00)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger to create wallet on user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_wallet();

-- Function to update wallet balance
CREATE OR REPLACE FUNCTION public.update_wallet_balance(
  p_user_id UUID,
  p_amount DECIMAL,
  p_transaction_type public.transaction_type,
  p_description TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaction_id UUID;
  v_balance_before DECIMAL;
  v_balance_after DECIMAL;
BEGIN
  -- Get current balance
  SELECT balance INTO v_balance_before
  FROM public.user_wallets
  WHERE user_id = p_user_id;
  
  IF v_balance_before IS NULL THEN
    -- Create wallet if it doesn't exist
    INSERT INTO public.user_wallets (user_id, balance)
    VALUES (p_user_id, 0.00)
    ON CONFLICT (user_id) DO NOTHING;
    v_balance_before := 0.00;
  END IF;
  
  -- Calculate new balance
  v_balance_after := v_balance_before + p_amount;
  
  IF v_balance_after < 0 THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;
  
  -- Update wallet balance
  UPDATE public.user_wallets
  SET balance = v_balance_after,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Create transaction record
  INSERT INTO public.transactions (
    user_id,
    transaction_type,
    amount,
    balance_before,
    balance_after,
    description,
    reference_id,
    reference_type
  )
  VALUES (
    p_user_id,
    p_transaction_type,
    p_amount,
    v_balance_before,
    v_balance_after,
    p_description,
    p_reference_id,
    p_reference_type
  )
  RETURNING id INTO v_transaction_id;
  
  RETURN v_transaction_id;
END;
$$;

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_prefix TEXT := 'INV';
  v_year TEXT := TO_CHAR(now(), 'YYYY');
  v_month TEXT := TO_CHAR(now(), 'MM');
  v_sequence INTEGER;
BEGIN
  -- Get next sequence number for this month
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '\d+$') AS INTEGER)), 0) + 1
  INTO v_sequence
  FROM public.invoices
  WHERE invoice_number LIKE v_prefix || '-' || v_year || v_month || '-%';
  
  RETURN v_prefix || '-' || v_year || v_month || '-' || LPAD(v_sequence::TEXT, 6, '0');
END;
$$;

-- Insert default add-ons (Only AI Lawyer Assistant)
INSERT INTO public.addons (code, name, description, price, status, max_per_case, features) VALUES
(
  'ai_lawyer_assistant',
  'AI Lawyer Assistant',
  'Extra support for AI lawyer with deep search, OCR reading and understanding of case documents, media, and evidences. Includes Hash Value generation as per Indian Law Section 63(4)C for digital evidences.',
  250.00,
  'active',
  1,
  '{"features": ["Deep case analysis", "Enhanced OCR processing", "Document understanding", "Evidence hash generation (Section 63(4)C)", "Advanced legal research"]}'::jsonb
)
ON CONFLICT (code) DO NOTHING;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_wallets TO authenticated;
GRANT SELECT ON public.transactions TO authenticated;
GRANT SELECT, INSERT ON public.payments TO authenticated;
GRANT SELECT ON public.invoices TO authenticated;
GRANT SELECT ON public.promo_codes TO authenticated;
GRANT SELECT ON public.addons TO authenticated;
GRANT SELECT, INSERT ON public.case_addons TO authenticated;

