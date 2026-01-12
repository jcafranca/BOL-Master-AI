
import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, RefreshCcw, Loader2, CheckCircle2, AlertCircle, FileSearch, ShieldCheck, Database, Zap, Layers, Cpu, Globe, Zap as OpenAIZap, Network, ChevronDown } from 'lucide-react';
import { parseBOLImage } from '../services/aiService';
import { BOLData, AIConfig, AIProvider, ProviderProfile } from '../types';

interface ScannerProps {
  onScanComplete: (data: BOLData) => void;
  onBatchComplete?: (data: BOLData[]) => void;
  aiConfig: AIConfig;
  onConfigUpdate: (config: AIConfig) => void;
}

const Scanner: React.FC<ScannerProps> = ({ onScanComplete, onBatchComplete, aiConfig, onConfigUpdate }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [batchInfo, setBatchInfo] = useState<{ current: number, total: number } | null>(null);
  const [showModelSelector, setShowModelSelector] = useState(false);
  
  // Use a local state for the selected profile in the scanner, 
  // defaulting to the system default (Gemini) even if another is selected in settings.
  const [selectedProfileId, setSelectedProfileId] = useState<string>(() => {
    const defaultProfile = aiConfig.profiles.find(p => p.isDefault);
    return defaultProfile ? defaultProfile.id : aiConfig.activeProfileId;
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeProfile = aiConfig.profiles.find(p => p.id === selectedProfileId) || aiConfig.profiles[0];

  const loadingSteps = [
    { label: "Optimizing Document", icon: Zap, sub: "Applying adaptive compression..." },
    { label: "AI Layout Analysis", icon: FileSearch, sub: "Mapping logistics headers and tables..." },
    { label: "Extraction Pipeline", icon: Database, sub: `Processing with ${activeProfile.name}...` },
    { label: "Verifying Integrity", icon: ShieldCheck, sub: "Cross-referencing weights and units..." }
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

  const handleProfileSelect = (id: string) => {
    setSelectedProfileId(id);
    setShowModelSelector(false);
  };

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

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsProcessing(true);
    setError(null);

    // Prepare a temporary config that overrides the active profile with the locally selected one
    const scanConfig: AIConfig = {
      ...aiConfig,
      activeProfileId: selectedProfileId
    };

    if (files.length === 1) {
      try {
        const base64 = await readFileAsDataURL(files[0]);
        setPreview(base64);
        const { base64: compressedContent, mimeType } = await compressImage(base64);
        const data = await parseBOLImage(compressedContent, mimeType, scanConfig);
        onScanComplete(data);
      } catch (err: any) {
        console.error("Scanner Error:", err);
        setError(`AI (${activeProfile.provider}) failed. Check API key or endpoint.`);
        setIsProcessing(false);
      }
    } else {
      setBatchInfo({ current: 0, total: files.length });
      try {
        const results = await Promise.all(files.map(async (file, index) => {
          try {
            const base64 = await readFileAsDataURL(file);
            if (index === 0) setPreview(base64);
            const { base64: compressedContent, mimeType } = await compressImage(base64);
            const data = await parseBOLImage(compressedContent, mimeType, scanConfig);
            setBatchInfo(prev => prev ? { ...prev, current: prev.current + 1 } : null);
            return data;
          } catch (err) {
            setBatchInfo(prev => prev ? { ...prev, current: prev.current + 1 } : null);
            return null;
          }
        }));

        const validResults = results.filter((r): r is BOLData => r !== null);
        if (validResults.length > 0) {
          if (onBatchComplete) onBatchComplete(validResults);
          else onScanComplete(validResults[validResults.length - 1]);
        } else {
          setError("Failed to process batch documents.");
          setIsProcessing(false);
        }
      } catch (err) {
        setError("Batch processing encountered a fatal error.");
        setIsProcessing(false);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const reset = () => {
    setPreview(null);
    setError(null);
    setIsProcessing(false);
    setBatchInfo(null);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-12 space-y-10 animate-in zoom-in-95 duration-500">
      <div className="text-center space-y-3 relative">
        <div className="relative inline-block">
          <button 
            onClick={() => setShowModelSelector(!showModelSelector)}
            className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 mb-2 shadow-sm hover:border-blue-400 transition-all active:scale-95 group"
          >
            <Cpu size={14} className="text-blue-500" />
            <span className="text-[10px] font-black uppercase text-slate-700 tracking-widest">
              Profile: {activeProfile.name}
            </span>
            <ChevronDown size={14} className={`text-slate-300 transition-transform duration-300 ${showModelSelector ? 'rotate-180' : ''}`} />
          </button>

          {showModelSelector && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-white border border-slate-100 rounded-3xl shadow-2xl z-50 p-3 animate-in fade-in zoom-in-95 duration-200">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Override Scan Engine</p>
              <div className="space-y-1 max-h-[300px] overflow-y-auto custom-scroll">
                {aiConfig.profiles.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleProfileSelect(p.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${
                      selectedProfileId === p.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      selectedProfileId === p.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {p.provider === AIProvider.GEMINI ? <Globe size={16} /> : p.provider === AIProvider.OPENAI ? <OpenAIZap size={16} /> : <Network size={16} />}
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <p className="text-sm font-bold truncate leading-none">{p.name}</p>
                      <p className="text-[10px] opacity-60 mt-1 truncate">{p.model}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Document Scanning</h1>
        <p className="text-slate-500 font-medium">Automatic extraction of freight documents.</p>
      </div>

      <div className={`relative border-[3px] border-dashed rounded-[3rem] transition-all duration-500 flex flex-col items-center justify-center min-h-[450px] overflow-hidden ${
        preview ? 'border-transparent shadow-2xl' : 'border-slate-200 bg-white hover:border-blue-400'
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
                  {batchInfo && (
                    <div className="mb-4 bg-blue-600/20 px-4 py-1.5 rounded-full inline-flex items-center gap-2 border border-blue-500/30">
                      <span className="text-xs font-bold uppercase tracking-widest text-blue-100">
                        {batchInfo.current + 1} / {batchInfo.total} Processing
                      </span>
                    </div>
                  )}
                  <h3 className="text-2xl font-bold mb-2 tracking-tight">{loadingSteps[loadingPhase].label}</h3>
                  <p className="text-slate-400 text-sm italic">{loadingSteps[loadingPhase].sub}</p>

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
                <button onClick={reset} className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-2xl hover:scale-105 active:scale-95 transition-all">
                  <RefreshCcw size={18} /> Retake Scan
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center p-12 space-y-8 flex flex-col items-center">
            <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mx-auto ring-[12px] ring-blue-50/50 group-hover:scale-110 transition-transform">
              <Camera size={44} strokeWidth={1.5} />
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-black text-slate-800 tracking-tight">Ready to Scan</p>
              <p className="text-sm text-slate-400 max-w-[280px] mx-auto font-medium">
                Using <strong className="text-slate-700">{activeProfile.name}</strong> for this session.
              </p>
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 text-white px-10 py-5 rounded-[1.5rem] font-bold shadow-xl shadow-blue-200 flex items-center justify-center gap-3 hover:bg-blue-700 hover:-translate-y-1 transition-all"
            >
              <Upload size={22} />
              Select Documents
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileChange} />
          </div>
        )}

        {error && !isProcessing && (
          <div className="absolute top-6 left-6 right-6 bg-red-50 border border-red-200 p-5 rounded-2xl flex items-start gap-4 shadow-lg z-20">
            <AlertCircle className="text-red-600 shrink-0" size={24} />
            <div>
              <p className="text-red-900 font-bold">Extraction Failed</p>
              <p className="text-red-600 text-xs mt-1 leading-relaxed">{error}</p>
              <button onClick={reset} className="text-red-700 text-xs font-black mt-3 uppercase tracking-widest border-b-2 border-red-200">Try Again</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Scanner;
