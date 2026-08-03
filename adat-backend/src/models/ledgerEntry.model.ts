import mongoose, { Schema, Document } from 'mongoose';

export interface ILedgerEntry extends Document {
  tenantId: string;
  partyType: 'Farmer' | 'Customer';
  partyId: mongoose.Schema.Types.ObjectId; // References Farmer or Customer
  amount: number;
  entryType: 'Debit' | 'Credit'; // Debit = decreases liability/balance, Credit = increases liability/balance
  paymentMode?: 'Cash' | 'UPI' | 'RTGS' | 'NEFT' | 'Cheque' | 'Bank Transfer';
  reference?: string; // Reference bill number or invoice number
  remarks?: string;
  balanceAfter: number;
}

const LedgerEntrySchema: Schema = new Schema({
  tenantId: { type: String, required: true },
  partyType: { type: String, enum: ['Farmer', 'Customer'], required: true },
  partyId: { type: mongoose.Schema.Types.ObjectId, required: true },
  amount: { type: Number, required: true },
  entryType: { type: String, enum: ['Debit', 'Credit'], required: true },
  paymentMode: { type: String, enum: ['Cash', 'UPI', 'RTGS', 'NEFT', 'Cheque', 'Bank Transfer'] },
  reference: { type: String },
  remarks: { type: String },
  balanceAfter: { type: Number, required: true }
}, { timestamps: true });

export default mongoose.model<ILedgerEntry>('LedgerEntry', LedgerEntrySchema);
