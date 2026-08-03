import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
  tenantId: string;
  name: string;
  mobile: string;
  address?: string;
  gstin?: string;
  outstandingBalance: number;
}

const CustomerSchema: Schema = new Schema({
  tenantId: { type: String, required: true },
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  address: { type: String },
  gstin: { type: String },
  outstandingBalance: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model<ICustomer>('Customer', CustomerSchema);
