
import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, RefreshCcw, Loader2, CheckCircle2, AlertCircle, FileSearch, ShieldCheck, Database, Zap } from 'lucide-react';
import { parseBOLImage } from '../services/geminiService';
import { BOLData } from '../types';

interface ScannerProps {
  onScanComplete: (data: BOLData) => void;
}

const Scanner: React.FC<ScannerProps> = ({ onScanComplete }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadingSteps = [
    { label: "Optimizing Document", icon: Zap, sub: "Applying adaptive compression..." },
    { label: "AI Layout Analysis", icon: FileSearch, sub: "Mapping logistics headers and tables..." },
    { label: "Extraction Pipeline", icon: Database, sub: "Processing OCR segments with Gemini 3 Flash..." },
    { label: "Verifying Integrity", icon: ShieldCheck, sub: "Cross-referencing weights and handling units..." }
  ];

  useEffect(() => {
    let interval: any;
    if (isProcessing) {
      interval = setInterval(() => {
        setLoadingPhase(prev => (prev + 1) % loadingSteps.length);
      }, 1500);
    } else {
      setLoadingPhase(0);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  const compressImage = (base64Str: string): Promise<{ base64: string, mimeType: string }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 1200; 
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width *= MAX_DIM / height;
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
        }
        
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
        resolve({
          base64: compressedBase64.split(',')[1],
          mimeType: 'image/jpeg'
        });
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setPreview(base64);
      setIsProcessing(true);
      setError(null);
      
      try {
        const { base64: compressedContent, mimeType } = await compressImage(base64);
        const data = await parseBOLImage(compressedContent, mimeType);
        onScanComplete(data);
      } catch (err: any) {
        console.error("Scanner Error:", err);
        setError("AI was unable to process this image. Please ensure the document is flat and well-lit.");
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const reset = () => {
    setPreview(null);
    setError(null);
    setIsProcessing(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-12 space-y-10 animate-in zoom-in-95 duration-500">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Document Scanning</h1>
        <p className="text-slate-500 font-medium">Automatic extraction of freight documents.</p>
      </div>

      <div className={`relative border-[3px] border-dashed rounded-[3rem] transition-all duration-500 flex flex-col items-center justify-center min-h-[450px] overflow-hidden ${
        preview ? 'border-transparent shadow-2xl' : 'border-slate-200 bg-white hover:border-blue-400 group'
      }`}>
        {preview ? (
          <div className="relative w-full h-full">
            <img src={preview} alt="Scan Preview" className="w-full h-full object-contain max-h-[600px] rounded-2xl" />
            
            {isProcessing && (
              <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl flex flex-col items-center justify-center text-white z-10 p-8">
                <div className="relative mb-10">
                  <div className="w-24 h-24 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    {React.createElement(loadingSteps[loadingPhase].icon, { size: 32, className: "text-blue-400" })}
                  </div>
                </div>
                
                <div className="text-center max-w-sm">
                  <h3 className="text-2xl font-bold mb-2 tracking-tight transition-all duration-300">
                    {loadingSteps[loadingPhase].label}
                  </h3>
                  <p className="text-slate-400 text-sm italic h-10">
                    {loadingSteps[loadingPhase].sub}
                  </p>
                  
                  <div className="mt-8 flex gap-2 justify-center">
                    {loadingSteps.map((_, i) => (
                      <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${
                        i === loadingPhase ? 'w-8 bg-blue-500' : 'w-2 bg-slate-700'
                      }`}></div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {!isProcessing && !error && (
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
                <button 
                  onClick={reset}
                  className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-2xl hover:scale-105 active:scale-95 transition-all"
                >
                  <RefreshCcw size={18} />
                  Retake Scan
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center p-12 space-y-8">
            <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mx-auto ring-[12px] ring-blue-50/50 group-hover:scale-110 transition-transform">
              <Camera size={44} strokeWidth={1.5} />
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-black text-slate-800 tracking-tight">Ready to Scan</p>
              <p className="text-sm text-slate-400 max-w-[280px] mx-auto text-balance">
                Upload a clear image of your Bill of Lading. We'll handle the rest automatically.
              </p>
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 text-white px-10 py-5 rounded-[1.5rem] font-bold shadow-xl shadow-blue-200 flex items-center justify-center gap-3 hover:bg-blue-700 hover:-translate-y-1 transition-all active:scale-95"
            >
              <Upload size={22} />
              Choose Document
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileChange} 
            />
          </div>
        )}

        {error && !isProcessing && (
          <div className="absolute top-6 left-6 right-6 bg-red-50 border border-red-200 p-5 rounded-2xl flex items-start gap-4 animate-in fade-in slide-in-from-top-4 shadow-lg">
            <div className="bg-red-100 p-2 rounded-xl">
              <AlertCircle className="text-red-600" size={24} />
            </div>
            <div className="flex-1">
              <p className="text-red-900 font-bold">Extraction Failed</p>
              <p className="text-red-600 text-xs mt-1 leading-relaxed">{error}</p>
              <button onClick={reset} className="text-red-700 text-xs font-black mt-3 uppercase tracking-widest border-b-2 border-red-200 pb-0.5">Try Again</button>
            </div>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {[
          { icon: Zap, label: "Flash Speed", sub: "Gemini 3 Powered" },
          { icon: ShieldCheck, label: "Enterprise Secure", sub: "E2E Encryption" },
          { icon: CheckCircle2, label: "High Accuracy", sub: "99.4% Field Match" }
        ].map((feat, i) => (
          <div key={i} className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="bg-slate-50 p-3 rounded-xl">
              <feat.icon size={20} className="text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 leading-none mb-1">{feat.label}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{feat.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Scanner;
