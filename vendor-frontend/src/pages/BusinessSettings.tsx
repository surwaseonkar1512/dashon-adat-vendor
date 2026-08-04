import React, { useState, useEffect } from 'react';
import { ArrowLeft, Settings, Save, CheckCircle, Store, Building2, Receipt } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { updateVendorProfile } from '../store/slices/authSlice';
import type { RootState } from '../store/store';
import { API_BASE } from '../config';
import { DocumentUploader, type DocumentMetadata } from '../components/DocumentUploader';

const BusinessSettings = () => {
  const { vendor, token } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  const [address, setAddress] = useState(vendor?.address || '');
  const [gstNumber, setGstNumber] = useState(vendor?.gstNumber || '');
  const [logoDocs, setLogoDocs] = useState<DocumentMetadata[]>(
    vendor?.logo ? [{ documentType: 'Logo', url: vendor.logo }] : []
  );

  // Printer Settings
  const [deviceType, setDeviceType] = useState('Bluetooth');
  const [paperWidth, setPaperWidth] = useState('80mm');
  const [autoPrintPurchase, setAutoPrintPurchase] = useState(true);
  const [autoPrintSale, setAutoPrintSale] = useState(true);
  const [autoDownloadPDF, setAutoDownloadPDF] = useState(false);
  const [autoShareWhatsApp, setAutoShareWhatsApp] = useState(false);
  const [askBeforePrint, setAskBeforePrint] = useState(true);

  const [message, setMessage] = useState('');

  // Load configured settings
  useEffect(() => {
    const saved = localStorage.getItem('adat_printer_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      setDeviceType(parsed.deviceType || 'Bluetooth');
      setPaperWidth(parsed.paperWidth || '80mm');
      setAutoPrintPurchase(parsed.autoPrintPurchase ?? true);
      setAutoPrintSale(parsed.autoPrintSale ?? true);
      setAutoDownloadPDF(parsed.autoDownloadPDF ?? false);
      setAutoShareWhatsApp(parsed.autoShareWhatsApp ?? false);
      setAskBeforePrint(parsed.askBeforePrint ?? true);
    }
  }, []);

  const handleUploadLogo = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', 'Logo');

    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });
    
    if (!response.ok) throw new Error('Upload failed');
    const data = await response.json();
    
    setLogoDocs([{ documentType: 'Logo', url: data.data.url }]);
  };

  const handleDeleteLogo = async () => {
    setLogoDocs([]);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save Printer Settings
    const config = {
      deviceType,
      paperWidth,
      autoPrintPurchase,
      autoPrintSale,
      autoDownloadPDF,
      autoShareWhatsApp,
      askBeforePrint
    };
    localStorage.setItem('adat_printer_settings', JSON.stringify(config));

    // Save Business Settings
    try {
      const logoUrl = logoDocs.length > 0 ? logoDocs[0].url : '';
      const response = await fetch(`${API_BASE}/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tenantId: vendor?.tenantId,
          ownerName: vendor?.ownerName, // preserve
          logo: logoUrl,
          address,
          gstNumber
        })
      });

      const data = await response.json();
      if (data.success) {
        dispatch(updateVendorProfile({
          logo: logoUrl,
          address,
          gstNumber
        }));
        setMessage('Settings saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        alert(data.message || 'Failed to save business settings');
      }
    } catch (error) {
      alert('Network error. Failed to save.');
    }
  };

  const handleTestPrint = () => {
    alert(`[Simulating ${paperWidth} ESC/POS Thermal Print via ${deviceType}]\n--------------------------------\n        ${vendor?.businessName?.toUpperCase()}\n        TEST PRINT READY\n--------------------------------`);
  };

  return (
    <div className="px-4 py-6 max-w-md mx-auto min-h-screen bg-gray-50 pb-20 text-left">
      <div className="flex items-center space-x-2 mb-6">
        <button onClick={() => window.history.back()} className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Settings className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold text-gray-950 font-sans">Business & Settings</h1>
      </div>

      {message && (
        <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-3 rounded flex items-center text-xs text-green-700">
          <CheckCircle className="h-4 w-4 mr-2" /> {message}
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
        
        {/* Business Settings */}
        <div className="bg-white rounded-2xl p-4 border shadow-sm space-y-4">
          <h3 className="font-bold text-primary uppercase flex items-center"><Store className="w-4 h-4 mr-2"/> Business Profile</h3>
          
          <DocumentUploader
            title="Business Logo"
            documents={logoDocs}
            onUpload={handleUploadLogo}
            onDelete={handleDeleteLogo}
            allowMultiple={false}
          />

          <div>
            <label className="block text-gray-500 font-semibold mb-1 flex items-center"><Building2 className="w-3 h-3 mr-1"/> Business Address</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Shop No 1, Main Market..."
              className="w-full border rounded-xl p-3 bg-white text-sm focus:ring-1 focus:ring-primary"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-gray-500 font-semibold mb-1 flex items-center"><Receipt className="w-3 h-3 mr-1"/> GST Number (Optional)</label>
            <input
              type="text"
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value)}
              placeholder="Enter GSTIN"
              className="w-full border rounded-xl p-3 bg-white text-sm focus:ring-1 focus:ring-primary uppercase"
            />
          </div>
        </div>

        {/* Device Selection */}
        <div className="bg-white rounded-2xl p-4 border shadow-sm space-y-3">
          <h3 className="font-bold text-primary uppercase">Printer Interface</h3>
          <div>
            <label className="block text-gray-500 font-semibold mb-1">Select Interface</label>
            <select
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value)}
              className="w-full border rounded-xl p-3 bg-white text-sm"
            >
              <option value="Bluetooth">Bluetooth Thermal Printer</option>
              <option value="USB">USB Desktop Printer</option>
              <option value="Wi-Fi">Wi-Fi Network Printer</option>
              <option value="Standard">Standard A4 Laser Printer</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-500 font-semibold mb-1">Paper Width</label>
            <select
              value={paperWidth}
              onChange={(e) => setPaperWidth(e.target.value)}
              className="w-full border rounded-xl p-3 bg-white text-sm"
            >
              <option value="80mm">80 mm Receipt Paper</option>
              <option value="58mm">58 mm Receipt Paper</option>
              <option value="A4">A4 Standard Sheet</option>
            </select>
          </div>
        </div>

        {/* Automations */}
        <div className="bg-white rounded-2xl p-4 border shadow-sm space-y-3">
          <h3 className="font-bold text-primary uppercase">Automations</h3>
          <div className="space-y-2.5">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" checked={autoPrintPurchase} onChange={(e) => setAutoPrintPurchase(e.target.checked)} className="rounded text-primary focus:ring-primary w-4 h-4" />
              <span className="font-semibold text-gray-700">Auto Print Purchase Bill</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" checked={autoPrintSale} onChange={(e) => setAutoPrintSale(e.target.checked)} className="rounded text-primary focus:ring-primary w-4 h-4" />
              <span className="font-semibold text-gray-700">Auto Print Sales Bill</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" checked={autoDownloadPDF} onChange={(e) => setAutoDownloadPDF(e.target.checked)} className="rounded text-primary focus:ring-primary w-4 h-4" />
              <span className="font-semibold text-gray-700">Auto Download PDF</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" checked={autoShareWhatsApp} onChange={(e) => setAutoShareWhatsApp(e.target.checked)} className="rounded text-primary focus:ring-primary w-4 h-4" />
              <span className="font-semibold text-gray-700">Auto Share WhatsApp Receipt</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" checked={askBeforePrint} onChange={(e) => setAskBeforePrint(e.target.checked)} className="rounded text-primary focus:ring-primary w-4 h-4" />
              <span className="font-semibold text-gray-700">Ask Before Printing</span>
            </label>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            type="button"
            onClick={handleTestPrint}
            className="flex-1 bg-white border border-primary text-primary font-bold py-3 rounded-xl shadow hover:bg-green-50"
          >
            Test Print Slip
          </button>
          <button
            type="submit"
            className="flex-1 bg-primary hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow flex items-center justify-center"
          >
            <Save className="mr-2 h-4 w-4" /> Save Settings
          </button>
        </div>
      </form>
    </div>
  );
};

export default BusinessSettings;
