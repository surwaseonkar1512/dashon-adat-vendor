import mongoose, { Schema, Document } from 'mongoose';

export interface ISalesBill extends Document {
  tenantId: string;
  invoiceNumber: string;
  customerId: mongoose.Schema.Types.ObjectId;
  commodityId: mongoose.Schema.Types.ObjectId;
  warehouseId: mongoose.Schema.Types.ObjectId;
  lotNumber: string;
  quantity: number; // in KG
  rate: number; // per Quintal
  discount?: number;
  gstPercent: number;
  gstAmount: number;
  loadingCharge?: number;
  transportCharge?: number;
  grandTotal: number;
  paymentStatus: 'Paid' | 'Pending' | 'Draft';
  remarks?: string;
}

const SalesBillSchema: Schema = new Schema({
  tenantId: { type: String, required: true },
  invoiceNumber: { type: String, required: true, unique: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  commodityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Commodity', required: true },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  lotNumber: { type: String, required: true },
  quantity: { type: Number, required: true },
  rate: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  gstPercent: { type: Number, default: 5 },
  gstAmount: { type: Number, required: true },
  loadingCharge: { type: Number, default: 0 },
  transportCharge: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['Paid', 'Pending', 'Draft'], default: 'Pending' },
  remarks: { type: String }
}, { timestamps: true });

export default mongoose.model<ISalesBill>('SalesBill', SalesBillSchema);
