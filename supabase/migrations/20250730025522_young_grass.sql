/*
  # إنشاء نظام المصادقة ونظام الحضور المحدث

  1. الجداول الجديدة
    - `user_profiles` - ملفات المستخدمين مع الأدوار
    - `attendance_logs` - سجل الحضور المفصل
    - `employee_accounts` - حسابات الموظفين

  2. الأمان
    - تمكين RLS على جميع الجداول
    - سياسات أمان حسب الدور

  3. الفهارس والقيود
    - فهارس للأداء
    - قيود البيانات
*/

-- جدول ملفات المستخدمين
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'employee')) DEFAULT 'employee',
  employee_number text UNIQUE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- جدول سجل الحضور المفصل
CREATE TABLE IF NOT EXISTS attendance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  employee_number text NOT NULL,
  full_name text NOT NULL,
  check_in_time timestamptz NOT NULL DEFAULT now(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- جدول حسابات الموظفين (للمدير لإدارة الحسابات)
CREATE TABLE IF NOT EXISTS employee_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  employee_number text UNIQUE NOT NULL,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  last_attendance timestamptz,
  total_attendance_days integer DEFAULT 0,
  created_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- إنشاء المدير الرئيسي (سيتم إنشاؤه عبر التطبيق)
-- البريد الإلكتروني: hamadaalialissawi@gmail.com
-- كلمة المرور: 123456789@@

-- تمكين RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_accounts ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان لملفات المستخدمين
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert profiles" ON user_profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update profiles" ON user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- سياسات الأمان لسجل الحضور
CREATE POLICY "Users can insert own attendance" ON attendance_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own attendance" ON attendance_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all attendance" ON attendance_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete attendance" ON attendance_logs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- سياسات الأمان لحسابات الموظفين
CREATE POLICY "Admins can manage employee accounts" ON employee_accounts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_employee_number ON user_profiles(employee_number);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_user_date ON attendance_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_date ON attendance_logs(date);
CREATE INDEX IF NOT EXISTS idx_employee_accounts_employee_number ON employee_accounts(employee_number);

-- دالة لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- تطبيق الدالة على الجداول
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_accounts_updated_at BEFORE UPDATE ON employee_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- دالة لتحديث إحصائيات الحضور
CREATE OR REPLACE FUNCTION update_attendance_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE employee_accounts 
  SET 
    last_attendance = NEW.check_in_time,
    total_attendance_days = (
      SELECT COUNT(DISTINCT date) 
      FROM attendance_logs 
      WHERE user_id = NEW.user_id
    )
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- تطبيق الدالة على جدول الحضور
CREATE TRIGGER update_attendance_stats_trigger AFTER INSERT ON attendance_logs
  FOR EACH ROW EXECUTE FUNCTION update_attendance_stats();