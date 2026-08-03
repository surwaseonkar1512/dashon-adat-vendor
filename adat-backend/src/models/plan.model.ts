import mongoose, { Schema, Document } from 'mongoose';

export interface IPlan extends Document {
  name: string;
  price: number;
  billingCycle: 'Monthly' | 'Yearly';
  features: {
    maxUsers: number;
    maxWarehouses: number;
  };
  isActive: boolean;
}

const PlanSchema: Schema = new Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  billingCycle: { type: String, enum: ['Monthly', 'Yearly'], required: true },
  features: {
    maxUsers: { type: Number, default: 1 },
    maxWarehouses: { type: Number, default: 1 },
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model<IPlan>('Plan', PlanSchema);
