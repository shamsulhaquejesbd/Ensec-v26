-- ============================================================================
-- ENSEC ERP & DISTRIBUTION PLATFORM - COMPLETE SUPABASE DATABASE SCHEMA
-- Compatible with PostgreSQL 15+ / Supabase SQL Editor
-- Project: isnhqtbmassgrqidnpmc.supabase.co
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. USERS & PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id BIGSERIAL PRIMARY KEY,
  uid TEXT UNIQUE, -- Supabase Auth UID or Firebase Auth UID
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT DEFAULT 'ensec2026', -- Login & application password
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'Field Force', -- 'Super Admin' | 'Sales Head' | 'Regional Manager' | 'Area Sales Manager' | 'Field Force' | 'Warehouse Manager' | 'Factory Manager' | 'Accounts / Finance' | 'Auditor'
  designation TEXT,
  department TEXT DEFAULT 'Operations',
  status TEXT DEFAULT 'Active',
  avatar TEXT,
  permissions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure password column exists if table was previously created without it
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password TEXT DEFAULT 'ensec2026';

-- ============================================================================
-- 2. WAREHOUSES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.warehouses (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  district TEXT DEFAULT 'Dhaka',
  incharge_name TEXT,
  incharge_phone TEXT,
  is_factory_plant BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. DISTRIBUTORS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.distributors (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  owner_name TEXT,
  proprietor_name TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  district TEXT DEFAULT 'Dhaka',
  region TEXT DEFAULT 'Dhaka Division',
  area TEXT,
  territory TEXT DEFAULT 'Central Market',
  db_point TEXT,
  market_hierarchy TEXT,
  departments TEXT[] DEFAULT '{}',
  address TEXT,
  warehouse_id BIGINT REFERENCES public.warehouses(id) ON DELETE SET NULL,
  credit_limit_bdt NUMERIC(12, 2) DEFAULT 500000.00,
  current_balance_bdt NUMERIC(12, 2) DEFAULT 0.00,
  current_outstanding_bdt NUMERIC(12, 2) DEFAULT 0.00,
  opening_balance_bdt NUMERIC(12, 2) DEFAULT 0.00,
  payment_terms_days INT DEFAULT 30,
  assigned_salesperson_id TEXT,
  assigned_salesperson_name TEXT,
  assigned_rep_id TEXT,
  assigned_rep_name TEXT,
  customer_category_id TEXT,
  customer_category_name TEXT,
  discontinue_date DATE,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Graceful column migrations for existing instances of distributors table
ALTER TABLE public.distributors ADD COLUMN IF NOT EXISTS owner_name TEXT;
ALTER TABLE public.distributors ADD COLUMN IF NOT EXISTS proprietor_name TEXT;
ALTER TABLE public.distributors ADD COLUMN IF NOT EXISTS district TEXT DEFAULT 'Dhaka';
ALTER TABLE public.distributors ADD COLUMN IF NOT EXISTS db_point TEXT;
ALTER TABLE public.distributors ADD COLUMN IF NOT EXISTS market_hierarchy TEXT;
ALTER TABLE public.distributors ADD COLUMN IF NOT EXISTS departments TEXT[] DEFAULT '{}';
ALTER TABLE public.distributors ADD COLUMN IF NOT EXISTS current_outstanding_bdt NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.distributors ADD COLUMN IF NOT EXISTS opening_balance_bdt NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.distributors ADD COLUMN IF NOT EXISTS payment_terms_days INT DEFAULT 30;
ALTER TABLE public.distributors ADD COLUMN IF NOT EXISTS assigned_salesperson_id TEXT;
ALTER TABLE public.distributors ADD COLUMN IF NOT EXISTS assigned_salesperson_name TEXT;
ALTER TABLE public.distributors ADD COLUMN IF NOT EXISTS assigned_rep_id TEXT;
ALTER TABLE public.distributors ADD COLUMN IF NOT EXISTS assigned_rep_name TEXT;
ALTER TABLE public.distributors ADD COLUMN IF NOT EXISTS customer_category_id TEXT;
ALTER TABLE public.distributors ADD COLUMN IF NOT EXISTS customer_category_name TEXT;
ALTER TABLE public.distributors ADD COLUMN IF NOT EXISTS discontinue_date DATE;
ALTER TABLE public.distributors ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_distributors_code ON public.distributors(code);
CREATE INDEX IF NOT EXISTS idx_distributors_status ON public.distributors(status);

-- ============================================================================
-- 4. CUSTOMERS & RETAILERS DIRECTORY
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.customers (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  owner_name TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  channel TEXT DEFAULT 'Distributor Sales', -- 'Distributor Sales' | 'Direct Sales'
  customer_type TEXT DEFAULT 'Retailer', -- 'Retailer' | 'Dealer' | 'Corporate Customer' | 'Workshop' | 'Project Customer'
  pricing_tier TEXT DEFAULT 'Dealer / Retailer Channel',
  assigned_distributor_id BIGINT REFERENCES public.distributors(id) ON DELETE SET NULL,
  assigned_distributor_name TEXT,
  district TEXT DEFAULT 'Dhaka',
  territory TEXT DEFAULT 'Mirpur',
  address TEXT,
  credit_limit_bdt NUMERIC(12, 2) DEFAULT 50000.00,
  outstanding_balance_bdt NUMERIC(12, 2) DEFAULT 0.00,
  status TEXT DEFAULT 'Active',
  gps_coordinates TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. FINISHED PRODUCTS TABLE (Lithium Battery Packs & SKUs)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.products (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  model TEXT NOT NULL,
  brand TEXT DEFAULT 'Ensec Lithium BD',
  category TEXT DEFAULT 'Electric Vehicle (EV) Batteries',
  
  -- Electrical & Battery Ratings
  nominal_voltage NUMERIC(6, 2) DEFAULT 51.20,
  capacity_ah NUMERIC(6, 2) DEFAULT 86.00,
  energy_wh NUMERIC(10, 2) DEFAULT 4403.20,
  battery_type TEXT DEFAULT 'LiFePO4',
  chemistry TEXT DEFAULT 'Lifepo4',

  -- Detailed Engineering & Technical Specifications
  normal_voltage TEXT DEFAULT '51.2V',
  rated_capacity TEXT DEFAULT '51.2V86Ah',
  cycle_life TEXT DEFAULT '>4000',
  typical_capacity_kwh TEXT DEFAULT '4.40KWH',
  max_charge_current TEXT DEFAULT '50A',
  standard_charging TEXT DEFAULT 'CC/CV, 0.5C, 58.4V.',
  max_discharge_current TEXT DEFAULT '120A/150A/200A',
  weight_kg TEXT DEFAULT '40KG (±)2%',
  dimension_cm TEXT DEFAULT '50*36*26',
  operating_temperature TEXT DEFAULT '0-60°C',
  mileage_km TEXT DEFAULT '80-90KM with Full Charge.',

  -- 5-Channel Pricing Architecture (BDT)
  trade_price_bdt NUMERIC(12, 2) DEFAULT 0.00,
  distributor_price_bdt NUMERIC(12, 2) DEFAULT 85000.00,
  dealer_price_bdt NUMERIC(12, 2) DEFAULT 89000.00,
  corporate_price_bdt NUMERIC(12, 2) DEFAULT 92000.00,
  project_price_bdt NUMERIC(12, 2) DEFAULT 88000.00,
  retail_price_bdt NUMERIC(12, 2) DEFAULT 98000.00,
  mrp_bdt NUMERIC(12, 2) DEFAULT 98000.00,
  assembly_cost_estimate_bdt NUMERIC(12, 2) DEFAULT 4500.00,
  category_prices JSONB DEFAULT '{}'::jsonb,

  -- Commercial & Manufacturing Parameters
  warranty_months INT DEFAULT 36,
  stock_quantity INT DEFAULT 0,
  unit TEXT DEFAULT 'Units',
  bom JSONB DEFAULT '[]'::jsonb,
  image_url TEXT,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safe Alter Table migration script (adds missing specification columns to existing tables)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS battery_type TEXT DEFAULT 'LiFePO4';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS chemistry TEXT DEFAULT 'Lifepo4';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS normal_voltage TEXT DEFAULT '51.2V';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS rated_capacity TEXT DEFAULT '51.2V86Ah';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cycle_life TEXT DEFAULT '>4000';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS typical_capacity_kwh TEXT DEFAULT '4.40KWH';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS max_charge_current TEXT DEFAULT '50A';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS standard_charging TEXT DEFAULT 'CC/CV, 0.5C, 58.4V.';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS max_discharge_current TEXT DEFAULT '120A/150A/200A';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS weight_kg TEXT DEFAULT '40KG (±)2%';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS dimension_cm TEXT DEFAULT '50*36*26';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS operating_temperature TEXT DEFAULT '0-60°C';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS mileage_km TEXT DEFAULT '80-90KM with Full Charge.';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS distributor_price_bdt NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS dealer_price_bdt NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS corporate_price_bdt NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS project_price_bdt NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS retail_price_bdt NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS assembly_cost_estimate_bdt NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_prices JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS bom JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'Units';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================================
-- 5.1 RAW MATERIAL CLASSIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.raw_material_classifications (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- e.g. 'CLS-CELL', 'CLS-ELEC', 'CLS-MECH'
  name TEXT NOT NULL, -- 'Active Electrochemical Cells', 'Power Electronics & Control', etc.
  description TEXT,
  color_tag TEXT DEFAULT 'amber',
  status TEXT DEFAULT 'Active', -- 'Active' | 'Inactive'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. RAW MATERIAL CATEGORIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.raw_material_categories (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- e.g. 'RMC-CELL', 'RMC-BMS', 'RMC-CASE'
  name TEXT NOT NULL, -- 'Cell', 'BMS', 'Casing', 'Wire & Busbar', 'Connector', 'PCB', 'Insulation & Pack'
  parent_classification TEXT, -- 'Active Electrochemical Cells', 'Power Electronics & Control', etc.
  description TEXT,
  status TEXT DEFAULT 'Active', -- 'Active' | 'Inactive'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. RAW MATERIALS TABLE (Kushtia Factory Inventory & SCM)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.raw_materials (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- e.g. 'RM-CELL-105', 'RM-BMS-48V'
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'Cell' | 'BMS' | 'Casing' | 'Connector' | 'Wire & Busbar' | 'PCB' | 'Insulation & Pack'
  category_id BIGINT REFERENCES public.raw_material_categories(id) ON DELETE SET NULL,
  unit TEXT NOT NULL DEFAULT 'Pieces', -- 'Pieces' | 'Units' | 'Sets' | 'Kits' | 'Sheets'
  stock_kushtia INT DEFAULT 0,
  reorder_level INT DEFAULT 0,
  last_purchase_unit_cost_bdt NUMERIC(12, 2) DEFAULT 0.00,
  standard_cost_bdt NUMERIC(12, 2) DEFAULT 0.00,
  status TEXT DEFAULT 'Active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. SALES ORDERS TABLE (Captured via Mobile App or Portal)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sales_orders (
  id BIGSERIAL PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  customer_id BIGINT REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  salesperson_id TEXT,
  salesperson_name TEXT NOT NULL,
  warehouse_id BIGINT REFERENCES public.warehouses(id) ON DELETE SET NULL,
  warehouse_name TEXT,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  gross_amount_bdt NUMERIC(12, 2) DEFAULT 0.00,
  discount_amount_bdt NUMERIC(12, 2) DEFAULT 0.00,
  tax_vat_bdt NUMERIC(12, 2) DEFAULT 0.00,
  net_amount_bdt NUMERIC(12, 2) NOT NULL,
  paid_amount_bdt NUMERIC(12, 2) DEFAULT 0.00,
  due_amount_bdt NUMERIC(12, 2) DEFAULT 0.00,
  status TEXT DEFAULT 'Pending Delivery', -- 'Pending Delivery' | 'Delivered' | 'Partially Delivered' | 'Cancelled'
  items_json JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of items: [{ productId, productName, quantity, unitPriceBDT, lineTotal }]
  applied_offer_code TEXT,
  cancellation_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 9. TADA CLAIMS TABLE (Field Travel & Daily Allowances)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tada_claims (
  id BIGSERIAL PRIMARY KEY,
  ff_code TEXT NOT NULL,
  ff_name TEXT NOT NULL,
  tran_date DATE NOT NULL DEFAULT CURRENT_DATE,
  distributor_name TEXT,
  route_name TEXT,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  mode TEXT DEFAULT 'Bus', -- 'Bus' | 'Rickshaw' | 'Motorcycle' | 'CNG' | 'Train' | 'Own DA'
  distance_km NUMERIC(6, 2) DEFAULT 0.0,
  fare_amount_bdt NUMERIC(10, 2) DEFAULT 0.00,
  da_amount_bdt NUMERIC(10, 2) DEFAULT 0.00,
  hotel_amount_bdt NUMERIC(10, 2) DEFAULT 0.00,
  misc_amount_bdt NUMERIC(10, 2) DEFAULT 0.00,
  total_amount_bdt NUMERIC(10, 2) NOT NULL,
  status TEXT DEFAULT 'Pending_HOS_Approval', -- 'Pending_HOS_Approval' | 'Approved' | 'Rejected'
  approver_name TEXT DEFAULT 'Mohammad Faruk (HOS)',
  approved_at TIMESTAMPTZ,
  remarks TEXT,
  receipt_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 10. WARRANTY & RMA TICKETS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.warranty_tickets (
  id BIGSERIAL PRIMARY KEY,
  ticket_number TEXT UNIQUE NOT NULL,
  serial_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  dealer_name TEXT,
  battery_brand TEXT DEFAULT 'Ensec Lithium BD',
  battery_model TEXT NOT NULL,
  battery_type TEXT DEFAULT 'LiFePO4',
  purchase_date DATE,
  defect_category TEXT NOT NULL, -- 'BMS Cutoff / No Voltage Output' | 'Cell Voltage Imbalance' | 'Capacity Drop / Low Mileage' | 'Charging Failure' | 'Connector / Cable Damage'
  detailed_description TEXT,
  is_battery_working TEXT DEFAULT 'No / Dead',
  urgency TEXT DEFAULT 'Normal', -- 'Normal' | 'High' | 'Urgent'
  status TEXT DEFAULT 'Complaint Registered', -- 'Complaint Registered' | 'Battery Received' | 'Technical Inspection' | 'In Repair' | 'Quality Control Passed' | 'Delivered'
  prior_repairs_count INT DEFAULT 0,
  notes TEXT,
  assigned_technician TEXT,
  resolution_type TEXT, -- 'Repaired' | 'Cell Replaced' | 'BMS Replaced' | 'Full Unit Replacement'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 11. ATTENDANCE & PUNCH LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.attendance_logs (
  id BIGSERIAL PRIMARY KEY,
  rep_name TEXT NOT NULL,
  punch_type TEXT NOT NULL, -- 'Punch IN' | 'Punch OUT'
  punch_time TEXT NOT NULL,
  punch_date DATE NOT NULL DEFAULT CURRENT_DATE,
  gps_location TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 12. CASH BOOK & FINANCE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cash_book_entries (
  id BIGSERIAL PRIMARY KEY,
  voucher_no TEXT UNIQUE NOT NULL,
  voucher_date DATE NOT NULL DEFAULT CURRENT_DATE,
  account_type TEXT NOT NULL, -- 'Head Office Cash' | 'Factory Cash' | 'City Bank PLC' | 'Eastern Bank PLC'
  transaction_category TEXT NOT NULL, -- 'Customer Payment' | 'Distributor Payment' | 'Field Force Expense' | 'Transport Expense' | 'Bank Transfer'
  description TEXT NOT NULL,
  reference TEXT,
  cash_in_bdt NUMERIC(12, 2) DEFAULT 0.00,
  cash_out_bdt NUMERIC(12, 2) DEFAULT 0.00,
  running_balance_bdt NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 13. INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_customers_code ON public.customers(code);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_sales_orders_number ON public.sales_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_sales_orders_date ON public.sales_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_tada_claims_code ON public.tada_claims(ff_code);
CREATE INDEX IF NOT EXISTS idx_tada_claims_date ON public.tada_claims(tran_date);
CREATE INDEX IF NOT EXISTS idx_warranty_tickets_number ON public.warranty_tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_warranty_tickets_serial ON public.warranty_tickets(serial_number);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_date ON public.attendance_logs(punch_date);
CREATE INDEX IF NOT EXISTS idx_raw_material_categories_code ON public.raw_material_categories(code);
CREATE INDEX IF NOT EXISTS idx_raw_materials_code ON public.raw_materials(code);
CREATE INDEX IF NOT EXISTS idx_raw_materials_category ON public.raw_materials(category);

-- ============================================================================
-- 14. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_material_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tada_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranty_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_book_entries ENABLE ROW LEVEL SECURITY;

-- Allow read & write access for authenticated users & anon API key
DO $$
BEGIN
  -- Users policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Allow public access') THEN
    CREATE POLICY "Allow public access" ON public.users FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Customers policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Allow public access') THEN
    CREATE POLICY "Allow public access" ON public.customers FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Distributors policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'distributors' AND policyname = 'Allow public access') THEN
    CREATE POLICY "Allow public access" ON public.distributors FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Warehouses policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'warehouses' AND policyname = 'Allow public access') THEN
    CREATE POLICY "Allow public access" ON public.warehouses FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Products policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Allow public access') THEN
    CREATE POLICY "Allow public access" ON public.products FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Raw Material Classifications policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'raw_material_classifications' AND policyname = 'Allow public access') THEN
    CREATE POLICY "Allow public access" ON public.raw_material_classifications FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Raw Material Categories policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'raw_material_categories' AND policyname = 'Allow public access') THEN
    CREATE POLICY "Allow public access" ON public.raw_material_categories FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Raw Materials policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'raw_materials' AND policyname = 'Allow public access') THEN
    CREATE POLICY "Allow public access" ON public.raw_materials FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Sales Orders policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sales_orders' AND policyname = 'Allow public access') THEN
    CREATE POLICY "Allow public access" ON public.sales_orders FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- TADA Claims policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tada_claims' AND policyname = 'Allow public access') THEN
    CREATE POLICY "Allow public access" ON public.tada_claims FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Warranty Tickets policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'warranty_tickets' AND policyname = 'Allow public access') THEN
    CREATE POLICY "Allow public access" ON public.warranty_tickets FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Attendance policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'attendance_logs' AND policyname = 'Allow public access') THEN
    CREATE POLICY "Allow public access" ON public.attendance_logs FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Cash Book policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cash_book_entries' AND policyname = 'Allow public access') THEN
    CREATE POLICY "Allow public access" ON public.cash_book_entries FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

--- ============================================================================
--- 14.1 SUPABASE REALTIME REPLICATION (Instant UI & Dashboard Updates)
--- ============================================================================
-- Enables live CDC streaming so Supabase Dashboard Table Editor and clients
-- see new and modified rows immediately without manual page refresh.
DO $$
BEGIN
  -- Set replica identity to FULL for comprehensive payload delivery
  ALTER TABLE public.raw_material_classifications REPLICA IDENTITY FULL;
  ALTER TABLE public.raw_material_categories REPLICA IDENTITY FULL;
  ALTER TABLE public.raw_materials REPLICA IDENTITY FULL;
  ALTER TABLE public.products REPLICA IDENTITY FULL;
  ALTER TABLE public.distributors REPLICA IDENTITY FULL;
  ALTER TABLE public.warehouses REPLICA IDENTITY FULL;

  -- Add tables to the supabase_realtime publication
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.raw_material_classifications;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.raw_material_categories;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.raw_materials;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.distributors;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.warehouses;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- ============================================================================
-- 15. SEED INITIAL DATA (Optional / Production Defaults)
-- ============================================================================
INSERT INTO public.users (name, email, password, phone, role, designation, department)
VALUES
  ('Engr. Sohidul Islam', 'sohidul@ensecbd.com', 'ensec2026', '+880 1711-234567', 'Super Admin', 'Managing Director & CTO', 'Executive Management'),
  ('Tanvir Hossain', 'tanvir.sales@ensecbd.com', 'ensec2026', '+880 1819-345678', 'Sales Head', 'National Head of Sales', 'Sales & Marketing'),
  ('Mustafizur Rahman', 'mustafiz.kushtia@ensecbd.com', 'ensec2026', '+880 1912-987654', 'Factory Manager', 'Head of Kushtia Assembly Plant', 'Manufacturing'),
  ('Kamrul Hasan', 'kamrul.accounts@ensecbd.com', 'ensec2026', '+880 1612-443322', 'Accounts / Finance', 'Senior Finance Manager', 'Finance & Accounts'),
  ('Rafiqul Alam', 'rafiqul.dhaka1@ensecbd.com', 'ensec2026', '+880 1722-887766', 'Warehouse Manager', 'Central Warehouse In-Charge (Tejgaon)', 'Supply Chain'),
  ('Md. Abdur Rahman', 'abdur.spo@ensecbd.com', 'ensec2026', '+880 1711-209841', 'Field Force', 'Senior SPO (Mirpur)', 'Field Operations')
ON CONFLICT (email) DO UPDATE SET 
  password = EXCLUDED.password,
  updated_at = NOW();

INSERT INTO public.warehouses (code, name, location, district, is_factory_plant)
VALUES
  ('WH-01', 'Dhaka Central Hub 1', 'Tejgaon Industrial Area', 'Dhaka', FALSE),
  ('WH-02', 'Kushtia Manufacturing Plant', 'Kushtia BSCIC Industrial Estate', 'Kushtia', TRUE),
  ('WH-03', 'Chattogram Port Depot', 'Agrabad Commercial Area', 'Chattogram', FALSE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.raw_material_categories (code, name, parent_classification, description, status)
VALUES
  ('RMC-CELL', 'Cell', 'Active Electrochemical Cells', 'Lithium Iron Phosphate (LiFePO4) & NMC prismatic and cylindrical cells (3.2V 105Ah, 280Ah Grade-A) for battery pack assembly.', 'Active'),
  ('RMC-BMS', 'BMS', 'Power Electronics & Control', 'Battery Management Systems (4S to 16S), smart active balancers, CAN/RS485 communication boards, and Bluetooth telemetry modules.', 'Active'),
  ('RMC-CASE', 'Casing', 'Mechanical Hardware & Enclosure', 'Heavy-duty 19-inch 3U server rack sheet-metal enclosures, ABS IP65 solar enclosures, and industrial powder-coated cabinets.', 'Active'),
  ('RMC-WIRE', 'Wire & Busbar', 'Interconnects & Wiring', 'Pure copper nickel-plated busbars, laser-welded bus plates, high-temperature silicone cables, and terminal lugs.', 'Active'),
  ('RMC-CONN', 'Connector', 'Interconnects & Wiring', 'Anderson SB-50/SB-120 high-current connectors, aviation circular plugs, terminal posts, and quick-disconnect harness fittings.', 'Active'),
  ('RMC-PCB', 'PCB', 'Power Electronics & Control', 'Power distribution boards, LED status indicators, cell voltage sampling flex PCBs, and shunt current monitoring assemblies.', 'Active'),
  ('RMC-INSUL', 'Insulation & Pack', 'Thermal & Insulation Materials', 'FR4 epoxy glass fiber sheet insulation, EVA vibration absorption pads, Kapton polyimide tape, and thermal barrier silica blankets.', 'Active')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.raw_materials (code, name, category, unit, stock_kushtia, reorder_level, last_purchase_unit_cost_bdt, standard_cost_bdt)
VALUES
  ('RM-CELL-105', 'LiFePO4 Grade-A Prismatic Cell 3.2V 105Ah', 'Cell', 'Pieces', 4800, 1000, 3850.00, 3800.00),
  ('RM-CELL-280', 'LiFePO4 Mega Cell 3.2V 280Ah (Grade A)', 'Cell', 'Pieces', 1200, 400, 8200.00, 8100.00),
  ('RM-BMS-48V', 'Smart BMS 16S 48V 100A with LCD & CAN/RS485', 'BMS', 'Units', 350, 80, 4600.00, 4500.00),
  ('RM-BMS-12V', 'Smart Solar BMS 4S 12.8V 150A Bluetooth', 'BMS', 'Units', 650, 120, 2400.00, 2350.00),
  ('RM-CASE-3U', 'Server Rack 19-inch 3U Powder Coated Steel Enclosure', 'Casing', 'Sets', 320, 60, 3200.00, 3100.00),
  ('RM-CASE-SOLAR', 'ABS Heavy Duty Solar Box Enclosure IP65', 'Casing', 'Sets', 610, 100, 1850.00, 1800.00),
  ('RM-BUSBAR-CU', 'Nickel-Plated Pure Copper Busbars & Laser Terminals Kit', 'Wire & Busbar', 'Kits', 1100, 250, 650.00, 600.00),
  ('RM-INSUL-EPOXY', 'FR4 Epoxy Glass Fiber Insulation Board & Thermal Pad', 'Insulation & Pack', 'Sheets', 2400, 500, 280.00, 250.00)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.products (
  code, name, model, brand, category,
  nominal_voltage, capacity_ah, energy_wh, battery_type, chemistry,
  normal_voltage, rated_capacity, cycle_life, typical_capacity_kwh,
  max_charge_current, standard_charging, max_discharge_current,
  weight_kg, dimension_cm, operating_temperature, mileage_km,
  distributor_price_bdt, dealer_price_bdt, corporate_price_bdt, project_price_bdt,
  retail_price_bdt, trade_price_bdt, mrp_bdt, warranty_months, status
)
VALUES
  (
    'ENS-EN51.2V86AH', 'EN51.2V86AH', 'EN51.2V86AH', 'Ensec Lithium BD', 'Electric Vehicle (EV) Batteries',
    51.2, 86.0, 4403.20, 'LiFePO4', 'Lifepo4',
    '51.2V', '51.2V86Ah', '>4000', '4.40KWH',
    '50A', 'CC/CV, 0.5C, 58.4V.', '120A/150A/200A',
    '40KG (±)2%', '50*36*26', '0-60°C', '80-90KM with Full Charge.',
    85000.00, 89000.00, 92000.00, 88000.00,
    98000.00, 85000.00, 98000.00, 36, 'Active'
  ),
  (
    'EN-LFP-12100', 'Ensec LiFePO4 Inverter Battery 12V 100Ah', 'EN-LFP-12V100AH', 'Ensec Lithium BD', 'Inverter Lithium Battery',
    12.8, 100.0, 1280.00, 'LiFePO4', 'Lifepo4',
    '12.8V', '12.8V100Ah', '>3500', '1.28KWH',
    '50A', 'CC/CV, 0.5C, 14.6V.', '100A/150A',
    '12.5KG', '33*17*22', '0-55°C', 'N/A (Stationary Inverter)',
    32000.00, 34000.00, 35000.00, 33500.00,
    38000.00, 32000.00, 38000.00, 36, 'Active'
  ),
  (
    'EN-SOL-48100', 'SolarPro 48V 100Ah Server Rack Battery', 'SOL-48V100AH', 'SolarPro Series', 'Solar Energy Storage Batteries',
    51.2, 100.0, 5120.00, 'LiFePO4', 'Lifepo4',
    '51.2V', '51.2V100Ah', '>6000', '5.12KWH',
    '50A', 'CC/CV, 0.5C, 58.4V.', '100A/120A',
    '46KG', '44*48*17.5', '-10-60°C', 'N/A (Telecom & Solar ESS)',
    115000.00, 120000.00, 122000.00, 118000.00,
    135000.00, 115000.00, 135000.00, 60, 'Active'
  )
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.customers (code, name, phone, channel, customer_type, pricing_tier, territory, address)
VALUES
  ('RET-0001', 'SORNA COSMETIC AND CONFECTIONERY', '+880 1819-445522', 'Distributor Sales', 'Retailer', 'Dealer / Retailer Channel', 'Kadamtoly Doria', 'Shop 12, Kadamtoly Bazar, Bancharampur'),
  ('RET-0002', 'Bismillah Battery & Solar House', '+880 1711-889900', 'Distributor Sales', 'Dealer', 'Dealer / Retailer Channel', 'Mirpur 10', 'Plot 4, Main Road, Mirpur 10 Roundabout')
ON CONFLICT (code) DO NOTHING;



-- ============================================================================
-- 15. PRODUCT CATEGORIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.product_categories (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- e.g. 'CAT-TEL', 'CAT-SOL', 'CAT-EV'
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'Active', -- 'Active' | 'Inactive'
  product_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 16. PRODUCT BRANDS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.product_brands (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- e.g. 'BRD-ENSEC', 'BRD-OPTIMUM', 'BRD-VOLTMAX'
  name TEXT NOT NULL,
  origin TEXT DEFAULT 'Bangladesh (Kushtia Assembly Plant)',
  tagline TEXT,
  status TEXT DEFAULT 'Active', -- 'Active' | 'Inactive'
  product_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 17. CUSTOMER CATEGORIES TABLE (Pricing & Channel Tiers)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.customer_categories (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- e.g. 'CCAT-DIST-WHOLESALE', 'CCAT-DEALER-RETAIL'
  name TEXT NOT NULL,
  description TEXT,
  target_audience TEXT DEFAULT 'Both', -- 'Distributor' | 'Customer' | 'Both'
  discount_percentage NUMERIC(5, 2) DEFAULT 0.00,
  price_markup_percentage NUMERIC(5, 2) DEFAULT 0.00,
  status TEXT DEFAULT 'Active', -- 'Active' | 'Inactive'
  customer_count INT DEFAULT 0,
  distributor_count INT DEFAULT 0,
  product_price_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 18. ORG HIERARCHY TABLE (Company -> BU -> Division -> Region -> Area -> Territory)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.org_hierarchy (
  id BIGSERIAL PRIMARY KEY,
  node_id TEXT UNIQUE NOT NULL, -- e.g. 'org-1', 'org-2'
  code TEXT UNIQUE NOT NULL, -- e.g. 'ENSEC-HQ', 'BU-LIBAT', 'DIV-SALES'
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'Company' | 'Business Unit' | 'Division' | 'Region' | 'Area' | 'Territory'
  parent_id TEXT REFERENCES public.org_hierarchy(node_id) ON DELETE SET NULL,
  head_person TEXT,
  phone TEXT,
  tagged_distributor_ids TEXT[] DEFAULT '{}',
  tagged_customer_ids TEXT[] DEFAULT '{}',
  tagged_field_force_ids TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 19. DEPARTMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.departments (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- e.g. 'DEP-1', 'DEP-2'
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  division TEXT,
  head_of_department TEXT,
  email TEXT,
  phone TEXT,
  location TEXT,
  description TEXT,
  member_count INT DEFAULT 0,
  status TEXT DEFAULT 'Active', -- 'Active' | 'Inactive'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 20. BANKS LIST TABLE (Cash & Bank Accounts)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.banks (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- e.g. 'Bank-13', 'Bank-12'
  name TEXT NOT NULL,
  native_name TEXT,
  account_no TEXT NOT NULL,
  branch_name TEXT NOT NULL,
  routing_number TEXT,
  swift_code TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 21. UNITS OF MEASUREMENT TABLE (UOM)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.units_of_measurement (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- e.g. 'UOM-001', 'UOM-002'
  name TEXT NOT NULL, -- 'Pieces', 'Complete Set', 'Battery Module'
  symbol TEXT NOT NULL, -- 'pcs', 'set', 'mod'
  native_name TEXT, -- 'পিস', 'সেট'
  applicable_to TEXT NOT NULL DEFAULT 'Both', -- 'Finish Product' | 'Raw Material' | 'Both'
  category TEXT DEFAULT 'Discrete Count', -- 'Discrete Count' | 'Electrical Assembly' | 'Packaging & Container'
  is_base_unit BOOLEAN DEFAULT FALSE,
  allow_decimals BOOLEAN DEFAULT FALSE,
  decimal_places INT DEFAULT 0,
  standard_packaging_rate NUMERIC(10, 2) DEFAULT 1.00,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 22. FIELD FORCE TABLE (Sales Officers, Supervisors, Delivery Personnel)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.field_force_reps (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- e.g. 'FF-DHK-01', 'MEL00445'
  name TEXT NOT NULL,
  native_name TEXT,
  pin TEXT,
  phone TEXT NOT NULL,
  designation TEXT NOT NULL,
  field_force_type TEXT DEFAULT 'Capture', -- 'Capture' | 'CaptureAndApprove' | 'Order Booker' | 'Delivery Man' | 'Supervisor'
  department TEXT,
  departments TEXT[] DEFAULT '{}',
  region TEXT,
  area TEXT,
  territory TEXT,
  market_hierarchy TEXT,
  distributor_id BIGINT REFERENCES public.distributors(id) ON DELETE SET NULL,
  distributor_name TEXT,
  monthly_target_bdt NUMERIC(12, 2) DEFAULT 0.00,
  monthly_achieved_bdt NUMERIC(12, 2) DEFAULT 0.00,
  basic_salary_bdt NUMERIC(10, 2) DEFAULT 0.00,
  conveyance_bdt NUMERIC(10, 2) DEFAULT 0.00,
  ta_da_bdt NUMERIC(10, 2) DEFAULT 0.00,
  mobile_allowance_bdt NUMERIC(10, 2) DEFAULT 0.00,
  current_location JSONB DEFAULT '{}'::jsonb,
  joining_date DATE,
  discontinue_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 23. OFFERS & PROMOTIONS ENGINE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.offers_promotions (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- e.g. 'OFF-001', 'STX-BLN-01'
  title TEXT NOT NULL,
  discount_title TEXT,
  discount_native_title TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  discount_for TEXT DEFAULT 'All', -- 'Distributor' | 'Retailer' | 'Wholesaler' | 'Corporate' | 'Dealer' | 'All'
  department TEXT,
  discount_on TEXT DEFAULT 'LineItem', -- 'LineItem' | 'InvoiceSubtotal' | 'Category' | 'Brand'
  eligible_for TEXT DEFAULT 'Product', -- 'Product' | 'CustomerTier' | 'Region' | 'All'
  priority INT DEFAULT 1,
  when_condition TEXT DEFAULT 'Quantity', -- 'Quantity' | 'OrderValue' | 'PaymentMode'
  greater_than_or_equal_to NUMERIC(12, 2) DEFAULT 1,
  condition_value NUMERIC(12, 2) DEFAULT 1,
  provide_benefit TEXT DEFAULT 'PercentageDiscount', -- 'PercentageDiscount' | 'FixedAmount' | 'FreeSameProduct' | 'FreeChosenProduct'
  discount_amount NUMERIC(12, 2) DEFAULT 0.00,
  discount_percentage NUMERIC(5, 2) DEFAULT 0.00,
  flat_discount_bdt NUMERIC(12, 2) DEFAULT 0.00,
  free_product_qty INT DEFAULT 0,
  free_product_id TEXT,
  free_product_name TEXT,
  allow_discount_for TEXT DEFAULT 'FullQuantity',
  apply_in_multiples BOOLEAN DEFAULT TRUE,
  discount_limitation TEXT DEFAULT 'Unlimited',
  limit_times INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 24. INDEXES FOR NEW MASTER DATA TABLES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_product_categories_code ON public.product_categories(code);
CREATE INDEX IF NOT EXISTS idx_product_brands_code ON public.product_brands(code);
CREATE INDEX IF NOT EXISTS idx_customer_categories_code ON public.customer_categories(code);
CREATE INDEX IF NOT EXISTS idx_org_hierarchy_code ON public.org_hierarchy(code);
CREATE INDEX IF NOT EXISTS idx_org_hierarchy_parent ON public.org_hierarchy(parent_id);
CREATE INDEX IF NOT EXISTS idx_departments_code ON public.departments(code);
CREATE INDEX IF NOT EXISTS idx_banks_code ON public.banks(code);
CREATE INDEX IF NOT EXISTS idx_units_code ON public.units_of_measurement(code);
CREATE INDEX IF NOT EXISTS idx_field_force_code ON public.field_force_reps(code);
CREATE INDEX IF NOT EXISTS idx_field_force_phone ON public.field_force_reps(phone);
CREATE INDEX IF NOT EXISTS idx_offers_promotions_code ON public.offers_promotions(code);
CREATE INDEX IF NOT EXISTS idx_offers_promotions_dates ON public.offers_promotions(start_date, end_date);

-- ============================================================================
-- 25. ROW LEVEL SECURITY (RLS) FOR NEW TABLES
-- ============================================================================
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_hierarchy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units_of_measurement ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_force_reps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers_promotions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Product Categories policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_categories' AND policyname = 'Allow public access') THEN
    CREATE POLICY "Allow public access" ON public.product_categories FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Product Brands policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_brands' AND policyname = 'Allow public access') THEN
    CREATE POLICY "Allow public access" ON public.product_brands FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Customer Categories policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customer_categories' AND policyname = 'Allow public access') THEN
    CREATE POLICY "Allow public access" ON public.customer_categories FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Org Hierarchy policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'org_hierarchy' AND policyname = 'Allow public access') THEN
    CREATE POLICY "Allow public access" ON public.org_hierarchy FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Departments policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'departments' AND policyname = 'Allow public access') THEN
    CREATE POLICY "Allow public access" ON public.departments FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Banks policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'banks' AND policyname = 'Allow public access') THEN
    CREATE POLICY "Allow public access" ON public.banks FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Units of Measurement policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'units_of_measurement' AND policyname = 'Allow public access') THEN
    CREATE POLICY "Allow public access" ON public.units_of_measurement FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Field Force Reps policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'field_force_reps' AND policyname = 'Allow public access') THEN
    CREATE POLICY "Allow public access" ON public.field_force_reps FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Offers Promotions policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'offers_promotions' AND policyname = 'Allow public access') THEN
    CREATE POLICY "Allow public access" ON public.offers_promotions FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================================================
-- 26. INITIAL SEED DATA FOR NEW TABLES
-- ============================================================================

-- 1. Product Categories Seeds
INSERT INTO public.product_categories (code, name, description, status)
VALUES
  ('CAT-SOL', 'Solar Home System', '12.8V & 25.6V high-cycle lithium storage for off-grid residential and commercial solar installations.', 'Active'),
  ('CAT-EV', 'EV & E-Rickshaw', '60V & 72V traction battery packs for Bangladeshi electric three-wheelers and commercial light EVs.', 'Active'),
  ('CAT-IND', 'Commercial & Industrial', 'High-voltage and multi-megawatt containerized BESS solutions for manufacturing plants and spinning mills.', 'Active'),
  ('CAT-UPS', 'Inverter / UPS', 'Instant switchover lithium backup packs for home IPS, office offline UPS, and server power supplies.', 'Active')
ON CONFLICT (code) DO NOTHING;

-- 2. Product Brands Seeds
INSERT INTO public.product_brands (code, name, origin, tagline, status)
VALUES
  ('BRD-ENSEC', 'Ensec Lithium BD', 'Bangladesh (Kushtia Assembly Plant)', 'Engineered for extreme tropical durability & high-temperature cycle life.', 'Active'),
  ('BRD-OPTIMUM', 'Optimum Joint Venture', 'Bangladesh & China JV', 'Cost-optimized lithium packs with 50:50 shared manufacturing capital.', 'Active'),
  ('BRD-VOLTMAX', 'VoltMax Industrial', 'OEM Licensed', 'Heavy-duty traction and material handling energy packs.', 'Active')
ON CONFLICT (code) DO NOTHING;

-- 3. Customer Categories Seeds
INSERT INTO public.customer_categories (code, name, description, target_audience, discount_percentage, price_markup_percentage, status)
VALUES
  ('CCAT-DIST-WHOLESALE', 'Nationwide Authorized Distributor Tier', 'Premier regional warehouse stockists & exclusive DB points with largest order volumes and dedicated credit ceilings.', 'Distributor', 20.00, 0.00, 'Active'),
  ('CCAT-DEALER-RETAIL', 'Dealers, Workshops & Battery Retailers', 'Local battery shops, auto electric garages, and regional sub-dealers purchasing for aftermarket resale.', 'Customer', 14.00, 5.00, 'Active'),
  ('CCAT-CORP-TEL', 'Direct Corporate & Telecom Infrastructure', 'Tier-1 enterprise accounts including telecom tower operators, data centers, and multi-facility industrial conglomerates.', 'Customer', 12.00, 6.00, 'Active'),
  ('CCAT-PRJ-TENDER', 'Government Tenders & Solar Projects', 'BREB rural electrification mini-grids, donor-funded solar projects, and institutional energy storage tenders.', 'Customer', 15.00, 3.00, 'Active'),
  ('CCAT-END-CONSUMER', 'Walk-In & Direct Retail Consumer', 'Direct walk-in end consumers and non-contracted residential buyers receiving standard maximum retail price.', 'Customer', 0.00, 15.00, 'Active')
ON CONFLICT (code) DO NOTHING;

-- 4. Org Hierarchy Seeds
INSERT INTO public.org_hierarchy (node_id, code, name, type, parent_id, head_person, phone)
VALUES
  ('org-1', 'ENSEC-HQ', 'Ensec Bangladesh Ltd.', 'Company', NULL, 'Engr. Sohidul Islam', '+880 2 9887766'),
  ('org-2', 'BU-LIBAT', 'Lithium Battery Business Unit', 'Business Unit', 'org-1', NULL, NULL),
  ('org-3', 'DIV-SALES', 'National Sales Division', 'Division', 'org-2', 'Tanvir Hossain', NULL),
  ('org-4', 'REG-DHK', 'Dhaka Region', 'Region', 'org-3', 'Sabbir Ahmed (RM)', NULL),
  ('org-5', 'AREA-DHK-N', 'Dhaka North Area', 'Area', 'org-4', NULL, NULL),
  ('org-6', 'TERR-MIRPUR', 'Mirpur Territory', 'Territory', 'org-5', NULL, NULL),
  ('org-7', 'REG-CTG', 'Chittagong Region', 'Region', 'org-3', 'Mustafa Kamal (RM)', NULL),
  ('org-8', 'REG-KHU', 'Khulna & Kushtia Region', 'Region', 'org-3', 'Ashraful Alam (RM)', NULL)
ON CONFLICT (code) DO NOTHING;

-- 5. Departments Seeds
INSERT INTO public.departments (code, name, full_name, division, head_of_department, email, phone, location, status)
VALUES
  ('DEP-1', 'MOUSUMI NETWORK LTD', 'DEP-1 - MOUSUMI NETWORK LTD', 'Commercial & FMCG Distribution', 'Kazi Morshedul Alam', 'mousumi.network@ensec-optimum.com', '+880 1711-234567', 'Dhaka HQ - Tejgaon', 'Active'),
  ('DEP-2', 'PROFESSIONAL DIVISION', 'DEP-2 - PROFESSIONAL DIVISION', 'Corporate & Institutional Sales', 'Engr. Tariqul Islam', 'professional.div@ensec-optimum.com', '+880 1819-345678', 'Dhaka HQ - Banani', 'Active'),
  ('DEP-3', 'HBL EXCLUSIVE', 'DEP-3 - HBL EXCLUSIVE', 'OEM & High-Capacity Storage', 'Mahfuzur Rahman', 'hbl.exclusive@ensec-optimum.com', '+880 1713-456789', 'Dhaka HQ - Motijheel', 'Active'),
  ('DEP-4', 'BATTERY DISTRIBUTION DIVISION', 'DEP-4 - BATTERY DISTRIBUTION DIVISION', 'Primary Automotive & E-Mobility', 'Hasan Ali Chowdhury', 'battery.dist@ensec-optimum.com', '+880 1912-567890', 'Chittagong Hub - Agrabad', 'Active'),
  ('DEP-5', 'SOLAR & INDUSTRIAL SOLUTIONS', 'DEP-5 - SOLAR & INDUSTRIAL SOLUTIONS', 'Renewable & Utility Scale', 'Dr. Shahinur Rashid', 'solar.industrial@ensec-optimum.com', '+880 1714-678901', 'Kushtia Plant & Dhaka HQ', 'Active'),
  ('DEP-6', 'KUSHTIA FACTORY OPERATIONS', 'DEP-6 - KUSHTIA FACTORY OPERATIONS', 'Manufacturing & Plant Engineering', 'Engr. M. A. Kashem', 'factory.kushtia@ensec-optimum.com', '+880 1715-789012', 'Kushtia Industrial Estate', 'Active')
ON CONFLICT (code) DO NOTHING;

-- 6. Banks Seeds
INSERT INTO public.banks (code, name, native_name, account_no, branch_name, is_active)
VALUES
  ('Bank-13', 'MEL-Global Trade Point (0559)', 'এমইএল-গ্লোবাল ট্রেড পয়েন্ট (০৫৫৯)', '2061090000559', 'Banani', TRUE),
  ('Bank-12', 'MEL-Mercantile Bank PLC (8795)', 'এমইএল-মার্কেন্টাইল ব্যাংক পিএলসি', '1111001268795', 'Banani', TRUE),
  ('Bank-11', 'MNL-Dhaka Bank Limited (2036)', 'এমএনএল-ঢাকা ব্যাংক লিমিটেড', '2151750002036', 'Gulshan-2', TRUE),
  ('Bank-6', 'MNL-Dutch-Bangla Bank (9288)', 'এমএনএল-ডাচ-বাংলা ব্যাংক', '1161100029288', 'Gulshan', TRUE),
  ('Bank-10', 'Armanitola / HO Cash Payment', 'আরমানিটোলা / প্রধান কার্যালয় নগদ গ্রহণ', 'Hand Cash', 'Armanitola', TRUE)
ON CONFLICT (code) DO NOTHING;

-- 7. Units of Measurement Seeds
INSERT INTO public.units_of_measurement (code, name, symbol, native_name, applicable_to, category, is_base_unit, allow_decimals, standard_packaging_rate, is_active)
VALUES
  ('UOM-001', 'Pieces', 'pcs', 'পিস', 'Finish Product', 'Discrete Count', TRUE, FALSE, 1.00, TRUE),
  ('UOM-002', 'Complete Set', 'set', 'সেট', 'Finish Product', 'Electrical Assembly', FALSE, FALSE, 1.00, TRUE),
  ('UOM-003', 'Battery Module', 'mod', 'মডিউল', 'Finish Product', 'Discrete Count', FALSE, FALSE, 1.00, TRUE),
  ('UOM-004', 'Battery Pack', 'pack', 'প্যাক', 'Finish Product', 'Packaging & Container', FALSE, FALSE, 1.00, TRUE),
  ('UOM-005', 'Kilogram', 'kg', 'কেজি', 'Raw Material', 'Weight / Mass', TRUE, TRUE, 1.00, TRUE),
  ('UOM-006', 'Meter', 'm', 'মিটার', 'Raw Material', 'Length / Dimension', TRUE, TRUE, 1.00, TRUE),
  ('UOM-007', 'Sheet', 'sht', 'শীট', 'Raw Material', 'Discrete Count', FALSE, FALSE, 1.00, TRUE)
ON CONFLICT (code) DO NOTHING;

-- 8. Field Force Reps Seeds
INSERT INTO public.field_force_reps (code, name, native_name, phone, designation, department, region, area, territory, monthly_target_bdt, monthly_achieved_bdt, basic_salary_bdt, conveyance_bdt, ta_da_bdt, mobile_allowance_bdt, is_active)
VALUES
  ('FF-DHK-01', 'Zubair Ahmed', 'জুবায়ের আহমেদ', '+880 1714-554433', 'Territory Sales Officer (Dhaka North)', 'MOUSUMI NETWORK LTD', 'Dhaka Division', 'Dhaka North', 'Mirpur & Pallabi', 3500000.00, 2980000.00, 32000.00, 6500.00, 5000.00, 1500.00, TRUE),
  ('MEL00445', 'Fazleh Rabbi (Dhaka)', 'ফজলহ রাব্বি (ঢাকা)', '+880 1719-887766', 'Field Representative (Dhaka Metro)', 'MOUSUMI NETWORK LTD', 'Dhaka Division', 'Dhaka North', 'Mirpur & Pallabi', 2800000.00, 2450000.00, 28000.00, 5500.00, 4500.00, 1500.00, TRUE),
  ('FF-CTG-01', 'Tanvir Ahmed Chowdhury', 'তানভীর আহমেদ চৌধুরী', '+880 1819-223344', 'Area Sales Manager (Chittagong South)', 'BATTERY DISTRIBUTION DIVISION', 'Chittagong Division', 'Chittagong South', 'Agrabad & Halishahar', 4200000.00, 3890000.00, 45000.00, 8000.00, 7000.00, 2000.00, TRUE),
  ('FF-KST-01', 'Mijanur Rahman', 'মিজানুর রহমান', '+880 1712-998877', 'Territory Officer (Kushtia & Jashore)', 'KUSHTIA FACTORY OPERATIONS', 'Khulna Division', 'Kushtia', 'Kushtia Sadar & Poradah', 2500000.00, 2310000.00, 30000.00, 5000.00, 4000.00, 1500.00, TRUE)
ON CONFLICT (code) DO NOTHING;

-- 9. Offers & Promotions Seeds
INSERT INTO public.offers_promotions (code, title, discount_title, discount_native_title, start_date, end_date, discount_for, department, discount_on, eligible_for, priority, when_condition, greater_than_or_equal_to, condition_value, provide_benefit, discount_amount, free_product_qty, allow_discount_for, apply_in_multiples, discount_limitation, is_active)
VALUES
  ('STX-BLN-01', 'Stx.P Primary Blonde Powder (8p=1p Free)', 'Stx.P Primary Blonde Powder (8p=1p Free)', 'এসটিএক্স.পি প্রাইমারি ব্লন্ড পাউডার (৮টি কিনলে ১টি ফ্রি)', '2026-06-14', '2026-11-01', 'Distributor', 'DEP-1 - MOUSUMI NETWORK LTD', 'LineItem', 'Product', 1, 'Quantity', 8.00, 8.00, 'FreeSameProduct', 1.00, 1, 'FullQuantity', TRUE, 'Unlimited', TRUE),
  ('LUCY-ABO-100', 'Lucy Advanced Baby Oil 200ml (3p= 100/- OFF)', 'Lucy Advanced Baby Oil 200ml (3p= 100/- OFF)', 'লুসি অ্যাডভান্সড বেবি অয়েল ২০০মি.লি ৩৯০/- (৩টিতে ১০০/- ছাড়)', '2026-10-07', '2026-11-01', 'Retailer', 'DEP-1 - MOUSUMI NETWORK LTD', 'LineItem', 'Product', 3, 'Quantity', 3.00, 3.00, 'FixedAmount', 100.00, 0, 'FullQuantity', TRUE, 'Unlimited', TRUE),
  ('EN-LFP-PROMO10', 'Ensec Inverter Lithium Battery Launch Promo', '10% Flat Invoice Discount on 48V Modules', 'এনসেক ইনভার্টার লিথিয়াম ব্যাটারি ১০% ছাড়', '2026-01-01', '2026-12-31', 'All', 'DEP-2 - PROFESSIONAL DIVISION', 'InvoiceSubtotal', 'All', 2, 'OrderValue', 100000.00, 100000.00, 'PercentageDiscount', 10.00, 0, 'FullQuantity', FALSE, 'Unlimited', TRUE)
ON CONFLICT (code) DO NOTHING;


-- ============================================================================
-- 27. STOCK CID RECEIVE (MATERIAL RECEIVE REPORT - MRR) & INWARD RECEIPTS
-- Matches "Stock Receive Product" section & CID Receive Form in StockModule
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.stock_cid_receipts (
  id BIGSERIAL PRIMARY KEY,
  voucher_id TEXT UNIQUE, -- e.g. 'CID-MRR-2026-0045'
  mrr_number TEXT UNIQUE NOT NULL,
  receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
  source_type TEXT NOT NULL DEFAULT 'Kushtia Manufacturing Plant', -- 'Kushtia Manufacturing Plant' | 'Optimum JV Joint Venture Plant' | 'Factory Assembly Line 1 (LiFePO4 ESS)' | 'Factory Assembly Line 2 (EV 60V / 72V)' | 'Subcontractor / Direct Production Lot' | 'Returned Finished Goods (Factory Re-certified)'
  source_location TEXT DEFAULT 'Kushtia Factory - Main Plant Bay 3',
  warehouse_id BIGINT REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  target_warehouse_name TEXT NOT NULL DEFAULT 'Dhaka Central Warehouse (Tejgaon)',
  challan_number TEXT,
  gate_pass_number TEXT,
  truck_number TEXT,
  carrier_vehicle_no TEXT,
  driver_name TEXT,
  driver_phone TEXT,
  received_by TEXT NOT NULL DEFAULT 'Warehouse In-charge',
  qc_inspector TEXT DEFAULT 'Engr. Sohidul Islam (Lead QC)',
  qc_status TEXT NOT NULL DEFAULT 'QC Passed & Stamped', -- 'QC Passed & Stamped' | 'Conditionally Accepted' | 'Pending QC Inspection' | 'QC Failed'
  status TEXT NOT NULL DEFAULT 'Received & Stocked', -- 'Pending Verification' | 'Verified & Posted' | 'Rejected' | 'Received & Stocked'
  total_items INT DEFAULT 0,
  total_quantity NUMERIC(12, 2) DEFAULT 0,
  total_amount_bdt NUMERIC(14, 2) DEFAULT 0,
  general_remarks TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 28. STOCK CID RECEIPT ITEMS (LINE ITEMS FOR STOCK RECEIVE PRODUCT SECTION)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.stock_cid_receipt_items (
  id BIGSERIAL PRIMARY KEY,
  receipt_id BIGINT REFERENCES public.stock_cid_receipts(id) ON DELETE CASCADE,
  mrr_number TEXT NOT NULL,
  product_id BIGINT REFERENCES public.products(id) ON DELETE SET NULL,
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  sku TEXT,
  category TEXT,
  batch_number TEXT NOT NULL,
  serial_range TEXT,
  received_qty NUMERIC(12, 2) NOT NULL DEFAULT 1,
  unit_cost_bdt NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_cost_bdt NUMERIC(14, 2) NOT NULL DEFAULT 0,
  rack_location TEXT DEFAULT 'Row A - Shelf 01',
  package_condition TEXT DEFAULT 'Factory Sealed',
  line_remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 29. WAREHOUSE PHYSICAL STOCK BALANCES (REAL-TIME INVENTORY TRACKING)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.stock_inventory (
  id BIGSERIAL PRIMARY KEY,
  warehouse_id BIGINT REFERENCES public.warehouses(id) ON DELETE CASCADE,
  warehouse_code TEXT,
  warehouse_name TEXT,
  product_id BIGINT REFERENCES public.products(id) ON DELETE CASCADE,
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  sku TEXT,
  category TEXT,
  batch_number TEXT NOT NULL DEFAULT 'GEN-BATCH',
  rack_location TEXT DEFAULT 'Bay-1 / Shelf-A',
  quantity_on_hand NUMERIC(12, 2) NOT NULL DEFAULT 0,
  quantity_reserved NUMERIC(12, 2) NOT NULL DEFAULT 0,
  quantity_available NUMERIC(12, 2) GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
  unit_cost_bdt NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_valuation_bdt NUMERIC(14, 2) GENERATED ALWAYS AS (quantity_on_hand * unit_cost_bdt) STORED,
  last_mrr_number TEXT,
  last_received_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_wh_product_batch UNIQUE(warehouse_id, product_id, batch_number)
);

-- ============================================================================
-- 30. STOCK OPENING RECORDS (CREATE & UPLOAD OPENING STOCK)
-- Matches StockModule Tabs "Create Opening Stock" and "Upload Opening Stock"
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.stock_opening_records (
  id BIGSERIAL PRIMARY KEY,
  warehouse_id BIGINT REFERENCES public.warehouses(id) ON DELETE SET NULL,
  warehouse_name TEXT,
  product_id BIGINT REFERENCES public.products(id) ON DELETE SET NULL,
  product_code TEXT,
  product_name TEXT NOT NULL,
  sku TEXT,
  category TEXT,
  batch_number TEXT NOT NULL DEFAULT 'OPN-2026',
  quantity NUMERIC(12, 2) NOT NULL DEFAULT 0,
  unit_cost_bdt NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_cost_bdt NUMERIC(14, 2) DEFAULT 0,
  rack_location TEXT,
  source_method TEXT DEFAULT 'Manual', -- 'Manual' | 'CSV Upload' | 'Excel Upload'
  entry_date DATE DEFAULT CURRENT_DATE,
  entered_by TEXT DEFAULT 'System Admin',
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 31. STOCK ISSUES & STOCK ISSUE ITEMS (ISSUED TAB)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.stock_issues (
  id BIGSERIAL PRIMARY KEY,
  issue_number TEXT UNIQUE NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  warehouse_id BIGINT REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  warehouse_name TEXT,
  issued_to TEXT NOT NULL, -- e.g. 'Mousumi Network Ltd' or 'Chittagong Depot'
  recipient_name TEXT,
  issue_type TEXT DEFAULT 'Delivery to Distributor', -- 'Delivery to Distributor' | 'Inter-Warehouse Dispatch' | 'Production Scrap / Rework' | 'Corporate Direct'
  gate_pass_number TEXT,
  driver_vehicle TEXT,
  reference_no TEXT,
  reason TEXT,
  total_quantity NUMERIC(12, 2) DEFAULT 0,
  total_value_bdt NUMERIC(14, 2) DEFAULT 0,
  status TEXT DEFAULT 'Dispatched', -- 'Pending Dispatch' | 'Dispatched' | 'Delivered' | 'Cancelled'
  issued_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.stock_issue_items (
  id BIGSERIAL PRIMARY KEY,
  issue_id BIGINT REFERENCES public.stock_issues(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  batch_number TEXT,
  quantity NUMERIC(12, 2) NOT NULL DEFAULT 1,
  unit_cost_bdt NUMERIC(12, 2) DEFAULT 0,
  total_bdt NUMERIC(14, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 32. STOCK PRIMARY RETURNS (PRIMARY RETURN TAB)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.stock_primary_returns (
  id BIGSERIAL PRIMARY KEY,
  return_number TEXT UNIQUE NOT NULL,
  return_date DATE NOT NULL DEFAULT CURRENT_DATE,
  distributor_id BIGINT REFERENCES public.distributors(id) ON DELETE SET NULL,
  distributor_name TEXT NOT NULL,
  warehouse_id BIGINT REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  warehouse_name TEXT,
  product_id BIGINT REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  batch_number TEXT,
  quantity NUMERIC(12, 2) NOT NULL DEFAULT 1,
  unit_price_bdt NUMERIC(12, 2) DEFAULT 0,
  total_value_bdt NUMERIC(14, 2) DEFAULT 0,
  reason TEXT NOT NULL, -- 'Slow Moving Stock Swap' | 'Customer Order Cancellation' | 'Transit Box Denting'
  qc_status TEXT DEFAULT 'Pending QC Inspection',
  status TEXT DEFAULT 'Returned & Restocked',
  received_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 33. STOCK DAMAGE RETURNS (DAMAGE RETURN TAB)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.stock_damage_returns (
  id BIGSERIAL PRIMARY KEY,
  ticket_number TEXT UNIQUE NOT NULL,
  incident_date DATE NOT NULL DEFAULT CURRENT_DATE,
  warehouse_id BIGINT REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  warehouse_name TEXT,
  distributor_id BIGINT REFERENCES public.distributors(id) ON DELETE SET NULL,
  distributor_name TEXT,
  product_id BIGINT REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  batch_number TEXT,
  quantity NUMERIC(12, 2) NOT NULL DEFAULT 1,
  damage_type TEXT NOT NULL, -- 'Enclosure Crack' | 'BMS Voltage Deviation' | 'Water Immersion' | 'Cell Puffing'
  severity TEXT DEFAULT 'Major', -- 'Minor' | 'Major' | 'Critical / Unusable'
  reported_by TEXT,
  action_taken TEXT DEFAULT 'Factory Rework Return', -- 'Factory Rework Return' | 'Scrap / Salvage' | 'Credit Note Issued'
  salvage_value_bdt NUMERIC(12, 2) DEFAULT 0,
  status TEXT DEFAULT 'Investigating',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 34. STOCK TRANSFERS (STOCK TRANSFER TAB)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.stock_transfers (
  id BIGSERIAL PRIMARY KEY,
  transfer_number TEXT UNIQUE NOT NULL,
  transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
  source_warehouse_id BIGINT REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  source_warehouse_name TEXT NOT NULL,
  destination_warehouse_id BIGINT REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  destination_warehouse_name TEXT NOT NULL,
  challan_number TEXT,
  vehicle_number TEXT,
  driver_name TEXT,
  driver_phone TEXT,
  total_items INT DEFAULT 1,
  total_quantity NUMERIC(12, 2) NOT NULL DEFAULT 1,
  total_value_bdt NUMERIC(14, 2) DEFAULT 0,
  status TEXT DEFAULT 'In Transit', -- 'Initiated' | 'In Transit' | 'Received at Destination' | 'Rejected / Returned'
  dispatched_by TEXT,
  received_by TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.stock_transfer_items (
  id BIGSERIAL PRIMARY KEY,
  transfer_id BIGINT REFERENCES public.stock_transfers(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  batch_number TEXT,
  quantity NUMERIC(12, 2) NOT NULL DEFAULT 1,
  unit_cost_bdt NUMERIC(12, 2) DEFAULT 0,
  total_bdt NUMERIC(14, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 35. STOCK ADJUSTMENTS (STOCK ADJUSTMENT TAB - AUDIT RECONCILIATION)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.stock_adjustments (
  id BIGSERIAL PRIMARY KEY,
  reference_no TEXT UNIQUE NOT NULL,
  adjustment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  warehouse_id BIGINT REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  warehouse_name TEXT NOT NULL,
  product_id BIGINT REFERENCES public.products(id) ON DELETE RESTRICT,
  product_code TEXT,
  product_name TEXT NOT NULL,
  batch_number TEXT,
  adjustment_type TEXT NOT NULL, -- 'Physical Count Variance' | 'Damaged in Warehouse' | 'Sample / Marketing Demo' | 'Write-off'
  previous_qty NUMERIC(12, 2) NOT NULL DEFAULT 0,
  adjustment_qty NUMERIC(12, 2) NOT NULL DEFAULT 0, -- can be positive or negative
  new_qty NUMERIC(12, 2) NOT NULL DEFAULT 0,
  unit_cost_bdt NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_cost_variance_bdt NUMERIC(14, 2) NOT NULL DEFAULT 0,
  reason TEXT NOT NULL,
  adjusted_by TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 36. REQUISITIONS & INDENTS (REQUISITIONS SECTION FROM SCREENSHOTS)
-- Matches RequisitionModule: Create Requisition, List, Approvals, Delivery Confirmation
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.requisitions (
  id BIGSERIAL PRIMARY KEY,
  requisition_no TEXT UNIQUE NOT NULL,
  requisition_date DATE NOT NULL DEFAULT CURRENT_DATE,
  requested_by TEXT NOT NULL,
  requisition_for TEXT DEFAULT 'Dealer', -- 'Dealer' | 'Distributor' | 'Factory Store' | 'Internal Department'
  dealer_or_distributor_id BIGINT REFERENCES public.distributors(id) ON DELETE SET NULL,
  dealer_name TEXT NOT NULL,
  branch_warehouse_id BIGINT REFERENCES public.warehouses(id) ON DELETE SET NULL,
  target_depot TEXT DEFAULT 'Dhaka Central Depot',
  field_force_code TEXT,
  field_force_name TEXT,
  department_code TEXT DEFAULT 'DEP-1',
  department_name TEXT DEFAULT 'MOUSUMI NETWORK LTD',
  status TEXT NOT NULL DEFAULT 'Pending Approval', -- 'Pending Approval' | 'Approved by Factory' | 'Issued by Accounts' | 'Received at Warehouse' | 'Rejected'
  total_qty NUMERIC(12, 2) DEFAULT 0,
  total_amount_bdt NUMERIC(14, 2) DEFAULT 0,
  challan_no TEXT,
  deposit_notes TEXT,
  factory_notes TEXT,
  factory_reviewed_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.requisition_items (
  id BIGSERIAL PRIMARY KEY,
  requisition_id BIGINT REFERENCES public.requisitions(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES public.products(id) ON DELETE SET NULL,
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  sku TEXT,
  category TEXT,
  required_qty NUMERIC(12, 2) NOT NULL DEFAULT 1,
  approved_qty NUMERIC(12, 2) DEFAULT 0,
  unit_cost_bdt NUMERIC(12, 2) NOT NULL DEFAULT 0,
  discount_rate NUMERIC(5, 2) DEFAULT 0,
  free_qty NUMERIC(12, 2) DEFAULT 0,
  total_cost_bdt NUMERIC(14, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 37. RETAILER FIELD ORDERS & DELIVERIES (MOBILE SALES PORTAL SCREENSHOTS)
-- Matches MobileSalesPortal Screenshots: Order Capture, Confirmation, Partial, Cancellation
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.retailer_orders (
  id BIGSERIAL PRIMARY KEY,
  order_no TEXT UNIQUE NOT NULL,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  retailer_id BIGINT REFERENCES public.customers(id) ON DELETE SET NULL,
  retailer_code TEXT,
  retailer_name TEXT NOT NULL,
  distributor_id BIGINT REFERENCES public.distributors(id) ON DELETE SET NULL,
  distributor_name TEXT NOT NULL,
  field_rep_id BIGINT REFERENCES public.field_force_reps(id) ON DELETE SET NULL,
  field_rep_code TEXT,
  field_rep_name TEXT NOT NULL,
  market_hierarchy TEXT,
  delivery_status TEXT NOT NULL DEFAULT 'Pending', -- 'Pending' | 'Full Delivery' | 'Partial Delivery' | 'Cancelled'
  total_items INT DEFAULT 0,
  gross_amount_bdt NUMERIC(14, 2) NOT NULL DEFAULT 0,
  discount_amount_bdt NUMERIC(14, 2) DEFAULT 0,
  net_payable_bdt NUMERIC(14, 2) NOT NULL DEFAULT 0,
  collected_cash_bdt NUMERIC(14, 2) DEFAULT 0,
  due_balance_bdt NUMERIC(14, 2) DEFAULT 0,
  payment_method TEXT DEFAULT 'Cash on Delivery', -- 'Cash on Delivery' | 'MFS (bKash/Nagad)' | 'Bank Transfer' | 'Credit 30 Days'
  gps_latitude NUMERIC(10, 7),
  gps_longitude NUMERIC(10, 7),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.retailer_order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT REFERENCES public.retailer_orders(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES public.products(id) ON DELETE SET NULL,
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  ordered_qty NUMERIC(12, 2) NOT NULL DEFAULT 1,
  delivered_qty NUMERIC(12, 2) DEFAULT 0,
  unit_price_bdt NUMERIC(12, 2) NOT NULL DEFAULT 0,
  discount_bdt NUMERIC(12, 2) DEFAULT 0,
  total_bdt NUMERIC(14, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Retailer Order Delivery Actions (Full Confirmation or Partial Delivery)
CREATE TABLE IF NOT EXISTS public.retailer_delivery_actions (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT REFERENCES public.retailer_orders(id) ON DELETE CASCADE,
  order_no TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'Full Confirmation' | 'Partial Delivery'
  delivered_qty NUMERIC(12, 2) NOT NULL,
  undelivered_qty NUMERIC(12, 2) DEFAULT 0,
  cash_received_bdt NUMERIC(14, 2) DEFAULT 0,
  receipt_voucher_no TEXT,
  confirmed_by TEXT NOT NULL,
  remarks TEXT,
  confirmed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Retailer Order Cancellation Reasons (Matching Screenshot 2 Screen 3)
CREATE TABLE IF NOT EXISTS public.retailer_cancellations (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT REFERENCES public.retailer_orders(id) ON DELETE CASCADE,
  order_no TEXT NOT NULL,
  cancellation_reason TEXT NOT NULL, -- 'Shop Closed / Owner Not Present' | 'Insufficient Cash / Funds' | 'Customer Changed Mind' | 'Duplicate Order Placed' | 'Wrong Product Ordered' | 'Pricing / Discount Dispute'
  cancelled_by TEXT NOT NULL,
  notes TEXT,
  cancelled_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 38. DISTRIBUTOR MARKET HIERARCHY BEATS (ORG HIERARCHY PAGE INTEGRATION)
-- Links directly to Org Hierarchy nodes and assigned Distributors
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.market_hierarchies (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  node_type TEXT NOT NULL DEFAULT 'Beat', -- 'Beat' | 'Market Hierarchy' | 'DB Point' | 'Territory' | 'Area' | 'Region'
  parent_code TEXT,
  division TEXT DEFAULT 'Dhaka Division',
  region TEXT DEFAULT 'Dhaka Region',
  area TEXT,
  territory TEXT,
  db_point TEXT,
  head_person TEXT,
  phone TEXT,
  assigned_distributor_ids BIGINT[] DEFAULT '{}',
  assigned_distributor_codes TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 39. PERFORMANCE INDEXES FOR STOCK & SCREENSHOT TABLES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_stock_cid_mrr ON public.stock_cid_receipts(mrr_number);
CREATE INDEX IF NOT EXISTS idx_stock_cid_wh ON public.stock_cid_receipts(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_cid_date ON public.stock_cid_receipts(receipt_date);
CREATE INDEX IF NOT EXISTS idx_stock_cid_items_receipt ON public.stock_cid_receipt_items(receipt_id);
CREATE INDEX IF NOT EXISTS idx_stock_cid_items_prod ON public.stock_cid_receipt_items(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_inv_wh ON public.stock_inventory(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_inv_prod ON public.stock_inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_issues_no ON public.stock_issues(issue_number);
CREATE INDEX IF NOT EXISTS idx_stock_primary_ret_no ON public.stock_primary_returns(return_number);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_no ON public.stock_transfers(transfer_number);
CREATE INDEX IF NOT EXISTS idx_stock_adj_ref ON public.stock_adjustments(reference_no);
CREATE INDEX IF NOT EXISTS idx_requisitions_no ON public.requisitions(requisition_no);
CREATE INDEX IF NOT EXISTS idx_requisition_items_req ON public.requisition_items(requisition_id);
CREATE INDEX IF NOT EXISTS idx_retailer_orders_no ON public.retailer_orders(order_no);
CREATE INDEX IF NOT EXISTS idx_retailer_orders_ret ON public.retailer_orders(retailer_id);
CREATE INDEX IF NOT EXISTS idx_retailer_orders_dist ON public.retailer_orders(distributor_id);
CREATE INDEX IF NOT EXISTS idx_market_hierarchies_code ON public.market_hierarchies(code);

-- ============================================================================
-- 40. ROW LEVEL SECURITY (RLS) FOR ALL NEW TABLES (SAFE DYNAMIC EXECUTION)
-- Only enables RLS on tables that exist in the public schema to avoid 42P01 errors
-- ============================================================================
DO $$ 
DECLARE
  tbl text;
  target_tables text[] := ARRAY[
    'stock_cid_receipts',
    'stock_cid_receipt_items',
    'stock_inventory',
    'stock_opening_records',
    'stock_issues',
    'stock_issue_items',
    'stock_primary_returns',
    'stock_damage_returns',
    'stock_transfers',
    'stock_transfer_items',
    'stock_adjustments',
    'requisitions',
    'requisition_items',
    'retailer_orders',
    'retailer_order_items',
    'retailer_delivery_actions',
    'retailer_cancellations',
    'market_hierarchies'
  ];
BEGIN
  FOR tbl IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = ANY(target_tables)
  LOOP
    -- Safely enable RLS
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    
    -- Authenticated full access policy
    EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated full access on %I" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Allow authenticated full access on %I" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', tbl, tbl);
    
    -- Public anon full access policy for client frontend
    EXECUTE format('DROP POLICY IF EXISTS "Allow anon full access on %I" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Allow anon full access on %I" ON public.%I FOR ALL TO anon USING (true) WITH CHECK (true)', tbl, tbl);
  END LOOP;
END $$;

-- ============================================================================
-- 41. INITIAL PRODUCTION SEEDS FOR STOCK & MASTER DATA
-- Note: CID Received Stock starts with 0 test/sample data for clean production use.
-- If you previously inserted test CID receipts, run:
-- TRUNCATE TABLE public.stock_cid_receipt_items, public.stock_cid_receipts CASCADE;
-- ============================================================================


-- 3. Seed Market Hierarchy Beats (Matching Org Hierarchy Integration)
INSERT INTO public.market_hierarchies (
  code,
  name,
  full_name,
  node_type,
  parent_code,
  division,
  region,
  area,
  territory,
  db_point,
  head_person,
  phone,
  is_active
)
VALUES
  ('BEAT-MIRPUR-01', 'Mirpur-10 Main Market Beat', 'Dhaka Division > Dhaka Region > Dhaka North > Mirpur > Mirpur-10 Main Market Beat', 'Beat', 'TERR-MIRPUR', 'Dhaka Division', 'Dhaka Region', 'Dhaka North Area', 'Mirpur Territory', 'DB Point Mirpur', 'Zubair Ahmed', '+880 1714-554433', TRUE),
  ('BEAT-PALLABI-02', 'Pallabi & Purobi Auto Electric Hub', 'Dhaka Division > Dhaka Region > Dhaka North > Mirpur > Pallabi Auto Electric Hub', 'Beat', 'TERR-MIRPUR', 'Dhaka Division', 'Dhaka Region', 'Dhaka North Area', 'Mirpur Territory', 'DB Point Pallabi', 'Fazleh Rabbi', '+880 1719-887766', TRUE),
  ('BEAT-AGRABAD-01', 'Agrabad Commercial Beat', 'Chittagong Division > Chittagong Region > Chittagong South > Agrabad Commercial Beat', 'Beat', 'REG-CTG', 'Chittagong Division', 'Chittagong Region', 'Chittagong South', 'Agrabad Territory', 'DB Point Agrabad', 'Tanvir Ahmed Chowdhury', '+880 1819-223344', TRUE),
  ('BEAT-KST-01', 'Kushtia Sadar & Poradah Market Beat', 'Khulna Division > Khulna Region > Kushtia > Kushtia Sadar & Poradah Market Beat', 'Beat', 'REG-KHU', 'Khulna Division', 'Khulna Region', 'Kushtia Area', 'Kushtia Sadar', 'DB Point Kushtia Plant', 'Mijanur Rahman', '+880 1712-998877', TRUE)
ON CONFLICT (code) DO NOTHING;

-- 4. Seed Requisitions matching RequisitionModule screenshots
INSERT INTO public.requisitions (
  requisition_no,
  requisition_date,
  requested_by,
  requisition_for,
  dealer_name,
  target_depot,
  field_force_code,
  field_force_name,
  department_code,
  status,
  total_qty,
  total_amount_bdt,
  notes
)
VALUES
  (
    'REQ-2026-0012',
    CURRENT_DATE,
    'Tanvir Ahmed Chowdhury',
    'Distributor',
    'Mousumi Network Ltd (Dhaka Central)',
    'Dhaka Central Depot (Tejgaon)',
    'FF-DHK-01',
    'Zubair Ahmed',
    'DEP-1',
    'Pending Approval',
    25.00,
    2750000.00,
    'Urgent indent for Mirpur electric three-wheeler fleet replenishment.'
  )
ON CONFLICT (requisition_no) DO NOTHING;

INSERT INTO public.requisition_items (
  requisition_id,
  product_code,
  product_name,
  sku,
  required_qty,
  approved_qty,
  unit_cost_bdt,
  total_cost_bdt
)
VALUES
  (
    (SELECT id FROM public.requisitions WHERE requisition_no = 'REQ-2026-0012'),
    'BAT-512-086',
    'Ensec LFP-51.2V 86Ah EV Traction Battery',
    'ENS-LFP-512086-EV',
    25.00,
    25.00,
    110000.00,
    2750000.00
  )
ON CONFLICT DO NOTHING;
