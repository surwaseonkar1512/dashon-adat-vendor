import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, Settings, Bell, FileText, Activity } from 'lucide-react';
import clsx from 'clsx';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Vendors', href: '/vendors', icon: Users },
  { name: 'Commodities', href: '/commodities', icon: FileText },
  { name: 'Plans', href: '/plans', icon: CreditCard },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Audit Logs', href: '/audit-logs', icon: Activity },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const Sidebar = () => {
  return (
    <div className="flex flex-col w-64 h-screen bg-gray-900 border-r border-gray-800 text-white">
      <div className="flex items-center justify-center h-16 bg-gray-950 border-b border-gray-800 px-4">
        <h1 className="text-xl font-bold text-secondary">ADAT Super Admin</h1>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="px-2 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                clsx(
                  isActive
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white',
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                )
              }
            >
              <item.icon
                className="mr-3 flex-shrink-0 h-6 w-6 text-gray-400 group-hover:text-gray-300"
                aria-hidden="true"
              />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
