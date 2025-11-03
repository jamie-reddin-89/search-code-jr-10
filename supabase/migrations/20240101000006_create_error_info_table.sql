-- Create error_info table for device-specific error information
CREATE TABLE public.error_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT,
  model TEXT,
  category TEXT,
  error_code TEXT NOT NULL,
  meaning TEXT NOT NULL,
  solution TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX idx_error_info_brand ON public.error_info(brand);
CREATE INDEX idx_error_info_model ON public.error_info(model);
CREATE INDEX idx_error_info_error_code ON public.error_info(error_code);
CREATE INDEX idx_error_info_brand_model_code ON public.error_info(brand, model, error_code);

-- Enable RLS
ALTER TABLE public.error_info ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Error info is viewable by everyone" ON public.error_info
  FOR SELECT USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Users can create error info" ON public.error_info
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Allow users to update their own
CREATE POLICY "Users can update their own error info" ON public.error_info
  FOR UPDATE USING (auth.uid() = created_by);

-- Allow users to delete their own
CREATE POLICY "Users can delete their own error info" ON public.error_info
  FOR DELETE USING (auth.uid() = created_by);
