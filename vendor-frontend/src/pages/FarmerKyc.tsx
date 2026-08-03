import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../store/store';
import { Search, Plus, X, Shield, CheckCircle, ArrowLeft } from 'lucide-react';

interface Farmer {
  _id: string;
  farmerId: string;
  name: string;
  mobile: string;
  village: string;
  district: string;
  aadhaarNumber: string;
  status: string;
}

const FarmerKyc = () => {
  const { vendor } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(''); // Keep state declaration but we will render it in JSX to make it read/used

  // Form State
  const [name, setName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [mobile, setMobile] = useState('');
  const [gender, setGender] = useState('Male');
  const [dob, setDob] = useState('');
  const [village, setVillage] = useState('');
  const [taluka, setTaluka] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [branch, setBranch] = useState('');

  const API_BASE = 'http://localhost:5000/api/v1/vendor';

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
    if (vendor?.tenantId) {
      fetchFarmers();
    }
  }, [search, vendor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch(`${API_BASE}/farmers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: vendor?.tenantId,
          name, fatherName, mobile, gender, dob,
          village, taluka, district, state, pincode,
          aadhaarNumber, panNumber,
          bankDetails: { accountHolder, bankName, accountNumber, ifsc, branch }
        })
      });

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        // Reset Form fields
        setName(''); setFatherName(''); setMobile(''); setDob('');
        setVillage(''); setTaluka(''); setDistrict(''); setState(''); setPincode('');
        setAadhaarNumber(''); setPanNumber('');
        setAccountHolder(''); setBankName(''); setAccountNumber(''); setIfsc(''); setBranch('');
        fetchFarmers();
      } else {
        setError(data.message || 'Failed to register farmer.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="px-4 py-6 max-w-md mx-auto min-h-screen bg-gray-50 pb-20 text-left">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-950">Farmer KYC</h1>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-green-700 text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center shadow"
        >
          <Plus className="h-4 w-4 mr-1" /> New Farmer
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4 rounded text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by Name, Mobile or Village..."
          className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-2xl shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary p-3 bg-white"
        />
      </div>

      {/* Farmers List */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500 text-sm">Loading farmers...</div>
      ) : (
        <div className="space-y-4">
          {farmers.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              No registered farmers found. Add a farmer to begin daily transactions.
            </div>
          ) : (
            farmers.map((farmer) => (
              <div key={farmer._id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-950 text-sm">{farmer.name}</h3>
                  <p className="text-[11px] text-gray-400 font-medium">ID: {farmer.farmerId}</p>
                  <p className="text-xs text-gray-600 mt-2">📍 {farmer.village}, {farmer.district}</p>
                  <p className="text-xs text-gray-500">📞 {farmer.mobile}</p>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <span className="bg-green-50 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center">
                    <CheckCircle className="h-3 w-3 mr-0.5" /> Verified
                  </span>
                  <span className="text-[11px] text-gray-400">Aadhaar: ****{farmer.aadhaarNumber.slice(-4)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Register Farmer Drawer/Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-30 bg-black bg-opacity-40 flex items-end">
          <div className="bg-white w-full rounded-t-3xl max-h-[85vh] overflow-y-auto p-6 space-y-6 max-w-md mx-auto shadow-2xl">
            <div className="flex justify-between items-center border-b pb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center">
                <Shield className="h-5 w-5 text-primary mr-1.5" /> Farmer Registration
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pb-10">
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Personal Information</h3>
                <input
                  type="text"
                  required
                  placeholder="Farmer Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border rounded-xl p-3 text-sm focus:ring-primary border-gray-200"
                />
                <input
                  type="text"
                  required
                  placeholder="Father / Husband Name"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  className="w-full border rounded-xl p-3 text-sm focus:ring-primary border-gray-200"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Mobile Number"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full border rounded-xl p-3 text-sm focus:ring-primary border-gray-200"
                  />
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full border rounded-xl p-3 text-sm bg-white border-gray-200"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Address Details</h3>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Village"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    className="w-full border rounded-xl p-3 text-sm focus:ring-primary border-gray-200"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Taluka"
                    value={taluka}
                    onChange={(e) => setTaluka(e.target.value)}
                    className="w-full border rounded-xl p-3 text-sm focus:ring-primary border-gray-200"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="District"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full border rounded-xl p-3 text-sm focus:ring-primary border-gray-200"
                  />
                  <input
                    type="text"
                    required
                    placeholder="State"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full border rounded-xl p-3 text-sm focus:ring-primary border-gray-200"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Pincode"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full border rounded-xl p-3 text-sm focus:ring-primary border-gray-200"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">KYC Documents</h3>
                <input
                  type="text"
                  required
                  placeholder="Aadhaar Card Number"
                  value={aadhaarNumber}
                  onChange={(e) => setAadhaarNumber(e.target.value)}
                  className="w-full border rounded-xl p-3 text-sm focus:ring-primary border-gray-200"
                />
                <input
                  type="text"
                  placeholder="PAN Card (Optional)"
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value)}
                  className="w-full border rounded-xl p-3 text-sm focus:ring-primary border-gray-200"
                />
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Bank Details</h3>
                <input
                  type="text"
                  required
                  placeholder="Account Holder Name"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  className="w-full border rounded-xl p-3 text-sm focus:ring-primary border-gray-200"
                />
                <input
                  type="text"
                  required
                  placeholder="Bank Name"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full border rounded-xl p-3 text-sm focus:ring-primary border-gray-200"
                />
                <input
                  type="text"
                  required
                  placeholder="Account Number"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full border rounded-xl p-3 text-sm focus:ring-primary border-gray-200"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="IFSC Code"
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value)}
                    className="w-full border rounded-xl p-3 text-sm focus:ring-primary border-gray-200"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Branch"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full border rounded-xl p-3 text-sm focus:ring-primary border-gray-200"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-primary hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl shadow mt-6"
              >
                Register & Verify Farmer
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerKyc;
