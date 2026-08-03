import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { Lock, Phone, AlertCircle } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/v1/vendor/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (data.success) {
        dispatch(loginSuccess({ vendor: data.vendor, token: data.token }));
        // If it's the very first login (status is 'Trial' or has setup flag), route to setup-wizard
        // Let's inspect local storage or status
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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between px-4 py-8 max-w-md mx-auto">
      <div className="flex-1 flex flex-col justify-center">
        <div className="text-center mb-8">
          <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto shadow-lg mb-4">
            ADAT
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">ADAT Platform</h2>
          <p className="text-sm text-gray-500 mt-1">Commodity Procurement Platform</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-3 rounded flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Username / Phone
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter login username"
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-primary focus:border-primary text-sm p-3"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-primary focus:border-primary text-sm p-3"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded text-primary focus:ring-primary" />
              <span>Remember Me</span>
            </label>
            <button type="button" className="text-primary font-medium hover:underline">
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-xl shadow transition duration-200 mt-6 disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'LOGIN'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-xs uppercase tracking-wider font-semibold">OR</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>
          <button
            type="button"
            className="w-full border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded-xl text-sm"
          >
            Login using OTP
          </button>
        </div>
      </div>

      <div className="text-center text-xs text-gray-400 mt-8">
        App Version 1.0.0
      </div>
    </div>
  );
};

export default Login;
