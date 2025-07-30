import React, { useState, useEffect } from 'react';
import { DollarSign, Edit2, Trash2 } from 'lucide-react';
import { supabase, Employee, Advance } from '../lib/supabase';
import { useToast } from '../hooks/useToast';
import LoadingSpinner from '../components/LoadingSpinner';
import EmployeeSelect from '../components/EmployeeSelect';
import ConfirmDialog from '../components/ConfirmDialog';

const AdvancesView: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [amount, setAmount] = useState('');
  const [editingAdvance, setEditingAdvance] = useState<Advance | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Advance | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchEmployees();
    fetchAdvances();
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

  const fetchAdvances = async () => {
    try {
      const { data, error } = await supabase
        .from('advances')
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
      setAdvances(data || []);
    } catch (error) {
      showToast('خطأ في تحميل بيانات السلف', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEmployee || !amount) {
      showToast('يرجى ملء جميع الحقول', 'warning');
      return;
    }

    try {
      if (editingAdvance) {
        const { error } = await supabase
          .from('advances')
          .update({
            employee_id: selectedEmployee,
            amount: parseFloat(amount)
          })
          .eq('id', editingAdvance.id);
        
        if (error) throw error;
        showToast('تم تحديث السلفة بنجاح', 'success');
      } else {
        const { error } = await supabase
          .from('advances')
          .insert({
            employee_id: selectedEmployee,
            amount: parseFloat(amount)
          });
        
        if (error) throw error;
        showToast('تم إضافة السلفة بنجاح', 'success');
      }
      
      resetForm();
      fetchAdvances();
    } catch (error) {
      showToast('حدث خطأ أثناء حفظ البيانات', 'error');
    }
  };

  const handleEdit = (advance: Advance) => {
    setEditingAdvance(advance);
    setSelectedEmployee(advance.employee_id);
    setAmount(advance.amount.toString());
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    
    try {
      const { error } = await supabase
        .from('advances')
        .delete()
        .eq('id', confirmDelete.id);
      
      if (error) throw error;
      
      showToast('تم حذف السلفة بنجاح', 'success');
      fetchAdvances();
    } catch (error) {
      showToast('حدث خطأ أثناء حذف السلفة', 'error');
    } finally {
      setConfirmDelete(null);
    }
  };

  const resetForm = () => {
    setSelectedEmployee('');
    setAmount('');
    setEditingAdvance(null);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">إدارة السلف</h2>

      {/* Form */}
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          {editingAdvance ? 'تعديل السلفة' : 'إضافة سلفة جديدة'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                المبلغ (جنيه)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="أدخل مبلغ السلفة"
                required
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              {editingAdvance ? 'تحديث' : 'إضافة'} السلفة
            </button>
            {editingAdvance && (
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

      {/* Advances List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  اسم الموظف
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المبلغ
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
              {advances.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    لا توجد سلف مسجلة بعد
                  </td>
                </tr>
              ) : (
                advances.map((advance) => (
                  <tr key={advance.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {advance.employees?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {advance.amount.toLocaleString()} جنيه
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(advance.date).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 space-x-reverse">
                      <button
                        onClick={() => handleEdit(advance)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(advance)}
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
        title="تأكيد حذف السلفة"
        message={`هل أنت متأكد من حذف سلفة بمبلغ ${confirmDelete?.amount} جنيه للموظف "${confirmDelete?.employees?.name}"؟`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
        type="danger"
        confirmText="حذف"
        cancelText="إلغاء"
      />
    </div>
  );
};

export default AdvancesView;