import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../store/store';
import { Plus, X, ShoppingCart, Calendar, ArrowLeft, Search, UserPlus, Printer, Download, Send } from 'lucide-react';
import { API_BASE } from '../config';
import { WeighingScaleConnector } from '../components/WeighingScaleConnector';
import { SmartFarmerModal } from '../components/SmartFarmerModal';

interface Farmer {
  _id: string;
  farmerId: string;
  name: string;
  mobile: string;
  village: string;
}

interface Commodity {
  _id: string;
  name: string;
  englishName: string;
  unit: string;
}

interface SlabRule {
  threshold: number;
  interval: number;
  shrinkFactor?: number;
  dryingChargeRate?: number;
  deductionPercent?: number;
}

interface Formula {
  _id: string;
  formulaName: string;
  commodityId: string;
  qualityParameters: {
    moisture: SlabRule;
    foreignMatter: SlabRule;
    broken: SlabRule;
  };
}

interface Rate {
  commodityId: string;
  purchaseRate: number;
}

interface Bill {
  _id: string;
  billNumber: string;
  farmerId: Farmer;
  commodityId: Commodity;
  netWeight: number;
  netPayable: number;
  paymentStatus: string;
  status: 'Draft' | 'Finalized';
  createdAt: string;
}

const PurchaseBilling = () => {
  const { vendor } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const [bills, setBills] = useState<Bill[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [rates, setRates] = useState<Rate[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'Finalized' | 'Draft'>('Finalized');
  const [editingBillId, setEditingBillId] = useState<string | null>(null);

  // Farmer Search & Modal State
  const [farmerSearchQuery, setFarmerSearchQuery] = useState('');
  const [isFarmerDropdownOpen, setIsFarmerDropdownOpen] = useState(false);
  const [isSmartFarmerModalOpen, setIsSmartFarmerModalOpen] = useState(false);

  // Form State
  const [farmerId, setFarmerId] = useState('');
  const [commodityId, setCommodityId] = useState('');
  const [grossWeight, setGrossWeight] = useState<number>(1000);
  const [bagWeight, setBagWeight] = useState<number>(20);
  const [bagCount, setBagCount] = useState<number>(4);
  const [actualMoisture, setActualMoisture] = useState<number>(15);
  const [actualFM, setActualFM] = useState<number>(3);
  const [actualBroken, setActualBroken] = useState<number>(1);

  // Loaded variables
  const [selectedFormula, setSelectedFormula] = useState<Formula | null>(null);
  const [selectedRate, setSelectedRate] = useState<number>(5250);


  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [billsRes, farmersRes, commoditiesRes, formulasRes, ratesRes] = await Promise.all([
        fetch(`${API_BASE}/purchases?tenantId=${vendor?.tenantId}`),
        fetch(`${API_BASE}/farmers?tenantId=${vendor?.tenantId}`),
        fetch(`${API_BASE}/commodities`),
        fetch(`${API_BASE}/formulas?tenantId=${vendor?.tenantId}`),
        fetch(`${API_BASE}/rates?tenantId=${vendor?.tenantId}`)
      ]);

      const billsData = await billsRes.json();
      const farmersData = await farmersRes.json();
      const commoditiesData = await commoditiesRes.json();
      const formulasData = await formulasRes.json();
      const ratesData = await ratesRes.json();

      if (billsData.success) setBills(billsData.data);
      if (farmersData.success) setFarmers(farmersData.data);
      if (commoditiesData.success) setCommodities(commoditiesData.data);
      if (formulasData.success) setFormulas(formulasData.data);
      if (ratesData.success) setRates(ratesData.data);
    } catch (err) {
      setError('Connection failed. Verify backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (vendor?.tenantId) {
      fetchData();
    }
  }, [vendor]);

  // Load formula and rates automatically when commodity changes
  useEffect(() => {
    if (commodityId) {
      const formula = formulas.find(f => String(f.commodityId || '') === commodityId || String((f as any).commodityId?._id || '') === commodityId);
      setSelectedFormula(formula || null);

      const rateObj = rates.find(r => String(r.commodityId || '') === commodityId || String((r as any).commodityId?._id || '') === commodityId);
      setSelectedRate(rateObj ? rateObj.purchaseRate : 5250);
    } else {
      setSelectedFormula(null);
      setSelectedRate(5250);
    }
  }, [commodityId, formulas, rates]);

  const handleEditDraft = (bill: Bill) => {
    setEditingBillId(bill._id);
    setFarmerId(bill.farmerId._id);
    setCommodityId(bill.commodityId._id);
    // You would typically fetch the full details if you didn't populate them all in the list view,
    // but for now we'll just set what we have and open the modal. In a real app we'd load the weights back.
    setIsModalOpen(true);
  };

  // Math calculations
  const calculateBill = () => {
    const baseNetWeight = Math.max(0, grossWeight - bagWeight);
    let moistureDeductionWt = 0;
    let dryingCharge = 0;
    let fmDeductionWt = 0;
    let brokenDeductionWt = 0;
    const appliedList: any[] = [];

    if (selectedFormula?.qualityParameters) {
      // 1. Moisture Calculation
      const mRule = selectedFormula.qualityParameters.moisture;
      if (actualMoisture > mRule.threshold) {
        const excess = actualMoisture - mRule.threshold;
        const slabs = Math.max(0, Math.floor(excess / mRule.interval));
        const shrinkPercent = slabs * (mRule.shrinkFactor || 0);
        moistureDeductionWt = (baseNetWeight * shrinkPercent) / 100;
        dryingCharge = slabs * (mRule.dryingChargeRate || 0) * (baseNetWeight / 100); // per quintal
        appliedList.push({ name: 'Moisture Shrinkage', type: 'Weight', value: moistureDeductionWt });
        appliedList.push({ name: 'Drying Charges', type: 'Deduction', value: dryingCharge });
      }

      // 2. Foreign Matter Calculation
      const fmRule = selectedFormula.qualityParameters.foreignMatter;
      if (actualFM > fmRule.threshold) {
        const excess = actualFM - fmRule.threshold;
        const slabs = Math.max(0, Math.floor(excess / fmRule.interval));
        const deductionPercent = slabs * (fmRule.deductionPercent || 0);
        fmDeductionWt = (baseNetWeight * deductionPercent) / 100;
        appliedList.push({ name: 'Foreign Matter Deduction', type: 'Weight', value: fmDeductionWt });
      }

      // 3. Broken Slabs Calculation
      const bRule = selectedFormula.qualityParameters.broken;
      if (actualBroken > bRule.threshold) {
        const excess = actualBroken - bRule.threshold;
        const slabs = Math.max(0, Math.floor(excess / bRule.interval));
        const deductionPercent = slabs * (bRule.deductionPercent || 0);
        brokenDeductionWt = (baseNetWeight * deductionPercent) / 100;
        appliedList.push({ name: 'Broken Grain Deduction', type: 'Weight', value: brokenDeductionWt });
      }
    }

    const finalNetWeight = Math.max(0, baseNetWeight - moistureDeductionWt - fmDeductionWt - brokenDeductionWt);
    const grossAmount = finalNetWeight * (selectedRate / 100); // Rate per Quintal (1 Quintal = 100 KG)
    
    // Deduction fixed fees
    const hamali = 300;
    const commission = 500;
    const netPayable = Math.max(0, grossAmount - dryingCharge - hamali - commission);

    return {
      netWeight: finalNetWeight,
      totalAmount: grossAmount,
      netPayable: netPayable,
      dryingCharge,
      moistureDeductionWt,
      fmDeductionWt,
      brokenDeductionWt,
      hamali,
      commission,
      deductionsApplied: appliedList
    };
  };

  const calc = calculateBill();

  const [showPrintModal, setShowPrintModal] = useState(false);
  const [lastSavedBill, setLastSavedBill] = useState<any>(null);
  const [printTab, setPrintTab] = useState<'Thermal' | 'A4'>('Thermal');

  const handleSubmit = async (e: React.FormEvent, status: 'Draft' | 'Finalized' = 'Finalized') => {
    e.preventDefault();
    setError('');

    if (!farmerId) return setError('Please select a farmer');
    if (!commodityId) return setError('Please select a commodity');

    try {
      const selectedFarmerObj = farmers.find(f => f._id === farmerId);
      const selectedCommObj = commodities.find(c => c._id === commodityId);

      const payload = {
        tenantId: vendor?.tenantId,
        farmerId,
        commodityId,
        grossWeight,
        bagWeight,
        bagCount,
        rate: selectedRate,
        deductionsApplied: [
          { name: 'Moisture Shrinkage', type: 'Weight', value: calc.moistureDeductionWt, amount: calc.moistureDeductionWt },
          { name: 'Drying Charges', type: 'FixedAmount', value: calc.dryingCharge, amount: calc.dryingCharge },
          { name: 'Foreign Matter Deduction', type: 'Weight', value: calc.fmDeductionWt, amount: calc.fmDeductionWt }
        ],
        totalAmount: calc.totalAmount,
        netPayable: calc.netPayable,
        status
      };

      const url = editingBillId 
        ? `${API_BASE}/purchases/${editingBillId}`
        : `${API_BASE}/purchases`;
      const method = editingBillId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        // Set last saved bill data for modal layout
        setLastSavedBill({
          ...data.data,
          farmerId: selectedFarmerObj,
          commodityId: selectedCommObj,
          moisture: actualMoisture,
          foreignMatter: actualFM,
          grossWeight,
          bagWeight,
          dryingCharge: calc.dryingCharge,
          hamali: calc.hamali,
          commission: calc.commission
        });

        setIsModalOpen(false);
        if (status === 'Finalized') {
          setShowPrintModal(true);
        } else {
          alert('Draft Saved Successfully');
        }

        setGrossWeight(1000);
        setBagWeight(20);
        setBagCount(4);
        setFarmerId('');
        setCommodityId('');
        setEditingBillId(null);
        fetchData();
      } else {
        setError(data.message || 'Failed to save bill.');
      }
    } catch (err) {
      setError('An error occurred.');
    }
  };

  return (
    <div className="px-4 py-6 max-w-md mx-auto min-h-screen bg-gray-50 pb-20 text-left relative">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-950">Purchase Billing</h1>
        </div>
        <button
          onClick={() => {
            setEditingBillId(null);
            setIsModalOpen(true);
          }}
          className="bg-primary hover:bg-green-700 text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center shadow"
        >
          <Plus className="h-4 w-4 mr-1" /> New Bill
        </button>
      </div>

      <div className="flex bg-gray-200 p-1 rounded-xl mb-4 text-xs font-bold w-full max-w-xs mx-auto">
        <button 
          onClick={() => setActiveTab('Finalized')} 
          className={`flex-1 py-2 rounded-lg text-center ${activeTab === 'Finalized' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}`}
        >
          Finalized Bills
        </button>
        <button 
          onClick={() => setActiveTab('Draft')} 
          className={`flex-1 py-2 rounded-lg text-center ${activeTab === 'Draft' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}`}
        >
          Drafts
        </button>
      </div>

      {error && <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4 rounded text-xs text-red-700">{error}</div>}

      {/* Bill History */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500 text-sm">Loading purchases...</div>
      ) : (
        <div className="space-y-4">
          {bills.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              No purchase bills generated today.
            </div>
          ) : (
            bills.filter(b => b.status === activeTab).map((bill) => (
              <div key={bill._id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex justify-between items-center animate-fade-in">
                <div onClick={() => activeTab === 'Draft' ? handleEditDraft(bill) : null} className={activeTab === 'Draft' ? 'cursor-pointer' : ''}>
                  <h3 className="font-bold text-gray-950 text-sm">{bill.farmerId?.name}</h3>
                  <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">{bill.commodityId?.englishName}</span>
                  <div className="text-xs text-gray-500 mt-2 flex items-center">
                    <Calendar className="h-3 w-3 mr-1" /> {new Date(bill.createdAt).toLocaleDateString()}
                  </div>
                  <p className="text-xs text-gray-600 font-medium">Weight: {bill.netWeight.toFixed(2)} KG</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-gray-950">₹{bill.netPayable.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                  <span className={`inline-block mt-2 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                    bill.status === 'Draft' ? 'bg-gray-100 text-gray-700' :
                    bill.paymentStatus === 'Paid' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                  }`}>
                    {bill.status === 'Draft' ? 'Draft' : (bill.paymentStatus === 'Pending' ? 'Completed' : bill.paymentStatus)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* New Purchase Drawer */}
      {isModalOpen && (
        <div className="fixed inset-0 z-30 bg-black bg-opacity-40 flex items-end">
          <div className="bg-white w-full rounded-t-3xl max-h-[85vh] overflow-y-auto p-6 space-y-4 max-w-md mx-auto shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-bold text-gray-900 flex items-center">
                <ShoppingCart className="h-5 w-5 text-primary mr-1.5" /> {editingBillId ? 'Resume Draft' : 'Purchase Billing'}
              </h2>
              <button onClick={() => { setIsModalOpen(false); setEditingBillId(null); }} className="text-gray-500">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={(e) => handleSubmit(e, 'Finalized')} className="space-y-4 pb-8 text-left">
              <div className="relative">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Select Farmer</label>
                
                {/* Searchable Dropdown Trigger */}
                <div 
                  className="w-full border rounded-xl p-3 text-sm bg-white border-gray-200 flex justify-between items-center cursor-pointer"
                  onClick={() => setIsFarmerDropdownOpen(!isFarmerDropdownOpen)}
                >
                  <span className={farmerId ? 'text-gray-900 font-medium' : 'text-gray-500'}>
                    {farmerId ? farmers.find(f => f._id === farmerId)?.name : '-- Search Farmer --'}
                  </span>
                  <Search className="w-4 h-4 text-gray-400" />
                </div>

                {/* Dropdown Menu */}
                {isFarmerDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-hidden flex flex-col">
                    <div className="p-2 border-b">
                      <input 
                        type="text" 
                        autoFocus
                        value={farmerSearchQuery}
                        onChange={(e) => setFarmerSearchQuery(e.target.value)}
                        placeholder="Search name, mobile, village..." 
                        className="w-full bg-gray-50 border-none rounded-lg p-2 text-sm focus:ring-0"
                      />
                    </div>
                    <div className="overflow-y-auto flex-1">
                      {farmers.filter(f => 
                        f.name.toLowerCase().includes(farmerSearchQuery.toLowerCase()) || 
                        f.mobile.includes(farmerSearchQuery) || 
                        f.village.toLowerCase().includes(farmerSearchQuery.toLowerCase())
                      ).map(f => (
                        <div 
                          key={f._id} 
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-0"
                          onClick={() => {
                            setFarmerId(f._id);
                            setIsFarmerDropdownOpen(false);
                            setFarmerSearchQuery('');
                          }}
                        >
                          <div className="font-semibold text-sm text-gray-900">{f.name}</div>
                          <div className="text-xs text-gray-500">{f.mobile} • {f.village}</div>
                        </div>
                      ))}
                      {/* Add New Option */}
                      <div 
                        className="p-3 bg-green-50 text-green-700 hover:bg-green-100 cursor-pointer flex items-center justify-center font-semibold"
                        onClick={() => {
                          setIsFarmerDropdownOpen(false);
                          setIsSmartFarmerModalOpen(true);
                        }}
                      >
                        <UserPlus className="w-4 h-4 mr-2" /> Add New Farmer
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Select Commodity</label>
                <select
                  required
                  value={commodityId}
                  onChange={(e) => setCommodityId(e.target.value)}
                  className="w-full border rounded-xl p-3 text-sm bg-white border-gray-200"
                >
                  <option value="">-- Choose Commodity --</option>
                  {commodities.map(c => <option key={c._id} value={c._id}>{c.englishName}</option>)}
                </select>
              </div>

              <div className="bg-white border rounded-xl p-3 mb-2 shadow-sm">
                <WeighingScaleConnector onWeightChange={(weight) => setGrossWeight(weight)} className="mb-3" />
                <div className="grid grid-cols-3 gap-2 border-t pt-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Gross Wt (KG)</label>
                    <input type="number" required value={grossWeight} onChange={(e) => setGrossWeight(Number(e.target.value))} className="w-full border rounded-xl p-2 text-xs border-gray-200 text-right bg-gray-50 focus:bg-white transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Bag Wt</label>
                    <input type="number" required value={bagWeight} onChange={(e) => setBagWeight(Number(e.target.value))} className="w-full border rounded-xl p-2 text-xs border-gray-200 text-right" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Bags</label>
                    <input type="number" required value={bagCount} onChange={(e) => setBagCount(Number(e.target.value))} className="w-full border rounded-xl p-2 text-xs border-gray-200 text-right" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Moisture (%)</label>
                  <input type="number" step="0.1" value={actualMoisture} onChange={(e) => setActualMoisture(Number(e.target.value))} className="w-full border rounded-xl p-2 text-xs border-gray-200 text-right" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">FM (%)</label>
                  <input type="number" step="0.1" value={actualFM} onChange={(e) => setActualFM(Number(e.target.value))} className="w-full border rounded-xl p-2 text-xs border-gray-200 text-right" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Broken (%)</label>
                  <input type="number" step="0.1" value={actualBroken} onChange={(e) => setActualBroken(Number(e.target.value))} className="w-full border rounded-xl p-2 text-xs border-gray-200 text-right" />
                </div>
              </div>

              {/* Live Preview Math */}
              {commodityId && (
                <div className="bg-gray-50 border rounded-2xl p-4 space-y-2 text-xs text-gray-700">
                  <h4 className="font-bold text-gray-900 border-b pb-1.5 mb-2 uppercase tracking-wide text-[10px]">Calculation Preview</h4>
                  <div className="flex justify-between">
                    <span>Moisture Shrink:</span>
                    <span className="text-red-500">-{calc.moistureDeductionWt.toFixed(2)} KG</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Foreign Matter Shrink:</span>
                    <span className="text-red-500">-{calc.fmDeductionWt.toFixed(2)} KG</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-gray-950 border-t pt-1">
                    <span>Net Weight:</span>
                    <span className="text-primary">{calc.netWeight.toFixed(2)} KG</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rate (₹ / Quintal):</span>
                    <span>₹{selectedRate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Drying Charge:</span>
                    <span className="text-red-500">-₹{calc.dryingCharge.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hamali + Comm:</span>
                    <span className="text-red-500">-₹{calc.hamali + calc.commission}</span>
                  </div>
                  <div className="flex justify-between border-t border-dashed pt-2 mt-2 text-sm font-black text-gray-900">
                    <span>Net Payable:</span>
                    <span className="text-primary">₹{calc.netPayable.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, 'Draft')}
                  className="flex-1 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-bold py-3 px-2 rounded-xl shadow-sm text-xs"
                >
                  Save as Draft
                </button>
                <button
                  type="submit"
                  className="flex-[2] bg-primary hover:bg-green-700 text-white font-bold py-3 px-2 rounded-xl shadow-sm text-xs"
                >
                  Finalize & Generate Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post-Save Print Modal & Layout Previews */}
      {showPrintModal && lastSavedBill && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[85vh] text-xs">
            
            {/* Modal Title */}
            <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
              <h3 className="font-black text-gray-900">Receipt Generated</h3>
              <button onClick={() => setShowPrintModal(false)} className="text-gray-500 font-bold">✕</button>
            </div>

            {/* Layout Mode Selector */}
            <div className="flex bg-gray-100 p-1 m-3 rounded-xl">
              <button
                onClick={() => setPrintTab('Thermal')}
                className={`flex-1 py-1.5 font-bold rounded-lg ${printTab === 'Thermal' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'}`}
              >
                Thermal Preview (80mm)
              </button>
              <button
                onClick={() => setPrintTab('A4')}
                className={`flex-1 py-1.5 font-bold rounded-lg ${printTab === 'A4' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'}`}
              >
                A4 Invoice Layout
              </button>
            </div>

            {/* Receipt Preview Window */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-100/50">
              {printTab === 'Thermal' ? (
                <div className="bg-white p-4 border border-dashed shadow-xs max-w-[280px] mx-auto text-left font-mono leading-tight text-[10px] text-gray-800">
                  {vendor?.logo && (
                    <div className="flex justify-center mb-2">
                      <img src={vendor.logo} alt="Logo" className="max-h-12 grayscale" />
                    </div>
                  )}
                  <div className="text-center font-bold text-xs uppercase mb-1">{vendor?.businessName || 'ADAT'}</div>
                  {vendor?.address && <div className="text-center text-[9px] mb-1">{vendor.address}</div>}
                  {vendor?.gstNumber && <div className="text-center text-[9px] mb-1">GSTIN: {vendor.gstNumber}</div>}
                  <div className="text-center mb-2">Commodity Purchase</div>
                  <hr className="border-dashed my-1" />
                  <div>Bill No: {lastSavedBill.billNumber}</div>
                  <div>Date: 03-08-2026</div>
                  <div>Time: 09:35 AM</div>
                  <hr className="border-dashed my-1" />
                  <div>Farmer: {lastSavedBill.farmerId?.name}</div>
                  <div>Village: Kallam</div>
                  <hr className="border-dashed my-1" />
                  <div>Commodity: {lastSavedBill.commodityId?.englishName}</div>
                  <div className="flex justify-between"><span>Gross Wt:</span><span>{lastSavedBill.grossWeight} KG</span></div>
                  <div className="flex justify-between"><span>Moisture:</span><span>{lastSavedBill.moisture}%</span></div>
                  <div className="flex justify-between"><span>FM:</span><span>{lastSavedBill.foreignMatter}%</span></div>
                  <div className="flex justify-between font-bold"><span>Net Weight:</span><span>{lastSavedBill.netWeight?.toFixed(2)} KG</span></div>
                  <div className="flex justify-between"><span>Rate/Q:</span><span>₹{lastSavedBill.rate}</span></div>
                  <hr className="border-dashed my-1" />
                  <div className="flex justify-between"><span>Gross Amount:</span><span>₹{lastSavedBill.totalAmount?.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Hamali:</span><span>₹{lastSavedBill.hamali}</span></div>
                  <div className="flex justify-between"><span>Drying Chg:</span><span>₹{lastSavedBill.dryingCharge?.toFixed(0)}</span></div>
                  <div className="flex justify-between"><span>Commission:</span><span>₹{lastSavedBill.commission}</span></div>
                  <hr className="border-dashed my-1" />
                  <div className="flex justify-between font-bold text-xs"><span>Net Payable:</span><span>₹{lastSavedBill.netPayable?.toLocaleString()}</span></div>
                  <hr className="border-dashed my-1" />
                  <div className="text-center mt-2">Thank You</div>
                  <div className="text-center">Visit Again</div>
                </div>
              ) : (
                <div className="bg-white p-4 shadow-xs border text-left space-y-3 font-sans text-[10px] text-gray-700">
                  <div className="text-center font-bold text-sm border-b pb-2 uppercase tracking-wide">ADAT - Purchase Invoice</div>
                  
                  <div className="grid grid-cols-2 gap-2 border-b pb-2 text-[9px]">
                    <div>
                      {vendor?.logo && (
                        <img src={vendor.logo} alt="Logo" className="max-h-8 mb-2" />
                      )}
                      <p className="font-bold text-gray-900">{vendor?.businessName || 'ADAT Solutions'}</p>
                      {vendor?.address && <p>{vendor.address}</p>}
                      {vendor?.gstNumber && <p>GSTIN: {vendor.gstNumber}</p>}
                    </div>
                    <div className="text-right">
                      <p><span className="font-bold">Bill No:</span> {lastSavedBill.billNumber}</p>
                      <p><span className="font-bold">Date:</span> {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="border-b pb-2">
                    <p className="font-bold text-gray-900 text-[9px] mb-1">Farmer Details</p>
                    <p>Name: {lastSavedBill.farmerId?.name}</p>
                    <p>Mobile: {lastSavedBill.farmerId?.mobile || '9876543210'}</p>
                  </div>

                  <table className="w-full text-[9px] text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100 border-b">
                        <th className="p-1">Commodity</th>
                        <th className="p-1 text-right">Gross Wt</th>
                        <th className="p-1 text-right">Deductions</th>
                        <th className="p-1 text-right">Net Wt</th>
                        <th className="p-1 text-right">Net Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-1 font-bold">{lastSavedBill.commodityId?.englishName}</td>
                        <td className="p-1 text-right">{lastSavedBill.grossWeight} KG</td>
                        <td className="p-1 text-right">{(lastSavedBill.grossWeight - lastSavedBill.netWeight)?.toFixed(2)} KG</td>
                        <td className="p-1 text-right">{lastSavedBill.netWeight?.toFixed(2)} KG</td>
                        <td className="p-1 text-right">₹{lastSavedBill.netPayable?.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="flex justify-between items-end border-t pt-2 mt-4 text-[9px]">
                    <div className="border p-2 rounded bg-gray-50 flex items-center justify-center">
                      <span className="font-mono text-[8px] text-gray-400">[ QR Authentication ]</span>
                    </div>
                    <div className="text-right space-y-1">
                      <p><span className="font-bold">Sub Total:</span> ₹{lastSavedBill.totalAmount?.toLocaleString()}</p>
                      <p className="font-bold text-gray-900">Grand Total: ₹{lastSavedBill.netPayable?.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions Bar */}
            <div className="p-4 border-t bg-gray-50 grid grid-cols-2 gap-2">
              <button
                onClick={() => alert('[Simulating Thermal Bluetooth Output]')}
                className="bg-primary hover:bg-green-700 text-white font-bold py-2 rounded-xl flex items-center justify-center"
              >
                <Printer className="w-4 h-4 mr-2" /> Print Thermal
              </button>
              <button
                onClick={() => window.print()}
                className="bg-white border text-gray-700 font-bold py-2 rounded-xl hover:bg-gray-100 flex items-center justify-center"
              >
                <Download className="w-4 h-4 mr-2" /> Download PDF
              </button>
              <button
                onClick={() => alert('[Sharing Invoice details directly to WhatsApp]')}
                className="col-span-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold py-2 rounded-xl text-center flex items-center justify-center"
              >
                <Send className="w-4 h-4 mr-2" /> Share WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Smart Farmer Quick Registration Modal */}
      <SmartFarmerModal
        isOpen={isSmartFarmerModalOpen}
        onClose={() => setIsSmartFarmerModalOpen(false)}
        initialMobile={farmerSearchQuery}
        onSuccess={(newFarmer) => {
          // Immediately select and update farmers list
          setFarmers((prev) => [newFarmer, ...prev]);
          setFarmerId(newFarmer._id);
          setIsSmartFarmerModalOpen(false);
          setFarmerSearchQuery('');
        }}
      />
    </div>
  );
};

export default PurchaseBilling;
