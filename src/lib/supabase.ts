import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// أنواع البيانات
export interface CompanyInfo {
  id: string;
  place_name: string;
  manager_name: string;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  employee_number: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  employee_id: string;
  date: string;
  status: 'حضور' | 'غياب';
  created_at: string;
  updated_at: string;
  employees?: Employee;
}

export interface Advance {
  id: string;
  employee_id: string;
  amount: number;
  date: string;
  created_at: string;
  updated_at: string;
  employees?: Employee;
}

export interface Bonus {
  id: string;
  employee_id: string;
  days: number;
  reason: string;
  date: string;
  created_at: string;
  updated_at: string;
  employees?: Employee;
}

export interface Discount {
  id: string;
  employee_id: string;
  days: number;
  reason: string;
  date: string;
  created_at: string;
  updated_at: string;
  employees?: Employee;
}

export interface Overtime {
  id: string;
  employee_id: string;
  hours: number;
  calculated_days: number;
  notes: string;
  date: string;
  created_at: string;
  updated_at: string;
  employees?: Employee;
}

export interface Leave {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  calculated_days: number;
  created_at: string;
  updated_at: string;
  employees?: Employee;
}

export interface EmployeeSummary {
  employee: Employee;
  attendanceDays: number;
  absenceDays: number;
  totalAdvances: number;
  totalBonusDays: number;
  totalDiscountDays: number;
  totalLeaveDays: number;
  totalOvertimeDays: number;
}