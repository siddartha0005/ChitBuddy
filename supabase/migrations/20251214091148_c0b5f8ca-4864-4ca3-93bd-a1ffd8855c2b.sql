-- Add status column to ledger for payment confirmation
ALTER TABLE public.ledger 
ADD COLUMN status text NOT NULL DEFAULT 'pending';

-- Add confirmed_by and confirmed_at columns
ALTER TABLE public.ledger 
ADD COLUMN confirmed_by uuid,
ADD COLUMN confirmed_at timestamp with time zone;

-- Create index for faster pending payment queries
CREATE INDEX idx_ledger_status ON public.ledger(status);
CREATE INDEX idx_ledger_chit_status ON public.ledger(chit_id, status);