import React, { useState, useEffect } from 'react';
import { Clock, Edit2, Trash2 } from 'lucide-react';
import { supabase, Employee, Overtime } from '../lib/supabase';
import { useToast } from '../hooks/useToast';
import LoadingSpinner from '../components/LoadingSpinner';
import EmployeeSelect from '../components/EmployeeSelect';
import ConfirmDialog from '../components/ConfirmDialog';

const OvertimeView: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [overtime, setOvertime] = useState<Overtime[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [hours, setHours] = useState('');
  const [notes, setNotes] = useState('');
  const [editingOvertime, setEditingOvertime] = useState<Overtime | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Overtime | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchEmployees();
    fetchOvertime();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('employee_number');
      
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      showToast('خطأ في تحميل بيانات الموظفين', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchOvertime = async () => {
    try {
      const { data, error } = await supabase
        .from('overtime')
        .select(`
          *,
          employees (
            id,
            employee_number,
            name
          )
        `)
        .order('date', { ascending: false });
      
      if (error) throw error;
      setOvertime(data || []);
    } catch (error) {
      showToast('خطأ في تحميل بيانات العمل الإضافي', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEmployee || !hours) {
      showToast('يرجى ملء الحقول المطلوبة', 'warning');
      return;
    }

    try {
      if (editingOvertime) {
        const { error } = await supabase
          .from('overtime')
          .update({
            employee_id: selectedEmployee,
            hours: parseFloat(hours),
            notes: notes || ''
          })
          .eq('id', editingOvertime.id);
        
        if (error) throw error;
        showToast('تم تحديث العمل الإضافي بنجاح', 'success');
      } else {
        const { error } = await supabase
          .from('overtime')
          .insert({
            employee_id: selectedEmployee,
            hours: parseFloat(hours),
            notes: notes || ''
          });
        
        if (error) throw error;
        showToast('تم إضافة العمل الإضافي بنجاح', 'success');
      }
      
      resetForm();
      fetchOvertime();
    } catch (error) {
      showToast('حدث خطأ أثناء حفظ البيانات', 'error');
    }
  };

  const handleEdit = (overtime: Overtime) => {
    setEditingOvertime(overtime);
    setSelectedEmployee(overtime.employee_id);
    setHours(overtime.hours.toString());
    setNotes(overtime.notes || '');
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    
    try {
      const { error } = await supabase
        .from('overtime')
        .delete()
        .eq('id', confirmDelete.id);
      
      if (error) throw error;
      
      showToast('تم حذف سجل العمل الإضافي بنجاح', 'success');
      fetchOvertime();
    } catch (error) {
      showToast('حدث خطأ أثناء حذف السجل', 'error');
    } finally {
      setConfirmDelete(null);
    }
  };

  const resetForm = () => {
    setSelectedEmployee('');
    setHours('');
    setNotes('');
    setEditingOvertime(null);
  };

  const calculateDays = (hours: number) => {
    return (hours / 8).toFixed(2);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">إدارة العمل الإضافي</h2>

      {/* Form */}
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          {editingOvertime ? 'تعديل العمل الإضافي' : 'إضافة عمل إضافي جديد'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الموظف
              </label>
              <EmployeeSelect
                employees={employees}
                selectedEmployee={selectedEmployee}
                onEmployeeChange={setSelectedEmployee}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                عدد الساعات
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="أدخل عدد ساعات العمل الإضافي"
                required
              />
              {hours && (
                <p className="text-xs text-gray-500 mt-1">
                  = {calculateDays(parseFloat(hours))} يوم إضافي
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ملاحظات (اختياري)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="أدخل ملاحظات حول العمل الإضافي"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              {editingOvertime ? 'تحديث' : 'إضافة'} العمل الإضافي
            </button>
            {editingOvertime && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                إلغاء
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Overtime List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  اسم الموظف
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  عدد الساعات
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الأيام الإضافية
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ملاحظات
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  التاريخ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  العمليات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {overtime.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    لا توجد سجلات عمل إضافي بعد
                  </td>
                </tr>
              ) : (
                overtime.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.employees?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                      {record.hours} ساعة
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      {record.calculated_days} يوم
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {record.notes || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(record.date).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 space-x-reverse">
                      <button
                        onClick={() => handleEdit(record)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(record)}
                        className="text-red-600 hover:text-red-900 p-1 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="تأكيد حذف العمل الإضافي"
        message={`هل أنت متأكد من حذف سجل العمل الإضافي ${confirmDelete?.hours} ساعة للموظف "${confirmDelete?.employees?.name}"؟`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
        type="danger"
        confirmText="حذف"
        cancelText="إلغاء"
      />
    </div>
  );
};

export default OvertimeView;