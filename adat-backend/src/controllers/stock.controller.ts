import { Request, Response } from 'express';
import Warehouse from '../models/warehouse.model';
import StockMovement from '../models/stockMovement.model';
import Commodity from '../models/commodity.model';

export const createWarehouse = async (req: Request, res: Response) => {
  try {
    const { tenantId, name, location, capacity, manager } = req.body;
    const warehouse = new Warehouse({ tenantId, name, location, capacity, manager });
    await warehouse.save();
    res.status(201).json({ success: true, data: warehouse });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getWarehouses = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ success: false, message: 'tenantId is required' });
    const warehouses = await Warehouse.find({ tenantId });
    res.status(200).json({ success: true, data: warehouses });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Returns total inventory summary grouped by commodity and lot
export const getStockSummary = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ success: false, message: 'tenantId is required' });

    // Aggregate stock by commodity & lot
    const summary = await StockMovement.aggregate([
      { $match: { tenantId } },
      { $group: {
          _id: { commodityId: '$commodityId', lotNumber: '$lotNumber', warehouseId: '$warehouseId' },
          totalQuantity: { $sum: '$quantity' }
        }
      }
    ]);

    // Populate references manually
    const populated = await Promise.all(summary.map(async (item) => {
      const commodity = await Commodity.findById(item._id.commodityId);
      const warehouse = await Warehouse.findById(item._id.warehouseId);
      return {
        commodity,
        warehouse,
        lotNumber: item._id.lotNumber,
        quantity: item.totalQuantity
      };
    }));

    res.status(200).json({ success: true, data: populated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Stock Transfer
export const transferStock = async (req: Request, res: Response) => {
  try {
    const { tenantId, commodityId, sourceWarehouseId, destinationWarehouseId, lotNumber, quantity, remarks } = req.body;

    // Check available stock in source
    const stockHistory = await StockMovement.find({ tenantId, commodityId, warehouseId: sourceWarehouseId, lotNumber });
    const available = stockHistory.reduce((acc, curr) => acc + curr.quantity, 0);

    if (available < quantity) {
      return res.status(400).json({ success: false, message: `Insufficient stock in source warehouse. Available: ${available} KG` });
    }

    // 1. Move OUT from source
    const moveOut = new StockMovement({
      tenantId,
      commodityId,
      warehouseId: sourceWarehouseId,
      lotNumber,
      quantity: -quantity,
      type: 'Transfer',
      remarks: `Transferred to Warehouse ID: ${destinationWarehouseId}. ${remarks || ''}`
    });
    await moveOut.save();

    // 2. Move IN to destination
    const moveIn = new StockMovement({
      tenantId,
      commodityId,
      warehouseId: destinationWarehouseId,
      lotNumber,
      quantity,
      type: 'Transfer',
      remarks: `Transferred from Warehouse ID: ${sourceWarehouseId}. ${remarks || ''}`
    });
    await moveIn.save();

    res.status(200).json({ success: true, message: 'Stock transferred successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Stock Adjustment (e.g. damaged, corrections)
export const adjustStock = async (req: Request, res: Response) => {
  try {
    const { tenantId, commodityId, warehouseId, lotNumber, quantity, type, remarks } = req.body; // quantity can be positive or negative

    const movement = new StockMovement({
      tenantId,
      commodityId,
      warehouseId,
      lotNumber,
      quantity, // directly added/deducted
      type: 'Adjustment',
      remarks: `Stock Adjustment: ${type}. ${remarks || ''}`
    });
    await movement.save();

    res.status(200).json({ success: true, message: 'Stock adjusted successfully', data: movement });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
