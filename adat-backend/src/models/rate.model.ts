import mongoose, { Schema, Document } from 'mongoose';

export interface IRate extends Document {
  tenantId: string;
  commodityId: mongoose.Schema.Types.ObjectId;
  purchaseRate: number;
  salesRate: number;
  marketName?: string;
  remarks?: string;
  effectiveDate: Date;
  status: 'Active' | 'Inactive';
}

const RateSchema: Schema = new Schema({
  tenantId: { type: String, required: true },
  commodityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Commodity', required: true },
  purchaseRate: { type: Number, required: true },
  salesRate: { type: Number, required: true },
  marketName: { type: String, default: 'Local Mandi' },
  remarks: { type: String },
  effectiveDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

export default mongoose.model<IRate>('Rate', RateSchema);
