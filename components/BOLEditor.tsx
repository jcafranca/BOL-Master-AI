
import React, { useState } from 'react';
import { Save, Download, Trash2, AlertCircle, CheckCircle2, FileJson, Table, ChevronDown, ChevronUp, Plus, Trash, Hash, Phone, Mail, User, Layers } from 'lucide-react';
import { BOLData, BOLField, Party, LineItem } from '../types';

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
    billTo: false
  });

  const handleChange = (field: keyof BOLData, value: any) => {
    const current = formData[field] as BOLField<any>;
    setFormData({
      ...formData,
      [field]: { ...current, value }
    });
  };

  const handleDownload = (format: 'json' | 'txt') => {
    const exportData = { ...formData };
    delete exportData.rawImage;
    
    let content = "";
    let fileName = `BOL_${formData.blNumber.value || 'EXPORT'}`;
    let mimeType = "";

    if (format === 'json') {
      content = JSON.stringify(exportData, null, 2);
      fileName += ".json";
      mimeType = "application/json";
    } else {
      content = `BILL OF LADING REPORT\n`;
      content += `======================\n`;
      content += `B/L Number: ${formData.blNumber.value}\n`;
      content += `Carrier: ${formData.carrier.value}\n`;
      content += `Shipper: ${formData.shipper.value.name}\n`;
      content += `Consignee: ${formData.consignee.value.name}\n`;
      content += `Reference Codes: ${formData.referenceCodes.value.join(', ')}\n\n`;
      content += `Items:\n`;
      formData.lineItems.value.forEach((item, i) => {
        content += ` - Line ${i+1}: ${item.qty} ${item.package_type} - ${item.description} (Weight: ${item.weight_lbs} lbs, NMFC: ${item.nmfc_code}-${item.nmfc_sub}, Class: ${item.freight_class})\n`;
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

  const handleLineItemChange = (index: number, field: keyof LineItem, value: any) => {
    const newLineItems = [...formData.lineItems.value];
    newLineItems[index] = { ...newLineItems[index], [field]: value };
    setFormData({
      ...formData,
      lineItems: { ...formData.lineItems, value: newLineItems }
    });
  };

  const addLineItem = () => {
    const newItem: LineItem = {
      qty: 1, pieces: 1, package_type: '', handling_unit_type: '', weight_lbs: 0,
      hazmat: false, non_stackable: false, dimensions_in: '', description: '',
      nmfc_code: '', nmfc_sub: '', freight_class: '', line_total_weight_lbs: 0
    };
    setFormData({
      ...formData,
      lineItems: { ...formData.lineItems, value: [...formData.lineItems.value, newItem] }
    });
  };

  const removeLineItem = (index: number) => {
    const newLineItems = formData.lineItems.value.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      lineItems: { ...formData.lineItems, value: newLineItems }
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
    const fieldData = formData[field] as BOLField<any>;
    const score = fieldData?.confidence || 0.8;
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</label>
          <div className="flex items-center gap-1">
            <span className={`text-[9px] font-bold ${getConfidenceColor(score)}`}>
              {Math.round(score * 100)}%
            </span>
          </div>
        </div>
        {isArray ? (
          <textarea 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={Array.isArray(value) ? value.join(', ') : ''}
            onChange={(e) => handleChange(field, e.target.value.split(',').map(s => s.trim()))}
            rows={1}
            placeholder="Separate with commas..."
          />
        ) : (
          <input 
            type={type}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={value || ''}
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
              {Math.round(score * 100)}% Match
            </span>
          </div>
          {isExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
        </button>
        {isExpanded && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 bg-white">
            <div className="md:col-span-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Entity Name</label>
              <input 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-900"
                value={party.name}
                onChange={(e) => handlePartyChange(id, 'name', e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Address</label>
              <input 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium"
                value={party.address1}
                onChange={(e) => handlePartyChange(id, 'address1', e.target.value)}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Zip / Postal</label>
              <input 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium"
                value={party.zip}
                onChange={(e) => handlePartyChange(id, 'zip', e.target.value)}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">City</label>
              <input className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium" value={party.city} onChange={(e) => handlePartyChange(id, 'city', e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">State / Prov</label>
              <input className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium" value={party.state} onChange={(e) => handlePartyChange(id, 'state', e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Country</label>
              <input className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium" value={party.country} onChange={(e) => handlePartyChange(id, 'country', e.target.value)} />
            </div>
            
            <div className="md:col-span-3 border-t border-slate-50 pt-4 mt-2">
              <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-3">Contact Details</h4>
            </div>
            
            <div className="relative">
              <User size={12} className="absolute left-2.5 top-[2.2rem] text-slate-400" />
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Contact Person</label>
              <input className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-sm font-medium" value={party.contact} placeholder="Name" onChange={(e) => handlePartyChange(id, 'contact', e.target.value)} />
            </div>
            <div className="relative">
              <Phone size={12} className="absolute left-2.5 top-[2.2rem] text-slate-400" />
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Phone Number</label>
              <input className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-sm font-medium" value={party.phone} placeholder="+1..." onChange={(e) => handlePartyChange(id, 'phone', e.target.value)} />
            </div>
            <div className="relative">
              <Mail size={12} className="absolute left-2.5 top-[2.2rem] text-slate-400" />
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Email Address</label>
              <input className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-sm font-medium" value={party.email} placeholder="mail@example.com" onChange={(e) => handlePartyChange(id, 'email', e.target.value)} />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-8 animate-in fade-in duration-300">
      {/* Sidebar - Preview */}
      <div className="lg:w-1/3 space-y-6">
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xl sticky top-8">
          <h3 className="font-bold text-slate-800 mb-4">Verification Preview</h3>
          {formData.rawImage ? (
            <img 
              src={formData.rawImage.startsWith('data:') ? formData.rawImage : `data:image/jpeg;base64,${formData.rawImage}`} 
              alt="Scan" 
              className="w-full h-auto rounded-xl border border-slate-100 shadow-inner max-h-[60vh] object-contain"
            />
          ) : (
            <div className="w-full aspect-[3/4] bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 text-xs italic">
              Preview Unavailable
            </div>
          )}
          <div className="mt-6 flex flex-col gap-2">
            <button 
              onClick={() => handleDownload('txt')}
              className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-lg"
            >
              <Download size={16} /> Download Report (.txt)
            </button>
            <button 
              onClick={() => handleDownload('json')}
              className="w-full bg-slate-100 text-slate-700 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors"
            >
              <FileJson size={16} /> Export JSON
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Editor & Verification</h2>
            <p className="text-sm text-slate-500">Confirm all extracted fields including contacts and references.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onCancel} className="px-4 py-2 text-slate-500 font-bold text-sm">Cancel</button>
            <button 
              onClick={() => onSave(formData)}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
            >
              <Save size={18} />
              Save Record
            </button>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-10 overflow-y-auto max-h-[85vh] custom-scroll">
          {/* Section 1: IDs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-sm font-bold text-blue-600 border-b border-blue-100 pb-2 mb-4 uppercase tracking-widest flex items-center gap-2">
                <Hash size={16} /> Identifiers & References
              </h3>
            </div>
            <FieldRow label="B/L Number" field="blNumber" value={formData.blNumber.value} />
            <FieldRow label="PRO Number" field="proNumber" value={formData.proNumber.value} />
            <FieldRow label="Carrier" field="carrier" value={formData.carrier.value} />
            <FieldRow label="Issue Date" field="issueDate" value={formData.issueDate.value} />
            <div className="col-span-1 md:col-span-2">
              <FieldRow label="Reference Codes (PO#, Account#, etc)" field="referenceCodes" value={formData.referenceCodes.value} isArray />
            </div>
          </div>

          {/* Section 2: Parties */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-sm font-bold text-blue-600 border-b border-blue-100 pb-2 mb-4 uppercase tracking-widest flex items-center gap-2">
                <Plus size={16} /> Parties (Origin & Destination)
              </h3>
            </div>
            <PartyEditor id="shipper" label="Shipper" party={formData.shipper.value} />
            <PartyEditor id="consignee" label="Consignee" party={formData.consignee.value} />
            <PartyEditor id="billTo" label="Bill To" party={formData.billTo.value} />
          </div>

          {/* Section 3: Handling Units */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-blue-100 pb-2">
              <h3 className="text-sm font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                <Table size={16} /> Handling Units & Line Items
              </h3>
              <button onClick={addLineItem} className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-lg font-bold">+ Add Line</button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left text-[10px] md:text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="px-2 py-3 w-12 text-center">Qty</th>
                    <th className="px-2 py-3 w-12 text-center">Pcs</th>
                    <th className="px-2 py-3 w-24">Type</th>
                    <th className="px-2 py-3">Description</th>
                    <th className="px-2 py-3 w-20 text-center">Weight</th>
                    <th className="px-2 py-3 w-20 text-center">NMFC</th>
                    <th className="px-2 py-3 w-16 text-center">Sub</th>
                    <th className="px-2 py-3 w-16 text-center">Class</th>
                    <th className="px-2 py-3 w-12 text-center">Hzmt</th>
                    <th className="px-2 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {formData.lineItems.value.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 group">
                      <td className="px-1 py-3">
                        <input type="number" className="w-full border border-slate-200 rounded px-1.5 py-1 text-center font-bold" value={item.qty} onChange={(e) => handleLineItemChange(idx, 'qty', parseInt(e.target.value))} />
                      </td>
                      <td className="px-1 py-3">
                        <input type="number" className="w-full border border-slate-200 rounded px-1.5 py-1 text-center" value={item.pieces} onChange={(e) => handleLineItemChange(idx, 'pieces', parseInt(e.target.value))} />
                      </td>
                      <td className="px-1 py-3">
                        <input type="text" className="w-full border border-slate-200 rounded px-1.5 py-1" value={item.package_type} onChange={(e) => handleLineItemChange(idx, 'package_type', e.target.value)} />
                      </td>
                      <td className="px-1 py-3">
                        <input type="text" className="w-full border border-slate-200 rounded px-1.5 py-1" value={item.description} onChange={(e) => handleLineItemChange(idx, 'description', e.target.value)} />
                      </td>
                      <td className="px-1 py-3">
                        <input type="number" className="w-full border border-slate-200 rounded px-1.5 py-1 text-center" value={item.weight_lbs} onChange={(e) => handleLineItemChange(idx, 'weight_lbs', parseFloat(e.target.value))} />
                      </td>
                      <td className="px-1 py-3">
                        <input type="text" className="w-full border border-slate-200 rounded px-1.5 py-1 text-center font-mono" value={item.nmfc_code} onChange={(e) => handleLineItemChange(idx, 'nmfc_code', e.target.value)} />
                      </td>
                      <td className="px-1 py-3">
                        <input type="text" className="w-full border border-slate-200 rounded px-1.5 py-1 text-center" value={item.nmfc_sub} onChange={(e) => handleLineItemChange(idx, 'nmfc_sub', e.target.value)} />
                      </td>
                      <td className="px-1 py-3">
                        <input type="text" className="w-full border border-slate-200 rounded px-1.5 py-1 text-center font-bold text-blue-600" value={item.freight_class} onChange={(e) => handleLineItemChange(idx, 'freight_class', e.target.value)} />
                      </td>
                      <td className="px-1 py-3 text-center">
                        <input type="checkbox" className="w-4 h-4 rounded text-blue-600" checked={item.hazmat} onChange={(e) => handleLineItemChange(idx, 'hazmat', e.target.checked)} />
                      </td>
                      <td className="px-1 py-3">
                        <button onClick={() => removeLineItem(idx)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Logistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-sm font-bold text-blue-600 border-b border-blue-100 pb-2 mb-4 uppercase tracking-widest flex items-center gap-2">
                <AlertCircle size={16} /> Routing & Logistics
              </h3>
            </div>
            <FieldRow label="Port of Loading" field="portLoading" value={formData.portLoading.value} />
            <FieldRow label="Port of Discharge" field="portDischarge" value={formData.portDischarge.value} />
            <FieldRow label="Place of Delivery" field="placeDelivery" value={formData.placeDelivery.value} />
            <FieldRow label="Freight Terms" field="freightTerms" value={formData.freightTerms.value} />
            <div className="col-span-1 md:col-span-2">
              <FieldRow label="Special Instructions" field="specialInstructions" value={formData.specialInstructions.value} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BOLEditor;
