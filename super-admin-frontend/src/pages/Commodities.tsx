import React, { useState, useEffect } from 'react';
import { Plus, X, Upload, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react';

interface Commodity {
  _id: string;
  name: string;
  marathiName: string;
  englishName: string;
  commodityCode: string;
  category: string;
  unit: string;
  gstPercent: number;
}

const Commodities = () => {
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [marathiName, setMarathiName] = useState('');
  const [englishName, setEnglishName] = useState('');
  const [commodityCode, setCommodityCode] = useState('');
  const [category, setCategory] = useState('Oilseeds');
  const [unit, setUnit] = useState('KG');
  const [gstPercent, setGstPercent] = useState(5);
  const [hsnCode, setHsnCode] = useState('');

  const API_BASE = 'http://localhost:5000/api/v1/superadmin';

  const fetchCommodities = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/commodities`);
      const data = await res.json();
      if (data.success) {
        setCommodities(data.data);
      }
    } catch (err) {
      setError('Failed to load commodities.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCommodities();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch(`${API_BASE}/commodities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, marathiName, englishName, commodityCode, category, unit, gstPercent, hsnCode
        })
      });

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        setSuccessMsg('Commodity created successfully!');
        // Reset form
        setName(''); setMarathiName(''); setEnglishName(''); setCommodityCode('');
        fetchCommodities();
      } else {
        setError(data.message || 'Failed to create commodity.');
      }
    } catch (err) {
      setError('An error occurred.');
    }
  };

  // Import mock CSV file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setSuccessMsg('');
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        // Basic CSV Parsing (CSV layout: Name, MarathiName, EnglishName, Code, Category, Unit, GST, HSN)
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        const headers = lines[0].split(',');

        const parsedCommodities = lines.slice(1).map(line => {
          const cols = line.split(',');
          return {
            name: cols[0],
            marathiName: cols[1],
            englishName: cols[2],
            commodityCode: cols[3],
            category: cols[4] || 'Oilseeds',
            unit: cols[5] || 'KG',
            gstPercent: Number(cols[6] || 5),
            hsnCode: cols[7] || ''
          };
        });

        const res = await fetch(`${API_BASE}/commodities/import`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ commodities: parsedCommodities })
        });

        const data = await res.json();
        if (data.success) {
          setIsImportOpen(false);
          setSuccessMsg(data.message || 'Bulk import completed!');
          fetchCommodities();
        } else {
          setError(data.message || 'Failed to import commodities.');
        }
      } catch (err) {
        setError('Error reading or parsing file. Make sure it is a valid CSV.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Commodity Master</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsImportOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Upload className="mr-2 h-4 w-4" /> Bulk Import (CSV/Excel)
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-green-700"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Commodity
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
            <p className="text-sm text-green-700">{successMsg}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading commodities...</div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commodity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marathi Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GST %</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {commodities.map((c) => (
                <tr key={c._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{c.englishName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.marathiName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.commodityCode}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.gstPercent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Manual Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-medium text-gray-900">Add New Commodity</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-left">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">English Name</label>
                  <input type="text" required value={englishName} onChange={(e) => { setEnglishName(e.target.value); setName(e.target.value); }} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Marathi Name</label>
                  <input type="text" required value={marathiName} onChange={(e) => setMarathiName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Commodity Code</label>
                  <input type="text" required value={commodityCode} onChange={(e) => setCommodityCode(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <input type="text" required value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Unit</label>
                  <input type="text" required value={unit} onChange={(e) => setUnit(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">GST (%)</label>
                  <input type="number" required value={gstPercent} onChange={(e) => setGstPercent(Number(e.target.value))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">HSN Code</label>
                  <input type="text" value={hsnCode} onChange={(e) => setHsnCode(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-green-700">Save Commodity</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <FileSpreadsheet className="h-5 w-5 mr-2 text-primary" /> Bulk Import
              </h3>
              <button onClick={() => setIsImportOpen(false)} className="text-gray-400 hover:text-gray-500">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-center">
              <p className="text-xs text-gray-500">Upload a CSV file containing commodity rows in this format:<br /><strong>Name,MarathiName,EnglishName,Code,Category,Unit,GST,HSN</strong></p>
              <label className="w-full flex flex-col items-center px-4 py-6 bg-white text-gray-400 rounded-lg shadow-lg tracking-wide uppercase border border-blue cursor-pointer hover:bg-gray-50">
                <Upload className="h-8 w-8 text-primary" />
                <span className="mt-2 text-sm font-bold">Select CSV File</span>
                <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Commodities;
