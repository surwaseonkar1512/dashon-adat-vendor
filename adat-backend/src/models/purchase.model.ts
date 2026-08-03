import mongoose, { Schema, Document } from 'mongoose';

export interface IPurchase extends Document {
  tenantId: string;
  billNumber: string;
  farmerId: mongoose.Schema.Types.ObjectId;
  commodityId: mongoose.Schema.Types.ObjectId;
  grossWeight: number;
  bagWeight: number;
  bagCount: number;
  netWeight: number;
  rate: number;
  deductionsApplied: Array<{
    name: string;
    type: string;
    value: number;
    amount: number;
  }>;
  totalAmount: number;
  netPayable: number;
  paymentStatus: 'Pending' | 'Paid';
}

const PurchaseSchema: Schema = new Schema({
  tenantId: { type: String, required: true },
  billNumber: { type: String, required: true, unique: true },
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true },
  commodityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Commodity', required: true },
  grossWeight: { type: Number, required: true },
  bagWeight: { type: Number, required: true },
  bagCount: { type: Number, required: true },
  netWeight: { type: Number, required: true },
  rate: { type: Number, required: true },
  deductionsApplied: [
    {
      name: { type: String },
      type: { type: String },
      value: { type: Number },
      amount: { type: Number }
    }
  ],
  totalAmount: { type: Number, required: true },
  netPayable: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' }
}, { timestamps: true });

export default mongoose.model<IPurchase>('Purchase', PurchaseSchema);
