import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface ISuperAdmin extends Document {
  email: string;
  passwordHash: string;
  role: string;
  name: string;
  isActive: boolean;
  comparePassword(password: string): Promise<boolean>;
}

const superAdminSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, default: 'SUPER_ADMIN', enum: ['SUPER_ADMIN', 'SUPPORT_EXECUTIVE', 'FINANCE_MANAGER', 'TECHNICAL_ADMINISTRATOR'] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Hash password before saving
superAdminSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) return;
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

// Compare password method
superAdminSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

export default mongoose.model<ISuperAdmin>('SuperAdmin', superAdminSchema);
