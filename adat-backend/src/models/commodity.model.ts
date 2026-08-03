import mongoose, { Schema, Document } from 'mongoose';

export interface ICommodity extends Document {
  name: string;
  marathiName: string;
  englishName: string;
  commodityCode: string;
  category: string;
  unit: string;
  hsnCode?: string;
  gstPercent: number;
  status: 'Active' | 'Inactive';
  defaultFormula?: string;
}

const CommoditySchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  marathiName: { type: String, required: true },
  englishName: { type: String, required: true },
  commodityCode: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  unit: { type: String, default: 'KG' },
  hsnCode: { type: String },
  gstPercent: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  defaultFormula: { type: String }
}, { timestamps: true });

export default mongoose.model<ICommodity>('Commodity', CommoditySchema);
