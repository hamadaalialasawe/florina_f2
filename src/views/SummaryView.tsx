import React, { useState, useEffect } from 'react';
import { FileText, Download } from 'lucide-react';
import { supabase, Employee, EmployeeSummary, CompanyInfo } from '../lib/supabase';
import { useToast } from '../hooks/useToast';
import LoadingSpinner from '../components/LoadingSpinner';
import EmployeeSelect from '../components/EmployeeSelect';
import { exportEmployeeSummaryToExcel } from '../lib/excelExport';

const SummaryView: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [employeeSummary, setEmployeeSummary] = useState<EmployeeSummary | null>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchEmployees();
    fetchCompanyInfo();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      fetchEmployeeSummary(selectedEmployee);
    }
  }, [selectedEmployee]);

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

  const fetchCompanyInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('company_info')
        .select('*')
        .limit(1)
        .single();
      
      if (error) throw error;
      setCompanyInfo(data);
    } catch (error) {
      console.error('Error fetching company info:', error);
    }
  };

  const fetchEmployeeSummary = async (employeeId: string) => {
    setSummaryLoading(true);
    try {
      const employee = employees.find(emp => emp.id === employeeId);
      if (!employee) return;

      // Fetch all data for the employee
      const [
        attendanceResult,
        advancesResult,
        bonusesResult,
        discountsResult,
        overtimeResult,
        leavesResult
      ] = await Promise.all([
        supabase
          .from('attendance')
          .select('*')
          .eq('employee_id', employeeId),
        supabase
          .from('advances')
          .select('*')
          .eq('employee_id', employeeId),
        supabase
          .from('bonuses')
          .select('*')
          .eq('employee_id', employeeId),
        supabase
          .from('discounts')
          .select('*')
          .eq('employee_id', employeeId),
        supabase
          .from('overtime')
          .select('*')
          .eq('employee_id', employeeId),
        supabase
          .from('leaves')
          .select('*')
          .eq('employee_id', employeeId)
      ]);

      // Calculate summary
      const attendanceData = attendanceResult.data || [];
      const advancesData = advancesResult.data || [];
      const bonusesData = bonusesResult.data || [];
      const discountsData = discountsResult.data || [];
      const overtimeData = overtimeResult.data || [];
      const leavesData = leavesResult.data || [];

      const attendanceDays = attendanceData.filter(record => record.status === 'حضور').length;
      const absenceDays = attendanceData.filter(record => record.status === 'غياب').length;
      const totalAdvances = advancesData.reduce((sum, advance) => sum + parseFloat(advance.amount.toString()), 0);
      const totalBonusDays = bonusesData.reduce((sum, bonus) => sum + parseFloat(bonus.days.toString()), 0);
      const totalDiscountDays = discountsData.reduce((sum, discount) => sum + parseFloat(discount.days.toString()), 0);
      const totalLeaveDays = leavesData.reduce((sum, leave) => sum + leave.calculated_days, 0);
      const totalOvertimeDays = overtimeData.reduce((sum, overtime) => sum + parseFloat(overtime.calculated_days.toString()), 0);

      setEmployeeSummary({
        employee,
        attendanceDays,
        absenceDays,
        totalAdvances,
        totalBonusDays,
        totalDiscountDays,
        totalLeaveDays,
        totalOvertimeDays
      });
    } catch (error) {
      showToast('خطأ في تحميل ملخص الموظف', 'error');
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleExportToExcel = () => {
    if (!employeeSummary || !companyInfo) {
      showToast('يجب اختيار موظف أولاً', 'warning');
      return;
    }

    try {
      exportEmployeeSummaryToExcel(employeeSummary, companyInfo);
      showToast('تم تصدير التقرير بنجاح', 'success');
    } catch (error) {
      showToast('حدث خطأ أثناء تصدير التقرير', 'error');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">ملخص الموظف</h2>

      {/* Employee Selection */}
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          اختيار الموظف لعرض الملخص
        </h3>
        
        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            الموظف
          </label>
          <EmployeeSelect
            employees={employees}
            selectedEmployee={selectedEmployee}
            onEmployeeChange={setSelectedEmployee}
            placeholder="اختر موظف لعرض ملخصه"
          />
        </div>
      </div>

      {/* Employee Summary */}
      {selectedEmployee && (
        <div className="bg-white rounded-lg shadow-md border">
          {summaryLoading ? (
            <LoadingSpinner />
          ) : employeeSummary ? (
            <div>
              {/* Header */}
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      ملخص الموظف: {employeeSummary.employee.name}
                    </h3>
                    <p className="text-gray-600">
                      الرقم الوظيفي: {employeeSummary.employee.employee_number}
                    </p>
                    {companyInfo && (
                      <div className="mt-3 text-sm text-gray-500">
                        <p>{companyInfo.place_name} - مدير: {companyInfo.manager_name}</p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleExportToExcel}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    تصدير إلى Excel
                  </button>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Attendance */}
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-2">الحضور</h4>
                    <p className="text-2xl font-bold text-green-600">
                      {employeeSummary.attendanceDays}
                    </p>
                    <p className="text-sm text-green-700">يوم حضور</p>
                  </div>

                  {/* Absence */}
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <h4 className="font-semibold text-red-800 mb-2">الغياب</h4>
                    <p className="text-2xl font-bold text-red-600">
                      {employeeSummary.absenceDays}
                    </p>
                    <p className="text-sm text-red-700">يوم غياب</p>
                  </div>

                  {/* Advances */}
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h4 className="font-semibold text-yellow-800 mb-2">إجمالي السلف</h4>
                    <p className="text-2xl font-bold text-yellow-600">
                      {employeeSummary.totalAdvances.toLocaleString()}
                    </p>
                    <p className="text-sm text-yellow-700">جنيه</p>
                  </div>

                  {/* Bonuses */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">أيام المكافآت</h4>
                    <p className="text-2xl font-bold text-blue-600">
                      {employeeSummary.totalBonusDays}
                    </p>
                    <p className="text-sm text-blue-700">يوم مكافأة</p>
                  </div>

                  {/* Discounts */}
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-purple-800 mb-2">أيام الخصومات</h4>
                    <p className="text-2xl font-bold text-purple-600">
                      {employeeSummary.totalDiscountDays}
                    </p>
                    <p className="text-sm text-purple-700">يوم خصم</p>
                  </div>

                  {/* Leaves */}
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <h4 className="font-semibold text-orange-800 mb-2">أيام الإجازات</h4>
                    <p className="text-2xl font-bold text-orange-600">
                      {employeeSummary.totalLeaveDays}
                    </p>
                    <p className="text-sm text-orange-700">يوم إجازة</p>
                  </div>

                  {/* Overtime */}
                  <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                    <h4 className="font-semibold text-indigo-800 mb-2">العمل الإضافي</h4>
                    <p className="text-2xl font-bold text-indigo-600">
                      {employeeSummary.totalOvertimeDays.toFixed(2)}
                    </p>
                    <p className="text-sm text-indigo-700">يوم إضافي</p>
                  </div>

                  {/* Report Date */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-2">تاريخ التقرير</h4>
                    <p className="text-lg font-bold text-gray-600">
                      {new Date().toLocaleDateString('ar-EG')}
                    </p>
                    <p className="text-sm text-gray-700">آخر تحديث</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              حدث خطأ في تحميل ملخص الموظف
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SummaryView;