import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../store/store';
import { TrendingUp, Save, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

interface Commodity {
  _id: string;
  name: string;
  englishName: string;
}

interface Rate {
  _id: string;
  commodityId: any;
  purchaseRate: number;
  salesRate: number;
  marketName: string;
  effectiveDate: string;
  remarks?: string;
}

const RateMaster = () => {
  const { vendor } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [rates, setRates] = useState<Rate[]>([]);
  const [selectedCommodityId, setSelectedCommodityId] = useState('');
  
  // Rate Form State
  const [purchaseRate, setPurchaseRate] = useState(5250);
  const [salesRate, setSalesRate] = useState(5450);
  const [marketName, setMarketName] = useState('Latur APMC');
  const [remarks, setRemarks] = useState("Today's Market Price");
  
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const API_BASE = 'http://localhost:5000/api/v1/vendor';

  const fetchData = async () => {
    try {
      const [comRes, rateRes] = await Promise.all([
        fetch(`${API_BASE}/commodities`),
        fetch(`${API_BASE}/rates?tenantId=${vendor?.tenantId}`)
      ]);
      const comData = await comRes.json();
      const rateData = await rateRes.json();

      if (comData.success) {
        setCommodities(comData.data);
        if (comData.data.length > 0) setSelectedCommodityId(comData.data[0]._id);
      }
      if (rateData.success) setRates(rateData.data);
    } catch (err) {}
  };

  useEffect(() => {
    if (vendor?.tenantId) {
      fetchData();
    }
  }, [vendor]);

  // Load existing rates when commodity changes
  useEffect(() => {
    if (selectedCommodityId) {
      const existing = rates.find(r => 
        String(r.commodityId || '') === selectedCommodityId || 
        String(r.commodityId?._id || '') === selectedCommodityId
      );

      if (existing) {
        setPurchaseRate(existing.purchaseRate);
        setSalesRate(existing.salesRate);
        setMarketName(existing.marketName || 'Latur APMC');
        setRemarks(existing.remarks || '');
      } else {
        setPurchaseRate(5250);
        setSalesRate(5450);
        setMarketName('Latur APMC');
        setRemarks("Today's Market Price");
      }
    }
  }, [selectedCommodityId, rates]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const res = await fetch(`${API_BASE}/rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: vendor?.tenantId,
          commodityId: selectedCommodityId,
          purchaseRate,
          salesRate,
          marketName,
          remarks
        })
      });

      const data = await res.json();
      if (data.success) {
        setMessage('Rates updated successfully!');
        fetchData();
      } else {
        setError(data.message || 'Failed to update rates.');
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
        <TrendingUp className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold text-gray-950 font-sans">Daily Rate Master</h1>
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

      {/* Active Rates List */}
      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden mb-6">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider p-4 border-b">Current Mandi Rates</h3>
        <div className="divide-y">
          {rates.length === 0 ? (
            <p className="p-4 text-xs text-gray-500 text-center">No commodity rates set yet.</p>
          ) : (
            rates.map((r) => (
              <div key={r._id} className="p-4 flex justify-between items-center text-xs">
                <div>
                  <h4 className="font-bold text-gray-950 text-sm">{(r.commodityId as any)?.englishName || 'Commodity'}</h4>
                  <span className="text-gray-400 font-medium">📍 {r.marketName}</span>
                </div>
                <div className="text-right">
                  <p className="font-black text-primary text-sm">Buy: ₹{r.purchaseRate}/Q</p>
                  <p className="text-gray-500">Sell: ₹{r.salesRate}/Q</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add / Edit Form */}
      <form onSubmit={handleSave} className="space-y-4 text-left pb-10 bg-white border p-4 rounded-2xl shadow-sm">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider pb-2 border-b">Update Rates</h3>
        
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

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Purchase Rate (₹/Q)</label>
            <input
              type="number"
              required
              value={purchaseRate}
              onChange={(e) => setPurchaseRate(Number(e.target.value))}
              className="w-full border rounded-xl p-3 text-sm border-gray-200 text-right"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Sales Rate (₹/Q)</label>
            <input
              type="number"
              required
              value={salesRate}
              onChange={(e) => setSalesRate(Number(e.target.value))}
              className="w-full border rounded-xl p-3 text-sm border-gray-200 text-right"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Market / Mandi Name</label>
          <input
            type="text"
            required
            value={marketName}
            onChange={(e) => setMarketName(e.target.value)}
            className="w-full border rounded-xl p-3 text-sm border-gray-200"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Remarks</label>
          <input
            type="text"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full border rounded-xl p-3 text-sm border-gray-200"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-primary hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl shadow flex items-center justify-center mt-6"
        >
          <Save className="mr-2 h-4 w-4" /> Save Rates Configuration
        </button>
      </form>
    </div>
  );
};

export default RateMaster;
