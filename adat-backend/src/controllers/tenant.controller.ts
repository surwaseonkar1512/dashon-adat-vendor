import { Request, Response } from 'express';
import Tenant from '../models/tenant.model';

export const createTenant = async (req: Request, res: Response) => {
  try {
    const { 
      businessName, 
      ownerName, 
      email, 
      phone, 
      planId, 
      username, 
      password, 
      subscriptionDays 
    } = req.body;
    
    // Generate a unique tenant ID
    const tenantId = `TENANT_${Math.floor(Math.random() * 1000000)}`;

    // Calculate subscription dates
    const subscriptionStart = new Date();
    const subscriptionEnd = new Date();
    subscriptionEnd.setDate(subscriptionStart.getDate() + Number(subscriptionDays || 30));

    const tenant = new Tenant({
      tenantId,
      businessName,
      ownerName,
      email,
      phone,
      username,
      passwordHash: password, // Will be hashed by pre-save hook
      planId,
      subscriptionStart,
      subscriptionEnd,
      subscriptionDays: Number(subscriptionDays || 30),
      status: 'Active'
    });

    await tenant.save();
    res.status(201).json({ success: true, data: tenant });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Email, Username, or Tenant ID already exists' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getTenants = async (req: Request, res: Response) => {
  try {
    const tenants = await Tenant.find().populate('planId');
    res.status(200).json({ success: true, data: tenants });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getDashboardMetrics = async (req: Request, res: Response) => {
  try {
    const totalTenants = await Tenant.countDocuments();
    const activeTenants = await Tenant.countDocuments({ status: 'Active' });
    
    res.status(200).json({ 
      success: true, 
      data: {
        totalTenants,
        activeTenants
      } 
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
