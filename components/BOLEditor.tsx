
import React, { useState } from 'react';
import { Save, Download, Trash2, AlertCircle, CheckCircle2, FileJson, Table, ChevronDown, ChevronUp } from 'lucide-react';
import { BOLData, BOLField, Party } from '../types';

interface BOLEditorProps {
  data: BOLData;
  onSave: (updatedData: BOLData) => void;
  onCancel: () => void;
}

const BOLEditor: React.FC<BOLEditorProps> = ({ data, onSave, onCancel }) => {
  const [formData, setFormData] = useState<BOLData>(data);
  const [expandedParties, setExpandedParties] = useState<Record<string, boolean>>({
    shipper: true,
    consignee: true,
    billTo: true
  });

  const handleChange = (field: keyof BOLData, value: any) => {
    const current = formData[field] as BOLField<any>;
    setFormData({
      ...formData,
      [field]: { ...current, value }
    });
  };

  const handlePartyChange = (partyField: 'shipper' | 'consignee' | 'billTo', subField: keyof Party, value: string) => {
    const currentParty = formData[partyField].value;
    setFormData({
      ...formData,
      [partyField]: {
        ...formData[partyField],
        value: {
          ...currentParty,
          [subField]: value
        }
      }
    });
  };

  const toggleParty = (id: string) => {
    setExpandedParties(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getConfidenceColor = (score: number) => {
    if (score > 0.8) return 'text-green-500';
    if (score > 0.5) return 'text-amber-500';
    return 'text-red-500';
  };

  const FieldRow = ({ label, field, value, type = 'text', isArray = false }: { label: string, field: keyof BOLData, value: any, type?: string, isArray?: boolean }) => {
    const score = (formData[field] as BOLField<any>).confidence;
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</label>
          <div className="flex items-center gap-1">
            <span className={`text-[10px] font-bold ${getConfidenceColor(score)}`}>
              {Math.round(score * 100)}% Match
            </span>
          </div>
        </div>
        {isArray ? (
          <textarea 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={Array.isArray(value) ? value.join(', ') : ''}
            onChange={(e) => handleChange(field, e.target.value.split(',').map(s => s.trim()))}
            rows={2}
          />
        ) : (
          <input 
            type={type}
            className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
              score < 0.5 ? 'border-amber-200 bg-amber-50/30' : ''
            }`}
            value={value}
            onChange={(e) => handleChange(field, e.target.value)}
          />
        )}
      </div>
    );
  };

  const PartyEditor = ({ id, label, party }: { id: 'shipper' | 'consignee' | 'billTo', label: string, party: Party }) => {
    const isExpanded = expandedParties[id];
    const score = formData[id].confidence;
    return (
      <div className="col-span-1 md:col-span-2 border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        <button 
          onClick={() => toggleParty(id)}
          className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-slate-800">{label}</h3>
            <span className={`text-[10px] font-bold ${getConfidenceColor(score)}`}>
              {Math.round(score * 100)}% Confidence
            </span>
          </div>
          {isExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
        </button>
        {isExpanded && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 bg-white">
            <div className="md:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Entity Name</label>
              <input 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-900"
                value={party.name}
                onChange={(e) => handlePartyChange(id, 'name', e.target.value)}
                placeholder="Company Name"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Address 1</label>
              <input 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium"
                value={party.address1}
                onChange={(e) => handlePartyChange(id, 'address1', e.target.value)}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Address 2</label>
              <input 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium"
                value={party.address2}
                onChange={(e) => handlePartyChange(id, 'address2', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">City</label>
                <input className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium" value={party.city} onChange={(e) => handlePartyChange(id, 'city', e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">State/Prov</label>
                <input className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium" value={party.state} onChange={(e) => handlePartyChange(id, 'state', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Zip/Postal</label>
                <input className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium" value={party.zip} onChange={(e) => handlePartyChange(id, 'zip', e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Country</label>
                <input className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium" value={party.country} onChange={(e) => handlePartyChange(id, 'country', e.target.value)} />
              </div>
            </div>
            <div className="md:col-span-2 grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Contact Name</label>
                <input className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium" value={party.contact} onChange={(e) => handlePartyChange(id, 'contact', e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Phone</label>
                <input className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium" value={party.phone} onChange={(e) => handlePartyChange(id, 'phone', e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Email</label>
                <input className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium" value={party.email} onChange={(e) => handlePartyChange(id, 'email', e.target.value)} />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-8 animate-in fade-in duration-300">
      {/* Sidebar - Image Preview */}
      <div className="lg:w-1/3 space-y-6">
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xl overflow-hidden sticky top-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">Original Document</h3>
            <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded uppercase tracking-tighter">
              {formData.type} BOL
            </span>
          </div>
          {formData.rawImage ? (
            <img 
              src={formData.rawImage.startsWith('data:') ? formData.rawImage : `data:image/jpeg;base64,${formData.rawImage}`} 
              alt="Scan" 
              className="w-full h-auto rounded-xl border border-slate-100 shadow-inner max-h-[70vh] object-contain"
            />
          ) : (
            <div className="w-full aspect-[3/4] bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 text-xs italic">
              No image preview available
            </div>
          )}
          <div className="mt-6 flex flex-wrap gap-2">
            <button className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors">
              <Download size={14} /> Download
            </button>
            <button className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors">
              <FileJson size={14} /> JSON
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Form */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Extracted Data</h2>
            <p className="text-sm text-slate-500">Review and verify detected logistics fields.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={onCancel}
              className="px-5 py-2.5 text-slate-600 font-bold text-sm hover:text-slate-900"
            >
              Discard
            </button>
            <button 
              onClick={() => onSave(formData)}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
            >
              <Save size={18} />
              Verify & Save
            </button>
          </div>
        </div>

        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 max-h-[70vh] overflow-y-auto custom-scroll">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-slate-900 font-bold border-l-4 border-blue-500 pl-3 mb-6">Identification & References</h3>
          </div>
          <FieldRow label="B/L Number" field="blNumber" value={formData.blNumber.value} />
          <FieldRow label="PRO Number" field="proNumber" value={formData.proNumber.value} />
          <FieldRow label="Carrier / Line" field="carrier" value={formData.carrier.value} />
          <FieldRow label="Issue Date" field="issueDate" value={formData.issueDate.value} />
          <div className="col-span-1 md:col-span-2">
            <FieldRow label="Reference Codes (PO#, Acct#)" field="referenceCodes" value={formData.referenceCodes.value} isArray />
          </div>
          <FieldRow label="Vessel & Voyage" field="vesselVoyage" value={formData.vesselVoyage.value} />
          
          <div className="col-span-1 md:col-span-2 mt-4">
            <h3 className="text-slate-900 font-bold border-l-4 border-blue-500 pl-3 mb-4">Parties Breakdown</h3>
          </div>
          
          <PartyEditor id="shipper" label="Shipper (Origin)" party={formData.shipper.value} />
          <PartyEditor id="consignee" label="Consignee (Destination)" party={formData.consignee.value} />
          <PartyEditor id="billTo" label="Bill To (Billing)" party={formData.billTo.value} />

          <div className="col-span-1 md:col-span-2 mt-4">
            <h3 className="text-slate-900 font-bold border-l-4 border-blue-500 pl-3 mb-6">Logistics & Route</h3>
          </div>
          <FieldRow label="Port of Loading" field="portLoading" value={formData.portLoading.value} />
          <FieldRow label="Port of Discharge" field="portDischarge" value={formData.portDischarge.value} />
          <FieldRow label="Place of Receipt" field="placeReceipt" value={formData.placeReceipt.value} />
          <FieldRow label="Place of Delivery" field="placeDelivery" value={formData.placeDelivery.value} />

          <div className="col-span-1 md:col-span-2 mt-4">
            <h3 className="text-slate-900 font-bold border-l-4 border-blue-500 pl-3 mb-6">Cargo & Special Details</h3>
          </div>
          <div className="col-span-1 md:col-span-2">
            <div className="space-y-1">
               <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Special Instructions</label>
               <textarea 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none h-24"
                value={formData.specialInstructions.value}
                onChange={(e) => handleChange('specialInstructions', e.target.value)}
                placeholder="E.g. Call before delivery, handle with care, driver notes..."
              />
            </div>
          </div>
          <div className="col-span-1 md:col-span-2">
            <FieldRow label="Goods Description" field="descriptionGoods" value={formData.descriptionGoods.value} />
          </div>
          <FieldRow label="Gross Weight" field="grossWeight" value={formData.grossWeight.value} />
          <FieldRow label="Net Weight" field="netWeight" value={formData.netWeight.value} />
          <FieldRow label="Containers" field="containerNumbers" value={formData.containerNumbers.value} isArray />
          <FieldRow label="Seal Numbers" field="sealNumbers" value={formData.sealNumbers.value} isArray />
          <FieldRow label="Freight Terms" field="freightTerms" value={formData.freightTerms.value} />
          <FieldRow label="HS Code" field="hsCode" value={formData.hsCode.value} />
        </div>
      </div>
    </div>
  );
};

export default BOLEditor;
