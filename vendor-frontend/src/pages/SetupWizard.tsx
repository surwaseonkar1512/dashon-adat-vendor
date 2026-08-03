import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store/store';
import { completeSetup } from '../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';

interface Commodity {
  _id: string;
  name: string;
  marathiName: string;
  englishName: string;
  commodityCode: string;
  unit: string;
}

const SetupWizard = () => {
  const { vendor } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [error, setError] = useState('');

  // Step 1: Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Step 2: Business Profile
  const [ownerName, setOwnerName] = useState(vendor?.ownerName || '');
  const [phone, setPhone] = useState(vendor?.phone || '');

  // Step 3: Commodities (Standard list)
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [selectedCommodity, setSelectedCommodity] = useState<Commodity | null>(null);

  // Step 4: ERP Formula Engine Config
  const [moistureThreshold, setMoistureThreshold] = useState(13);
  const [moistureInterval, setMoistureInterval] = useState(0.5);
  const [moistureShrink, setMoistureShrink] = useState(0.7);
  const [dryingCharge, setDryingCharge] = useState(15);

  const [fmThreshold, setFmThreshold] = useState(2);
  const [fmInterval, setFmInterval] = useState(0.5);
  const [fmDeduction, setFmDeduction] = useState(0.5);
  const [fmCharge, setFmCharge] = useState(10);

  // Step 5: Rates Config
  const [purchaseRate, setPurchaseRate] = useState(5250);
  const [salesRate, setSalesRate] = useState(5450);
  const [marketName, setMarketName] = useState('Latur APMC');

  const API_BASE = 'http://localhost:5000/api/v1/vendor';

  useEffect(() => {
    fetch(`${API_BASE}/commodities`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCommodities(data.data);
          if (data.data.length > 0) setSelectedCommodity(data.data[0]);
        }
      });
  }, []);

  const handleNext = async () => {
    setError('');

    if (step === 1) {
      if (!newPassword || newPassword !== confirmPassword) {
        return setError('Passwords do not match');
      }
      if (!acceptTerms) {
        return setError('Please accept the Terms & Conditions');
      }
      setStep(2);
    } else if (step === 2) {
      try {
        const res = await fetch(`${API_BASE}/setup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId: vendor?.tenantId,
            password: newPassword,
            phone,
            ownerName
          })
        });
        const data = await res.json();
        if (!data.success) return setError(data.message);
        setStep(3);
      } catch (err) {
        setError('Setup failed. Please try again.');
      }
    } else if (step === 3) {
      setStep(4);
    } else if (step === 4) {
      if (!selectedCommodity) return setError('Please select a commodity');
      try {
        const res = await fetch(`${API_BASE}/formulas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId: vendor?.tenantId,
            commodityId: selectedCommodity._id,
            formulaName: 'Standard Soybean Formula',
            qualityParameters: {
              moisture: { threshold: moistureThreshold, interval: moistureInterval, shrinkFactor: moistureShrink, dryingChargeRate: dryingCharge },
              foreignMatter: { threshold: fmThreshold, interval: fmInterval, deductionPercent: fmDeduction, dryingChargeRate: fmCharge },
              broken: { threshold: 1, interval: 0.5, deductionPercent: 0.5 }
            }
          })
        });
        const data = await res.json();
        if (!data.success) return setError(data.message);
        setStep(5);
      } catch (err) {
        setError('Failed to save formula.');
      }
    } else if (step === 5) {
      try {
        if (!selectedCommodity) return;
        await fetch(`${API_BASE}/rates`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId: vendor?.tenantId,
            commodityId: selectedCommodity._id,
            purchaseRate,
            salesRate,
            marketName,
          })
        });

        dispatch(completeSetup());
        navigate('/dashboard');
      } catch (err) {
        setError('Failed to save rates.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between px-4 py-6 max-w-md mx-auto">
      <div>
        {/* Progress Bar */}
        <div className="flex justify-between items-center mb-6">
          {[1, 2, 3, 4, 5].map((num) => (
            <div key={num} className="flex-1 flex items-center">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= num ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                {num}
              </div>
              {num < 5 && <div className={`flex-grow h-1 ${step > num ? 'bg-primary' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {error && <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4 rounded text-xs text-red-700">{error}</div>}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Change Temporary Password</h2>
            <p className="text-xs text-gray-500">For security, please set a new strong password before using your account.</p>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border rounded-xl p-3 text-sm focus:ring-primary focus:border-primary border-gray-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border rounded-xl p-3 text-sm focus:ring-primary focus:border-primary border-gray-300"
              />
            </div>
            <label className="flex items-start space-x-2 pt-2">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 rounded text-primary focus:ring-primary"
              />
              <span className="text-xs text-gray-600">I accept all Platform Terms of Service and Privacy Policy details.</span>
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Verify Business Profile</h2>
            <p className="text-xs text-gray-500">Ensure your contact and owner details are correct.</p>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Business Name</label>
              <input
                type="text"
                disabled
                value={vendor?.businessName || ''}
                className="w-full border rounded-xl p-3 text-sm bg-gray-100 border-gray-300 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Owner Name</label>
              <input
                type="text"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full border rounded-xl p-3 text-sm focus:ring-primary border-gray-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Phone Number</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border rounded-xl p-3 text-sm focus:ring-primary border-gray-300"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Available Commodities</h2>
            <p className="text-xs text-gray-500">Standard commodities synced from Super Admin. You can view but cannot edit this master data.</p>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {commodities.map((c) => (
                <div key={c._id} className="p-3 bg-white border border-gray-200 rounded-xl flex items-center justify-between shadow-sm">
                  <div>
                    <h3 className="font-semibold text-gray-900">{c.englishName} ({c.marathiName})</h3>
                    <span className="text-xs text-gray-400">Code: {c.commodityCode} | Unit: {c.unit}</span>
                  </div>
                  <span className="bg-green-50 text-green-700 text-xs px-2.5 py-1 rounded-full font-medium">Ready</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <h2 className="text-xl font-bold text-gray-900">Deduction Formula Engine</h2>
            <p className="text-xs text-gray-500">Configure thresholds, intervals, and shrinkage rates for ERP calculations.</p>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Select Commodity</label>
              <select
                value={selectedCommodity?._id}
                onChange={(e) => setSelectedCommodity(commodities.find(c => c._id === e.target.value) || null)}
                className="w-full border rounded-xl p-3 text-sm bg-white border-gray-300"
              >
                {commodities.map(c => <option key={c._id} value={c._id}>{c.englishName}</option>)}
              </select>
            </div>

            <div className="border-t pt-3 space-y-3">
              <h3 className="text-xs font-bold text-primary uppercase">Moisture Quality Parameters</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500">Threshold (%)</label>
                  <input type="number" step="0.1" value={moistureThreshold} onChange={(e) => setMoistureThreshold(Number(e.target.value))} className="w-full border rounded-lg p-2 text-xs" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500">Slab Interval (%)</label>
                  <input type="number" step="0.1" value={moistureInterval} onChange={(e) => setMoistureInterval(Number(e.target.value))} className="w-full border rounded-lg p-2 text-xs" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500">Shrink Factor (% weight)</label>
                  <input type="number" step="0.01" value={moistureShrink} onChange={(e) => setMoistureShrink(Number(e.target.value))} className="w-full border rounded-lg p-2 text-xs" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500">Drying Charge (₹/Quintal)</label>
                  <input type="number" value={dryingCharge} onChange={(e) => setDryingCharge(Number(e.target.value))} className="w-full border rounded-lg p-2 text-xs" />
                </div>
              </div>
            </div>

            <div className="border-t pt-3 space-y-3">
              <h3 className="text-xs font-bold text-primary uppercase">Foreign Matter Parameters</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500">Threshold (%)</label>
                  <input type="number" step="0.1" value={fmThreshold} onChange={(e) => setFmThreshold(Number(e.target.value))} className="w-full border rounded-lg p-2 text-xs" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500">Slab Interval (%)</label>
                  <input type="number" step="0.1" value={fmInterval} onChange={(e) => setFmInterval(Number(e.target.value))} className="w-full border rounded-lg p-2 text-xs" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500">Deduction Factor (%)</label>
                  <input type="number" step="0.1" value={fmDeduction} onChange={(e) => setFmDeduction(Number(e.target.value))} className="w-full border rounded-lg p-2 text-xs" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500">Cleaning Charge (₹/Quintal)</label>
                  <input type="number" value={fmCharge} onChange={(e) => setFmCharge(Number(e.target.value))} className="w-full border rounded-lg p-2 text-xs" />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Today's Market Rates</h2>
            <p className="text-xs text-gray-500">Set standard daily purchase rates based on Mandi prices.</p>

            {selectedCommodity && (
              <div className="bg-white border rounded-xl p-4 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-800 border-b pb-2">{selectedCommodity.englishName}</h3>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Purchase Rate (₹ per Quintal)</label>
                  <input
                    type="number"
                    value={purchaseRate}
                    onChange={(e) => setPurchaseRate(Number(e.target.value))}
                    className="w-full border rounded-xl p-3 text-sm focus:ring-primary border-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Sales Rate (₹ per Quintal)</label>
                  <input
                    type="number"
                    value={salesRate}
                    onChange={(e) => setSalesRate(Number(e.target.value))}
                    className="w-full border rounded-xl p-3 text-sm focus:ring-primary border-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Mandi / Market Name</label>
                  <input
                    type="text"
                    value={marketName}
                    onChange={(e) => setMarketName(e.target.value)}
                    className="w-full border rounded-xl p-3 text-sm focus:ring-primary border-gray-300"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <button
        onClick={handleNext}
        className="w-full bg-primary hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-xl shadow transition duration-200 mt-6"
      >
        {step === 5 ? 'Finish & Ready for Operations' : 'Continue'}
      </button>
    </div>
  );
};

export default SetupWizard;
