import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Vendors from './pages/Vendors';
import Commodities from './pages/Commodities';
import Layout from './components/Layout';
import { Toaster } from 'sonner';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes wrapped in Layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="vendors" element={<Vendors />} />
          <Route path="commodities" element={<Commodities />} />
          <Route path="plans" element={<div className="p-4 text-gray-500">Plans Management Coming Soon</div>} />
          <Route path="reports" element={<div className="p-4 text-gray-500">Reports Coming Soon</div>} />
          <Route path="audit-logs" element={<div className="p-4 text-gray-500">Audit Logs Coming Soon</div>} />
          <Route path="settings" element={<div className="p-4 text-gray-500">Settings Coming Soon</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
