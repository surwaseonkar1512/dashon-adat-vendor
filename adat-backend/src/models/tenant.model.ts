import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface ITenant extends Document {
  tenantId: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  username: string;
  passwordHash: string;
  status: 'Active' | 'Suspended' | 'Trial';
  planId: mongoose.Schema.Types.ObjectId;
  subscriptionStart: Date;
  subscriptionEnd: Date;
  subscriptionDays: number;
  logo?: string;
  address?: string;
  gstNumber?: string;
  comparePassword(password: string): Promise<boolean>;
}

const TenantSchema: Schema = new Schema({
  tenantId: { type: String, required: true, unique: true },
  businessName: { type: String, required: true },
  ownerName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  status: { type: String, enum: ['Active', 'Suspended', 'Trial'], default: 'Trial' },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
  subscriptionStart: { type: Date, required: true },
  subscriptionEnd: { type: Date, required: true },
  subscriptionDays: { type: Number, required: true },
  logo: { type: String },
  address: { type: String },
  gstNumber: { type: String },
}, { timestamps: true });

// Hash password before saving
TenantSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) return;
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

// Compare password
TenantSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

export default mongoose.model<ITenant>('Tenant', TenantSchema);
