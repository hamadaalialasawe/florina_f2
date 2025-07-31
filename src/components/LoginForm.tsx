import React, { useState } from 'react';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import { signIn, ensureAdminExists } from '../lib/auth';
import { useToast } from '../hooks/useToast';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  // التحقق من وجود المدير عند تحميل الصفحة
  React.useEffect(() => {
    ensureAdminExists();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(email, password);
      showToast('تم تسجيل الدخول بنجاح', 'success');
    } catch (error: any) {
      console.error('خطأ في تسجيل الدخول:', error);
      
      // رسائل خطأ مخصصة
      let errorMessage = 'خطأ في تسجيل الدخول';
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'بيانات الدخول غير صحيحة. تأكد من البريد الإلكتروني وكلمة المرور.';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'يرجى تأكيد البريد الإلكتروني أولاً.';
      } else if (error.message?.includes('Too many requests')) {
        errorMessage = 'تم تجاوز عدد المحاولات المسموح. يرجى المحاولة لاحقاً.';
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            نظام إدارة الحضور والغياب
          </h1>
          <p className="text-gray-600">فلورينا كافي</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="أدخل البريد الإلكتروني"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              كلمة المرور
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors pr-12"
                placeholder="أدخل كلمة المرور"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                disabled={loading}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2">بيانات تجريبية:</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>المدير:</strong> hamadaalialissawi@gmail.com</p>
            <p><strong>كلمة المرور:</strong> 123456789@@</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;