import { Router } from 'express';
import { createPlan, getPlans } from '../controllers/plan.controller';
import { createTenant, getTenants, getDashboardMetrics } from '../controllers/tenant.controller';
import { createCommodity, bulkImportCommodities, getCommodities } from '../controllers/commodity.controller';

const router = Router();

// Plan Routes
router.post('/plans', createPlan);
router.get('/plans', getPlans);

// Tenant Routes
router.post('/tenants', createTenant);
router.get('/tenants', getTenants);

// Commodity Routes
router.post('/commodities', createCommodity);
router.post('/commodities/import', bulkImportCommodities);
router.get('/commodities', getCommodities);

// Dashboard
router.get('/dashboard', getDashboardMetrics);

export default router;
