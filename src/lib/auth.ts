import { supabase } from './supabase';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'employee';
  employee_number?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AttendanceLog {
  id: string;
  user_id: string;
  employee_number: string;
  full_name: string;
  check_in_time: string;
  date: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface EmployeeAccount {
  id: string;
  user_id: string;
  employee_number: string;
  full_name: string;
  email: string;
  is_active: boolean;
  last_attendance?: string;
  total_attendance_days: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// تسجيل الدخول
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
};

// تسجيل الخروج
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// الحصول على المستخدم الحالي
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// الحصول على ملف المستخدم
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
};

// إنشاء حساب موظف جديد (للمدير فقط)
export const createEmployeeAccount = async (
  email: string,
  password: string,
  fullName: string,
  employeeNumber: string
) => {
  // إنشاء المستخدم في نظام المصادقة
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  
  if (authError) throw authError;
  
  if (!authData.user) throw new Error('فشل في إنشاء المستخدم');
  
  // إنشاء ملف المستخدم
  const { error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      id: authData.user.id,
      email,
      full_name: fullName,
      role: 'employee',
      employee_number: employeeNumber,
      is_active: true,
    });
  
  if (profileError) throw profileError;
  
  // إنشاء سجل في جدول حسابات الموظفين
  const currentUser = await getCurrentUser();
  const { error: accountError } = await supabase
    .from('employee_accounts')
    .insert({
      user_id: authData.user.id,
      employee_number: employeeNumber,
      full_name: fullName,
      email,
      is_active: true,
      created_by: currentUser?.id,
    });
  
  if (accountError) throw accountError;
  
  return authData.user;
};

// تسجيل الحضور
export const recordAttendance = async () => {
  const user = await getCurrentUser();
  if (!user) throw new Error('يجب تسجيل الدخول أولاً');
  
  const profile = await getUserProfile(user.id);
  if (!profile) throw new Error('ملف المستخدم غير موجود');
  
  // التحقق من عدم تسجيل الحضور مسبقاً اليوم
  const today = new Date().toISOString().split('T')[0];
  const { data: existingAttendance } = await supabase
    .from('attendance_logs')
    .select('id')
    .eq('user_id', user.id)
    .eq('date', today)
    .single();
  
  if (existingAttendance) {
    throw new Error('تم تسجيل الحضور مسبقاً اليوم');
  }
  
  // تسجيل الحضور
  const { data, error } = await supabase
    .from('attendance_logs')
    .insert({
      user_id: user.id,
      employee_number: profile.employee_number || '',
      full_name: profile.full_name,
      check_in_time: new Date().toISOString(),
      date: today,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// الحصول على سجل الحضور (للمدير)
export const getAttendanceLogs = async (
  startDate?: string,
  endDate?: string,
  employeeId?: string
) => {
  let query = supabase
    .from('attendance_logs')
    .select('*')
    .order('check_in_time', { ascending: false });
  
  if (startDate) {
    query = query.gte('date', startDate);
  }
  
  if (endDate) {
    query = query.lte('date', endDate);
  }
  
  if (employeeId) {
    query = query.eq('user_id', employeeId);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// الحصول على حسابات الموظفين (للمدير)
export const getEmployeeAccounts = async () => {
  const { data, error } = await supabase
    .from('employee_accounts')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

// تحديث كلمة مرور موظف (للمدير)
export const updateEmployeePassword = async (userId: string, newPassword: string) => {
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    password: newPassword,
  });
  
  if (error) throw error;
};

// تحديث كلمة المرور الشخصية
export const updateOwnPassword = async (newPassword: string) => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  
  if (error) throw error;
};

// تفعيل/إلغاء تفعيل حساب موظف
export const toggleEmployeeStatus = async (userId: string, isActive: boolean) => {
  const { error: profileError } = await supabase
    .from('user_profiles')
    .update({ is_active: isActive })
    .eq('id', userId);
  
  if (profileError) throw profileError;
  
  const { error: accountError } = await supabase
    .from('employee_accounts')
    .update({ is_active: isActive })
    .eq('user_id', userId);
  
  if (accountError) throw accountError;
};

// حذف حساب موظف
export const deleteEmployeeAccount = async (userId: string) => {
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) throw error;
};

// إنشاء المدير الرئيسي (يتم استدعاؤها مرة واحدة)
export const createMainAdmin = async () => {
  const adminEmail = 'hamadaalialissawi@gmail.com';
  const adminPassword = '123456789@@';
  
  try {
    // التحقق من وجود المدير مسبقاً
    const { data: existingAdmin } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', adminEmail)
      .eq('role', 'admin')
      .single();
    
    if (existingAdmin) {
      return existingAdmin;
    }
    
    // إنشاء المدير باستخدام التسجيل العادي
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPassword,
      options: {
        emailRedirectTo: undefined,
      }
    });
    
    if (authError) throw authError;
    
    if (!authData.user) throw new Error('فشل في إنشاء المدير');
    
    // إنشاء ملف المدير
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email: adminEmail,
        full_name: 'حمادة علي الليساوي',
        role: 'admin',
        is_active: true,
      });
    
    if (profileError) throw profileError;
    
    return authData.user;
  } catch (error) {
    console.error('خطأ في إنشاء المدير الرئيسي:', error);
    throw error;
  }
};

// التحقق من وجود المدير وإنشاؤه إذا لم يكن موجوداً
export const ensureAdminExists = async () => {
  try {
    const adminEmail = 'hamadaalialissawi@gmail.com';
    
    // التحقق من وجود المدير في قاعدة البيانات
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', adminEmail)
      .eq('role', 'admin')
      .single();
    
    if (!existingProfile) {
      // إنشاء المدير إذا لم يكن موجوداً
      await createMainAdmin();
    }
  } catch (error) {
    console.error('خطأ في التحقق من وجود المدير:', error);
  }
};