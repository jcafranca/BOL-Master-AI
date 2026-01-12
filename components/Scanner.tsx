
import React, { useRef, useState, useCallback } from 'react';
import { Camera, Upload, RefreshCcw, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { parseBOLImage } from '../services/geminiService';
import { BOLData } from '../types';

interface ScannerProps {
  onScanComplete: (data: BOLData) => void;
}

const Scanner: React.FC<ScannerProps> = ({ onScanComplete }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const base64Content = base64.split(',')[1];
      setPreview(base64);
      await processImage(base64Content, file.type);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (base64: string, mimeType: string) => {
    setIsProcessing(true);
    setError(null);
    try {
      const data = await parseBOLImage(base64, mimeType);
      onScanComplete(data);
    } catch (err: any) {
      console.error(err);
      setError("AI was unable to process this document. Please ensure it's a clear Bill of Lading image.");
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setPreview(null);
    setError(null);
    setIsProcessing(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-8 animate-in zoom-in-95 duration-300">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">AI Document Scanner</h1>
        <p className="text-slate-500">Capture or upload a Bill of Lading for autonomous parsing.</p>
      </div>

      <div className={`relative border-2 border-dashed rounded-3xl transition-all duration-300 flex flex-col items-center justify-center min-h-[400px] overflow-hidden ${
        preview ? 'border-transparent shadow-2xl' : 'border-slate-200 bg-white hover:border-blue-400'
      }`}>
        {preview ? (
          <div className="relative w-full h-full">
            <img src={preview} alt="Scan Preview" className="w-full h-full object-contain max-h-[600px] rounded-2xl" />
            
            {isProcessing && (
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center text-white z-10">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" size={24} />
                </div>
                <div className="mt-6 text-center">
                  <h3 className="text-xl font-bold mb-1">Analyzing Document</h3>
                  <p className="text-blue-200 text-sm">Identifying fields with Gemini Intelligence...</p>
                </div>
              </div>
            )}

            {!isProcessing && !error && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
                <button 
                  onClick={reset}
                  className="bg-white/90 backdrop-blur text-slate-900 px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-white transition-all"
                >
                  <RefreshCcw size={18} />
                  Retake
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center p-8 space-y-6">
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-blue-50/50">
              <Camera size={36} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-800">Scan or Upload BOL</p>
              <p className="text-sm text-slate-400 mt-1 max-w-[250px] mx-auto">
                Support for high-res photos, PDF scans, and mobile captures.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-blue-200 flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:scale-95"
              >
                <Upload size={20} />
                Select Document
              </button>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*,application/pdf"
              onChange={handleFileChange} 
            />
          </div>
        )}

        {error && !isProcessing && (
          <div className="absolute top-4 left-4 right-4 bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-red-800 font-bold text-sm">Parsing Error</p>
              <p className="text-red-600 text-xs mt-0.5">{error}</p>
              <button onClick={reset} className="text-red-700 text-xs font-bold mt-2 underline">Try Again</button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-100/50 rounded-2xl p-6 border border-slate-200">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <CheckCircle2 size={18} className="text-green-500" />
          Pro Scanning Tips
        </h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 font-medium">
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
            Ensure document is flat and well-lit
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
            Keep edges within the camera frame
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
            Avoid shadows and strong glare
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
            Handwritten notes are supported
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Scanner;
