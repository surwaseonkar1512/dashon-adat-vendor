import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { Bell, User, LogOut } from 'lucide-react';
import type { RootState } from '../../store/store';

const Topbar = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      <div className="flex-1">
        {/* Placeholder for global search if needed */}
      </div>
      <div className="flex items-center space-x-4">
        <button className="text-gray-400 hover:text-gray-500">
          <Bell className="h-6 w-6" />
        </button>
        <div className="flex items-center space-x-2 border-l pl-4">
          <div className="flex flex-col text-right">
            <span className="text-sm font-medium text-gray-900">{user?.email}</span>
            <span className="text-xs text-gray-500">{user?.role}</span>
          </div>
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">
            <User className="h-5 w-5" />
          </div>
          <button
            onClick={() => dispatch(logout())}
            className="ml-2 text-gray-400 hover:text-red-500"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
