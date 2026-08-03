import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { Truck, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

interface Warehouse {
  _id: string;
  name: string;
}

interface Commodity {
  _id: string;
  englishName: string;
}

const WarehouseTransfer = () => {
  const { vendor } = useSelector((state: RootState) => state.auth);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [commodities, setCommodities] = useState<Commodity[]>([]);

  // Transfer Form State
  const [sourceId, setSourceId] = useState('');
  const [destinationId, setDestinationId] = useState('');
  const [commodityId, setCommodityId] = useState('');
  const [lotNumber, setLotNumber] = useState('LOT-001');
  const [quantity, setQuantity] = useState<number>(100);
  const [vehicleNo, setVehicleNo] = useState('');
  const [driverName, setDriverName] = useState('');
  const [remarks, setRemarks] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const API_BASE = 'http://localhost:5000/api/v1/vendor';

  useEffect(() => {
    if (vendor?.tenantId) {
      // Fetch warehouses & commodities
      fetch(`${API_BASE}/warehouses?tenantId=${vendor.tenantId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setWarehouses(data.data);
            if (data.data.length > 0) {
              setSourceId(data.data[0]._id);
              if (data.data.length > 1) setDestinationId(data.data[1]._id);
            }
          }
        });

      fetch(`${API_BASE}/commodities`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setCommodities(data.data);
            if (data.data.length > 0) setCommodityId(data.data[0]._id);
          }
        });
    }
  }, [vendor]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (sourceId === destinationId) {
      return setError('Source and Destination warehouse cannot be the same.');
    }

    try {
      const res = await fetch(`${API_BASE}/stock/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: vendor?.tenantId,
          commodityId,
          sourceWarehouseId: sourceId,
          destinationWarehouseId: destinationId,
          lotNumber,
          quantity,
          remarks: `Vehicle: ${vehicleNo} | Driver: ${driverName}. ${remarks}`
        })
      });

      const data = await res.json();
      if (data.success) {
        setSuccess('Warehouse stock transfer processed successfully!');
        setQuantity(100); setVehicleNo(''); setDriverName(''); setRemarks('');
      } else {
        setError(data.message || 'Failed to transfer stock.');
      }
    } catch (err) {
      setError('An error occurred.');
    }
  };

  return (
    <div className="px-4 py-6 max-w-md mx-auto min-h-screen bg-gray-50 pb-20 text-left">
      <div className="flex items-center space-x-2 mb-6">
        <button onClick={() => window.history.back()} className="text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Truck className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold text-gray-950 font-sans">Stock Transfer</h1>
      </div>

      {success && (
        <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-3 rounded flex items-center text-xs text-green-700">
          <CheckCircle className="h-4 w-4 mr-2" /> {success}
        </div>
      )}
      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-3 rounded flex items-center text-xs text-red-700">
          <AlertCircle className="h-4 w-4 mr-2" /> {error}
        </div>
      )}

      <form onSubmit={handleTransfer} className="space-y-4 text-left pb-10 bg-white border p-4 rounded-2xl shadow-sm text-xs">
        <div>
          <label className="block font-bold text-gray-400 uppercase tracking-wider mb-1">Select Commodity</label>
          <select value={commodityId} onChange={(e) => setCommodityId(e.target.value)} className="w-full border rounded-xl p-3 bg-white border-gray-200">
            {commodities.map(c => <option key={c._id} value={c._id}>{c.englishName}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block font-bold text-gray-400 uppercase tracking-wider mb-1">Source Warehouse</label>
            <select value={sourceId} onChange={(e) => setSourceId(e.target.value)} className="w-full border rounded-xl p-3 bg-white border-gray-200">
              {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-bold text-gray-400 uppercase tracking-wider mb-1">Destination Warehouse</label>
            <select value={destinationId} onChange={(e) => setDestinationId(e.target.value)} className="w-full border rounded-xl p-3 bg-white border-gray-200">
              {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block font-bold text-gray-400 uppercase tracking-wider mb-1">Lot Number</label>
            <input type="text" required value={lotNumber} onChange={(e) => setLotNumber(e.target.value)} className="w-full border rounded-xl p-3 border-gray-200" />
          </div>
          <div>
            <label className="block font-bold text-gray-400 uppercase tracking-wider mb-1">Quantity (KG)</label>
            <input type="number" required value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="w-full border rounded-xl p-3 border-gray-200 text-right" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block font-bold text-gray-400 uppercase tracking-wider mb-1">Vehicle No</label>
            <input type="text" value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} className="w-full border rounded-xl p-3 border-gray-200" />
          </div>
          <div>
            <label className="block font-bold text-gray-400 uppercase tracking-wider mb-1">Driver Name</label>
            <input type="text" value={driverName} onChange={(e) => setDriverName(e.target.value)} className="w-full border rounded-xl p-3 border-gray-200" />
          </div>
        </div>

        <div>
          <label className="block font-bold text-gray-400 uppercase tracking-wider mb-1">Remarks</label>
          <input type="text" value={remarks} onChange={(e) => setRemarks(e.target.value)} className="w-full border rounded-xl p-3 border-gray-200" />
        </div>

        <button type="submit" className="w-full bg-primary hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl shadow flex items-center justify-center mt-6">
          <Truck className="mr-2 h-4 w-4" /> Dispatch Stock Transfer
        </button>
      </form>
    </div>
  );
};

export default WarehouseTransfer;
