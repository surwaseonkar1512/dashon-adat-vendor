import { Request, Response } from 'express';
import Commodity from '../models/commodity.model';

export const createCommodity = async (req: Request, res: Response) => {
  try {
    const { name, marathiName, englishName, commodityCode, category, unit, gstPercent, hsnCode } = req.body;

    const commodity = new Commodity({
      name,
      marathiName,
      englishName,
      commodityCode,
      category,
      unit,
      gstPercent,
      hsnCode
    });

    await commodity.save();
    res.status(201).json({ success: true, data: commodity });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Commodity name or code already exists' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

export const bulkImportCommodities = async (req: Request, res: Response) => {
  try {
    const { commodities } = req.body; // Expects an array of commodity objects

    if (!Array.isArray(commodities)) {
      return res.status(400).json({ success: false, message: 'Invalid data format. Expected array of commodities.' });
    }

    const inserted = await Commodity.insertMany(commodities, { ordered: false });
    res.status(201).json({ success: true, message: `${inserted.length} commodities imported successfully` });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getCommodities = async (req: Request, res: Response) => {
  try {
    const commodities = await Commodity.find();
    res.status(200).json({ success: true, data: commodities });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
