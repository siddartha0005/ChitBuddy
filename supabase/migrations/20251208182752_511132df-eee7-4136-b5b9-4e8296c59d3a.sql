-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'member');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'member',
  UNIQUE (user_id, role)
);

-- Create chits table
CREATE TABLE public.chits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  chit_amount NUMERIC NOT NULL CHECK (chit_amount > 0),
  members_count INTEGER NOT NULL CHECK (members_count >= 2),
  months INTEGER NOT NULL CHECK (months >= 1),
  base_monthly_payment NUMERIC NOT NULL CHECK (base_monthly_payment > 0),
  post_take_monthly_payment NUMERIC NOT NULL CHECK (post_take_monthly_payment > 0),
  foreman_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  start_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chit_members table
CREATE TABLE public.chit_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chit_id UUID NOT NULL REFERENCES public.chits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  has_taken BOOLEAN NOT NULL DEFAULT false,
  taken_month INTEGER,
  join_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (chit_id, user_id)
);

-- Create months table
CREATE TABLE public.months (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chit_id UUID NOT NULL REFERENCES public.chits(id) ON DELETE CASCADE,
  month_index INTEGER NOT NULL CHECK (month_index >= 1),
  taker_member_id UUID REFERENCES public.chit_members(id) ON DELETE SET NULL,
  admin_selected_member_id UUID REFERENCES public.chit_members(id) ON DELETE SET NULL,
  admin_selected_reason TEXT,
  selection_method TEXT CHECK (selection_method IN ('admin', 'auction')),
  amount_received NUMERIC,
  auction_open BOOLEAN NOT NULL DEFAULT false,
  auction_closed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (chit_id, month_index)
);

-- Create bids table
CREATE TABLE public.bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month_id UUID NOT NULL REFERENCES public.months(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.chit_members(id) ON DELETE CASCADE,
  bid_amount NUMERIC NOT NULL CHECK (bid_amount >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ledger table (append-only)
CREATE TABLE public.ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chit_id UUID NOT NULL REFERENCES public.chits(id) ON DELETE CASCADE,
  month_id UUID REFERENCES public.months(id) ON DELETE SET NULL,
  member_id UUID NOT NULL REFERENCES public.chit_members(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('debit', 'credit')),
  amount NUMERIC NOT NULL,
  description TEXT,
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin_actions audit table
CREATE TABLE public.admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chit_id UUID NOT NULL REFERENCES public.chits(id) ON DELETE CASCADE,
  month_id UUID REFERENCES public.months(id) ON DELETE SET NULL,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chit_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.months ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents infinite recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user is admin of a chit
CREATE OR REPLACE FUNCTION public.is_chit_admin(_user_id UUID, _chit_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chits
    WHERE id = _chit_id
      AND foreman_id = _user_id
  )
$$;

-- Function to check if user is member of a chit
CREATE OR REPLACE FUNCTION public.is_chit_member(_user_id UUID, _chit_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chit_members
    WHERE chit_id = _chit_id
      AND user_id = _user_id
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles policies
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Chits policies
CREATE POLICY "Authenticated users can view chits they are part of" ON public.chits
  FOR SELECT USING (
    auth.uid() = foreman_id OR 
    public.is_chit_member(auth.uid(), id)
  );

CREATE POLICY "Admins can create chits" ON public.chits
  FOR INSERT WITH CHECK (
    auth.uid() = foreman_id AND 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Foreman can update their chits" ON public.chits
  FOR UPDATE USING (auth.uid() = foreman_id);

-- Chit members policies
CREATE POLICY "View chit members if part of chit" ON public.chit_members
  FOR SELECT USING (
    public.is_chit_admin(auth.uid(), chit_id) OR 
    public.is_chit_member(auth.uid(), chit_id)
  );

CREATE POLICY "Foreman can add members" ON public.chit_members
  FOR INSERT WITH CHECK (public.is_chit_admin(auth.uid(), chit_id));

CREATE POLICY "Foreman can update members" ON public.chit_members
  FOR UPDATE USING (public.is_chit_admin(auth.uid(), chit_id));

CREATE POLICY "Foreman can remove members" ON public.chit_members
  FOR DELETE USING (public.is_chit_admin(auth.uid(), chit_id));

-- Months policies
CREATE POLICY "View months if part of chit" ON public.months
  FOR SELECT USING (
    public.is_chit_admin(auth.uid(), chit_id) OR 
    public.is_chit_member(auth.uid(), chit_id)
  );

CREATE POLICY "Foreman can manage months" ON public.months
  FOR ALL USING (public.is_chit_admin(auth.uid(), chit_id));

-- Bids policies
CREATE POLICY "View bids if part of chit" ON public.bids
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.months m
      WHERE m.id = month_id
      AND (public.is_chit_admin(auth.uid(), m.chit_id) OR public.is_chit_member(auth.uid(), m.chit_id))
    )
  );

CREATE POLICY "Members can place bids" ON public.bids
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chit_members cm
      JOIN public.months m ON m.chit_id = cm.chit_id
      WHERE m.id = month_id
      AND cm.id = member_id
      AND cm.user_id = auth.uid()
      AND m.auction_open = true
    )
  );

-- Ledger policies
CREATE POLICY "View ledger if part of chit" ON public.ledger
  FOR SELECT USING (
    public.is_chit_admin(auth.uid(), chit_id) OR 
    public.is_chit_member(auth.uid(), chit_id)
  );

CREATE POLICY "System can insert ledger entries" ON public.ledger
  FOR INSERT WITH CHECK (
    public.is_chit_admin(auth.uid(), chit_id)
  );

-- Admin actions policies
CREATE POLICY "Admins can view their actions" ON public.admin_actions
  FOR SELECT USING (
    admin_id = auth.uid() OR 
    public.is_chit_admin(auth.uid(), chit_id)
  );

CREATE POLICY "Admins can log actions" ON public.admin_actions
  FOR INSERT WITH CHECK (
    admin_id = auth.uid() AND 
    public.is_chit_admin(auth.uid(), chit_id)
  );

-- Trigger to create profile and assign role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.email
  );
  
  -- Assign member role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'member');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();