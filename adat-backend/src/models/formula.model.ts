import mongoose, { Schema, Document } from 'mongoose';

export interface ISlabRule {
  threshold: number;      // e.g., 13% for moisture, 2% for FM
  interval: number;       // e.g., 0.5%
  shrinkFactor?: number;  // e.g., 0.7% shrink weight per slab
  dryingChargeRate?: number; // e.g., ₹15 per quintal per slab
  deductionPercent?: number; // e.g., 0.5% weight deduction per slab
}

export interface IFormula extends Document {
  tenantId: string;
  commodityId: mongoose.Schema.Types.ObjectId;
  formulaName: string;
  effectiveDate: Date;
  qualityParameters: {
    moisture: ISlabRule;
    foreignMatter: ISlabRule;
    broken: ISlabRule;
  };
  isActive: boolean;
}

const SlabRuleSchema = new Schema({
  threshold: { type: Number, required: true },
  interval: { type: Number, required: true },
  shrinkFactor: { type: Number, default: 0 },
  dryingChargeRate: { type: Number, default: 0 },
  deductionPercent: { type: Number, default: 0 }
});

const FormulaSchema: Schema = new Schema({
  tenantId: { type: String, required: true },
  commodityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Commodity', required: true },
  formulaName: { type: String, required: true },
  effectiveDate: { type: Date, default: Date.now },
  qualityParameters: {
    moisture: { type: SlabRuleSchema, required: true },
    foreignMatter: { type: SlabRuleSchema, required: true },
    broken: { type: SlabRuleSchema, required: true }
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model<IFormula>('Formula', FormulaSchema);
