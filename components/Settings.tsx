
import React, { useState } from 'react';
import { Shield, Cpu, Zap, Globe, Save, Key, Network, Link, Lock, Plus, Trash2, CheckCircle2, ChevronRight, AlertCircle, Info } from 'lucide-react';
import { AIConfig, AIProvider, ProviderProfile } from '../types';

interface SettingsProps {
  config: AIConfig;
  onUpdate: (config: AIConfig) => void;
}

const Settings: React.FC<SettingsProps> = ({ config, onUpdate }) => {
  const activeProfile = config.profiles.find(p => p.id === config.activeProfileId) || config.profiles[0];

  const handleSelectProfile = (id: string) => {
    onUpdate({ ...config, activeProfileId: id });
  };

  const handleAddProfile = () => {
    const newProfile: ProviderProfile = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Custom Pipeline ' + (config.profiles.length),
      provider: AIProvider.GEMINI,
      model: 'gemini-3-flash-preview',
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent',
      apiKey: ''
    };
    onUpdate({
      ...config,
      profiles: [...config.profiles, newProfile],
      activeProfileId: newProfile.id
    });
  };

  const handleDeleteProfile = (id: string) => {
    if (confirm('Are you sure you want to remove this AI configuration profile?')) {
      const updatedProfiles = config.profiles.filter(p => p.id !== id);
      let nextActiveId = config.activeProfileId;
      if (nextActiveId === id) {
        nextActiveId = updatedProfiles[0]?.id || 'default-gemini';
      }
      onUpdate({
        ...config,
        profiles: updatedProfiles,
        activeProfileId: nextActiveId
      });
    }
  };

  const handleProviderChange = (newProvider: AIProvider) => {
    let defaults = {
      model: activeProfile.model,
      endpoint: activeProfile.endpoint
    };

    if (newProvider === AIProvider.OPENAI) {
      defaults = {
        model: 'gpt-4o',
        endpoint: 'https://api.openai.com/v1/chat/completions'
      };
    } else if (newProvider === AIProvider.GEMINI) {
      defaults = {
        model: 'gemini-3-flash-preview',
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent'
      };
    } else if (newProvider === AIProvider.CUSTOM) {
      defaults = {
        model: 'custom-model-v1',
        endpoint: 'https://api.your-service.com/v1'
      };
    }

    handleProfileUpdate({
      ...activeProfile,
      provider: newProvider,
      ...defaults
    });
  };

  const handleProfileUpdate = (updated: ProviderProfile) => {
    const updatedProfiles = config.profiles.map(p => p.id === updated.id ? updated : p);
    onUpdate({ ...config, profiles: updatedProfiles });
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Cpu className="text-blue-600" size={32} />
            AI Intelligence Hub
          </h1>
          <p className="text-slate-500 font-medium">Configure dynamic extraction engines and provider profiles.</p>
        </div>
        <button 
          onClick={handleAddProfile}
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl active:scale-95"
        >
          <Plus size={20} />
          New Configuration
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar: Profile List */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Active Profiles</h3>
          <div className="space-y-3">
            {config.profiles.map((profile) => (
              <div 
                key={profile.id}
                onClick={() => handleSelectProfile(profile.id)}
                className={`p-5 rounded-[2rem] border-2 cursor-pointer transition-all relative group overflow-hidden ${
                  config.activeProfileId === profile.id 
                  ? 'border-blue-600 bg-white shadow-xl shadow-blue-100/50' 
                  : 'border-white bg-white hover:border-slate-200 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                    config.activeProfileId === profile.id ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'
                  }`}>
                    {profile.provider === AIProvider.GEMINI ? <Globe size={22} /> : profile.provider === AIProvider.OPENAI ? <Zap size={22} /> : <Network size={22} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-bold truncate text-sm ${config.activeProfileId === profile.id ? 'text-blue-900' : 'text-slate-800'}`}>
                        {profile.name}
                      </p>
                      {profile.isDefault && (
                        <span className="bg-blue-100 text-blue-700 text-[8px] font-black uppercase px-1.5 py-0.5 rounded tracking-tighter">System Default</span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                      {profile.model}
                    </p>
                  </div>
                  {config.activeProfileId === profile.id && (
                    <CheckCircle2 size={18} className="text-blue-600 shrink-0" />
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100 flex gap-4">
             <Info size={20} className="text-amber-600 shrink-0" />
             <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
               The system defaults to <strong>Gemini Flash</strong> for high-speed logistics processing. Custom profiles allow you to connect to local LLMs or specialized enterprise extraction APIs.
             </p>
          </div>
        </div>

        {/* Configuration Editor */}
        <div className="lg:col-span-8">
          <div className="bg-white border border-slate-100 rounded-[3rem] p-8 md:p-10 shadow-sm space-y-10">
             <div className="flex items-center justify-between gap-4 border-b border-slate-50 pb-8">
                <div className="flex items-center gap-4">
                   <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl">
                      <Cpu size={28} />
                   </div>
                   <div>
                      <h2 className="text-2xl font-bold text-slate-900">Profile Editor</h2>
                      <p className="text-sm text-slate-400 font-medium">Modify settings for <span className="text-slate-900 font-bold">{activeProfile.name}</span></p>
                   </div>
                </div>
                
                <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                   {Object.values(AIProvider).map(p => (
                      <button 
                        key={p}
                        onClick={() => handleProviderChange(p)}
                        disabled={activeProfile.isDefault}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          activeProfile.provider === p 
                          ? 'bg-white text-blue-600 shadow-sm' 
                          : 'text-slate-400 hover:text-slate-600'
                        } disabled:opacity-50`}
                      >
                        {p}
                      </button>
                   ))}
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Friendly Name</label>
                   <input 
                     type="text"
                     value={activeProfile.name}
                     disabled={activeProfile.isDefault}
                     onChange={(e) => handleProfileUpdate({...activeProfile, name: e.target.value})}
                     className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-50 outline-none transition-all disabled:opacity-50"
                     placeholder="e.g. Primary Pipeline"
                   />
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Model ID</label>
                   <input 
                     type="text"
                     value={activeProfile.model}
                     disabled={activeProfile.isDefault}
                     onChange={(e) => handleProfileUpdate({...activeProfile, model: e.target.value})}
                     className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-50 outline-none transition-all disabled:opacity-50"
                     placeholder="e.g. gpt-4o or gemini-3-flash-preview"
                   />
                </div>

                <div className="space-y-2 md:col-span-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Endpoint Link / URL</label>
                   <div className="relative">
                      <Link size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input 
                        type="text"
                        value={activeProfile.endpoint}
                        disabled={activeProfile.isDefault}
                        onChange={(e) => handleProfileUpdate({...activeProfile, endpoint: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-50 outline-none transition-all disabled:opacity-50"
                        placeholder="https://api..."
                      />
                   </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">API Authentication Token</label>
                   <div className="relative">
                      <Lock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input 
                        type="password"
                        value={activeProfile.apiKey || ''}
                        onChange={(e) => handleProfileUpdate({...activeProfile, apiKey: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                        placeholder="••••••••••••••••••••••••"
                      />
                   </div>
                   <p className="text-[10px] text-slate-400 mt-3 ml-1 flex items-center gap-1.5">
                     <AlertCircle size={12} />
                     {activeProfile.provider === AIProvider.GEMINI 
                       ? "Provider uses 'x-goog-api-key' custom header." 
                       : "Standard providers use 'Authorization: Bearer' header."}
                   </p>
                </div>
             </div>

             <div className="pt-10 flex flex-col md:flex-row items-center gap-4">
                <button 
                  onClick={() => {
                    onUpdate(config);
                    alert('Profile configuration synchronized.');
                  }}
                  className="w-full md:flex-1 bg-blue-600 text-white py-5 rounded-3xl font-bold flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
                >
                  <Save size={20} />
                  Save Changes
                </button>
                
                {!activeProfile.isDefault && (
                  <button 
                    onClick={() => handleDeleteProfile(activeProfile.id)}
                    className="w-full md:w-auto px-10 py-5 bg-red-50 text-red-600 rounded-3xl font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-3"
                  >
                    <Trash2 size={20} />
                    Delete Profile
                  </button>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
