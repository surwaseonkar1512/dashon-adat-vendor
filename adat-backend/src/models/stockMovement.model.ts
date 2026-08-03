import mongoose, { Schema, Document } from 'mongoose';

export interface IStockMovement extends Document {
  tenantId: string;
  commodityId: mongoose.Schema.Types.ObjectId;
  warehouseId: mongoose.Schema.Types.ObjectId;
  lotNumber: string;
  batchNumber?: string;
  quantity: number; // positive = added, negative = reduced
  type: 'Purchase' | 'Sale' | 'Transfer' | 'Adjustment' | 'Return';
  referenceId?: mongoose.Schema.Types.ObjectId; // ID of Purchase bill or Sales bill
  remarks?: string;
}

const StockMovementSchema: Schema = new Schema({
  tenantId: { type: String, required: true },
  commodityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Commodity', required: true },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  lotNumber: { type: String, required: true },
  batchNumber: { type: String },
  quantity: { type: Number, required: true },
  type: { type: String, enum: ['Purchase', 'Sale', 'Transfer', 'Adjustment', 'Return'], required: true },
  referenceId: { type: mongoose.Schema.Types.ObjectId },
  remarks: { type: String }
}, { timestamps: true });

export default mongoose.model<IStockMovement>('StockMovement', StockMovementSchema);
