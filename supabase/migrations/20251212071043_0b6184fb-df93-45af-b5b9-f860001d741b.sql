-- Add phone column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text UNIQUE;

-- Create index for phone lookups
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);

-- Create storage bucket for UPI QR codes
INSERT INTO storage.buckets (id, name, public)
VALUES ('upi-qr-codes', 'upi-qr-codes', true)
ON CONFLICT (id) DO NOTHING;

-- Create table for UPI payment settings (admin uploads QR code)
CREATE TABLE IF NOT EXISTS public.payment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chit_id uuid REFERENCES public.chits(id) ON DELETE CASCADE NOT NULL,
  qr_code_url text,
  upi_id text,
  account_holder_name text,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid,
  UNIQUE(chit_id)
);

-- Enable RLS
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

-- Policies for payment_settings
CREATE POLICY "Admins can manage payment settings"
ON public.payment_settings
FOR ALL
USING (is_chit_admin(auth.uid(), chit_id));

CREATE POLICY "Members can view payment settings"
ON public.payment_settings
FOR SELECT
USING (is_chit_member(auth.uid(), chit_id));

-- Storage policies for UPI QR codes
CREATE POLICY "Admins can upload QR codes"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'upi-qr-codes' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view QR codes"
ON storage.objects
FOR SELECT
USING (bucket_id = 'upi-qr-codes');

CREATE POLICY "Admins can update QR codes"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'upi-qr-codes' AND auth.role() = 'authenticated');

CREATE POLICY "Admins can delete QR codes"
ON storage.objects
FOR DELETE
USING (bucket_id = 'upi-qr-codes' AND auth.role() = 'authenticated');