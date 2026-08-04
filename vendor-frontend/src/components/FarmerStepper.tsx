import React, { useState } from 'react';
import { X, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { API_BASE } from '../config';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import type { DocumentMetadata } from './DocumentUploader';
import { DocumentUploader } from './DocumentUploader';

interface FarmerStepperProps {
  onComplete: (farmer: any) => void;
  onCancel: () => void;
  initialMobile?: string;
}

export const FarmerStepper = ({ onComplete, onCancel, initialMobile = '' }: FarmerStepperProps) => {
  const { vendor } = useSelector((state: RootState) => state.auth);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Farmer State
  const [farmerId, setFarmerId] = useState<string | null>(null); // DB _id of draft
  const [farmer, setFarmer] = useState<any>({
    mobile: initialMobile,
    name: '',
    village: '',
    fatherName: '',
    taluka: '',
    district: '',
    state: '',
    aadhaarNumber: '',
    panNumber: '',
    bankDetails: {
      accountHolder: '',
      bankName: '',
      branch: '',
      accountNumber: '',
      ifsc: ''
    },
    documents: [] as DocumentMetadata[],
    kycStatus: 'Basic'
  });

  const STEPS = ['Basic', 'Land', 'Identity', 'Bank', 'Review'];

  // Handle Input Changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFarmer({ ...farmer, [e.target.name]: e.target.value });
  };

  const handleBankChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFarmer({
      ...farmer,
      bankDetails: { ...farmer.bankDetails, [e.target.name]: e.target.value }
    });
  };

  // Move Next
  const nextStep = async () => {
    if (step === 1) {
      if (!farmer.name || !farmer.mobile || !farmer.village) {
        setError('Please fill all required fields');
        return;
      }
      await saveDraft();
    } else if (step === 2 || step === 3 || step === 4) {
      await updateDraft();
    }
    
    if (step < 5) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  // API Calls
  const saveDraft = async () => {
    setLoading(true);
    setError('');
    try {
      const url = farmerId ? `${API_BASE}/farmers/${farmerId}` : `${API_BASE}/farmers`;
      const method = farmerId ? 'PUT' : 'POST';
      
      const payload = { ...farmer, tenantId: vendor?.tenantId };
      if (!farmerId) payload.status = 'Active'; // For initial creation

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.success) {
        setFarmerId(data.data._id);
        setFarmer(data.data); // Update with DB generated fields
      } else {
        throw new Error(data.message || 'Failed to save');
      }
    } catch (err: any) {
      setError(err.message || 'Error saving draft');
      throw err; // Prevent advancing step
    } finally {
      setLoading(false);
    }
  };

  const updateDraft = saveDraft; // Same logic since it does PUT if farmerId exists

  // Document Upload Handlers
  const handleDocumentUpload = async (documentType: string, file: File, meta: any) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const uploadRes = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData
    });
    const uploadData = await uploadRes.json();
    
    if (uploadData.success) {
      const newDoc: DocumentMetadata = {
        documentType,
        url: uploadData.data.url,
        ...meta
      };
      const updatedDocs = [...(farmer.documents || []), newDoc];
      
      // Compute tentative KYC status based on documents
      let newStatus = farmer.kycStatus;
      const hasAadhaar = updatedDocs.some(d => d.documentType.includes('Aadhaar'));
      if (hasAadhaar) newStatus = 'KYC Pending';
      if (updatedDocs.length >= 3) newStatus = 'Verified'; // Naive logic

      setFarmer({ ...farmer, documents: updatedDocs, kycStatus: newStatus });
      
      // Auto-save immediately after upload
      await fetch(`${API_BASE}/farmers/${farmerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: updatedDocs, kycStatus: newStatus })
      });
    } else {
      throw new Error('Upload failed on server');
    }
  };

  const handleDocumentDelete = async (documentType: string, indexWithinType: number) => {
    // Find the actual index in the main array
    const typeDocs = (farmer.documents || []).filter((d: any) => d.documentType === documentType);
    const docToDelete = typeDocs[indexWithinType];
    const actualIndex = farmer.documents.findIndex((d: any) => d === docToDelete);
    
    if (actualIndex > -1) {
      const updatedDocs = [...farmer.documents];
      updatedDocs.splice(actualIndex, 1);
      setFarmer({ ...farmer, documents: updatedDocs });
      
      await fetch(`${API_BASE}/farmers/${farmerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: updatedDocs })
      });
    }
  };

  const getDocuments = (type: string) => (farmer.documents || []).filter((d: any) => d.documentType === type);

  return (
    <div className="fixed inset-0 z-50 bg-white sm:bg-gray-900/50 sm:p-4 flex flex-col sm:items-center sm:justify-center overflow-hidden animate-in fade-in">
      <div className="bg-white sm:rounded-3xl shadow-xl w-full max-w-md h-full sm:h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in-95">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <h2 className="text-lg font-bold text-gray-900">Add Farmer</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 bg-gray-50 p-2 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Step {step} of 5</span>
            <span className="text-xs font-bold text-primary">{STEPS[step-1]}</span>
          </div>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map(s => (
              <React.Fragment key={s}>
                <div className={`h-2.5 rounded-full flex-1 transition-all ${step >= s ? 'bg-primary' : 'bg-gray-200'}`} />
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          {error && <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm font-medium mb-4">{error}</div>}

          {/* STEP 1: BASIC INFO */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <h3 className="font-bold text-gray-800 border-b pb-2">Essential Details</h3>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Farmer Name <span className="text-red-500">*</span></label>
                  <input type="text" name="name" value={farmer.name} onChange={handleChange} placeholder="e.g. Ramesh Patil" className="w-full border rounded-xl p-3 text-sm focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Mobile Number <span className="text-red-500">*</span></label>
                  <input type="tel" name="mobile" value={farmer.mobile} onChange={handleChange} placeholder="10-digit number" className="w-full border rounded-xl p-3 text-sm focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Village <span className="text-red-500">*</span></label>
                  <input type="text" name="village" value={farmer.village} onChange={handleChange} placeholder="e.g. Shirpur" className="w-full border rounded-xl p-3 text-sm focus:ring-1 focus:ring-primary" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <h3 className="font-bold text-gray-800 border-b pb-2">Optional Details</h3>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Father/Husband Name</label>
                  <input type="text" name="fatherName" value={farmer.fatherName} onChange={handleChange} className="w-full border rounded-xl p-3 text-sm focus:ring-1 focus:ring-primary" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Taluka</label>
                    <input type="text" name="taluka" value={farmer.taluka} onChange={handleChange} className="w-full border rounded-xl p-3 text-sm focus:ring-1 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">District</label>
                    <input type="text" name="district" value={farmer.district} onChange={handleChange} className="w-full border rounded-xl p-3 text-sm focus:ring-1 focus:ring-primary" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">State</label>
                    <input type="text" name="state" value={farmer.state} onChange={handleChange} className="w-full border rounded-xl p-3 text-sm focus:ring-1 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Aadhaar Number</label>
                    <input type="text" name="aadhaarNumber" value={farmer.aadhaarNumber} onChange={handleChange} className="w-full border rounded-xl p-3 text-sm focus:ring-1 focus:ring-primary" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: LAND DOCUMENTS */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <DocumentUploader 
                title="7/12 Records" 

                documents={getDocuments('7/12')}
                onUpload={(file, meta) => handleDocumentUpload('7/12', file, meta)}
                onDelete={(index) => handleDocumentDelete('7/12', index)}
                allowMultiple={true}
                showSurveyNumber={true}
              />
              <DocumentUploader 
                title="8A Records" 

                documents={getDocuments('8A')}
                onUpload={(file, meta) => handleDocumentUpload('8A', file, meta)}
                onDelete={(index) => handleDocumentDelete('8A', index)}
                allowMultiple={true}
                showSurveyNumber={true}
              />
            </div>
          )}

          {/* STEP 3: IDENTITY DOCUMENTS */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-4">
                <h3 className="font-bold text-gray-800 border-b pb-2 mb-3">Aadhaar Details</h3>
                <label className="block text-xs font-bold text-gray-500 mb-1">Aadhaar Number</label>
                <input type="text" name="aadhaarNumber" value={farmer.aadhaarNumber} onChange={handleChange} placeholder="12-digit number" className="w-full border rounded-xl p-3 text-sm focus:ring-1 focus:ring-primary" />
                <div className="space-y-4 mt-4">
                  <DocumentUploader 
                    title="Aadhaar Front Image" 
                    documents={(farmer.documents || []).filter((d: any) => d.documentType === 'Aadhaar Front')}
                    onUpload={(file, meta) => handleDocumentUpload('Aadhaar Front', file, meta)}
                    onDelete={async (idx) => handleDocumentDelete('Aadhaar Front', idx)}
                    allowMultiple={false}
                  />
                  <DocumentUploader 
                    title="Aadhaar Back Image" 
                    documents={(farmer.documents || []).filter((d: any) => d.documentType === 'Aadhaar Back')}
                    onUpload={(file, meta) => handleDocumentUpload('Aadhaar Back', file, meta)}
                    onDelete={async (idx) => handleDocumentDelete('Aadhaar Back', idx)}
                    allowMultiple={false}
                  />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-4">
                <h3 className="font-bold text-gray-800 border-b pb-2 mb-3">PAN Details (Optional)</h3>
                <label className="block text-xs font-bold text-gray-500 mb-1">PAN Number</label>
                <input type="text" name="panNumber" value={farmer.panNumber} onChange={handleChange} placeholder="ABCDE1234F" className="w-full border rounded-xl p-3 text-sm focus:ring-1 focus:ring-primary uppercase mb-4" />
                
                <DocumentUploader 
                  title="PAN Card Image" 
                  documents={getDocuments('PAN')}
                  onUpload={(file, meta) => handleDocumentUpload('PAN', file, meta)}
                  onDelete={(index) => handleDocumentDelete('PAN', index)}
                  allowMultiple={false}
                />
              </div>
            </div>
          )}

          {/* STEP 4: BANK DETAILS */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <h3 className="font-bold text-gray-800 border-b pb-2">Bank Account</h3>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Account Holder Name</label>
                  <input type="text" name="accountHolder" value={farmer.bankDetails?.accountHolder} onChange={handleBankChange} className="w-full border rounded-xl p-3 text-sm focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Bank Name</label>
                  <input type="text" name="bankName" value={farmer.bankDetails?.bankName} onChange={handleBankChange} className="w-full border rounded-xl p-3 text-sm focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Branch Name</label>
                  <input type="text" name="branch" value={farmer.bankDetails?.branch} onChange={handleBankChange} className="w-full border rounded-xl p-3 text-sm focus:ring-1 focus:ring-primary" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Account No.</label>
                    <input type="text" name="accountNumber" value={farmer.bankDetails?.accountNumber} onChange={handleBankChange} className="w-full border rounded-xl p-3 text-sm focus:ring-1 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">IFSC Code</label>
                    <input type="text" name="ifsc" value={farmer.bankDetails?.ifsc} onChange={handleBankChange} className="w-full border rounded-xl p-3 text-sm focus:ring-1 focus:ring-primary uppercase" />
                  </div>
                </div>
              </div>

              <DocumentUploader 
                title="Passbook / Cancelled Cheque" 

                documents={getDocuments('Passbook')}
                onUpload={(file, meta) => handleDocumentUpload('Passbook', file, meta)}
                onDelete={(index) => handleDocumentDelete('Passbook', index)}
                allowMultiple={false}
              />
            </div>
          )}

          {/* STEP 5: REVIEW */}
          {step === 5 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-black text-xl text-gray-900 mb-1">Review Farmer Profile</h3>
                <p className="text-sm text-gray-500">Please verify the information before saving.</p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y">
                <div className="p-4 flex justify-between items-center">
                  <span className="font-bold text-gray-700">Basic Information</span>
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
                <div className="p-4 flex justify-between items-center">
                  <span className="font-bold text-gray-700">Land Documents</span>
                  <span className="text-xs font-bold text-gray-500">{getDocuments('7/12').length + getDocuments('8A').length} Docs</span>
                </div>
                <div className="p-4 flex justify-between items-center">
                  <span className="font-bold text-gray-700">Identity Details</span>
                  {farmer.aadhaarNumber || farmer.panNumber ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <span className="text-xs font-bold text-gray-400">Skip</span>}
                </div>
                <div className="p-4 flex justify-between items-center">
                  <span className="font-bold text-gray-700">Bank Details</span>
                  {farmer.bankDetails?.accountNumber ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <span className="text-xs font-bold text-gray-400">Skip</span>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-gray-100 grid grid-cols-2 gap-3 mt-auto sticky bottom-0 z-10">
          <button 
            onClick={prevStep}
            disabled={step === 1 || loading}
            className="flex items-center justify-center py-3.5 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            {step > 1 && <ArrowLeft className="w-4 h-4 mr-2" />} Previous
          </button>
          
          {step < 5 ? (
            <button 
              onClick={nextStep}
              disabled={loading}
              className="flex items-center justify-center py-3.5 rounded-xl font-bold text-white bg-primary hover:bg-green-700 transition-colors shadow-md disabled:opacity-70"
            >
              {loading ? 'Saving...' : 'Next'} {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
            </button>
          ) : (
            <button 
              onClick={() => onComplete(farmer)}
              disabled={loading}
              className="flex items-center justify-center py-3.5 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 transition-colors shadow-md disabled:opacity-70"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" /> Complete KYC
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
