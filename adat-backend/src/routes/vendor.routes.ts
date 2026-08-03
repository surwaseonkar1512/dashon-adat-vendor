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
  createPurchaseBill,
  getPurchases,
  getVendorDashboardSummary
} from '../controllers/vendor.controller';
import { createSalesBill, getSalesBills } from '../controllers/sales.controller';
import { createWarehouse, getWarehouses, getStockSummary, transferStock, adjustStock } from '../controllers/stock.controller';
import { createCustomer, getCustomers, payFarmer, collectCustomerPayment, getLedgerHistory } from '../controllers/ledger.controller';

const router = Router();

router.post('/login', loginVendor);
router.post('/setup', setupVendor);
router.get('/commodities', getCommodities);
router.get('/formulas', getFormulas);
router.post('/formulas', saveFormula);
router.get('/rates', getRates);
router.post('/rates', updateRate);

// Farmer KYC
router.post('/farmers', createFarmer);
router.get('/farmers', getFarmers);
router.get('/farmers/:id', getFarmerProfile);

// Purchases Billing
router.post('/purchases', createPurchaseBill);
router.get('/purchases', getPurchases);

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
