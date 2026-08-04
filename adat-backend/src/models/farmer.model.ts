import mongoose, { Schema, Document } from 'mongoose';

export interface IFarmer extends Document {
  tenantId: string;
  farmerId: string;
  name: string;
  mobile: string;
  village: string;
  
  // Optional Basic Info
  fatherName?: string;
  gender?: string;
  dob?: Date;
  taluka?: string;
  district?: string;
  state?: string;
  pincode?: string;
  
  // KYC Info
  kycStatus: 'Basic' | 'KYC Pending' | 'Verified';
  aadhaarNumber?: string;
  panNumber?: string;
  
  // Bank Info
  bankDetails?: {
    accountHolder?: string;
    bankName?: string;
    accountNumber?: string;
    ifsc?: string;
    branch?: string;
  };
  
  // Documents Tracking
  documents?: {
    documentType: string;
    documentNumber?: string;
    url: string;
    remarks?: string;
    uploadDate: Date;
    surveyNumber?: string; // Specific for 7/12 or 8A
  }[];

  status: 'Active' | 'Inactive';
}

const FarmerSchema: Schema = new Schema({
  tenantId: { type: String, required: true },
  farmerId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  village: { type: String, required: true },
  
  fatherName: { type: String },
  gender: { type: String },
  dob: { type: Date },
  taluka: { type: String },
  district: { type: String },
  state: { type: String },
  pincode: { type: String },
  
  kycStatus: { type: String, enum: ['Basic', 'KYC Pending', 'Verified'], default: 'Basic' },
  
  // Sparse index ensures uniqueness only if the value is provided
  aadhaarNumber: { type: String, sparse: true, unique: true },
  panNumber: { type: String },
  
  bankDetails: {
    accountHolder: { type: String },
    bankName: { type: String },
    accountNumber: { type: String },
    ifsc: { type: String },
    branch: { type: String }
  },
  
  documents: [{
    documentType: { type: String, required: true },
    documentNumber: { type: String },
    url: { type: String, required: true },
    remarks: { type: String },
    uploadDate: { type: Date, default: Date.now },
    surveyNumber: { type: String }
  }],

  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

export default mongoose.model<IFarmer>('Farmer', FarmerSchema);
