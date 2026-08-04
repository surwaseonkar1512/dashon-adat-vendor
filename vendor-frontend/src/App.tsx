import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import SetupWizard from './pages/SetupWizard';
import Dashboard from './pages/Dashboard';
import FarmerKyc from './pages/FarmerKyc';
import PurchaseBilling from './pages/PurchaseBilling';
import FormulaMaster from './pages/FormulaMaster';
import RateMaster from './pages/RateMaster';
import SalesBilling from './pages/SalesBilling';
import StockManagement from './pages/StockManagement';
import PaymentsLedger from './pages/PaymentsLedger';
import WarehouseTransfer from './pages/WarehouseTransfer';
import ReportsAnalytics from './pages/ReportsAnalytics';
import BusinessSettings from './pages/BusinessSettings';
import Layout from './components/Layout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Setup Wizard Route */}
        <Route path="/setup-wizard" element={<SetupWizard />} />

        {/* Daily Operations protected routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="farmers" element={<FarmerKyc />} />
          <Route path="purchases" element={<PurchaseBilling />} />
          <Route path="formulas" element={<FormulaMaster />} />
          <Route path="rate-master" element={<RateMaster />} />
          <Route path="sales" element={<SalesBilling />} />
          <Route path="stock" element={<StockManagement />} />
          <Route path="ledgers" element={<PaymentsLedger />} />
          <Route path="transfers" element={<WarehouseTransfer />} />
          <Route path="reports" element={<ReportsAnalytics />} />
          <Route path="settings" element={<BusinessSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
