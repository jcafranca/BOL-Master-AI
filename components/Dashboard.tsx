
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts';
// Added ChevronRight to the imports from lucide-react to fix missing reference error
import { FileText, Clock, CheckCircle, AlertTriangle, TrendingUp, ArrowRight, ChevronRight } from 'lucide-react';
import { HistoryItem, ViewState } from '../types';

interface DashboardProps {
  history: HistoryItem[];
  setView: (view: ViewState) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ history, setView }) => {
  const stats = [
    { label: 'Total Scans', value: history.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Avg. Accuracy', value: '94.2%', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Pending Review', value: history.filter(h => h.status === 'draft').length, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Verified', value: history.filter(h => h.status === 'verified').length, icon: CheckCircle, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  const chartData = [
    { name: 'Mon', count: 12 },
    { name: 'Tue', count: 18 },
    { name: 'Wed', count: 15 },
    { name: 'Thu', count: 22 },
    { name: 'Fri', count: 30 },
    { name: 'Sat', count: 8 },
    { name: 'Sun', count: 5 },
  ];

  const typeData = [
    { name: 'Ocean', value: 45, color: '#2563eb' },
    { name: 'Air', value: 25, color: '#0ea5e9' },
    { name: 'Inland', value: 30, color: '#6366f1' },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Logistics Dashboard</h1>
          <p className="text-slate-500">Welcome back, Intelligence Operator</p>
        </div>
        <button 
          onClick={() => setView('scan')}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
        >
          <FileText size={20} />
          New BOL Scan
        </button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3">
              <div className={`${stat.bg} ${stat.color} w-10 h-10 rounded-lg flex items-center justify-center`}>
                <Icon size={20} />
              </div>
              <div>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">{stat.label}</p>
                <p className="text-xl md:text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-lg text-slate-800">Processing Volume</h2>
            <select className="text-sm border-none bg-slate-50 rounded-lg px-2 py-1 outline-none font-medium">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h2 className="font-bold text-lg text-slate-800 mb-6">BOL Type Split</h2>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
            {typeData.map((t, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: t.color}}></div>
                  <span className="text-slate-600 font-medium">{t.name}</span>
                </div>
                <span className="text-slate-400">{t.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <h2 className="font-bold text-lg text-slate-800">Recent Documents</h2>
          <button 
            onClick={() => setView('history')}
            className="text-blue-600 text-sm font-semibold flex items-center gap-1 hover:underline"
          >
            View All <ArrowRight size={14} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">BL Number</th>
                <th className="px-6 py-4">Shipper / Consignee</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {history.slice(0, 5).map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{item.blNumber.value || 'N/A'}</div>
                    <div className="text-xs text-slate-400">{new Date(item.timestamp).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    {/* Fix: Access the .name property of the Party objects instead of rendering the whole object */}
                    <div className="text-sm font-medium text-slate-700 truncate max-w-[200px]">{item.shipper.value.name}</div>
                    <div className="text-xs text-slate-400 truncate max-w-[200px]">{item.consignee.value.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {item.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                      item.status === 'verified' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-slate-400 group-hover:text-blue-600 transition-colors">
                      <ChevronRight size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {history.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 italic">
              <FileText size={48} className="mb-2 opacity-20" />
              <p>No documents processed yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
