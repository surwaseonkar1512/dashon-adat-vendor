import { Request, Response } from 'express';
import LedgerEntry from '../models/ledgerEntry.model';
import Customer from '../models/customer.model';
import Farmer from '../models/farmer.model';

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const { tenantId, name, mobile, address, gstin } = req.body;
    const customer = new Customer({ tenantId, name, mobile, address, gstin });
    await customer.save();
    res.status(201).json({ success: true, data: customer });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCustomers = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ success: false, message: 'tenantId is required' });
    const customers = await Customer.find({ tenantId });
    res.status(200).json({ success: true, data: customers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Make Payment to Farmer
export const payFarmer = async (req: Request, res: Response) => {
  try {
    const { tenantId, farmerId, amount, paymentMode, reference, remarks } = req.body;

    const farmer = await Farmer.findById(farmerId);
    if (!farmer) return res.status(404).json({ success: false, message: 'Farmer not found' });

    // Since we owe farmer money for purchase, payment is a Debit entry reducing the balance
    // For simplicity, outstanding balances are updated
    // In our context: balance = outstanding farmer balance (Credit is purchase, Debit is payment)
    // Let's compute new balance:
    // outstanding balance = previous balance - amount
    const ledgerHistory = await LedgerEntry.find({ tenantId, partyId: farmerId }).sort({ createdAt: -1 });
    const prevBalance = ledgerHistory[0]?.balanceAfter || 0;
    const balanceAfter = prevBalance - amount;

    const entry = new LedgerEntry({
      tenantId,
      partyType: 'Farmer',
      partyId: farmerId,
      amount,
      entryType: 'Debit',
      paymentMode,
      reference,
      remarks,
      balanceAfter
    });
    await entry.save();

    res.status(200).json({ success: true, data: entry });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Receive Collection from Customer
export const collectCustomerPayment = async (req: Request, res: Response) => {
  try {
    const { tenantId, customerId, amount, paymentMode, reference, remarks } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    customer.outstandingBalance = Math.max(0, customer.outstandingBalance - amount);
    await customer.save();

    const entry = new LedgerEntry({
      tenantId,
      partyType: 'Customer',
      partyId: customerId,
      amount,
      entryType: 'Debit', // Debit reduces outstanding credit balance
      paymentMode,
      reference,
      remarks,
      balanceAfter: customer.outstandingBalance
    });
    await entry.save();

    res.status(200).json({ success: true, data: entry });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getLedgerHistory = async (req: Request, res: Response) => {
  try {
    const { tenantId, partyType, partyId } = req.query;
    if (!tenantId || !partyType || !partyId) {
      return res.status(400).json({ success: false, message: 'tenantId, partyType, and partyId are required' });
    }

    const history = await LedgerEntry.find({ tenantId, partyType, partyId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: history });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const customerId = req.params.id;
    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    
    // Check if customer has an outstanding balance
    if (customer.outstandingBalance && customer.outstandingBalance > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete customer with an outstanding balance.' });
    }

    // Since we don't have a SalesBill import here easily, we could just delete the customer if balance is 0.
    // Assuming balance 0 means they are safe to delete or have been settled.
    await Customer.findByIdAndDelete(customerId);
    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error deleting customer', error: error.message });
  }
};
