import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../store/store';
import { Search, Shield, CheckCircle, ArrowLeft, Info, Clock, Plus } from 'lucide-react';
import { API_BASE } from '../config';
import { FarmerStepper } from '../components/FarmerStepper';
import { DocumentUploader } from '../components/DocumentUploader';

interface DocumentMetadata {
  _id?: string;
  documentType: string;
  documentNumber?: string;
  url: string;
  remarks?: string;
  surveyNumber?: string;
  uploadDate?: string;
}

interface Farmer {
  _id: string;
  farmerId: string;
  name: string;
  mobile: string;
  village: string;
  district?: string;
  aadhaarNumber?: string;
  panNumber?: string;
  kycStatus: string;
  status: string;
  fatherName?: string;
  gender?: string;
  dob?: string;
  taluka?: string;
  state?: string;
  pincode?: string;
  bankDetails?: {
    accountHolder?: string;
    bankName?: string;
    accountNumber?: string;
    ifsc?: string;
    branch?: string;
  };
  documents?: DocumentMetadata[];
}

const FarmerKyc = () => {
  const { vendor } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected Farmer CRM State
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [activeTab, setActiveTab] = useState('Basic Info');
  const [farmerPurchases, setFarmerPurchases] = useState<any[]>([]);
  const [farmerLedgers, setFarmerLedgers] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadType, setUploadType] = useState('7/12');
  const [docMeta, setDocMeta] = useState({ surveyNumber: '', documentNumber: '', remarks: '' });

  const fetchFarmers = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/farmers?tenantId=${vendor?.tenantId}&search=${search}`);
      const data = await res.json();
      if (data.success) {
        setFarmers(data.data);
      }
    } catch (err) {
      setError('Failed to fetch farmers.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (vendor?.tenantId && !selectedFarmer) {
      fetchFarmers();
    }
  }, [search, vendor, selectedFarmer]);

  const fetchFarmerData = async () => {
    if (!vendor?.tenantId || !selectedFarmer) return;
    try {
      if (activeTab === 'Purchase History') {
        const res = await fetch(`${API_BASE}/purchases?tenantId=${vendor.tenantId}&farmerId=${selectedFarmer._id}`);
        const data = await res.json();
        if (data.success) {
          // Only show finalized purchases
          setFarmerPurchases(data.data.filter((p: any) => p.status === 'Finalized'));
        }
      } else if (activeTab === 'Ledger') {
        const res = await fetch(`${API_BASE}/ledgers?tenantId=${vendor.tenantId}&partyType=Farmer&partyId=${selectedFarmer._id}`);
        const data = await res.json();
        if (data.success) setFarmerLedgers(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch farmer data', err);
    }
  };

  useEffect(() => {
    fetchFarmerData();
  }, [activeTab, selectedFarmer]);

  // Derived styling for KYC Badges
  const getKycBadge = (status: string) => {
    if (status === 'Verified') return <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full flex items-center"><CheckCircle className="w-3 h-3 mr-1" /> Verified</span>;
    if (status === 'KYC Pending') return <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded-full flex items-center"><Clock className="w-3 h-3 mr-1" /> KYC Pending</span>;
    return <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-full flex items-center"><Info className="w-3 h-3 mr-1" /> Basic</span>;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !selectedFarmer) return;
    const file = e.target.files[0];

    const formData = new FormData();
    formData.append('file', file);

    try {
      // 1. Upload to server
      const uploadRes = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData
      });
      const uploadData = await uploadRes.json();

      if (uploadData.success) {
        // 2. Attach to farmer
        const newDoc: DocumentMetadata = {
          documentType: uploadType,
          url: uploadData.data.url,
          ...docMeta
        };

        const updatedDocs = [...(selectedFarmer.documents || []), newDoc];

        // Auto-upgrade KYC Status logic
        let newStatus = selectedFarmer.kycStatus;
        if (newStatus === 'Basic' && uploadType === 'Aadhaar') newStatus = 'KYC Pending';
        if (updatedDocs.length > 2) newStatus = 'Verified'; // Simple simulation

        const updateRes = await fetch(`${API_BASE}/farmers/${selectedFarmer._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documents: updatedDocs, kycStatus: newStatus })
        });
        const updateData = await updateRes.json();
        if (updateData.success) {
          setSelectedFarmer(updateData.data);
          setDocMeta({ surveyNumber: '', documentNumber: '', remarks: '' });
        }
      } else {
        setError('Upload failed');
      }
    } catch (err) {
      setError('Upload error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDocumentDelete = async (indexToDelete: number, documentType: string) => {
    if (!selectedFarmer || !selectedFarmer.documents) return;
    
    // Find the actual index in the main array
    const typeDocs = selectedFarmer.documents.filter(d => d.documentType === documentType);
    const docToDelete = typeDocs[indexToDelete];
    const actualIndex = selectedFarmer.documents.findIndex(d => d === docToDelete);
    
    if (actualIndex > -1) {
      const updatedDocs = [...selectedFarmer.documents];
      updatedDocs.splice(actualIndex, 1);
      setSelectedFarmer({ ...selectedFarmer, documents: updatedDocs });
      
      try {
        await fetch(`${API_BASE}/farmers/${selectedFarmer._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documents: updatedDocs })
        });
      } catch (err) {
        console.error('Failed to delete document', err);
      }
    }
  };

  const saveBasicInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarmer) return;
    try {
      const res = await fetch(`${API_BASE}/farmers/${selectedFarmer._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedFarmer)
      });
      const data = await res.json();
      if (data.success) setSelectedFarmer(data.data);
    } catch (err) { }
  };


  const handlePayment = async (bill: any) => {
    if (!vendor?.tenantId || !selectedFarmer) return;
    try {
      // 1. Mark bill as paid
      const updateRes = await fetch(`${API_BASE}/purchases/${bill._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: 'Paid' })
      });
      
      // 2. Create Ledger entry
      const paymentRes = await fetch(`${API_BASE}/payments/farmer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: vendor.tenantId,
          farmerId: selectedFarmer._id,
          amount: bill.netPayable,
          paymentMode: 'Cash',
          reference: bill.billNumber,
          remarks: 'Bill payment'
        })
      });

      if (updateRes.ok && paymentRes.ok) {
        alert('Payment processed successfully!');
        fetchFarmerData();
      } else {
        alert('Payment failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Payment error');
    }
  };

  if (selectedFarmer) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <div className="bg-white border-b px-4 py-4 sticky top-0 z-10 flex items-center shadow-sm">
          <button onClick={() => setSelectedFarmer(null)} className="mr-3 p-1 rounded-full hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">{selectedFarmer.name}</h1>
            <p className="text-xs text-gray-500">{selectedFarmer.mobile} • {selectedFarmer.village}</p>
          </div>
          <div>{getKycBadge(selectedFarmer.kycStatus || 'Basic')}</div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b flex overflow-x-auto hide-scrollbar">
          {['Basic Info', 'Land Documents', 'Identity', 'Bank', 'Purchase History', 'Ledger'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-4 max-w-md mx-auto">
          {/* TAB: BASIC INFO */}
          {activeTab === 'Basic Info' && (
            <form onSubmit={saveBasicInfo} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <h3 className="font-bold text-gray-800 border-b pb-2">Personal Details</h3>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Father/Husband Name</label>
                <input type="text" value={selectedFarmer.fatherName || ''} onChange={e => setSelectedFarmer({ ...selectedFarmer, fatherName: e.target.value })} className="w-full border rounded-lg p-2 text-sm" />
              </div>

              <h3 className="font-bold text-gray-800 border-b pb-2 pt-4">Address Details</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Village</label>
                  <input type="text" value={selectedFarmer.village || ''} onChange={e => setSelectedFarmer({ ...selectedFarmer, village: e.target.value })} className="w-full border rounded-lg p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Taluka</label>
                  <input type="text" value={selectedFarmer.taluka || ''} onChange={e => setSelectedFarmer({ ...selectedFarmer, taluka: e.target.value })} className="w-full border rounded-lg p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">District</label>
                  <input type="text" value={selectedFarmer.district || ''} onChange={e => setSelectedFarmer({ ...selectedFarmer, district: e.target.value })} className="w-full border rounded-lg p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">State</label>
                  <input type="text" value={selectedFarmer.state || ''} onChange={e => setSelectedFarmer({ ...selectedFarmer, state: e.target.value })} className="w-full border rounded-lg p-2 text-sm" />
                </div>
              </div>

              <button type="submit" className="w-full bg-primary text-white py-2 rounded-xl font-bold mt-4 shadow hover:bg-green-700">Save Basic Info</button>
            </form>
          )}

          {/* TAB: LAND DOCUMENTS */}
          {activeTab === 'Land Documents' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <DocumentUploader 
                title="7/12 Records" 

                documents={(selectedFarmer.documents || []).filter((d: any) => d.documentType === '7/12')}
                onUpload={(file, meta) => { setUploadType('7/12'); setDocMeta(meta as any); return handleFileUpload({ target: { files: [file] } } as any); }}
                onDelete={async (idx) => handleDocumentDelete(idx, '7/12')}
                allowMultiple={true}
                showSurveyNumber={true}
              />
              <DocumentUploader 
                title="8A Records" 

                documents={(selectedFarmer.documents || []).filter((d: any) => d.documentType === '8A')}
                onUpload={(file, meta) => { setUploadType('8A'); setDocMeta(meta as any); return handleFileUpload({ target: { files: [file] } } as any); }}
                onDelete={async (idx) => handleDocumentDelete(idx, '8A')}
                allowMultiple={true}
                showSurveyNumber={true}
              />
            </div>
          )}

          {/* TAB: IDENTITY (KYC) */}
          {activeTab === 'Identity' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center"><Shield className="w-4 h-4 mr-2 text-primary" /> Aadhaar Details</h3>
                <input type="text" placeholder="12-digit Aadhaar Number" value={selectedFarmer.aadhaarNumber || ''} onChange={e => setSelectedFarmer({ ...selectedFarmer, aadhaarNumber: e.target.value })} className="w-full border rounded-lg p-2 text-sm mb-3" />
                <div className="space-y-4 mt-4">
                  <DocumentUploader 
                    title="Aadhaar Front Image" 

                    documents={(selectedFarmer.documents || []).filter((d: any) => d.documentType === 'Aadhaar Front')}
                    onUpload={(file, meta) => { setUploadType('Aadhaar Front'); setDocMeta(meta as any); return handleFileUpload({ target: { files: [file] } } as any); }}
                    onDelete={async (idx) => handleDocumentDelete(idx, 'Aadhaar Front')}
                    allowMultiple={false}
                  />
                  <DocumentUploader 
                    title="Aadhaar Back Image" 

                    documents={(selectedFarmer.documents || []).filter((d: any) => d.documentType === 'Aadhaar Back')}
                    onUpload={(file, meta) => { setUploadType('Aadhaar Back'); setDocMeta(meta as any); return handleFileUpload({ target: { files: [file] } } as any); }}
                    onDelete={async (idx) => handleDocumentDelete(idx, 'Aadhaar Back')}
                    allowMultiple={false}
                  />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-4">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center"><Info className="w-4 h-4 mr-2 text-primary" /> PAN Details</h3>
                <label className="block text-xs font-bold text-gray-500 mb-1">PAN Number</label>
                <input type="text" name="panNumber" value={selectedFarmer.panNumber || ''} onChange={e => setSelectedFarmer({ ...selectedFarmer, panNumber: e.target.value })} placeholder="ABCDE1234F" className="w-full border rounded-xl p-3 text-sm focus:ring-1 focus:ring-primary uppercase mb-4" />
                
                <DocumentUploader 
                  title="PAN Card Image" 

                  documents={(selectedFarmer.documents || []).filter((d: any) => d.documentType === 'PAN')}
                  onUpload={(file, meta) => { setUploadType('PAN'); setDocMeta(meta as any); return handleFileUpload({ target: { files: [file] } } as any); }}
                  onDelete={async (idx) => handleDocumentDelete(idx, 'PAN')}
                  allowMultiple={false}
                />
              </div>

              <button onClick={saveBasicInfo} className="w-full bg-primary text-white py-2 rounded-xl font-bold shadow hover:bg-green-700">Save Identity Details</button>
            </div>
          )}

          {/* TAB: BANK */}
          {activeTab === 'Bank' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <h3 className="font-bold text-gray-800 border-b pb-2">Bank Account</h3>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Account Holder Name</label>
                  <input type="text" value={selectedFarmer.bankDetails?.accountHolder || ''} onChange={e => setSelectedFarmer({ ...selectedFarmer, bankDetails: { ...selectedFarmer.bankDetails, accountHolder: e.target.value }})} className="w-full border rounded-xl p-3 text-sm focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Bank Name</label>
                  <input type="text" value={selectedFarmer.bankDetails?.bankName || ''} onChange={e => setSelectedFarmer({ ...selectedFarmer, bankDetails: { ...selectedFarmer.bankDetails, bankName: e.target.value }})} className="w-full border rounded-xl p-3 text-sm focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Branch Name</label>
                  <input type="text" value={selectedFarmer.bankDetails?.branch || ''} onChange={e => setSelectedFarmer({ ...selectedFarmer, bankDetails: { ...selectedFarmer.bankDetails, branch: e.target.value }})} className="w-full border rounded-xl p-3 text-sm focus:ring-1 focus:ring-primary" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Account No.</label>
                    <input type="text" value={selectedFarmer.bankDetails?.accountNumber || ''} onChange={e => setSelectedFarmer({ ...selectedFarmer, bankDetails: { ...selectedFarmer.bankDetails, accountNumber: e.target.value }})} className="w-full border rounded-xl p-3 text-sm focus:ring-1 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">IFSC Code</label>
                    <input type="text" value={selectedFarmer.bankDetails?.ifsc || ''} onChange={e => setSelectedFarmer({ ...selectedFarmer, bankDetails: { ...selectedFarmer.bankDetails, ifsc: e.target.value }})} className="w-full border rounded-xl p-3 text-sm focus:ring-1 focus:ring-primary uppercase" />
                  </div>
                </div>
                <button onClick={saveBasicInfo} className="w-full bg-primary text-white py-2 rounded-xl font-bold mt-4 shadow hover:bg-green-700">Save Bank Info</button>
              </div>

              <DocumentUploader 
                title="Passbook / Cancelled Cheque" 

                documents={(selectedFarmer.documents || []).filter((d: any) => d.documentType === 'Passbook')}
                onUpload={(file, meta) => { setUploadType('Passbook'); setDocMeta(meta as any); return handleFileUpload({ target: { files: [file] } } as any); }}
                onDelete={async (idx) => handleDocumentDelete(idx, 'Passbook')}
                allowMultiple={false}
              />
            </div>
          )}

          {/* TAB: PURCHASE HISTORY */}
          {activeTab === 'Purchase History' && (
            <div className="space-y-4 animate-in fade-in">
              {farmerPurchases.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="font-bold text-gray-800">No Purchases</h3>
                  <p className="text-sm text-gray-500 mt-2">No finalized purchases found for this farmer.</p>
                </div>
              ) : (
                farmerPurchases.map((bill: any) => (
                  <div key={bill._id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <h3 className="font-bold text-gray-950 text-sm">{bill.billNumber}</h3>
                        <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">{bill.commodityId?.englishName || 'Commodity'}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-gray-950">₹{bill.netPayable?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                        <span className={`inline-block mt-1 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          bill.paymentStatus === 'Paid' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {bill.paymentStatus === 'Pending' ? 'Completed' : 'Paid'}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-500 border-t pt-2">
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" /> {new Date(bill.createdAt).toLocaleDateString()}
                      </div>
                      {bill.paymentStatus === 'Pending' && (
                        <button
                          onClick={() => handlePayment(bill)}
                          className="bg-primary hover:bg-green-700 text-white font-bold py-1 px-3 rounded-lg text-[10px] shadow-sm"
                        >
                          Make Payment
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB: LEDGER */}
          {activeTab === 'Ledger' && (
            <div className="space-y-4 animate-in fade-in">
              {farmerLedgers.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="font-bold text-gray-800">No Ledger Entries</h3>
                  <p className="text-sm text-gray-500 mt-2">Ledger is empty.</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr>
                        <th className="p-3 font-bold border-b">Date</th>
                        <th className="p-3 font-bold border-b">Ref</th>
                        <th className="p-3 font-bold border-b text-right">Debit</th>
                        <th className="p-3 font-bold border-b text-right">Credit</th>
                        <th className="p-3 font-bold border-b text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {farmerLedgers.map((entry: any) => (
                        <tr key={entry._id} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="p-3 text-gray-600">{new Date(entry.createdAt).toLocaleDateString()}</td>
                          <td className="p-3 font-medium text-gray-800">{entry.reference || '-'}</td>
                          <td className="p-3 text-right font-medium text-red-600">{entry.entryType === 'Debit' ? `₹${entry.amount.toLocaleString()}` : '-'}</td>
                          <td className="p-3 text-right font-medium text-green-600">{entry.entryType === 'Credit' ? `₹${entry.amount.toLocaleString()}` : '-'}</td>
                          <td className="p-3 text-right font-black text-gray-900">₹{entry.balanceAfter.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // DEFAULT LIST VIEW
  return (
    <div className="px-4 py-6 max-w-md mx-auto min-h-screen bg-gray-50 pb-20 text-left relative">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-950">Farmers CRM</h1>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-green-700 text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center shadow"
        >
          <Plus className="h-4 w-4 mr-1" /> Quick Add
        </button>
      </div>

      {error && <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4 rounded text-xs text-red-700">{error}</div>}

      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by Name, Mobile, Aadhaar, Village..."
          className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-2xl shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary p-3 bg-white"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500 text-sm">Loading farmers...</div>
      ) : (
        <div className="space-y-3">
          {farmers.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              No registered farmers found. Add a farmer to begin.
            </div>
          ) : (
            farmers.map((farmer) => (
              <div
                key={farmer._id}
                onClick={() => setSelectedFarmer(farmer)}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex justify-between items-center cursor-pointer hover:border-primary transition-colors animate-in fade-in"
              >
                <div>
                  <h3 className="font-bold text-gray-950 text-sm">{farmer.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{farmer.mobile} • {farmer.village}</p>
                </div>
                <div>
                  {getKycBadge(farmer.kycStatus || 'Basic')}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Register Farmer Stepper */}
      {isModalOpen && (
        <FarmerStepper
          onCancel={() => setIsModalOpen(false)}
          onComplete={(newFarmer) => {
            setIsModalOpen(false);
            setFarmers(prev => [newFarmer, ...prev]);
            setSelectedFarmer(newFarmer); // Auto open CRM profile
          }}
        />
      )}
    </div>
  );
};

export default FarmerKyc;
