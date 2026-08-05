import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import Tenant from '../models/tenant.model';
import Commodity from './../models/commodity.model';
import Formula from './../models/formula.model';
import Rate from './../models/rate.model';
import Farmer from './../models/farmer.model';
import Purchase from './../models/purchase.model';

const JWT_SECRET = process.env.JWT_SECRET || 'vendor-app-super-secret-key-12345';

// 1. Login
export const loginVendor = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const vendor = await Tenant.findOne({ username }).populate('planId');
    if (!vendor) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (vendor.status === 'Suspended') {
      return res.status(403).json({ success: false, message: 'Your subscription is suspended. Please contact Super Admin.' });
    }

    // Verify password
    const isMatch = await vendor.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate Token
    const token = jwt.sign(
      { tenantId: vendor.tenantId, id: vendor._id, role: 'VENDOR' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      token,
      vendor: {
        id: vendor._id,
        tenantId: vendor.tenantId,
        businessName: vendor.businessName,
        ownerName: vendor.ownerName,
        email: vendor.email,
        phone: vendor.phone,
        status: vendor.status,
        plan: vendor.planId,
        subscriptionEnd: vendor.subscriptionEnd
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Setup (Password Reset & Profile details)
export const setupVendor = async (req: Request, res: Response) => {
  try {
    const { tenantId, password, phone, ownerName, logo, address, gstNumber } = req.body;

    const vendor = await Tenant.findOne({ tenantId });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    if (password) {
      vendor.passwordHash = password; // Will be hashed automatically by pre-save hook
    }
    if (phone) vendor.phone = phone;
    if (ownerName) vendor.ownerName = ownerName;
    if (logo) vendor.logo = logo;
    if (address) vendor.address = address;
    if (gstNumber) vendor.gstNumber = gstNumber;

    await vendor.save();

    res.status(200).json({ success: true, message: 'Vendor profile setup successfully', data: vendor });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Get Commodities
export const getCommodities = async (req: Request, res: Response) => {
  try {
    const commodities = await Commodity.find({ status: 'Active' });
    res.status(200).json({ success: true, data: commodities });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Formula Management
export const getFormulas = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'tenantId is required' });
    }
    const formulas = await Formula.find({ tenantId }).populate('commodityId');
    res.status(200).json({ success: true, data: formulas });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const saveFormula = async (req: Request, res: Response) => {
  try {
    const { tenantId, commodityId, formulaName, qualityParameters } = req.body;

    let formula = await Formula.findOne({ tenantId, commodityId });
    if (formula) {
      formula.formulaName = formulaName;
      formula.qualityParameters = qualityParameters;
      await formula.save();
    } else {
      formula = new Formula({
        tenantId,
        commodityId,
        formulaName,
        qualityParameters
      });
      await formula.save();
    }

    res.status(200).json({ success: true, data: formula });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Rate Management
export const getRates = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'tenantId is required' });
    }
    const rates = await Rate.find({ tenantId }).populate('commodityId');
    res.status(200).json({ success: true, data: rates });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateRate = async (req: Request, res: Response) => {
  try {
    const { tenantId, commodityId, purchaseRate, salesRate, marketName, remarks, effectiveDate } = req.body;

    let rate = await Rate.findOne({ tenantId, commodityId });
    if (rate) {
      rate.purchaseRate = purchaseRate;
      rate.salesRate = salesRate;
      rate.marketName = marketName || rate.marketName;
      rate.remarks = remarks || rate.remarks;
      rate.effectiveDate = effectiveDate || new Date();
      await rate.save();
    } else {
      rate = new Rate({
        tenantId,
        commodityId,
        purchaseRate,
        salesRate,
        marketName: marketName || 'Local Mandi',
        remarks,
        effectiveDate: effectiveDate || new Date()
      });
      await rate.save();
    }

    res.status(200).json({ success: true, data: rate });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Farmer KYC Management
export const createFarmer = async (req: Request, res: Response) => {
  try {
    const { 
      tenantId, name, mobile, village, aadhaarNumber,
      // Optional fields for Quick Registration or Full KYC
      fatherName, gender, dob, taluka, district, state, pincode, 
      panNumber, bankDetails, documents, kycStatus
    } = req.body;

    // Generate a unique Farmer ID
    const farmerId = `FRM_${Math.floor(Math.random() * 1000000)}`;

    const farmer = new Farmer({
      tenantId,
      farmerId,
      name,
      mobile,
      village,
      aadhaarNumber: aadhaarNumber || undefined, // undefined prevents unique index conflict on empty string
      fatherName,
      gender,
      dob: dob ? new Date(dob) : undefined,
      taluka,
      district,
      state,
      pincode,
      panNumber,
      bankDetails,
      documents,
      kycStatus: kycStatus || 'Basic'
    });

    await farmer.save();
    res.status(201).json({ success: true, data: farmer });
  } catch (error: any) {
    if (error.code === 11000) {
       return res.status(400).json({ success: false, message: 'Mobile or Aadhaar already exists' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateFarmer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Ensure empty strings for unique fields become undefined
    if (updateData.aadhaarNumber === '') {
      updateData.aadhaarNumber = undefined;
    }

    const farmer = await Farmer.findByIdAndUpdate(id, updateData, { new: true });
    res.status(200).json({ success: true, data: farmer });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export const getFarmers = async (req: Request, res: Response) => {
  try {
    const { tenantId, search } = req.query;
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'tenantId is required' });
    }

    let query: any = { tenantId };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { village: { $regex: search, $options: 'i' } },
        { farmerId: { $regex: search, $options: 'i' } },
        { aadhaarNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const farmers = await Farmer.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: farmers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFarmerProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const farmer = await Farmer.findById(id);
    if (!farmer) {
      return res.status(404).json({ success: false, message: 'Farmer not found' });
    }

    // Fetch only finalized purchases for this farmer's ledger
    const purchases = await Purchase.find({ farmerId: id, status: 'Finalized' }).populate('commodityId');

    // Calculate summary statistics
    let totalPurchases = purchases.length;
    let totalQuantity = 0;
    let totalPaid = 0;
    let pendingAmount = 0;

    purchases.forEach(p => {
      totalQuantity += p.netWeight;
      if (p.paymentStatus === 'Paid') {
        totalPaid += p.netPayable;
      } else {
        pendingAmount += p.netPayable;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        farmer,
        summary: {
          totalPurchases,
          totalQuantity,
          totalPaid,
          pendingAmount,
          lastTransactionDate: purchases[0]?.createdAt || null
        },
        purchases
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Purchase Billing
export const createPurchaseBill = async (req: Request, res: Response) => {
  try {
    const { 
      tenantId, farmerId, commodityId, grossWeight, bagWeight, bagCount, 
      rate, deductionsApplied, totalAmount, netPayable, paymentStatus, status 
    } = req.body;

    const billNumber = `BILL_${Math.floor(Math.random() * 10000000)}`;
    const netWeight = grossWeight - bagWeight;

    const purchase = new Purchase({
      tenantId,
      billNumber,
      farmerId,
      commodityId,
      grossWeight,
      bagWeight,
      bagCount,
      netWeight,
      rate,
      deductionsApplied,
      totalAmount,
      netPayable,
      paymentStatus: paymentStatus || 'Pending',
      status: status || 'Draft'
    });

    await purchase.save();
    res.status(201).json({ success: true, data: purchase });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePurchaseBill = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    if (updateData.grossWeight && updateData.bagWeight) {
      updateData.netWeight = updateData.grossWeight - updateData.bagWeight;
    }
    const purchase = await Purchase.findByIdAndUpdate(id, updateData, { new: true });
    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }
    res.status(200).json({ success: true, data: purchase });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPurchases = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'tenantId is required' });
    }
    const purchases = await Purchase.find({ tenantId }).populate('farmerId').populate('commodityId');
    res.status(200).json({ success: true, data: purchases });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Mobile Dashboard Stats Summary
export const getVendorDashboardSummary = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'tenantId is required' });
    }

    const today = new Date();
    today.setHours(0,0,0,0);

    const todayPurchases = await Purchase.find({
      tenantId,
      status: 'Finalized',
      createdAt: { $gte: today }
    });

    let todayPurchaseAmount = 0;
    let todayWeight = 0;
    let pendingPaymentAmount = 0;
    const uniqueFarmers = new Set();

    todayPurchases.forEach(p => {
      todayPurchaseAmount += p.netPayable;
      todayWeight += p.netWeight;
      uniqueFarmers.add(p.farmerId.toString());
      if (p.paymentStatus === 'Pending') {
        pendingPaymentAmount += p.netPayable;
      }
    });

    const totalStockWeight = await Purchase.aggregate([
      { $match: { tenantId, status: 'Finalized' } },
      { $group: { _id: null, totalStock: { $sum: '$netWeight' } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        todayPurchaseAmount,
        todaySalesAmount: 0,
        currentStock: totalStockWeight[0] ? `${(totalStockWeight[0].totalStock / 1000).toFixed(2)} Tons` : '0 Tons',
        pendingPaymentAmount,
        todayWeight: `${todayWeight} KG`,
        todayFarmersCount: uniqueFarmers.size
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deletePurchaseBill = async (req: Request, res: Response) => {
  try {
    const bill = await Purchase.findById(req.params.id);
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
    if (bill.status === 'Finalized') return res.status(400).json({ success: false, message: 'Cannot delete finalized bills' });
    await Purchase.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Bill deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error deleting bill', error: error.message });
  }
};

export const deleteFarmer = async (req: Request, res: Response) => {
  try {
    const farmerId = req.params.id;
    // Check if farmer has finalized bills
    const bills = await Purchase.find({ farmerId, status: 'Finalized' });
    if (bills.length > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete farmer with finalized bills.' });
    }
    // Delete draft bills associated with farmer
    await Purchase.deleteMany({ farmerId, status: 'Draft' });
    // Delete farmer
    await Farmer.findByIdAndDelete(farmerId);
    res.json({ success: true, message: 'Farmer deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error deleting farmer', error: error.message });
  }
};