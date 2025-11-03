-- Create fix_steps table for storing repair/fix procedures
CREATE TABLE public.fix_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT,
  model TEXT,
  error_code TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  media_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX idx_fix_steps_brand ON public.fix_steps(brand);
CREATE INDEX idx_fix_steps_model ON public.fix_steps(model);
CREATE INDEX idx_fix_steps_error_code ON public.fix_steps(error_code);
CREATE INDEX idx_fix_steps_created_by ON public.fix_steps(created_by);

-- Enable RLS
ALTER TABLE public.fix_steps ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Fix steps are viewable by everyone" ON public.fix_steps
  FOR SELECT USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Users can create fix steps" ON public.fix_steps
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Allow users to update their own
CREATE POLICY "Users can update their own fix steps" ON public.fix_steps
  FOR UPDATE USING (auth.uid() = created_by);

-- Allow users to delete their own
CREATE POLICY "Users can delete their own fix steps" ON public.fix_steps
  FOR DELETE USING (auth.uid() = created_by);
