/*
  # إنشاء قاعدة بيانات نظام إدارة الموظفين

  1. الجداول الجديدة
    - `company_info` - معلومات الشركة (اسم المكان، اسم المدير)
    - `employees` - بيانات الموظفين (الرقم الوظيفي، الاسم)
    - `attendance` - سجل الحضور والغياب
    - `advances` - السلف
    - `bonuses` - المكافآت
    - `discounts` - الخصومات
    - `overtime` - العمل الإضافي
    - `leaves` - الإجازات الشهرية

  2. الأمان
    - تمكين RLS على جميع الجداول
    - إضافة سياسات للقراءة والكتابة العامة (التطبيق مفتوح)

  3. الفهارس
    - فهارس على الأعمدة المستعلم عنها بكثرة
*/

-- جدول معلومات الشركة
CREATE TABLE IF NOT EXISTS company_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_name text NOT NULL DEFAULT 'فلورينا كافي',
  manager_name text NOT NULL DEFAULT 'حمادة علي',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- جدول الموظفين
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_number text UNIQUE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- جدول سجل الحضور
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  date date NOT NULL,
  status text NOT NULL CHECK (status IN ('حضور', 'غياب')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, date)
);

-- جدول السلف
CREATE TABLE IF NOT EXISTS advances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- جدول المكافآت
CREATE TABLE IF NOT EXISTS bonuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  days decimal(5,2) NOT NULL,
  reason text NOT NULL,
  date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- جدول الخصومات
CREATE TABLE IF NOT EXISTS discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  days decimal(5,2) NOT NULL,
  reason text NOT NULL,
  date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- جدول العمل الإضافي
CREATE TABLE IF NOT EXISTS overtime (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  hours decimal(5,2) NOT NULL,
  calculated_days decimal(5,2) GENERATED ALWAYS AS (hours / 8.0) STORED,
  notes text DEFAULT '',
  date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- جدول الإجازات
CREATE TABLE IF NOT EXISTS leaves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text NOT NULL,
  calculated_days integer GENERATED ALWAYS AS (end_date - start_date + 1) STORED,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (end_date >= start_date)
);

-- إدراج بيانات افتراضية لمعلومات الشركة
INSERT INTO company_info (place_name, manager_name) 
VALUES ('فلورينا كافي', 'حمادة علي')
ON CONFLICT DO NOTHING;

-- تمكين RLS على جميع الجداول
ALTER TABLE company_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE overtime ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;

-- سياسات الوصول العام (لأن التطبيق مفتوح لمن يملك الرابط)
CREATE POLICY "Allow all operations on company_info" ON company_info FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on employees" ON employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on attendance" ON attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on advances" ON advances FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on bonuses" ON bonuses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on discounts" ON discounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on overtime" ON overtime FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on leaves" ON leaves FOR ALL USING (true) WITH CHECK (true);

-- إنشاء فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_advances_employee_date ON advances(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_bonuses_employee_date ON bonuses(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_discounts_employee_date ON discounts(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_overtime_employee_date ON overtime(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_leaves_employee_dates ON leaves(employee_id, start_date, end_date);