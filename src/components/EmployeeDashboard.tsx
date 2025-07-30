import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, LogOut, Calendar, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { recordAttendance, getAttendanceLogs } from '../lib/auth';
import { useToast } from '../hooks/useToast';
import LoadingSpinner from './LoadingSpinner';

const EmployeeDashboard: React.FC = () => {
  const { profile, signOut } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // تحديث الوقت كل ثانية
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (profile) {
      checkTodayAttendance();
      loadRecentAttendance();
    }
  }, [profile]);

  const checkTodayAttendance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const logs = await getAttendanceLogs(today, today);
      setTodayAttendance(logs.length > 0 ? logs[0] : null);
    } catch (error) {
      console.error('خطأ في التحقق من الحضور اليوم:', error);
    }
  };

  const loadRecentAttendance = async () => {
    try {
      const logs = await getAttendanceLogs();
      setRecentAttendance(logs.slice(0, 5)); // آخر 5 سجلات
    } catch (error) {
      console.error('خطأ في تحميل سجل الحضور:', error);
    }
  };

  const handleAttendance = async () => {
    setLoading(true);
    try {
      await recordAttendance();
      showToast('تم تسجيل الحضور بنجاح! 🎉', 'success');
      checkTodayAttendance();
      loadRecentAttendance();
    } catch (error: any) {
      showToast(error.message || 'حدث خطأ أثناء تسجيل الحضور', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!profile) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4" dir="rtl">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  مرحباً، {profile.full_name}
                </h1>
                <p className="text-gray-600">
                  الرقم الوظيفي: {profile.employee_number}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              خروج
            </button>
          </div>

          {/* Current Time */}
          <div className="text-center py-6 border-t border-gray-100">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {formatTime(currentTime)}
            </div>
            <div className="text-gray-600">
              {formatDate(currentTime)}
            </div>
          </div>
        </div>

        {/* Attendance Button */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 text-center">
          {todayAttendance ? (
            <div className="space-y-4">
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-green-700">
                تم تسجيل الحضور اليوم
              </h2>
              <p className="text-gray-600">
                وقت الحضور: {new Date(todayAttendance.check_in_time).toLocaleTimeString('ar-EG')}
              </p>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-green-800 font-medium">
                  شكراً لك على الالتزام بالمواعيد! 🌟
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                <Clock className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                تسجيل الحضور
              </h2>
              <button
                onClick={handleAttendance}
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-12 py-4 rounded-xl text-xl font-bold hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-300 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
              >
                {loading ? 'جاري التسجيل...' : 'تسجيل الحضور الآن'}
              </button>
              <p className="text-gray-500 text-sm">
                اضغط على الزر لتسجيل حضورك اليوم
              </p>
            </div>
          )}
        </div>

        {/* Recent Attendance */}
        {recentAttendance.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              آخر سجلات الحضور
            </h3>
            <div className="space-y-3">
              {recentAttendance.map((log) => (
                <div key={log.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">
                      {new Date(log.date).toLocaleDateString('ar-EG')}
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(log.check_in_time).toLocaleTimeString('ar-EG')}
                    </div>
                  </div>
                  <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    حضور
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDashboard;