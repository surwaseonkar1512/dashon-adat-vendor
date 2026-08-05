import { Request, Response } from 'express';
import SalesBill from '../models/salesBill.model';
import Customer from '../models/customer.model';
import StockMovement from '../models/stockMovement.model';
import LedgerEntry from '../models/ledgerEntry.model';

export const createSalesBill = async (req: Request, res: Response) => {
  try {
    const {
      tenantId, customerId, commodityId, warehouseId, lotNumber,
      quantity, rate, discount, gstPercent, loadingCharge, transportCharge, paymentStatus, remarks
    } = req.body;

    // 1. Calculate Stock Availability
    const stockHistory = await StockMovement.find({ tenantId, commodityId, warehouseId, lotNumber });
    const availableStock = stockHistory.reduce((acc, curr) => acc + curr.quantity, 0);

    if (availableStock < quantity) {
      return res.status(400).json({ success: false, message: `Insufficient stock available. Remaining stock in this lot: ${availableStock} KG` });
    }

    // 2. Perform invoice calculations
    const baseValue = quantity * (rate / 100); // 1 Quintal = 100 KG
    const discountAmt = discount || 0;
    const taxableValue = Math.max(0, baseValue - discountAmt);
    const gstAmount = (taxableValue * (gstPercent || 5)) / 100;
    const grandTotal = taxableValue + gstAmount + (loadingCharge || 0) + (transportCharge || 0);

    const invoiceNumber = `INV_${Math.floor(Math.random() * 10000000)}`;

    const salesBill = new SalesBill({
      tenantId,
      invoiceNumber,
      customerId,
      commodityId,
      warehouseId,
      lotNumber,
      quantity,
      rate,
      discount,
      gstPercent,
      gstAmount,
      loadingCharge,
      transportCharge,
      grandTotal,
      paymentStatus: paymentStatus || 'Pending',
      remarks
    });

    await salesBill.save();

    // 3. Write Stock movement OUT
    const movement = new StockMovement({
      tenantId,
      commodityId,
      warehouseId,
      lotNumber,
      quantity: -quantity, // OUT movement
      type: 'Sale',
      referenceId: salesBill._id,
      remarks: `Sales Invoice: ${invoiceNumber}`
    });
    await movement.save();

    // 4. Update customer outstanding balance & write customer ledger entry
    const customer = await Customer.findById(customerId);
    if (customer) {
      customer.outstandingBalance += grandTotal;
      await customer.save();

      const ledger = new LedgerEntry({
        tenantId,
        partyType: 'Customer',
        partyId: customer._id,
        amount: grandTotal,
        entryType: 'Credit',
        reference: invoiceNumber,
        remarks: `Invoice generated`,
        balanceAfter: customer.outstandingBalance
      });
      await ledger.save();
    }

    res.status(201).json({ success: true, data: salesBill });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSalesBills = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'tenantId is required' });
    }

    const sales = await SalesBill.find({ tenantId })
      .populate('customerId')
      .populate('commodityId')
      .populate('warehouseId');

    res.status(200).json({ success: true, data: sales });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSalesBill = async (req: Request, res: Response) => {
  try {
    const bill = await SalesBill.findById(req.params.id);
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
    if (bill.status === 'Finalized') return res.status(400).json({ success: false, message: 'Cannot delete finalized bills' });
    await SalesBill.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Bill deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error deleting bill', error: error.message });
  }
};
