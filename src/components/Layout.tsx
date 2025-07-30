import React, { useState } from 'react';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Award, 
  Minus, 
  Clock, 
  PlaneTakeoff, 
  FileText, 
  Settings,
  Menu,
  X
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, onViewChange }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'employees', label: 'إدارة الموظفين', icon: Users },
    { id: 'attendance', label: 'تسجيل الحضور', icon: Calendar },
    { id: 'advances', label: 'إدارة السلف', icon: DollarSign },
    { id: 'bonuses', label: 'إدارة المكافآت', icon: Award },
    { id: 'discounts', label: 'إدارة الخصومات', icon: Minus },
    { id: 'overtime', label: 'العمل الإضافي', icon: Clock },
    { id: 'leaves', label: 'الإجازات الشهرية', icon: PlaneTakeoff },
    { id: 'summary', label: 'ملخص الموظف', icon: FileText },
    { id: 'settings', label: 'إعدادات الشركة', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 rtl" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <h1 className="text-xl font-bold text-gray-900">نظام إدارة موظفين فلورينا كافي</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 right-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out
          md:translate-x-0 md:static md:inset-0
          ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
        `}>
          <div className="flex flex-col h-full pt-16 md:pt-0">
            <nav className="flex-1 px-4 py-4 space-y-2">
              {menuItems.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onViewChange(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 text-right rounded-lg transition-colors
                      ${currentView === item.id 
                        ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-700' 
                        : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 md:mr-64">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;