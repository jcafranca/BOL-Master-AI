
import React, { useState } from 'react';
import { Search, Filter, MoreVertical, ExternalLink, Trash2, Download } from 'lucide-react';
import { HistoryItem } from '../types';

interface HistoryProps {
  items: HistoryItem[];
  onSelectItem: (item: HistoryItem) => void;
  onDeleteItem: (id: string) => void;
}

const History: React.FC<HistoryProps> = ({ items, onSelectItem, onDeleteItem }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = items.filter(item => 
    item.blNumber.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.shipper.value.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.consignee.value.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Processing Vault</h1>
          <p className="text-slate-500">History of all verified logistics documents.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search documents..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="bg-white border border-slate-200 p-2.5 rounded-xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <Filter size={20} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div 
            key={item.id}
            className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden"
          >
            <div className="p-7 space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex flex-wrap gap-2">
                  <span className="bg-blue-50 text-blue-600 text-[10px] font-bold uppercase px-3 py-1 rounded-full tracking-wider">
                    BILL OF LADING
                  </span>
                  <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full tracking-wider ${
                    item.status === 'verified' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <button className="text-slate-300 hover:text-slate-600">
                  <MoreVertical size={20} />
                </button>
              </div>

              <h3 className="text-2xl font-bold text-blue-600 tracking-tight">
                {item.blNumber.value || '21099992723'}
              </h3>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-2 h-2 rounded-full bg-slate-200 mt-2 shrink-0"></div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Shipper</p>
                    <p className="text-sm font-bold text-slate-700 leading-tight">{item.shipper.value.name || 'Example Pick Up Company'}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 shrink-0"></div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Consignee</p>
                    <p className="text-sm font-bold text-slate-700 leading-tight">{item.consignee.value.name || 'Example Delivery Company'}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                <p className="text-xs text-slate-400 font-semibold">{new Date(item.timestamp).toLocaleDateString()}</p>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => onSelectItem(item)}
                    className="p-2.5 text-slate-400 hover:text-blue-600 bg-slate-50/50 rounded-xl transition-all"
                  >
                    <ExternalLink size={20} />
                  </button>
                  <button className="p-2.5 text-slate-400 hover:text-slate-600 bg-slate-50/50 rounded-xl transition-all">
                    <Download size={20} />
                  </button>
                  <button 
                    onClick={() => onDeleteItem(item.id)}
                    className="p-2.5 text-slate-400 hover:text-red-600 bg-slate-50/50 rounded-xl transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default History;
