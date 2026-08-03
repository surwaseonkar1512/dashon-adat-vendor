import mongoose, { Schema, Document } from 'mongoose';

export interface IWarehouse extends Document {
  tenantId: string;
  name: string;
  location: string;
  capacity: string; // capacity in tons/quintals
  manager?: string;
  status: 'Active' | 'Inactive';
}

const WarehouseSchema: Schema = new Schema({
  tenantId: { type: String, required: true },
  name: { type: String, required: true },
  location: { type: String, required: true },
  capacity: { type: String, required: true },
  manager: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

export default mongoose.model<IWarehouse>('Warehouse', WarehouseSchema);
