import { Request, Response } from 'express';
import Plan from '../models/plan.model';

export const createPlan = async (req: Request, res: Response) => {
  try {
    const plan = new Plan(req.body);
    await plan.save();
    res.status(201).json({ success: true, data: plan });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getPlans = async (req: Request, res: Response) => {
  try {
    const plans = await Plan.find();
    res.status(200).json({ success: true, data: plans });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
