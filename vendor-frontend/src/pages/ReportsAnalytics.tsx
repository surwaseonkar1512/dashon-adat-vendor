import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { ArrowLeft, Download, Printer } from 'lucide-react';

interface Purchase {
  billNumber: string;
  netWeight: number;
  netPayable: number;
  createdAt: string;
}

interface Sale {
  invoiceNumber: string;
  quantity: number;
  grandTotal: number;
  createdAt: string;
}

const ReportsAnalytics = () => {
  const { vendor } = useSelector((state: RootState) => state.auth);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const API_BASE = 'http://localhost:5000/api/v1/vendor';

  useEffect(() => {
    if (vendor?.tenantId) {
      Promise.all([
        fetch(`${API_BASE}/purchases?tenantId=${vendor.tenantId}`),
        fetch(`${API_BASE}/sales?tenantId=${vendor.tenantId}`)
      ])
        .then(async ([pRes, sRes]) => {
          const pData = await pRes.json();
          const sData = await sRes.json();
          if (pData.success) setPurchases(pData.data);
          if (sData.success) setSales(sData.data);
        })
        .finally(() => setLoading(false));
    }
  }, [vendor]);

  // Compute stats
  const totalPurchaseWt = purchases.reduce((acc, curr) => acc + curr.netWeight, 0);
  const totalPurchaseAmt = purchases.reduce((acc, curr) => acc + curr.netPayable, 0);
  const totalSalesWt = sales.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalSalesAmt = sales.reduce((acc, curr) => acc + curr.grandTotal, 0);

  const grossProfit = Math.max(0, totalSalesAmt - totalPurchaseAmt);

  return (
    <div className="px-4 py-6 max-w-md mx-auto min-h-screen bg-gray-50 pb-20 text-left">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <button onClick={() => window.history.back()} className="text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-950">Reports & Analytics</h1>
        </div>
        <div className="flex space-x-1">
          <button onClick={() => window.print()} className="bg-white border p-2 rounded-xl text-gray-700">
            <Printer className="h-4 w-4" />
          </button>
          <button className="bg-white border p-2 rounded-xl text-gray-700">
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-xs text-gray-500 py-6">Loading reports...</p>
      ) : (
        <div className="space-y-4 text-xs">
          
          {/* Quick Metrics Summary */}
          <div className="bg-white border rounded-2xl p-4 shadow-xs grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] text-gray-400 font-bold block uppercase">Purchase Vol</span>
              <p className="text-sm font-black text-gray-900">{(totalPurchaseWt / 1000).toFixed(2)} Tons</p>
              <span className="text-gray-500 font-medium">₹{totalPurchaseAmt.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 font-bold block uppercase">Sales Vol</span>
              <p className="text-sm font-black text-gray-900">{(totalSalesWt / 1000).toFixed(2)} Tons</p>
              <span className="text-gray-500 font-medium">₹{totalSalesAmt.toLocaleString()}</span>
            </div>
            <div className="col-span-2 border-t pt-2 mt-1">
              <span className="text-[10px] text-gray-400 font-bold block uppercase">Estimated Margin</span>
              <p className="text-base font-black text-primary">₹{grossProfit.toLocaleString()}</p>
            </div>
          </div>

          {/* Recent Bills Ledger */}
          <div className="bg-white border rounded-2xl p-4 shadow-xs space-y-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-1">Purchase Receipts</h3>
            <div className="divide-y space-y-2 max-h-40 overflow-y-auto pr-1">
              {purchases.slice(0, 5).map((p, idx) => (
                <div key={idx} className="pt-2 flex justify-between">
                  <div>
                    <p className="font-bold text-gray-900">{p.billNumber}</p>
                    <span className="text-[10px] text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                  <span className="font-black text-gray-900">₹{p.netPayable.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Invoices Ledger */}
          <div className="bg-white border rounded-2xl p-4 shadow-xs space-y-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-1">Sales Invoices</h3>
            <div className="divide-y space-y-2 max-h-40 overflow-y-auto pr-1">
              {sales.slice(0, 5).map((s, idx) => (
                <div key={idx} className="pt-2 flex justify-between">
                  <div>
                    <p className="font-bold text-gray-900">{s.invoiceNumber}</p>
                    <span className="text-[10px] text-gray-400">{new Date(s.createdAt).toLocaleDateString()}</span>
                  </div>
                  <span className="font-black text-gray-900">₹{s.grandTotal.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default ReportsAnalytics;
