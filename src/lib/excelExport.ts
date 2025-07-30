import * as XLSX from 'xlsx';
import { EmployeeSummary, CompanyInfo } from './supabase';

export const exportEmployeeSummaryToExcel = (
  summary: EmployeeSummary,
  companyInfo: CompanyInfo
) => {
  // إنشاء ورقة عمل جديدة
  const workbook = XLSX.utils.book_new();
  
  // البيانات الأساسية
  const data = [
    ['اسم المكان', companyInfo.place_name],
    ['اسم المدير', companyInfo.manager_name],
    [''],
    ['تقرير الموظف'],
    ['الرقم الوظيفي', summary.employee.employee_number],
    ['اسم الموظف', summary.employee.name],
    [''],
    ['ملخص الأداء'],
    ['أيام الحضور', summary.attendanceDays],
    ['أيام الغياب', summary.absenceDays],
    ['إجمالي السلف', summary.totalAdvances + ' جنيه'],
    ['إجمالي أيام المكافآت', summary.totalBonusDays],
    ['إجمالي أيام الخصومات', summary.totalDiscountDays],
    ['إجمالي أيام الإجازات', summary.totalLeaveDays],
    ['إجمالي أيام العمل الإضافي', summary.totalOvertimeDays],
    [''],
    ['تاريخ التقرير', new Date().toLocaleDateString('ar-EG')]
  ];

  // إنشاء ورقة العمل
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  
  // تحديد عرض الأعمدة
  worksheet['!cols'] = [
    { width: 20 },
    { width: 30 }
  ];

  // إضافة ورقة العمل إلى المصنف
  XLSX.utils.book_append_sheet(workbook, worksheet, 'تقرير الموظف');

  // تصدير الملف
  const fileName = `تقرير_${summary.employee.name}_${new Date().toLocaleDateString('ar-EG').replace(/\//g, '-')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};