import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { Lock, Phone, AlertCircle, Eye, EyeOff, ShieldCheck, FileSpreadsheet, BarChart2, ShieldAlert } from 'lucide-react';
import { API_BASE } from '../config';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (data.success) {
        dispatch(loginSuccess({ vendor: data.vendor, token: data.token }));
        if (data.vendor.status === 'Trial') {
          navigate('/setup-wizard');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(data.message || 'Login failed.');
      }
    } catch (err) {
      setError('Connection to backend failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col justify-between px-4 py-6 max-w-md mx-auto relative bg-cover bg-center"
      style={{ backgroundImage: `url('/login_bg.png')` }}
    >
      {/* Top Overlay Gradient */}
      <div className="absolute inset-0 bg-black bg-opacity-10 z-0 pointer-events-none" />

      {/* Header Logo & Slogan */}
      <div className="text-center mt-6 z-10">
        <div className="h-16 w-16 bg-white border border-green-200 rounded-3xl flex items-center justify-center mx-auto shadow-lg mb-2">
          <div className="h-12 w-12 rounded-full border-2 border-green-600 flex items-center justify-center bg-green-50">
            <span className="text-green-700 font-extrabold text-sm tracking-tighter">ADAT</span>
          </div>
        </div>
        <h2 className="text-3xl font-black text-green-950 font-sans tracking-wide">ADAT</h2>
        <p className="text-[10px] text-green-800 font-extrabold mt-1 uppercase tracking-widest">
          ➔ शेतकऱ्यांचा विश्वास, आमची जबाबदारी ➔
        </p>
      </div>

      {/* Login Card */}
      <div className="bg-white rounded-[32px] p-6 shadow-2xl border border-gray-100 z-10 w-full my-auto space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-black text-gray-900">Vendor Login</h3>
          <div className="h-0.5 w-10 bg-green-600 mx-auto mt-1" />
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-xl flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
            <p className="text-[10px] font-bold text-red-700 leading-tight">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-3.5 text-xs text-left">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Mobile Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Phone className="h-4.5 w-4.5 text-green-600" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter mobile or username"
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-4.5 w-4.5 text-green-600" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600 bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="text-right">
            <button type="button" className="text-[10px] font-extrabold text-green-700 hover:underline">
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-700 hover:bg-green-800 text-white font-extrabold py-3 px-4 rounded-2xl shadow transition duration-200 mt-2 disabled:opacity-50 text-center block"
          >
            {isLoading ? 'SIGNING IN...' : 'LOGIN'}
          </button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink mx-3 text-gray-400 text-[9px] font-bold uppercase tracking-wider">or</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        <button
          type="button"
          className="w-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold py-2.5 px-4 rounded-2xl text-[10px] flex items-center justify-center space-x-2 shadow-xs"
        >
          <ShieldAlert className="h-4 w-4 text-green-700" />
          <span>Continue as Sub Vendor</span>
        </button>
      </div>

      {/* Premium Footer Pillars */}
      <div className="grid grid-cols-4 gap-2 text-center text-white z-10 pt-4 border-t border-white/20">
        <div className="flex flex-col items-center">
          <ShieldCheck className="h-4.5 w-4.5 text-green-300 mb-1" />
          <span className="text-[8px] font-bold tracking-wide">Secure</span>
        </div>
        <div className="flex flex-col items-center">
          <FileSpreadsheet className="h-4.5 w-4.5 text-green-300 mb-1" />
          <span className="text-[8px] font-bold tracking-wide">Easy Billing</span>
        </div>
        <div className="flex flex-col items-center">
          <BarChart2 className="h-4.5 w-4.5 text-green-300 mb-1" />
          <span className="text-[8px] font-bold tracking-wide">Real Time</span>
        </div>
        <div className="flex flex-col items-center">
          <Phone className="h-4.5 w-4.5 text-green-300 mb-1" />
          <span className="text-[8px] font-bold tracking-wide">24x7 Help</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
