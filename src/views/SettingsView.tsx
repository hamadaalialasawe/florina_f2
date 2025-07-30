import React, { useState, useEffect } from 'react';
import { Settings, RotateCcw, AlertTriangle } from 'lucide-react';
import { supabase, CompanyInfo } from '../lib/supabase';
import { useToast } from '../hooks/useToast';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';

const SettingsView: React.FC = () => {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [placeName, setPlaceName] = useState('');
  const [managerName, setManagerName] = useState('');
  const [showResetDialog, setShowResetDialog] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchCompanyInfo();
  }, []);

  const fetchCompanyInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('company_info')
        .select('*')
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setCompanyInfo(data);
        setPlaceName(data.place_name);
        setManagerName(data.manager_name);
      } else {
        // No company info exists, set defaults
        setPlaceName('فلورينا كافي');
        setManagerName('حمادة علي');
      }
    } catch (error) {
      showToast('خطأ في تحميل بيانات الشركة', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCompanyInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (companyInfo) {
        // Update existing record
        const { error } = await supabase
          .from('company_info')
          .update({
            place_name: placeName,
            manager_name: managerName,
            updated_at: new Date().toISOString()
          })
          .eq('id', companyInfo.id);
        
        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('company_info')
          .insert({
            place_name: placeName,
            manager_name: managerName
          });
        
        if (error) throw error;
      }
      
      showToast('تم حفظ بيانات الشركة بنجاح', 'success');
      fetchCompanyInfo(); // Refresh data
    } catch (error) {
      showToast('حدث خطأ أثناء حفظ البيانات', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleResetData = async () => {
    try {
      // Delete all data from all tables except company_info and employees
      await Promise.all([
        supabase.from('attendance').delete().neq('id', ''),
        supabase.from('advances').delete().neq('id', ''),
        supabase.from('bonuses').delete().neq('id', ''),
        supabase.from('discounts').delete().neq('id', ''),
        supabase.from('overtime').delete().neq('id', ''),
        supabase.from('leaves').delete().neq('id', '')
      ]);
      
      showToast('تم إعادة تعيين البيانات الشهرية بنجاح', 'success');
    } catch (error) {
      showToast('حدث خطأ أثناء إعادة تعيين البيانات', 'error');
    } finally {
      setShowResetDialog(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">إعدادات النظام</h2>

      {/* Company Info Settings */}
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          معلومات الشركة/المكان
        </h3>
        
        <form onSubmit={handleSaveCompanyInfo} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                اسم المكان
              </label>
              <input
                type="text"
                value={placeName}
                onChange={(e) => setPlaceName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="أدخل اسم المكان"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                اسم المدير
              </label>
              <input
                type="text"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="أدخل اسم المدير"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'جاري الحفظ...' : 'حفظ البيانات'}
          </button>
        </form>
      </div>

      {/* Reset Data Section */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              بدء شهر جديد (إعادة تعيين البيانات)
            </h3>
            <p className="text-red-700 mb-4 leading-relaxed">
              هذه العملية ستقوم بحذف جميع البيانات الشهرية (الحضور، السلف، المكافآت، الخصومات، الإجازات، والعمل الإضافي) 
              لجميع الموظفين بشكل نهائي. بيانات الموظفين ومعلومات الشركة ستبقى كما هي.
            </p>
            <p className="text-red-800 font-semibold mb-4">
              تحذير: هذه العملية لا يمكن التراجع عنها!
            </p>
            <button
              onClick={() => setShowResetDialog(true)}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              بدء شهر جديد
            </button>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="bg-gray-50 p-6 rounded-lg border">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">معلومات النظام</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-600">نوع النظام:</span>
            <span className="mr-2 text-gray-800">نظام إدارة موظفين ويب</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">مشاركة البيانات:</span>
            <span className="mr-2 text-gray-800">مزامنة فورية عبر الإنترنت</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">آخر تحديث:</span>
            <span className="mr-2 text-gray-800">{new Date().toLocaleDateString('ar-EG')}</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">حالة الاتصال:</span>
            <span className="mr-2 text-green-600 font-medium">متصل</span>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showResetDialog}
        title="⚠️ تأكيد إعادة تعيين البيانات"
        message="هل أنت متأكد تماماً من إعادة تعيين جميع البيانات الشهرية؟ ستفقد جميع سجلات الحضور والسلف والمكافآت والخصومات والإجازات والعمل الإضافي لجميع الموظفين. هذه العملية لا يمكن التراجع عنها!"
        onConfirm={handleResetData}
        onCancel={() => setShowResetDialog(false)}
        type="danger"
        confirmText="نعم، إعادة تعيين البيانات"
        cancelText="إلغاء"
      />
    </div>
  );
};

export default SettingsView;