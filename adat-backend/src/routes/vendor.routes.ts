import { Router } from 'express';
import { 
  loginVendor, 
  setupVendor, 
  getCommodities, 
  getFormulas, 
  saveFormula, 
  getRates, 
  updateRate,
  createFarmer,
  getFarmers,
  getFarmerProfile,
  updateFarmer,
  createPurchaseBill,
  getPurchases,
  updatePurchaseBill,
  getVendorDashboardSummary
} from '../controllers/vendor.controller';
import { createSalesBill, getSalesBills } from '../controllers/sales.controller';
import { createWarehouse, getWarehouses, getStockSummary, transferStock, adjustStock } from '../controllers/stock.controller';
import { createCustomer, getCustomers, payFarmer, collectCustomerPayment, getLedgerHistory } from '../controllers/ledger.controller';
import { upload, uploadFile } from '../controllers/upload.controller';

const router = Router();

router.post('/login', loginVendor);
router.post('/setup', setupVendor);
router.post('/upload', upload.single('file'), uploadFile);
router.get('/commodities', getCommodities);
router.get('/formulas', getFormulas);
router.post('/formulas', saveFormula);
router.get('/rates', getRates);
router.post('/rates', updateRate);

// Farmer KYC
router.post('/farmers', createFarmer);
router.get('/farmers', getFarmers);
router.get('/farmers/:id', getFarmerProfile);
router.put('/farmers/:id', updateFarmer);

// Purchases Billing
router.post('/purchases', createPurchaseBill);
router.get('/purchases', getPurchases);
router.put('/purchases/:id', updatePurchaseBill);

// Sales Billing
router.post('/sales', createSalesBill);
router.get('/sales', getSalesBills);

// Stock & Warehouses
router.post('/warehouses', createWarehouse);
router.get('/warehouses', getWarehouses);
router.get('/stock', getStockSummary);
router.post('/stock/transfer', transferStock);
router.post('/stock/adjust', adjustStock);

// Ledger & Collections
router.post('/customers', createCustomer);
router.get('/customers', getCustomers);
router.post('/payments/farmer', payFarmer);
router.post('/payments/customer', collectCustomerPayment);
router.get('/ledgers', getLedgerHistory);

// Dashboard Summary Stats
router.get('/dashboard-summary', getVendorDashboardSummary);

export default router;
