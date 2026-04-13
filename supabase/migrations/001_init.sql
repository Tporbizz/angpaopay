-- Products table
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('iphone', 'ipad', 'macbook')),
  price integer NOT NULL,
  active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Applications table
CREATE TABLE applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  product_id uuid REFERENCES products(id),
  product_name text,
  product_price integer,
  down_pct numeric,
  months integer,
  down_amt integer,
  monthly_payment integer,
  final_rate numeric,
  name text NOT NULL,
  id_card text,
  phone text,
  phone_duration text,
  social_url text,
  facebook text,
  tiktok text,
  instagram text,
  address text,
  residence_type text,
  community_bond text,
  job_type text,
  workplace text,
  work_duration text,
  income integer,
  ref1_name text,
  ref1_relation text,
  ref1_phone text,
  ref2_name text,
  ref2_relation text,
  ref2_phone text,
  stmt_url text,
  stmt_password text,
  work_photo_url text,
  auto_score integer,
  staff_score integer DEFAULT 0,
  total_score integer,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  staff_note text,
  approved_at timestamptz,
  approved_by text
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Allow all for development
CREATE POLICY "Allow all on products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on applications" ON applications FOR ALL USING (true) WITH CHECK (true);

-- Insert default products
INSERT INTO products (name, category, price, sort_order) VALUES
  ('iPhone 13 128GB', 'iphone', 14490, 1),
  ('iPhone 14 128GB', 'iphone', 16590, 2),
  ('iPhone 15 128GB', 'iphone', 20190, 3),
  ('iPhone 16 128GB', 'iphone', 24990, 4),
  ('iPhone 17 256GB', 'iphone', 29900, 5),
  ('iPhone Air 256GB', 'iphone', 31790, 6),
  ('iPhone 17 Pro 256GB', 'iphone', 42990, 7),
  ('iPhone 17 Pro 512GB', 'iphone', 49590, 8),
  ('iPhone 17 Pro Max 256GB', 'iphone', 47890, 9),
  ('iPhone 17 Pro Max 512GB', 'iphone', 54390, 10),
  ('MacBook Air M2 256GB', 'macbook', 25490, 11),
  ('MacBook Air M4 256GB', 'macbook', 29590, 12),
  ('MacBook Pro M5 512GB', 'macbook', 54900, 13),
  ('iPad A16 128GB WiFi', 'ipad', 12390, 14),
  ('iPad A16 128GB 5G', 'ipad', 18090, 15),
  ('iPad A16 256GB WiFi', 'ipad', 16590, 16),
  ('iPad A16 256GB 5G', 'ipad', 19090, 17),
  ('iPad A16 512GB WiFi', 'ipad', 23390, 18),
  ('iPad A16 512GB 5G', 'ipad', 24390, 19),
  ('iPad Air M3 11" 128GB WiFi', 'ipad', 16590, 20),
  ('iPad Air M3 11" 128GB 5G', 'ipad', 26490, 21),
  ('iPad Air M3 11" 256GB WiFi', 'ipad', 20390, 22),
  ('iPad Air M3 11" 256GB 5G', 'ipad', 30290, 23),
  ('iPad Air M3 11" 512GB WiFi', 'ipad', 31490, 24),
  ('iPad Air M3 13" 128GB WiFi', 'ipad', 23790, 25),
  ('iPad Air M3 13" 128GB 5G', 'ipad', 33090, 26),
  ('iPad Air M3 13" 256GB WiFi', 'ipad', 31390, 27),
  ('iPad Air M3 13" 256GB 5G', 'ipad', 36990, 28),
  ('iPad Air M3 13" 512GB WiFi', 'ipad', 37990, 29),
  ('iPad Air M3 13" 512GB 5G', 'ipad', 43590, 30),
  ('iPad Pro M4 11" 512GB WiFi', 'ipad', 36490, 31),
  ('iPad Pro M4 13" 256GB WiFi', 'ipad', 40490, 32),
  ('iPad Pro M4 13" 256GB 5G', 'ipad', 53590, 33),
  ('iPad Pro M4 13" 512GB WiFi', 'ipad', 46490, 34),
  ('iPad Pro M4 13" 512GB 5G', 'ipad', 60590, 35),
  ('iPad Pro M5 11" 256GB WiFi', 'ipad', 34990, 36),
  ('iPad Pro M5 11" 256GB 5G', 'ipad', 41990, 37),
  ('iPad Pro M5 11" 512GB WiFi', 'ipad', 41990, 38),
  ('iPad Pro M5 13" 256GB WiFi', 'ipad', 46690, 39),
  ('iPad Pro M5 13" 256GB 5G', 'ipad', 53690, 40),
  ('iPad Pro M5 13" 512GB WiFi', 'ipad', 53690, 41),
  ('iPad mini A17 Pro 128GB WiFi', 'ipad', 17690, 42);
