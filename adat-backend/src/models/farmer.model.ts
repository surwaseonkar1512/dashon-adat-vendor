import mongoose, { Schema, Document } from 'mongoose';

export interface IFarmer extends Document {
  tenantId: string;
  farmerId: string;
  name: string;
  fatherName: string;
  mobile: string;
  gender: string;
  dob?: Date;
  village: string;
  taluka: string;
  district: string;
  state: string;
  pincode: string;
  aadhaarNumber: string;
  panNumber?: string;
  bankDetails: {
    accountHolder: string;
    bankName: string;
    accountNumber: string;
    ifsc: string;
    branch: string;
  };
  landInfo?: {
    surveyNumber: string;
    crop: string;
    area: string;
    irrigationType: string;
  };
  status: 'Active' | 'Inactive';
}

const FarmerSchema: Schema = new Schema({
  tenantId: { type: String, required: true },
  farmerId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  fatherName: { type: String, required: true },
  mobile: { type: String, required: true },
  gender: { type: String, required: true },
  dob: { type: Date },
  village: { type: String, required: true },
  taluka: { type: String, required: true },
  district: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  aadhaarNumber: { type: String, required: true },
  panNumber: { type: String },
  bankDetails: {
    accountHolder: { type: String, required: true },
    bankName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    ifsc: { type: String, required: true },
    branch: { type: String, required: true }
  },
  landInfo: {
    surveyNumber: { type: String },
    crop: { type: String },
    area: { type: String },
    irrigationType: { type: String }
  },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

export default mongoose.model<IFarmer>('Farmer', FarmerSchema);
