import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { X, Calendar, ArrowLeft, ShoppingCart, User } from 'lucide-react';

interface Customer {
  _id: string;
  name: string;
  mobile: string;
}

interface Commodity {
  _id: string;
  englishName: string;
}

interface Warehouse {
  _id: string;
  name: string;
}

interface SalesInvoice {
  _id: string;
  invoiceNumber: string;
  customerId: Customer;
  commodityId: Commodity;
  quantity: number;
  rate: number;
  grandTotal: number;
  paymentStatus: string;
  createdAt: string;
}

const SalesBilling = () => {
  const { vendor } = useSelector((state: RootState) => state.auth);
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Sales Invoice Form State
  const [customerId, setCustomerId] = useState('');
  const [commodityId, setCommodityId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [lotNumber, setLotNumber] = useState('LOT-001');
  const [quantity, setQuantity] = useState<number>(100);
  const [rate, setRate] = useState<number>(5500);
  const [discount, setDiscount] = useState<number>(0);
  const [gstPercent, setGstPercent] = useState<number>(5);
  const [loadingCharge, setLoadingCharge] = useState<number>(0);
  const [transportCharge, setTransportCharge] = useState<number>(0);
  const [remarks, setRemarks] = useState('');

  // Customer Form State
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerGstin, setCustomerGstin] = useState('');

  const API_BASE = 'http://localhost:5000/api/v1/vendor';

  const fetchData = async () => {
    try {
      const [invRes, custRes, comRes, whRes] = await Promise.all([
        fetch(`${API_BASE}/sales?tenantId=${vendor?.tenantId}`),
        fetch(`${API_BASE}/customers?tenantId=${vendor?.tenantId}`),
        fetch(`${API_BASE}/commodities`),
        fetch(`${API_BASE}/warehouses?tenantId=${vendor?.tenantId}`)
      ]);

      const invData = await invRes.json();
      const custData = await custRes.json();
      const comData = await comRes.json();
      const whData = await whRes.json();

      if (invData.success) setInvoices(invData.data);
      if (custData.success) setCustomers(custData.data);
      if (comData.success) setCommodities(comData.data);
      if (whData.success) setWarehouses(whData.data);
    } catch (err) {}
  };

  useEffect(() => {
    if (vendor?.tenantId) {
      fetchData();
    }
  }, [vendor]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_BASE}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: vendor?.tenantId,
          name: customerName,
          mobile: customerMobile,
          address: customerAddress,
          gstin: customerGstin
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Customer registered successfully!');
        setCustomerName(''); setCustomerMobile(''); setCustomerAddress(''); setCustomerGstin('');
        setIsCustomerModalOpen(false);
        fetchData();
      } else {
        setError(data.message || 'Failed to add customer');
      }
    } catch (err) {
      setError('An error occurred.');
    }
  };

  const [showPrintModal, setShowPrintModal] = useState(false);
  const [lastSavedInvoice, setLastSavedInvoice] = useState<any>(null);
  const [printTab, setPrintTab] = useState<'Thermal' | 'A4'>('Thermal');

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const selectedCustomerObj = customers.find(c => c._id === customerId);
      const selectedCommObj = commodities.find(c => c._id === commodityId);
      const selectedWHObj = warehouses.find(w => w._id === warehouseId);

      const payload = {
        tenantId: vendor?.tenantId,
        customerId,
        commodityId,
        warehouseId,
        lotNumber,
        quantity,
        rate,
        discount,
        gstPercent,
        loadingCharge,
        transportCharge,
        remarks
      };

      const res = await fetch(`${API_BASE}/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setLastSavedInvoice({
          ...data.data,
          customerId: selectedCustomerObj,
          commodityId: selectedCommObj,
          warehouseId: selectedWHObj,
          quantity,
          rate,
          discount,
          gstPercent,
          loadingCharge,
          transportCharge
        });

        setIsInvoiceModalOpen(false);
        setShowPrintModal(true);
        fetchData();
      } else {
        setError(data.message || 'Failed to create sales invoice.');
      }
    } catch (err) {
      setError('An error occurred.');
    }
  };

  // Math totals
  const baseValue = quantity * (rate / 100);
  const taxableValue = Math.max(0, baseValue - discount);
  const gstAmount = (taxableValue * gstPercent) / 100;
  const grandTotal = taxableValue + gstAmount + loadingCharge + transportCharge;

  return (
    <div className="px-4 py-6 max-w-md mx-auto min-h-screen bg-gray-50 pb-20 text-left relative">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <button onClick={() => window.history.back()} className="text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-950">Sales Billing</h1>
        </div>
        <div className="flex space-x-1.5">
          <button
            onClick={() => setIsCustomerModalOpen(true)}
            className="bg-white border text-gray-700 text-xs font-bold py-2 px-3 rounded-xl shadow-xs"
          >
            + Customer
          </button>
          <button
            onClick={() => setIsInvoiceModalOpen(true)}
            className="bg-primary hover:bg-green-700 text-white text-xs font-bold py-2 px-3 rounded-xl flex items-center shadow"
          >
            + Invoice
          </button>
        </div>
      </div>

      {success && <div className="bg-green-50 border-l-4 border-green-500 p-3 mb-4 rounded text-xs text-green-700">{success}</div>}
      {error && <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4 rounded text-xs text-red-700">{error}</div>}

      {/* Invoice History */}
      <div className="space-y-4">
        {invoices.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm bg-white border rounded-2xl p-6 shadow-xs">
            No sales invoices generated yet.
          </div>
        ) : (
          invoices.map((inv) => (
            <div key={inv._id} className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">{inv.customerId?.name}</h3>
                <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">{inv.commodityId?.englishName}</span>
                <p className="text-xs text-gray-600 font-medium mt-1">Qty: {inv.quantity} KG</p>
                <div className="text-[10px] text-gray-400 mt-2 flex items-center">
                  <Calendar className="h-3 w-3 mr-1" /> {new Date(inv.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-gray-950">₹{inv.grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                <span className={`inline-block mt-2 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                  inv.paymentStatus === 'Paid' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {inv.paymentStatus}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Invoice Modal */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-30 bg-black bg-opacity-40 flex items-end">
          <div className="bg-white w-full rounded-t-3xl max-h-[85vh] overflow-y-auto p-6 space-y-4 max-w-md mx-auto shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-bold text-gray-900 flex items-center">
                <ShoppingCart className="h-5 w-5 text-primary mr-1.5" /> Sales Billing
              </h2>
              <button onClick={() => setIsInvoiceModalOpen(false)} className="text-gray-500">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-3 pb-8 text-left text-xs">
              <div>
                <label className="block font-bold text-gray-400 uppercase tracking-wider mb-1">Select Customer</label>
                <select required value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="w-full border rounded-xl p-3 bg-white">
                  <option value="">-- Choose Customer --</option>
                  {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-400 uppercase tracking-wider mb-1">Select Commodity</label>
                <select required value={commodityId} onChange={(e) => setCommodityId(e.target.value)} className="w-full border rounded-xl p-3 bg-white">
                  <option value="">-- Choose Commodity --</option>
                  {commodities.map(c => <option key={c._id} value={c._id}>{c.englishName}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-400 uppercase tracking-wider mb-1">Warehouse</label>
                  <select required value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className="w-full border rounded-xl p-3 bg-white">
                    <option value="">-- Choose WH --</option>
                    {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-400 uppercase tracking-wider mb-1">Lot Number</label>
                  <input type="text" required value={lotNumber} onChange={(e) => setLotNumber(e.target.value)} className="w-full border rounded-xl p-3" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-400 uppercase tracking-wider mb-1">Quantity (KG)</label>
                  <input type="number" required value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="w-full border rounded-xl p-3 text-right" />
                </div>
                <div>
                  <label className="block font-bold text-gray-400 uppercase tracking-wider mb-1">Rate (₹/Quintal)</label>
                  <input type="number" required value={rate} onChange={(e) => setRate(Number(e.target.value))} className="w-full border rounded-xl p-3 text-right" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-gray-400 uppercase tracking-wider mb-1">Discount (₹)</label>
                  <input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className="w-full border rounded-xl p-2 text-right" />
                </div>
                <div>
                  <label className="block font-bold text-gray-400 uppercase tracking-wider mb-1">GST (%)</label>
                  <input type="number" value={gstPercent} onChange={(e) => setGstPercent(Number(e.target.value))} className="w-full border rounded-xl p-2 text-right" />
                </div>
                <div>
                  <label className="block font-bold text-gray-400 uppercase tracking-wider mb-1">Loading (₹)</label>
                  <input type="number" value={loadingCharge} onChange={(e) => setLoadingCharge(Number(e.target.value))} className="w-full border rounded-xl p-2 text-right" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-400 uppercase tracking-wider mb-1">Transport (₹)</label>
                  <input type="number" value={transportCharge} onChange={(e) => setTransportCharge(Number(e.target.value))} className="w-full border rounded-xl p-2 text-right" />
                </div>
                <div>
                  <label className="block font-bold text-gray-400 uppercase tracking-wider mb-1">Remarks</label>
                  <input type="text" value={remarks} onChange={(e) => setRemarks(e.target.value)} className="w-full border rounded-xl p-2" />
                </div>
              </div>

              <div className="bg-gray-50 border rounded-2xl p-4 space-y-2 mt-3">
                <div className="flex justify-between font-bold text-gray-700">
                  <span>Base Value:</span>
                  <span>₹{baseValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-700">
                  <span>GST Amount:</span>
                  <span>₹{gstAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-dashed pt-2 text-sm font-black text-gray-950">
                  <span>Grand Total:</span>
                  <span className="text-primary">₹{grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              <button type="submit" className="w-full bg-primary hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl shadow mt-4">
                Generate GST Invoice
              </button>
            </form>
          </div>
        </div>
      )}

      {/* New Customer Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-30 bg-black bg-opacity-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-4 text-left">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-base font-bold text-gray-900 flex items-center">
                <User className="h-5 w-5 text-primary mr-1.5" /> Add Customer
              </h2>
              <button onClick={() => setIsCustomerModalOpen(false)} className="text-gray-500">✕</button>
            </div>
            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-400 uppercase tracking-wider mb-1">Name</label>
                <input type="text" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full border rounded-xl p-3" />
              </div>
              <div>
                <label className="block font-bold text-gray-400 uppercase tracking-wider mb-1">Mobile</label>
                <input type="text" required value={customerMobile} onChange={(e) => setCustomerMobile(e.target.value)} className="w-full border rounded-xl p-3" />
              </div>
              <div>
                <label className="block font-bold text-gray-400 uppercase tracking-wider mb-1">Address</label>
                <input type="text" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} className="w-full border rounded-xl p-3" />
              </div>
              <div>
                <label className="block font-bold text-gray-400 uppercase tracking-wider mb-1">GSTIN</label>
                <input type="text" value={customerGstin} onChange={(e) => setCustomerGstin(e.target.value)} className="w-full border rounded-xl p-3" />
              </div>
              <button type="submit" className="w-full bg-primary hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl shadow mt-4">
                Save Customer
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Post-Save Print Modal & Layout Previews */}
      {showPrintModal && lastSavedInvoice && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[85vh] text-xs">
            
            {/* Modal Title */}
            <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
              <h3 className="font-black text-gray-900">Invoice Generated</h3>
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
                  <div className="text-center font-bold text-xs uppercase mb-2">ADAT</div>
                  <div className="text-center mb-2">Sales Invoice</div>
                  <hr className="border-dashed my-1" />
                  <div>Invoice No: {lastSavedInvoice.invoiceNumber}</div>
                  <div>Date: 03-08-2026</div>
                  <div>Time: 09:35 AM</div>
                  <hr className="border-dashed my-1" />
                  <div>Customer: {lastSavedInvoice.customerId?.name}</div>
                  <hr className="border-dashed my-1" />
                  <div>Commodity: {lastSavedInvoice.commodityId?.englishName}</div>
                  <div className="flex justify-between"><span>Qty:</span><span>{lastSavedInvoice.quantity} KG</span></div>
                  <div className="flex justify-between"><span>Rate/Q:</span><span>₹{lastSavedInvoice.rate}</span></div>
                  <div className="flex justify-between"><span>GST ({lastSavedInvoice.gstPercent}%):</span><span>₹{((lastSavedInvoice.quantity * (lastSavedInvoice.rate / 100)) * lastSavedInvoice.gstPercent / 100).toFixed(0)}</span></div>
                  <hr className="border-dashed my-1" />
                  <div className="flex justify-between font-bold text-xs"><span>Grand Total:</span><span>₹{lastSavedInvoice.grandTotal?.toLocaleString()}</span></div>
                  <hr className="border-dashed my-1" />
                  <div className="text-center mt-2">Thank You</div>
                  <div className="text-center">Visit Again</div>
                </div>
              ) : (
                <div className="bg-white p-4 shadow-xs border text-left space-y-3 font-sans text-[10px] text-gray-700">
                  <div className="text-center font-bold text-sm border-b pb-2 uppercase tracking-wide">ADAT - Tax Invoice</div>
                  
                  <div className="grid grid-cols-2 gap-2 border-b pb-2 text-[9px]">
                    <div>
                      <p className="font-bold text-gray-900">Vendor Detail</p>
                      <p>{vendor?.businessName || 'ADAT Solutions'}</p>
                      <p>GSTIN: 27AASFA3845B1Z9</p>
                    </div>
                    <div className="text-right">
                      <p><span className="font-bold">Invoice No:</span> {lastSavedInvoice.invoiceNumber}</p>
                      <p><span className="font-bold">Date:</span> {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="border-b pb-2">
                    <p className="font-bold text-gray-900 text-[9px] mb-1">Customer Details</p>
                    <p>Name: {lastSavedInvoice.customerId?.name}</p>
                    <p>Mobile: {lastSavedInvoice.customerId?.mobile || '9876543210'}</p>
                    <p>GSTIN: {lastSavedInvoice.customerId?.gstin || 'Unregistered'}</p>
                  </div>

                  <table className="w-full text-[9px] text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100 border-b">
                        <th className="p-1">Commodity</th>
                        <th className="p-1 text-right">Quantity</th>
                        <th className="p-1 text-right">Rate</th>
                        <th className="p-1 text-right">GST %</th>
                        <th className="p-1 text-right">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-1 font-bold">{lastSavedInvoice.commodityId?.englishName}</td>
                        <td className="p-1 text-right">{lastSavedInvoice.quantity} KG</td>
                        <td className="p-1 text-right">₹{lastSavedInvoice.rate}</td>
                        <td className="p-1 text-right">{lastSavedInvoice.gstPercent}%</td>
                        <td className="p-1 text-right">₹{lastSavedInvoice.grandTotal?.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="flex justify-between items-end border-t pt-2 mt-4 text-[9px]">
                    <div className="border p-2 rounded bg-gray-50 flex items-center justify-center">
                      <span className="font-mono text-[8px] text-gray-400">[ QR Code Verification ]</span>
                    </div>
                    <div className="text-right space-y-1">
                      <p><span className="font-bold">GST Amount:</span> ₹{((lastSavedInvoice.quantity * (lastSavedInvoice.rate / 100)) * lastSavedInvoice.gstPercent / 100).toLocaleString()}</p>
                      <p className="font-bold text-gray-900">Grand Total: ₹{lastSavedInvoice.grandTotal?.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions Bar */}
            <div className="p-4 border-t bg-gray-50 grid grid-cols-2 gap-2">
              <button
                onClick={() => alert('[Simulating Thermal Bluetooth Output]')}
                className="bg-primary hover:bg-green-700 text-white font-bold py-2 rounded-xl"
              >
                🖨 Print Thermal
              </button>
              <button
                onClick={() => window.print()}
                className="bg-white border text-gray-700 font-bold py-2 rounded-xl hover:bg-gray-100"
              >
                📄 Download PDF
              </button>
              <button
                onClick={() => alert('[Sharing Invoice details directly to WhatsApp]')}
                className="col-span-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold py-2 rounded-xl text-center"
              >
                📲 Share WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesBilling;
