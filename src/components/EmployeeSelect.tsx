import React from 'react';
import { Employee } from '../lib/supabase';

interface EmployeeSelectProps {
  employees: Employee[];
  selectedEmployee: string;
  onEmployeeChange: (employeeId: string) => void;
  placeholder?: string;
  className?: string;
}

const EmployeeSelect: React.FC<EmployeeSelectProps> = ({
  employees,
  selectedEmployee,
  onEmployeeChange,
  placeholder = 'اختر موظف',
  className = ''
}) => {
  return (
    <select
      value={selectedEmployee}
      onChange={(e) => onEmployeeChange(e.target.value)}
      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
      required
    >
      <option value="">{placeholder}</option>
      {employees.map(employee => (
        <option key={employee.id} value={employee.id}>
          {employee.employee_number} - {employee.name}
        </option>
      ))}
    </select>
  );
};

export default EmployeeSelect;