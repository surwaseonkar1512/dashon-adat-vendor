import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { Plus, Calendar, ArrowLeft, CreditCard } from 'lucide-react';

interface Farmer {
  _id: string;
  name: string;
  mobile: string;
}

interface Customer {
  _id: string;
  name: string;
  mobile: string;
  outstandingBalance: number;
}

interface LedgerEntry {
  _id: string;
  entryType: 'Debit' | 'Credit';
  amount: number;
  paymentMode?: string;
  reference?: string;
  remarks?: string;
  balanceAfter: number;
  createdAt: string;
}

const PaymentsLedger = () => {
  const { vendor } = useSelector((state: RootState) => state.auth);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [partyType, setPartyType] = useState<'Farmer' | 'Customer'>('Customer');
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);

  // Modals state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Payment Form State
  const [payAmount, setPayAmount] = useState<number>(1000);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'RTGS' | 'NEFT' | 'Cheque' | 'Bank Transfer'>('Cash');
  const [reference, setReference] = useState('');
  const [remarks, setRemarks] = useState('Outstanding settlement');

  const API_BASE = 'http://localhost:5000/api/v1/vendor';

  const fetchData = async () => {
    try {
      const [farmRes, custRes] = await Promise.all([
        fetch(`${API_BASE}/farmers?tenantId=${vendor?.tenantId}`),
        fetch(`${API_BASE}/customers?tenantId=${vendor?.tenantId}`)
      ]);

      const farmData = await farmRes.json();
      const custData = await custRes.json();

      if (farmData.success) {
        setFarmers(farmData.data);
        if (partyType === 'Farmer' && farmData.data.length > 0) setSelectedPartyId(farmData.data[0]._id);
      }
      if (custData.success) {
        setCustomers(custData.data);
        if (partyType === 'Customer' && custData.data.length > 0) setSelectedPartyId(custData.data[0]._id);
      }
    } catch (err) {}
  };

  const fetchLedger = async () => {
    if (!selectedPartyId) return;
    try {
      const res = await fetch(`${API_BASE}/ledgers?tenantId=${vendor?.tenantId}&partyType=${partyType}&partyId=${selectedPartyId}`);
      const data = await res.json();
      if (data.success) {
        setLedgerEntries(data.data);
      }
    } catch (err) {}
  };

  useEffect(() => {
    if (vendor?.tenantId) {
      fetchData();
    }
  }, [vendor, partyType]);

  useEffect(() => {
    fetchLedger();
  }, [selectedPartyId, partyType]);

  const handlePostPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const endpoint = partyType === 'Farmer' ? 'payments/farmer' : 'payments/customer';

    try {
      const res = await fetch(`${API_BASE}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: vendor?.tenantId,
          farmerId: partyType === 'Farmer' ? selectedPartyId : undefined,
          customerId: partyType === 'Customer' ? selectedPartyId : undefined,
          amount: payAmount,
          paymentMode,
          reference,
          remarks
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Payment / Collection recorded successfully!');
        setIsPaymentModalOpen(false);
        fetchData();
        fetchLedger();
      } else {
        setError(data.message || 'Failed to submit payment.');
      }
    } catch (err) {
      setError('An error occurred.');
    }
  };

  // Select first item automatically when changing type
  const handleTypeChange = (type: 'Farmer' | 'Customer') => {
    setPartyType(type);
    setLedgerEntries([]);
    if (type === 'Farmer' && farmers.length > 0) setSelectedPartyId(farmers[0]._id);
    if (type === 'Customer' && customers.length > 0) setSelectedPartyId(customers[0]._id);
  };

  return (
    <div className="px-4 py-6 max-w-md mx-auto min-h-screen bg-gray-50 pb-20 text-left">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <button onClick={() => window.history.back()} className="text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-950">Payments & Ledgers</h1>
        </div>
        <button
          onClick={() => setIsPaymentModalOpen(true)}
          className="bg-primary hover:bg-green-700 text-white text-xs font-bold py-2 px-3 rounded-xl flex items-center shadow"
        >
          <Plus className="h-4 w-4 mr-1" /> New Entry
        </button>
      </div>

      {success && <div className="bg-green-50 border-l-4 border-green-500 p-3 mb-4 rounded text-xs text-green-700">{success}</div>}
      {error && <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4 rounded text-xs text-red-700">{error}</div>}

      {/* Selector Options */}
      <div className="flex bg-gray-200 p-1 rounded-xl mb-4">
        <button
          onClick={() => handleTypeChange('Customer')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg ${partyType === 'Customer' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
        >
          Customer Collections
        </button>
        <button
          onClick={() => handleTypeChange('Farmer')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg ${partyType === 'Farmer' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
        >
          Farmer Payments
        </button>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Select {partyType}</label>
        <select
          value={selectedPartyId}
          onChange={(e) => setSelectedPartyId(e.target.value)}
          className="w-full border rounded-xl p-3 text-sm bg-white border-gray-200 mb-6"
        >
          <option value="">-- Choose Party --</option>
          {partyType === 'Customer' 
            ? customers.map(c => <option key={c._id} value={c._id}>{c.name} (Outstanding: ₹{c.outstandingBalance})</option>)
            : farmers.map(f => <option key={f._id} value={f._id}>{f.name}</option>)
          }
        </select>
      </div>

      {/* Ledger History List */}
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Ledger Entries</h3>
      <div className="space-y-3">
        {ledgerEntries.length === 0 ? (
          <p className="text-center text-xs text-gray-400 py-6 bg-white border rounded-2xl shadow-xs">No transaction history found.</p>
        ) : (
          ledgerEntries.map((entry) => (
            <div key={entry._id} className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex justify-between items-center">
              <div>
                <span className={`inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full mb-1 ${
                  entry.entryType === 'Debit' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'
                }`}>
                  {entry.entryType}
                </span>
                <p className="text-xs text-gray-700 font-semibold">{entry.remarks || 'Settlement'}</p>
                <div className="text-[10px] text-gray-400 mt-2 flex items-center">
                  <Calendar className="h-3 w-3 mr-1" /> {new Date(entry.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-gray-900">₹{entry.amount.toLocaleString()}</p>
                <span className="text-[10px] text-gray-400 block font-medium">Bal: ₹{entry.balanceAfter.toLocaleString()}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Post Ledger Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-30 bg-black bg-opacity-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-4 text-left">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-base font-bold text-gray-900 flex items-center">
                <CreditCard className="h-5 w-5 text-primary mr-1.5" /> Post Settlement
              </h2>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-gray-500">✕</button>
            </div>
            <form onSubmit={handlePostPayment} className="space-y-3 text-xs text-left">
              <div>
                <label className="block font-bold text-gray-400 uppercase tracking-wider mb-1">Settlement Amount (₹)</label>
                <input type="number" required value={payAmount} onChange={(e) => setPayAmount(Number(e.target.value))} className="w-full border rounded-xl p-3 text-right" />
              </div>
              <div>
                <label className="block font-bold text-gray-400 uppercase tracking-wider mb-1">Payment Mode</label>
                <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value as any)} className="w-full border rounded-xl p-3 bg-white">
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="RTGS">RTGS</option>
                  <option value="NEFT">NEFT</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-gray-400 uppercase tracking-wider mb-1">Ref Number / ID</label>
                <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} className="w-full border rounded-xl p-3" />
              </div>
              <div>
                <label className="block font-bold text-gray-400 uppercase tracking-wider mb-1">Remarks</label>
                <input type="text" value={remarks} onChange={(e) => setRemarks(e.target.value)} className="w-full border rounded-xl p-3" />
              </div>
              <button type="submit" className="w-full bg-primary hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl shadow mt-4">
                Record Transaction
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsLedger;
