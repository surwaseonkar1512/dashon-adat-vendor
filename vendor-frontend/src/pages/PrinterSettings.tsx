import React, { useState, useEffect } from 'react';
import { ArrowLeft, Settings, Save, CheckCircle } from 'lucide-react';

const PrinterSettings = () => {
  const [deviceType, setDeviceType] = useState('Bluetooth');
  const [paperWidth, setPaperWidth] = useState('80mm');
  
  // Auto Print Checkboxes
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

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
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
    setMessage('Printer settings saved successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleTestPrint = () => {
    alert(`[Simulating ${paperWidth} ESC/POS Thermal Print via ${deviceType}]\n--------------------------------\n        ADAT ERP SYSTEM\n        TEST PRINT READY\n--------------------------------`);
  };

  return (
    <div className="px-4 py-6 max-w-md mx-auto min-h-screen bg-gray-50 pb-20 text-left">
      <div className="flex items-center space-x-2 mb-6">
        <button onClick={() => window.history.back()} className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Settings className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold text-gray-950 font-sans">Printer Settings</h1>
      </div>

      {message && (
        <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-3 rounded flex items-center text-xs text-green-700">
          <CheckCircle className="h-4 w-4 mr-2" /> {message}
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
        
        {/* Device Selection */}
        <div className="bg-white rounded-2xl p-4 border shadow-sm space-y-3">
          <h3 className="font-bold text-primary uppercase">Printer Interface</h3>
          <div>
            <label className="block text-gray-400 font-semibold mb-1">Select Interface</label>
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
            <label className="block text-gray-400 font-semibold mb-1">Paper Width</label>
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
            <label className="flex items-center space-x-2">
              <input type="checkbox" checked={autoPrintPurchase} onChange={(e) => setAutoPrintPurchase(e.target.checked)} className="rounded text-primary" />
              <span className="font-semibold text-gray-700">Auto Print Purchase Bill</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" checked={autoPrintSale} onChange={(e) => setAutoPrintSale(e.target.checked)} className="rounded text-primary" />
              <span className="font-semibold text-gray-700">Auto Print Sales Bill</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" checked={autoDownloadPDF} onChange={(e) => setAutoDownloadPDF(e.target.checked)} className="rounded text-primary" />
              <span className="font-semibold text-gray-700">Auto Download PDF</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" checked={autoShareWhatsApp} onChange={(e) => setAutoShareWhatsApp(e.target.checked)} className="rounded text-primary" />
              <span className="font-semibold text-gray-700">Auto Share WhatsApp Receipt</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" checked={askBeforePrint} onChange={(e) => setAskBeforePrint(e.target.checked)} className="rounded text-primary" />
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

export default PrinterSettings;
