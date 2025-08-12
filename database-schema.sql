-- ================================
-- REAL ESTATE MULTI-TENANT SCHEMA
-- ================================
DROP TABLE IF EXISTS agencies CASCADE;
-- 1. CREATE AGENCIES TABLE
-- ========================
CREATE TABLE agencies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CREATE USER PROFILES TABLE
-- =============================
-- This extends Supabase's auth.users with our custom fields
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'agent', 'viewer')) DEFAULT 'agent',
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. UPDATE PROPERTIES TABLE
-- ==========================
-- Add agency_id to existing properties table
ALTER TABLE properties 
ADD COLUMN agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE;

-- Make agency_id required (after we populate existing data)
-- ALTER TABLE properties ALTER COLUMN agency_id SET NOT NULL;

-- 4. CREATE INDEXES FOR PERFORMANCE
-- =================================
CREATE INDEX idx_user_profiles_agency_id ON user_profiles(agency_id);
CREATE INDEX idx_properties_agency_id ON properties(agency_id);
CREATE INDEX idx_properties_agency_status ON properties(agency_id, status);
CREATE INDEX idx_properties_agency_type ON properties(agency_id, property_type);

-- 5. ENABLE ROW LEVEL SECURITY (RLS)
-- ==================================
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- 6. CREATE RLS POLICIES
-- ======================

-- Agencies: Users can only see their own agency
CREATE POLICY "Users can view their own agency" ON agencies
  FOR SELECT USING (
    id IN (
      SELECT agency_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Agency admins can update their agency" ON agencies
  FOR UPDATE USING (
    id IN (
      SELECT agency_id FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- User Profiles: Users can view profiles from their agency
CREATE POLICY "Users can view profiles from their agency" ON user_profiles
  FOR SELECT USING (
    agency_id IN (
      SELECT agency_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Agency admins can manage agency users" ON user_profiles
  FOR ALL USING (
    agency_id IN (
      SELECT agency_id FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Properties: Users can only see properties from their agency
CREATE POLICY "Users can view properties from their agency" ON properties
  FOR SELECT USING (
    agency_id IN (
      SELECT agency_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert properties for their agency" ON properties
  FOR INSERT WITH CHECK (
    agency_id IN (
      SELECT agency_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update properties from their agency" ON properties
  FOR UPDATE USING (
    agency_id IN (
      SELECT agency_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete properties from their agency" ON properties
  FOR DELETE USING (
    agency_id IN (
      SELECT agency_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

-- 7. CREATE FUNCTIONS
-- ===================

-- Function to automatically create user profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- This will be called after a user signs up
  -- The agency_id will be set via the application
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to get current user's agency_id
CREATE OR REPLACE FUNCTION get_current_user_agency_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT agency_id FROM user_profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. INSERT SAMPLE DATA
-- ====================

-- Create a sample agency
INSERT INTO agencies (id, name, address, phone) VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'Premium Real Estate', '123 Business St, New York, NY', '+1-555-0123');

-- Update existing properties to belong to the sample agency
UPDATE properties 
SET agency_id = '550e8400-e29b-41d4-a716-446655440000'
WHERE agency_id IS NULL;

-- Now make agency_id required
ALTER TABLE properties ALTER COLUMN agency_id SET NOT NULL;

-- 9. GRANT PERMISSIONS
-- ===================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON agencies TO authenticated;
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON properties TO authenticated;

-- Grant sequence permissions if using SERIAL columns
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;