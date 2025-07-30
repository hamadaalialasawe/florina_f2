import React, { useState, useEffect } from 'react';
import { Minus, Edit2, Trash2 } from 'lucide-react';
import { supabase, Employee, Discount } from '../lib/supabase';
import { useToast } from '../hooks/useToast';
import LoadingSpinner from '../components/LoadingSpinner';
import EmployeeSelect from '../components/EmployeeSelect';
import ConfirmDialog from '../components/ConfirmDialog';

const DiscountsView: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [days, setDays] = useState('');
  const [reason, setReason] = useState('');
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Discount | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchEmployees();
    fetchDiscounts();
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

  const fetchDiscounts = async () => {
    try {
      const { data, error } = await supabase
        .from('discounts')
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
      setDiscounts(data || []);
    } catch (error) {
      showToast('خطأ في تحميل بيانات الخصومات', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEmployee || !days || !reason) {
      showToast('يرجى ملء جميع الحقول', 'warning');
      return;
    }

    try {
      if (editingDiscount) {
        const { error } = await supabase
          .from('discounts')
          .update({
            employee_id: selectedEmployee,
            days: parseFloat(days),
            reason: reason
          })
          .eq('id', editingDiscount.id);
        
        if (error) throw error;
        showToast('تم تحديث الخصم بنجاح', 'success');
      } else {
        const { error } = await supabase
          .from('discounts')
          .insert({
            employee_id: selectedEmployee,
            days: parseFloat(days),
            reason: reason
          });
        
        if (error) throw error;
        showToast('تم إضافة الخصم بنجاح', 'success');
      }
      
      resetForm();
      fetchDiscounts();
    } catch (error) {
      showToast('حدث خطأ أثناء حفظ البيانات', 'error');
    }
  };

  const handleEdit = (discount: Discount) => {
    setEditingDiscount(discount);
    setSelectedEmployee(discount.employee_id);
    setDays(discount.days.toString());
    setReason(discount.reason);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    
    try {
      const { error } = await supabase
        .from('discounts')
        .delete()
        .eq('id', confirmDelete.id);
      
      if (error) throw error;
      
      showToast('تم حذف الخصم بنجاح', 'success');
      fetchDiscounts();
    } catch (error) {
      showToast('حدث خطأ أثناء حذف الخصم', 'error');
    } finally {
      setConfirmDelete(null);
    }
  };

  const resetForm = () => {
    setSelectedEmployee('');
    setDays('');
    setReason('');
    setEditingDiscount(null);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">إدارة الخصومات</h2>

      {/* Form */}
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Minus className="w-5 h-5" />
          {editingDiscount ? 'تعديل الخصم' : 'إضافة خصم جديد'}
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
                عدد الأيام
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="أدخل عدد أيام الخصم"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                سبب الخصم
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="أدخل سبب الخصم"
                required
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              {editingDiscount ? 'تحديث' : 'إضافة'} الخصم
            </button>
            {editingDiscount && (
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

      {/* Discounts List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  اسم الموظف
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  عدد الأيام
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  السبب
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
              {discounts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    لا توجد خصومات مسجلة بعد
                  </td>
                </tr>
              ) : (
                discounts.map((discount) => (
                  <tr key={discount.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {discount.employees?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                      -{discount.days} يوم
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {discount.reason}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(discount.date).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 space-x-reverse">
                      <button
                        onClick={() => handleEdit(discount)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(discount)}
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
        title="تأكيد حذف الخصم"
        message={`هل أنت متأكد من حذف خصم ${confirmDelete?.days} يوم للموظف "${confirmDelete?.employees?.name}" بسبب "${confirmDelete?.reason}"؟`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
        type="danger"
        confirmText="حذف"
        cancelText="إلغاء"
      />
    </div>
  );
};

export default DiscountsView;