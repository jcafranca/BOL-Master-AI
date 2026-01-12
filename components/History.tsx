
import React, { useState } from 'react';
import { Search, Filter, MoreVertical, ExternalLink, Trash2, Download, FileJson, Inbox, XCircle, RotateCcw } from 'lucide-react';
import { HistoryItem, BOLType } from '../types';

interface HistoryProps {
  items: HistoryItem[];
  onSelectItem: (item: HistoryItem) => void;
  onDeleteItem: (id: string) => void;
}

const History: React.FC<HistoryProps> = ({ items, onSelectItem, onDeleteItem }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.blNumber.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.shipper.value.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.consignee.value.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesType = typeFilter === 'all' || item.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleDownload = (item: HistoryItem, format: 'json' | 'txt') => {
    const exportData = { ...item };
    delete exportData.rawImage;
    
    let content = "";
    let fileName = `BOL_${item.blNumber.value || 'EXPORT'}`;
    let mimeType = "";

    if (format === 'json') {
      content = JSON.stringify(exportData, null, 2);
      fileName += ".json";
      mimeType = "application/json";
    } else {
      content = `BILL OF LADING REPORT\n`;
      content += `======================\n`;
      content += `B/L Number: ${item.blNumber.value}\n`;
      content += `Carrier: ${item.carrier.value}\n`;
      content += `Shipper: ${item.shipper.value.name}\n`;
      content += `Consignee: ${item.consignee.value.name}\n`;
      content += `Reference Codes: ${item.referenceCodes.value.join(', ')}\n\n`;
      content += `Items:\n`;
      item.lineItems.value.forEach((li, i) => {
        content += ` - Line ${i+1}: ${li.qty} ${li.package_type} - ${li.description} (Weight: ${li.weight_lbs} lbs, NMFC: ${li.nmfc_code}-${li.nmfc_sub}, Class: ${li.freight_class})\n`;
      });
      fileName += ".txt";
      mimeType = "text/plain";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Processing Vault</h1>
          <p className="text-slate-500 font-medium">History of all verified logistics documents.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search B/L, Shipper..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 rounded-xl border transition-all shadow-sm flex items-center gap-2 ${
              showFilters || statusFilter !== 'all' || typeFilter !== 'all' 
              ? 'bg-blue-50 border-blue-200 text-blue-600' 
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Filter size={20} />
            <span className="text-sm font-bold hidden sm:inline">Filters</span>
          </button>
        </div>
      </header>

      {/* Filter Options Panel */}
      {showFilters && (
        <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm flex flex-wrap gap-6 animate-in slide-in-from-top-2 duration-300">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Document Status</label>
            <div className="flex gap-2">
              {['all', 'draft', 'verified', 'archived'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${
                    statusFilter === status 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">BOL Type</label>
            <div className="flex gap-2">
              {['all', BOLType.OCEAN, BOLType.AIR, BOLType.INLAND].map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    typeFilter === type 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-end ml-auto">
            <button 
              onClick={resetFilters}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1 mb-1"
            >
              <RotateCcw size={14} /> Reset
            </button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="bg-white rounded-[3rem] border border-slate-100 p-20 text-center space-y-6 shadow-sm">
          <div className="w-24 h-24 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto">
            <Inbox size={48} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Vault is Empty</h2>
            <p className="text-slate-400 text-sm max-w-xs mx-auto">No documents have been processed yet. Start by scanning a new Bill of Lading.</p>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-[3rem] border border-slate-100 p-20 text-center space-y-6 shadow-sm">
          <div className="w-24 h-24 bg-amber-50 text-amber-300 rounded-full flex items-center justify-center mx-auto">
            <XCircle size={48} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">No Match Found</h2>
            <p className="text-slate-400 text-sm max-w-xs mx-auto">We couldn't find any documents matching your current filter criteria.</p>
          </div>
          <button 
            onClick={resetFilters}
            className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg hover:scale-105 active:scale-95 transition-all"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
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
                      {item.type} BOL
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full tracking-wider ${
                      item.status === 'verified' ? 'bg-green-50 text-green-600' : 
                      item.status === 'draft' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <button className="text-slate-300 hover:text-slate-600">
                    <MoreVertical size={20} />
                  </button>
                </div>

                <h3 className="text-2xl font-bold text-blue-600 tracking-tight">
                  {item.blNumber.value || 'N/A'}
                </h3>

                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-2 h-2 rounded-full bg-slate-200 mt-2 shrink-0"></div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Shipper</p>
                      <p className="text-sm font-bold text-slate-700 leading-tight truncate max-w-[180px]">{item.shipper.value.name || 'Unknown Entity'}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 shrink-0"></div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Consignee</p>
                      <p className="text-sm font-bold text-slate-700 leading-tight truncate max-w-[180px]">{item.consignee.value.name || 'Unknown Entity'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                  <p className="text-xs text-slate-400 font-semibold">{new Date(item.timestamp).toLocaleDateString()}</p>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => onSelectItem(item)}
                      title="View Details"
                      className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50/50 rounded-lg transition-all"
                    >
                      <ExternalLink size={18} />
                    </button>
                    <button 
                      onClick={() => handleDownload(item, 'json')}
                      title="Download JSON"
                      className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-50/50 rounded-lg transition-all"
                    >
                      <FileJson size={18} />
                    </button>
                    <button 
                      onClick={() => handleDownload(item, 'txt')}
                      title="Download Text Report"
                      className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50/50 rounded-lg transition-all"
                    >
                      <Download size={18} />
                    </button>
                    <button 
                      onClick={() => onDeleteItem(item.id)}
                      title="Delete Record"
                      className="p-2 text-slate-400 hover:text-red-600 bg-slate-50/50 rounded-lg transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
