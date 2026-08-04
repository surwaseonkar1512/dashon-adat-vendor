import React from 'react';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { Home, ShoppingCart, Archive, FileText, User, AlertTriangle } from 'lucide-react';

const Layout = () => {
  const { isAuthenticated, vendor } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();

  // Scroll to top on every route change
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check subscription expiry/suspension
  if (vendor?.status === 'Suspended') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-6 max-w-md mx-auto text-center space-y-4">
        <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto mb-4">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Subscription Expired</h2>
        <p className="text-xs text-gray-500">Your account is suspended due to subscription expiration. Please renew your plan or contact the platform Super Admin.</p>
        <button
          onClick={() => window.location.href = '/login'}
          className="bg-primary hover:bg-green-700 text-white font-semibold py-2.5 px-6 rounded-xl shadow w-full"
        >
          Back to Login
        </button>
      </div>
    );
  }


  return (
    <div className="bg-gray-100 min-h-screen pb-20 relative max-w-md mx-auto">
      <Outlet />

      {/* Shared Bottom Navigation Bar */}
      <footer className="bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 max-w-md mx-auto px-4 py-1.5 flex items-center justify-between z-10 shadow-lg">
        {[
          { label: 'Home', icon: Home, path: '/dashboard' },
          { label: 'Purchase', icon: ShoppingCart, path: '/purchases' },
          { label: 'Stock', icon: Archive, path: '/stock' },
          { label: 'Reports', icon: FileText, path: '/reports' },
          { label: 'Ledgers', icon: User, path: '/ledgers' },
        ].map((tab, idx) => {
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={idx}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center flex-1 py-0.5"
            >
              <tab.icon className={`h-4.5 w-4.5 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
              <span className={`text-[9px] font-semibold mt-0.5 ${isActive ? 'text-primary' : 'text-gray-400'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </footer>
    </div>
  );
};

export default Layout;
