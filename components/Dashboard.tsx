
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts';
import { FileText, Clock, CheckCircle, AlertTriangle, TrendingUp, ArrowRight, ChevronRight, Inbox } from 'lucide-react';
import { HistoryItem, ViewState, BOLType } from '../types';

interface DashboardProps {
  history: HistoryItem[];
  setView: (view: ViewState) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ history, setView }) => {
  // --- Dynamic Data Processing ---

  // 1. Processing Volume (last 7 days)
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dateStr: d.toDateString(),
      count: 0
    };
  });

  history.forEach(item => {
    const itemDate = new Date(item.timestamp).toDateString();
    const dayObj = last7Days.find(d => d.dateStr === itemDate);
    if (dayObj) {
      dayObj.count++;
    }
  });

  const chartData = last7Days.map(d => ({ name: d.label, count: d.count }));

  // 2. BOL Type Split
  const typeCounts = {
    [BOLType.OCEAN]: 0,
    [BOLType.AIR]: 0,
    [BOLType.INLAND]: 0,
    [BOLType.UNKNOWN]: 0,
  };

  history.forEach(item => {
    if (typeCounts[item.type] !== undefined) {
      typeCounts[item.type]++;
    } else {
      typeCounts[BOLType.UNKNOWN]++;
    }
  });

  const totalCount = history.length || 1;
  const typeData = [
    { name: 'Ocean', value: typeCounts[BOLType.OCEAN], color: '#2563eb' },
    { name: 'Air', value: typeCounts[BOLType.AIR], color: '#0ea5e9' },
    { name: 'Inland', value: typeCounts[BOLType.INLAND], color: '#6366f1' },
    { name: 'Unknown', value: typeCounts[BOLType.UNKNOWN], color: '#94a3b8' },
  ].filter(t => t.value > 0);

  // If no data exists for the pie chart, show a placeholder
  const displayTypeData = typeData.length > 0 ? typeData : [{ name: 'No Data', value: 1, color: '#f1f5f9' }];

  // 3. Stats Calculation
  const verifiedCount = history.filter(h => h.status === 'verified').length;
  const draftCount = history.filter(h => h.status === 'draft').length;
  
  // Dynamic accuracy placeholder (in a real app, this would be an average of confidence scores)
  const avgAccuracy = history.length > 0 
    ? (history.reduce((acc, curr) => acc + (curr.blNumber.confidence + curr.shipper.confidence) / 2, 0) / history.length * 100).toFixed(1) + '%'
    : '0%';

  const stats = [
    { label: 'Total Scans', value: history.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Avg. Confidence', value: avgAccuracy, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Pending Review', value: draftCount, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Verified', value: verifiedCount, icon: CheckCircle, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Logistics Dashboard</h1>
          <p className="text-slate-500 font-medium">Real-time intelligence from your freight pipeline.</p>
        </div>
        <button 
          onClick={() => setView('scan')}
          className="bg-blue-600 text-white px-8 py-3.5 rounded-[1.25rem] font-bold flex items-center justify-center gap-3 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-blue-100"
        >
          <FileText size={20} />
          New BOL Scan
        </button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-4 group hover:shadow-md transition-all">
              <div className={`${stat.bg} ${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] mb-1">{stat.label}</p>
                <p className="text-2xl md:text-3xl font-black text-slate-900">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div>
              <h2 className="font-black text-xl text-slate-800 tracking-tight">Processing Volume</h2>
              <p className="text-xs text-slate-400 font-medium">Throughput for the last 7 cycles</p>
            </div>
          </div>
          <div className="h-[300px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} 
                />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px'}}
                  labelStyle={{fontWeight: 800, color: '#1e293b', marginBottom: '4px'}}
                />
                <Bar 
                  dataKey="count" 
                  fill="#3b82f6" 
                  radius={[8, 8, 8, 8]} 
                  barSize={45}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.count > 0 ? '#3b82f6' : '#f1f5f9'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
          <div className="mb-6">
            <h2 className="font-black text-xl text-slate-800 tracking-tight">BOL Type Split</h2>
            <p className="text-xs text-slate-400 font-medium">Categorical distribution</p>
          </div>
          <div className="h-[220px] w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {displayTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-6">
            {displayTypeData.map((t, i) => (
              <div key={i} className="flex flex-col p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full" style={{backgroundColor: t.color}}></div>
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{t.name}</span>
                </div>
                <span className="text-lg font-black text-slate-800">
                  {typeData.length > 0 ? t.value : '0'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white">
          <div>
            <h2 className="font-black text-xl text-slate-800 tracking-tight">Recent Intelligence</h2>
            <p className="text-xs text-slate-400 font-medium">Last 5 documents extracted</p>
          </div>
          <button 
            onClick={() => setView('history')}
            className="bg-slate-50 text-slate-600 px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-100 transition-all"
          >
            View Vault <ArrowRight size={14} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
              <tr>
                <th className="px-8 py-5">BL Number</th>
                <th className="px-8 py-5">Entities (Shipper / Consignee)</th>
                <th className="px-8 py-5">Modality</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {history.slice(0, 5).map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-all cursor-pointer group" onClick={() => {}}>
                  <td className="px-8 py-6">
                    <div className="font-black text-slate-900 text-sm tracking-tight">{item.blNumber.value || 'UNTITLED'}</div>
                    <div className="text-[10px] text-slate-400 font-bold mt-1">{new Date(item.timestamp).toLocaleDateString()}</div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-sm font-bold text-slate-700 truncate max-w-[200px] mb-0.5">{item.shipper.value.name || 'Unknown Shipper'}</div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[200px] font-medium">{item.consignee.value.name || 'Unknown Consignee'}</div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600">
                      {item.type}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      item.status === 'verified' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end">
                       <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <ChevronRight size={16} />
                       </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {history.length === 0 && (
            <div className="py-24 flex flex-col items-center justify-center text-slate-300">
              <div className="bg-slate-50 p-6 rounded-full mb-4">
                 <Inbox size={48} className="opacity-20" />
              </div>
              <p className="font-bold tracking-tight">No document history detected</p>
              <button onClick={() => setView('scan')} className="text-blue-600 text-xs font-black uppercase mt-2 hover:underline">Start Scanning</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
