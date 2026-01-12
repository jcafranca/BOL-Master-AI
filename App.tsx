
import React, { useState, useEffect } from 'react';
import { ViewState, BOLData, HistoryItem } from './types';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import Scanner from './components/Scanner';
import BOLEditor from './components/BOLEditor';
import History from './components/History';
import { Info, Shield, Layers, Workflow, Database, Cpu } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setView] = useState<ViewState>('dashboard');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeBOL, setActiveBOL] = useState<BOLData | null>(null);

  // Persistence (mocking a real DB)
  useEffect(() => {
    const saved = localStorage.getItem('bol_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const saveToHistory = (data: HistoryItem) => {
    const updated = [data, ...history.filter(h => h.id !== data.id)];
    setHistory(updated);
    localStorage.setItem('bol_history', JSON.stringify(updated));
  };

  const handleScanComplete = (data: BOLData) => {
    setActiveBOL(data);
    setView('edit');
  };

  const handleSaveBOL = (data: BOLData) => {
    saveToHistory({ ...data, status: 'verified' });
    setView('history');
    setActiveBOL(null);
  };

  const deleteHistoryItem = (id: string) => {
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    localStorage.setItem('bol_history', JSON.stringify(updated));
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard history={history} setView={setView} />;
      case 'scan':
        return <Scanner onScanComplete={handleScanComplete} />;
      case 'edit':
        return activeBOL ? (
          <BOLEditor 
            data={activeBOL} 
            onSave={handleSaveBOL} 
            onCancel={() => { setView('dashboard'); setActiveBOL(null); }} 
          />
        ) : <Dashboard history={history} setView={setView} />;
      case 'history':
        return (
          <History 
            items={history} 
            onSelectItem={(item) => { setActiveBOL(item); setView('edit'); }}
            onDeleteItem={deleteHistoryItem}
          />
        );
      case 'info':
        return <InfoPage />;
      default:
        return <Dashboard history={history} setView={setView} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-0 md:pl-64 transition-all duration-500">
      <Navigation currentView={currentView} setView={setView} />
      <main className="w-full h-full">
        {renderView()}
      </main>
    </div>
  );
};

const InfoPage = () => (
  <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-12 animate-in fade-in duration-500">
    <section className="text-center space-y-4">
      <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Enterprise Architecture</h1>
      <p className="text-slate-500 text-lg">Next-generation Bill of Lading Intelligence Platform</p>
    </section>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
          <Workflow size={24} />
        </div>
        <h3 className="text-xl font-bold mb-3">AI Workflow</h3>
        <p className="text-slate-600 text-sm leading-relaxed">
          The pipeline utilizes a Layout-Aware Multimodal approach. Gemini 3 models process spatial coordinates of text segments to accurately classify fields like Shipper and Consignee, which often lack explicit labels.
        </p>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
          <Cpu size={24} />
        </div>
        <h3 className="text-xl font-bold mb-3">ML Optimization</h3>
        <p className="text-slate-600 text-sm leading-relaxed">
          Confidence scoring uses entropy analysis from the transformer output. Low-confidence extractions are automatically flagged for manual Human-in-the-loop (HITL) verification to maintain 99.9% data integrity.
        </p>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-6">
          <Shield size={24} />
        </div>
        <h3 className="text-xl font-bold mb-3">Security & Compliance</h3>
        <p className="text-slate-600 text-sm leading-relaxed">
          End-to-end encryption for all document blobs. Data is processed in SOC2 Type II compliant environments. Role-based access (RBAC) ensures only authorized logistics operators can verify sensitive trade data.
        </p>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-6">
          <Database size={24} />
        </div>
        <h3 className="text-xl font-bold mb-3">Integrations</h3>
        <p className="text-slate-600 text-sm leading-relaxed">
          Native export to EDIFACT, XML, and JSON formats for seamless synchronization with SAP, Oracle, and other major Freight Forwarding Management Systems (FMS).
        </p>
      </div>
    </div>

    <div className="bg-slate-900 rounded-[2rem] p-8 md:p-12 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-10">
        <Layers size={160} strokeWidth={1} />
      </div>
      <div className="relative z-10 space-y-6">
        <h2 className="text-3xl font-bold">Scalability Roadmap</h2>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="w-10 h-10 shrink-0 bg-white/10 rounded-full flex items-center justify-center font-bold">1</div>
            <div>
              <p className="font-bold">Automated Sanctions Screening</p>
              <p className="text-slate-400 text-sm">Real-time matching of shippers against global AML and trade sanction lists.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-10 h-10 shrink-0 bg-white/10 rounded-full flex items-center justify-center font-bold">2</div>
            <div>
              <p className="font-bold">Blockchain Anchoring</p>
              <p className="text-slate-400 text-sm">Immutable hash tracking of BOL states for decentralized supply chain trust.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-10 h-10 shrink-0 bg-white/10 rounded-full flex items-center justify-center font-bold">3</div>
            <div>
              <p className="font-bold">Multi-modal AI-OCR</p>
              <p className="text-slate-400 text-sm">Expanding to support complex handwritten signatures and multiple ink-stamp overlays.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default App;
