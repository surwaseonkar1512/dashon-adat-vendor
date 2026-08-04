import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, Upload, X, Eye, Download, Trash2, FileText, CheckCircle2 } from 'lucide-react';
import { API_BASE } from '../config';

export interface DocumentMetadata {
  _id?: string;
  documentType: string;
  documentNumber?: string;
  url: string;
  remarks?: string;
  surveyNumber?: string;
  uploadDate?: string;
}

interface DocumentUploaderProps {
  title: string;
  documents: DocumentMetadata[];
  onUpload: (file: File, meta: { surveyNumber?: string; remarks?: string; documentNumber?: string }) => Promise<void>;
  onDelete: (index: number) => Promise<void>;
  allowMultiple?: boolean;
  showSurveyNumber?: boolean;
  showDocumentNumber?: boolean;
}

export const DocumentUploader = ({
  title,
  documents,
  onUpload,
  onDelete,
  allowMultiple = false,
  showSurveyNumber = false,
  showDocumentNumber = false
}: DocumentUploaderProps) => {
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [meta, setMeta] = useState({ surveyNumber: '', documentNumber: '', remarks: '' });
  const [captureMode, setCaptureMode] = useState<'' | 'environment' | 'user'>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setIsUploading(true);
    try {
      await onUpload(file, meta);
      setMeta({ surveyNumber: '', documentNumber: '', remarks: '' });
      setShowBottomSheet(false);
    } catch (error) {
      console.error('Upload failed', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerUpload = (mode: '' | 'environment') => {
    setCaptureMode(mode);
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 50);
  };

  const canUpload = allowMultiple || documents.length === 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4 animate-in fade-in">
      <div className="flex justify-between items-center border-b pb-3 mb-4">
        <h3 className="font-bold text-gray-900">{title}</h3>
        {allowMultiple && <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-bold uppercase tracking-wider">Unlimited</span>}
      </div>

      {/* Uploaded Documents List */}
      <div className="space-y-3 mb-4">
        {documents.map((doc, index) => (
          <div key={index} className="flex items-center p-3 border border-gray-100 rounded-xl bg-gray-50">
            <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center mr-3 text-primary">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="font-bold text-sm text-gray-900 truncate">
                {doc.documentType} {doc.surveyNumber ? `- Survey ${doc.surveyNumber}` : ''}
              </p>
              <div className="flex items-center text-[10px] text-green-600 font-bold mt-1">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Uploaded successfully
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <a 
                href={`${API_BASE}${doc.url}`} 
                target="_blank" 
                rel="noreferrer"
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                <Eye className="w-4 h-4" />
              </a>
              <a 
                href={`${API_BASE}${doc.url}`} 
                download
                target="_blank" 
                rel="noreferrer"
                className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg"
              >
                <Download className="w-4 h-4" />
              </a>
              <button 
                type="button"
                onClick={() => onDelete(index)}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Document Button */}
      {canUpload && (
        <button
          type="button"
          onClick={() => setShowBottomSheet(true)}
          className="w-full border-2 border-dashed border-gray-300 hover:border-primary bg-gray-50 hover:bg-green-50 text-gray-600 hover:text-primary transition-colors rounded-xl py-4 flex flex-col items-center justify-center"
        >
          <Upload className="w-6 h-6 mb-2" />
          <span className="font-bold text-sm">
            {documents.length > 0 ? '+ Add Another Document' : `+ Add ${title}`}
          </span>
        </button>
      )}

      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef}
        className="hidden" 
        accept="image/*,.pdf" 
        capture={captureMode ? captureMode : undefined}
        onChange={handleFileSelect} 
      />

      {/* Bottom Sheet for Upload Options */}
      {showBottomSheet && (
        <div className="fixed inset-0 z-[60] bg-black bg-opacity-50 flex items-end animate-in fade-in">
          <div className="bg-white w-full rounded-t-3xl p-6 pb-8 animate-in slide-in-from-bottom-5">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-900 text-lg">Upload {title}</h3>
              <button type="button" onClick={() => setShowBottomSheet(false)} className="p-2 text-gray-400 bg-gray-100 rounded-full hover:bg-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metadata Fields (Optional based on props) */}
            <div className="space-y-4 mb-6">
              {showSurveyNumber && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Survey Number</label>
                  <input 
                    type="text" 
                    value={meta.surveyNumber}
                    onChange={(e) => setMeta({...meta, surveyNumber: e.target.value})}
                    placeholder="Enter Survey No." 
                    className="w-full border rounded-xl p-3 text-sm focus:ring-1 focus:ring-primary"
                  />
                </div>
              )}
              {showDocumentNumber && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Document Number</label>
                  <input 
                    type="text" 
                    value={meta.documentNumber}
                    onChange={(e) => setMeta({...meta, documentNumber: e.target.value})}
                    placeholder={`Enter ${title} Number`} 
                    className="w-full border rounded-xl p-3 text-sm focus:ring-1 focus:ring-primary"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Remarks (Optional)</label>
                <input 
                  type="text" 
                  value={meta.remarks}
                  onChange={(e) => setMeta({...meta, remarks: e.target.value})}
                  placeholder="Any remarks..." 
                  className="w-full border rounded-xl p-3 text-sm focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-4">
              <button 
                type="button"
                onClick={() => triggerUpload('environment')}
                disabled={isUploading}
                className="bg-gray-50 border border-gray-200 hover:border-primary hover:bg-green-50 rounded-2xl p-4 flex flex-col items-center justify-center text-gray-700 hover:text-primary transition-colors disabled:opacity-50"
              >
                <Camera className="w-8 h-8 mb-2" />
                <span className="font-bold text-sm">Take Photo</span>
              </button>
              
              <button 
                type="button"
                onClick={() => triggerUpload('')}
                disabled={isUploading}
                className="bg-gray-50 border border-gray-200 hover:border-primary hover:bg-green-50 rounded-2xl p-4 flex flex-col items-center justify-center text-gray-700 hover:text-primary transition-colors disabled:opacity-50"
              >
                <ImageIcon className="w-8 h-8 mb-2" />
                <span className="font-bold text-sm">Gallery / File</span>
              </button>
            </div>
            
            {isUploading && (
              <div className="mt-6 text-center text-primary font-bold text-sm animate-pulse">
                Uploading document...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
