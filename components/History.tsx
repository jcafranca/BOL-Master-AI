
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

  // Fix: Access .name property for shipper and consignee when filtering
  const filteredItems = items.filter(item => 
    item.blNumber.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.shipper.value.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.consignee.value.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Processing History</h1>
          <p className="text-slate-500">Track and manage your scanned BOL vault.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by BL#, Company..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="bg-white border border-slate-200 p-2.5 rounded-xl text-slate-600 hover:bg-slate-50 transition-all">
            <Filter size={20} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div 
            key={item.id}
            className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden"
          >
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-50 text-blue-600 text-[10px] font-bold uppercase px-2 py-0.5 rounded tracking-widest">
                      {item.type}
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded tracking-widest ${
                      item.status === 'verified' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {item.blNumber.value || 'NO_BL_DETECTED'}
                  </h3>
                </div>
                <button className="text-slate-300 hover:text-slate-600 p-1">
                  <MoreVertical size={20} />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2"></div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Shipper</p>
                    {/* Fix: Access .name property of the Party object */}
                    <p className="text-sm font-semibold text-slate-700 truncate">{item.shipper.value.name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2"></div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Consignee</p>
                    {/* Fix: Access .name property of the Party object */}
                    <p className="text-sm font-semibold text-slate-700 truncate">{item.consignee.value.name}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <p className="text-xs text-slate-400 font-medium">{new Date(item.timestamp).toLocaleDateString()}</p>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => onSelectItem(item)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    title="View Details"
                  >
                    <ExternalLink size={18} />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all" title="Download Export">
                    <Download size={18} />
                  </button>
                  <button 
                    onClick={() => onDeleteItem(item.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    title="Delete Record"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div className="col-span-full py-24 flex flex-col items-center justify-center text-slate-400">
            <Search size={64} className="mb-4 opacity-10" />
            <p className="text-lg font-medium">No documents matching your search</p>
            <p className="text-sm">Try using different keywords or scan a new BOL.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
