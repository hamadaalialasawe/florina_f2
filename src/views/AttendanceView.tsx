import React, { useState, useEffect } from 'react';
import { Calendar, Trash2 } from 'lucide-react';
import { supabase, Employee, Attendance } from '../lib/supabase';
import { useToast } from '../hooks/useToast';
import LoadingSpinner from '../components/LoadingSpinner';
import EmployeeSelect from '../components/EmployeeSelect';
import ConfirmDialog from '../components/ConfirmDialog';

const AttendanceView: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewEmployee, setViewEmployee] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<Attendance | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (viewEmployee) {
      fetchEmployeeAttendance(viewEmployee);
    }
  }, [viewEmployee]);

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

  const fetchEmployeeAttendance = async (employeeId: string) => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          employees (
            id,
            employee_number,
            name
          )
        `)
        .eq('employee_id', employeeId)
        .order('date', { ascending: false });
      
      if (error) throw error;
      setAttendance(data || []);
    } catch (error) {
      showToast('خطأ في تحميل بيانات الحضور', 'error');
    }
  };

  const handleAttendanceSubmit = async (status: 'حضور' | 'غياب') => {
    if (!selectedEmployee || !selectedDate) {
      showToast('يرجى اختيار الموظف والتاريخ', 'warning');
      return;
    }

    try {
      const { error } = await supabase
        .from('attendance')
        .upsert({
          employee_id: selectedEmployee,
          date: selectedDate,
          status: status
        }, { 
          onConflict: 'employee_id,date',
          ignoreDuplicates: false 
        });
      
      if (error) throw error;
      
      showToast(`تم تسجيل ${status} بنجاح`, 'success');
      
      if (viewEmployee === selectedEmployee) {
        fetchEmployeeAttendance(selectedEmployee);
      }
    } catch (error) {
      showToast('حدث خطأ أثناء تسجيل الحضور', 'error');
    }
  };

  const handleDeleteAttendance = async () => {
    if (!confirmDelete) return;
    
    try {
      const { error } = await supabase
        .from('attendance')
        .delete()
        .eq('id', confirmDelete.id);
      
      if (error) throw error;
      
      showToast('تم حذف سجل الحضور بنجاح', 'success');
      fetchEmployeeAttendance(viewEmployee);
    } catch (error) {
      showToast('حدث خطأ أثناء حذف السجل', 'error');
    } finally {
      setConfirmDelete(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">تسجيل الحضور والغياب</h2>

      {/* Attendance Form */}
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          تسجيل حضور جديد
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
              التاريخ
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => handleAttendanceSubmit('حضور')}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            تسجيل حضور
          </button>
          <button
            onClick={() => handleAttendanceSubmit('غياب')}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            تسجيل غياب
          </button>
        </div>
      </div>

      {/* View Employee Attendance */}
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h3 className="text-lg font-semibold mb-4">عرض سجل حضور موظف</h3>
        
        <div className="max-w-md mb-4">
          <EmployeeSelect
            employees={employees}
            selectedEmployee={viewEmployee}
            onEmployeeChange={setViewEmployee}
            placeholder="اختر موظف لعرض سجل حضوره"
          />
        </div>

        {viewEmployee && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    التاريخ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    العمليات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendance.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                      لا توجد سجلات حضور لهذا الموظف
                    </td>
                  </tr>
                ) : (
                  attendance.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(record.date).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          record.status === 'حضور' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
        )}
      </div>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="تأكيد حذف سجل الحضور"
        message={`هل أنت متأكد من حذف سجل ${confirmDelete?.status} بتاريخ ${confirmDelete ? new Date(confirmDelete.date).toLocaleDateString('ar-EG') : ''}؟`}
        onConfirm={handleDeleteAttendance}
        onCancel={() => setConfirmDelete(null)}
        type="danger"
        confirmText="حذف"
        cancelText="إلغاء"
      />
    </div>
  );
};

export default AttendanceView;