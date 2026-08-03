import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../store/store';
import { FileText, Save, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { API_BASE } from '../config';

interface Commodity {
  _id: string;
  name: string;
  englishName: string;
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
  commodityId: any;
  qualityParameters: {
    moisture: SlabRule;
    foreignMatter: SlabRule;
    broken: SlabRule;
  };
}

const FormulaMaster = () => {
  const { vendor } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [selectedCommodityId, setSelectedCommodityId] = useState('');
  
  // Formula Form State
  const [formulaName, setFormulaName] = useState('Standard Formula');
  const [moistureThreshold, setMoistureThreshold] = useState(13);
  const [moistureInterval, setMoistureInterval] = useState(0.5);
  const [moistureShrink, setMoistureShrink] = useState(0.7);
  const [dryingCharge, setDryingCharge] = useState(15);

  const [fmThreshold, setFmThreshold] = useState(2);
  const [fmInterval, setFmInterval] = useState(0.5);
  const [fmDeduction, setFmDeduction] = useState(0.5);
  const [fmCharge, setFmCharge] = useState(10);

  const [brokenThreshold, setBrokenThreshold] = useState(1);
  const [brokenInterval, setBrokenInterval] = useState(0.5);
  const [brokenDeduction, setBrokenDeduction] = useState(0.5);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');


  const fetchData = async () => {
    try {
      const [comRes, formRes] = await Promise.all([
        fetch(`${API_BASE}/commodities`),
        fetch(`${API_BASE}/formulas?tenantId=${vendor?.tenantId}`)
      ]);
      const comData = await comRes.json();
      const formData = await formRes.json();

      if (comData.success) {
        setCommodities(comData.data);
        if (comData.data.length > 0) setSelectedCommodityId(comData.data[0]._id);
      }
      if (formData.success) setFormulas(formData.data);
    } catch (err) {}
  };

  useEffect(() => {
    if (vendor?.tenantId) {
      fetchData();
    }
  }, [vendor]);

  // Load existing formula when selected commodity changes
  useEffect(() => {
    if (selectedCommodityId) {
      const existing = formulas.find(f => 
        String(f.commodityId || '') === selectedCommodityId || 
        String(f.commodityId?._id || '') === selectedCommodityId
      );

      if (existing && existing.qualityParameters) {
        setFormulaName(existing.formulaName);
        const m = existing.qualityParameters.moisture;
        setMoistureThreshold(m.threshold);
        setMoistureInterval(m.interval);
        setMoistureShrink(m.shrinkFactor || 0);
        setDryingCharge(m.dryingChargeRate || 0);

        const fm = existing.qualityParameters.foreignMatter;
        setFmThreshold(fm.threshold);
        setFmInterval(fm.interval);
        setFmDeduction(fm.deductionPercent || 0);
        setFmCharge(fm.dryingChargeRate || 0);

        const b = existing.qualityParameters.broken;
        setBrokenThreshold(b.threshold);
        setBrokenInterval(b.interval);
        setBrokenDeduction(b.deductionPercent || 0);
      } else {
        // Reset defaults
        setFormulaName('Standard Formula');
        setMoistureThreshold(13);
        setMoistureInterval(0.5);
        setMoistureShrink(0.7);
        setDryingCharge(15);
        setFmThreshold(2);
        setFmInterval(0.5);
        setFmDeduction(0.5);
        setFmCharge(10);
        setBrokenThreshold(1);
        setBrokenInterval(0.5);
        setBrokenDeduction(0.5);
      }
    }
  }, [selectedCommodityId, formulas]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const res = await fetch(`${API_BASE}/formulas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: vendor?.tenantId,
          commodityId: selectedCommodityId,
          formulaName,
          qualityParameters: {
            moisture: { threshold: moistureThreshold, interval: moistureInterval, shrinkFactor: moistureShrink, dryingChargeRate: dryingCharge },
            foreignMatter: { threshold: fmThreshold, interval: fmInterval, deductionPercent: fmDeduction, dryingChargeRate: fmCharge },
            broken: { threshold: brokenThreshold, interval: brokenInterval, deductionPercent: brokenDeduction }
          }
        })
      });

      const data = await res.json();
      if (data.success) {
        setMessage('Formula saved successfully!');
        fetchData();
      } else {
        setError(data.message || 'Failed to save formula.');
      }
    } catch (err) {
      setError('An error occurred.');
    }
  };

  return (
    <div className="px-4 py-6 max-w-md mx-auto min-h-screen bg-gray-50 pb-20 text-left">
      <div className="flex items-center space-x-2 mb-6">
        <button type="button" onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-5 w-5 mr-1" />
        </button>
        <FileText className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold text-gray-950">Formula Master</h1>
      </div>

      {message && (
        <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-3 rounded flex items-center text-xs text-green-700">
          <CheckCircle className="h-4 w-4 mr-2" /> {message}
        </div>
      )}
      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-3 rounded flex items-center text-xs text-red-700">
          <AlertCircle className="h-4 w-4 mr-2" /> {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4 text-left pb-10">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Select Commodity</label>
          <select
            value={selectedCommodityId}
            onChange={(e) => setSelectedCommodityId(e.target.value)}
            className="w-full border rounded-xl p-3 text-sm bg-white border-gray-200"
          >
            {commodities.map(c => <option key={c._id} value={c._id}>{c.englishName}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Formula Name</label>
          <input
            type="text"
            required
            value={formulaName}
            onChange={(e) => setFormulaName(e.target.value)}
            className="w-full border rounded-xl p-3 text-sm border-gray-200"
          />
        </div>

        <div className="bg-white rounded-2xl p-4 border space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-primary uppercase">Moisture Rules</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-400">Threshold (%)</label>
              <input type="number" step="0.1" value={moistureThreshold} onChange={(e) => setMoistureThreshold(Number(e.target.value))} className="w-full border rounded-lg p-2 text-xs" />
            </div>
            <div>
              <label className="text-[10px] text-gray-400">Slab Interval (%)</label>
              <input type="number" step="0.1" value={moistureInterval} onChange={(e) => setMoistureInterval(Number(e.target.value))} className="w-full border rounded-lg p-2 text-xs" />
            </div>
            <div>
              <label className="text-[10px] text-gray-400">Shrink Factor (% wt)</label>
              <input type="number" step="0.01" value={moistureShrink} onChange={(e) => setMoistureShrink(Number(e.target.value))} className="w-full border rounded-lg p-2 text-xs" />
            </div>
            <div>
              <label className="text-[10px] text-gray-400">Drying Charge (₹/Q)</label>
              <input type="number" value={dryingCharge} onChange={(e) => setDryingCharge(Number(e.target.value))} className="w-full border rounded-lg p-2 text-xs" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-primary uppercase">Foreign Matter Rules</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-400">Threshold (%)</label>
              <input type="number" step="0.1" value={fmThreshold} onChange={(e) => setFmThreshold(Number(e.target.value))} className="w-full border rounded-lg p-2 text-xs" />
            </div>
            <div>
              <label className="text-[10px] text-gray-400">Slab Interval (%)</label>
              <input type="number" step="0.1" value={fmInterval} onChange={(e) => setFmInterval(Number(e.target.value))} className="w-full border rounded-lg p-2 text-xs" />
            </div>
            <div>
              <label className="text-[10px] text-gray-400">Deduction Factor (%)</label>
              <input type="number" step="0.1" value={fmDeduction} onChange={(e) => setFmDeduction(Number(e.target.value))} className="w-full border rounded-lg p-2 text-xs" />
            </div>
            <div>
              <label className="text-[10px] text-gray-400">Cleaning Charge (₹/Q)</label>
              <input type="number" value={fmCharge} onChange={(e) => setFmCharge(Number(e.target.value))} className="w-full border rounded-lg p-2 text-xs" />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-primary hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl shadow flex items-center justify-center"
        >
          <Save className="mr-2 h-4 w-4" /> Save Formula Configuration
        </button>
      </form>
    </div>
  );
};

export default FormulaMaster;
