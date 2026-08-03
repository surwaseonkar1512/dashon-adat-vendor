import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { Archive, ArrowLeft, Settings } from 'lucide-react';

interface Warehouse {
  _id: string;
  name: string;
  location: string;
  capacity: string;
}

interface StockItem {
  commodity: { englishName: string; _id: string };
  warehouse: { name: string; _id: string };
  lotNumber: string;
  quantity: number;
}

interface Commodity {
  _id: string;
  englishName: string;
}

const StockManagement = () => {
  const { vendor } = useSelector((state: RootState) => state.auth);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [commodities, setCommodities] = useState<Commodity[]>([]);

  // Modals state
  const [isWHModalOpen, setIsWHModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Warehouse Form State
  const [whName, setWhName] = useState('');
  const [whLocation, setWhLocation] = useState('');
  const [whCapacity, setWhCapacity] = useState('50 Tons');

  // Adjustment Form State
  const [selectedCommId, setSelectedCommId] = useState('');
  const [selectedWHId, setSelectedWHId] = useState('');
  const [lotNumber, setLotNumber] = useState('LOT-001');
  const [adjQuantity, setAdjQuantity] = useState<number>(100);
  const [adjType, setAdjType] = useState('Add'); // Add or Deduct
  const [adjReason, setAdjReason] = useState('Audit correction');

  const API_BASE = 'http://localhost:5000/api/v1/vendor';

  const fetchData = async () => {
    try {
      const [stockRes, whRes, comRes] = await Promise.all([
        fetch(`${API_BASE}/stock?tenantId=${vendor?.tenantId}`),
        fetch(`${API_BASE}/warehouses?tenantId=${vendor?.tenantId}`),
        fetch(`${API_BASE}/commodities`)
      ]);

      const stockData = await stockRes.json();
      const whData = await whRes.json();
      const comData = await comRes.json();

      if (stockData.success) setStock(stockData.data);
      if (whData.success) setWarehouses(whData.data);
      if (comData.success) {
        setCommodities(comData.data);
        if (comData.data.length > 0) setSelectedCommId(comData.data[0]._id);
      }
      if (whData.data && whData.data.length > 0) setSelectedWHId(whData.data[0]._id);
    } catch (err) {}
  };

  useEffect(() => {
    if (vendor?.tenantId) {
      fetchData();
    }
  }, [vendor]);

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_BASE}/warehouses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: vendor?.tenantId,
          name: whName,
          location: whLocation,
          capacity: whCapacity
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Warehouse created successfully!');
        setWhName(''); setWhLocation('');
        setIsWHModalOpen(false);
        fetchData();
      } else {
        setError(data.message || 'Failed to save warehouse');
      }
    } catch (err) {
      setError('An error occurred.');
    }
  };

  const handleCreateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const qtyMultiplier = adjType === 'Add' ? 1 : -1;

    try {
      const res = await fetch(`${API_BASE}/stock/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: vendor?.tenantId,
          commodityId: selectedCommId,
          warehouseId: selectedWHId,
          lotNumber,
          quantity: adjQuantity * qtyMultiplier,
          type: adjType === 'Add' ? 'Audit addition' : 'Damage/loss',
          remarks: adjReason
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Stock adjusted successfully!');
        setIsAdjustmentModalOpen(false);
        fetchData();
      } else {
        setError(data.message || 'Failed to adjust stock.');
      }
    } catch (err) {
      setError('An error occurred.');
    }
  };

  return (
    <div className="px-4 py-6 max-w-md mx-auto min-h-screen bg-gray-50 pb-20 text-left">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <button onClick={() => window.history.back()} className="text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-950">Stock Management</h1>
        </div>
        <div className="flex space-x-1.5">
          <button
            onClick={() => setIsWHModalOpen(true)}
            className="bg-white border text-gray-700 text-xs font-bold py-2 px-3 rounded-xl shadow-xs"
          >
            + WH
          </button>
          <button
            onClick={() => setIsAdjustmentModalOpen(true)}
            className="bg-primary hover:bg-green-700 text-white text-xs font-bold py-2 px-3 rounded-xl flex items-center shadow"
          >
            <Settings className="h-4 w-4 mr-1" /> Adjust
          </button>
        </div>
      </div>

      {success && <div className="bg-green-50 border-l-4 border-green-500 p-3 mb-4 rounded text-xs text-green-700">{success}</div>}
      {error && <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4 rounded text-xs text-red-700">{error}</div>}

      {/* Warehouse Master List */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 mb-6 space-y-3">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Warehouse Status</h3>
        <div className="grid grid-cols-2 gap-2">
          {warehouses.map(w => (
            <div key={w._id} className="border rounded-xl p-3 bg-gray-50/50">
              <h4 className="font-bold text-gray-900 text-xs">{w.name}</h4>
              <p className="text-[10px] text-gray-500 mt-1">📍 {w.location}</p>
              <span className="inline-block mt-2 text-[9px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full">{w.capacity}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stock Cards by Commodity & Lot */}
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Inventory Ledger</h3>
      <div className="space-y-3">
        {stock.length === 0 ? (
          <p className="text-center text-xs text-gray-400 py-6 bg-white border rounded-2xl shadow-xs">No active stock in warehouses.</p>
        ) : (
          stock.map((item, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-gray-900 text-sm">{item.commodity?.englishName}</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Lot: {item.lotNumber} | WH: {item.warehouse?.name}</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-primary">{(item.quantity / 1000).toFixed(2)} Tons</span>
                <p className="text-[10px] text-gray-400 font-medium">{item.quantity} KG</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Warehouse Modal */}
      {isWHModalOpen && (
        <div className="fixed inset-0 z-30 bg-black bg-opacity-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-4 text-left">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-base font-bold text-gray-900 flex items-center">
                <Archive className="h-5 w-5 text-primary mr-1.5" /> Add Warehouse
              </h2>
              <button onClick={() => setIsWHModalOpen(false)} className="text-gray-500">✕</button>
            </div>
            <form onSubmit={handleCreateWarehouse} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-400 uppercase tracking-wider mb-1">Warehouse Name</label>
                <input type="text" required value={whName} onChange={(e) => setWhName(e.target.value)} className="w-full border rounded-xl p-3" />
              </div>
              <div>
                <label className="block font-bold text-gray-400 uppercase tracking-wider mb-1">Location</label>
                <input type="text" required value={whLocation} onChange={(e) => setWhLocation(e.target.value)} className="w-full border rounded-xl p-3" />
              </div>
              <div>
                <label className="block font-bold text-gray-400 uppercase tracking-wider mb-1">Capacity (Tons)</label>
                <input type="text" required value={whCapacity} onChange={(e) => setWhCapacity(e.target.value)} className="w-full border rounded-xl p-3" />
              </div>
              <button type="submit" className="w-full bg-primary hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl shadow mt-4">
                Save Warehouse
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {isAdjustmentModalOpen && (
        <div className="fixed inset-0 z-30 bg-black bg-opacity-40 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 space-y-4 max-w-md mx-auto shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-base font-bold text-gray-900 flex items-center">
                <Settings className="h-5 w-5 text-primary mr-1.5" /> Adjust Inventory
              </h2>
              <button onClick={() => setIsAdjustmentModalOpen(false)} className="text-gray-500">✕</button>
            </div>
            <form onSubmit={handleCreateAdjustment} className="space-y-3 text-xs text-left">
              <div>
                <label className="block font-bold text-gray-400 uppercase tracking-wider mb-1">Select Commodity</label>
                <select required value={selectedCommId} onChange={(e) => setSelectedCommId(e.target.value)} className="w-full border rounded-xl p-3 bg-white">
                  {commodities.map(c => <option key={c._id} value={c._id}>{c.englishName}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-bold text-gray-400 uppercase tracking-wider mb-1">Select Warehouse</label>
                <select required value={selectedWHId} onChange={(e) => setSelectedWHId(e.target.value)} className="w-full border rounded-xl p-3 bg-white">
                  {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-400 uppercase tracking-wider mb-1">Lot Number</label>
                  <input type="text" required value={lotNumber} onChange={(e) => setLotNumber(e.target.value)} className="w-full border rounded-xl p-3" />
                </div>
                <div>
                  <label className="block font-bold text-gray-400 uppercase tracking-wider mb-1">Type</label>
                  <select value={adjType} onChange={(e) => setAdjType(e.target.value)} className="w-full border rounded-xl p-3 bg-white">
                    <option value="Add">Add Stock (+)</option>
                    <option value="Deduct">Deduct Stock (-)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-bold text-gray-400 uppercase tracking-wider mb-1">Quantity (KG)</label>
                <input type="number" required value={adjQuantity} onChange={(e) => setAdjQuantity(Number(e.target.value))} className="w-full border rounded-xl p-3 text-right" />
              </div>
              <div>
                <label className="block font-bold text-gray-400 uppercase tracking-wider mb-1">Reason / Remarks</label>
                <input type="text" required value={adjReason} onChange={(e) => setAdjReason(e.target.value)} className="w-full border rounded-xl p-3" />
              </div>
              <button type="submit" className="w-full bg-primary hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl shadow mt-4">
                Confirm Stock Adjustment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockManagement;
