
import { GoogleGenAI, Type } from "@google/genai";
import { BOLData, BOLType, Party, LineItem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const PARTY_PROPERTIES = {
  name: { type: Type.STRING },
  address1: { type: Type.STRING },
  address2: { type: Type.STRING },
  city: { type: Type.STRING },
  state: { type: Type.STRING },
  zip: { type: Type.STRING },
  country: { type: Type.STRING },
  email: { type: Type.STRING },
  phone: { type: Type.STRING },
  contact: { type: Type.STRING }
};

const LINE_ITEM_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    qty: { type: Type.NUMBER },
    pieces: { type: Type.NUMBER },
    package_type: { type: Type.STRING },
    handling_unit_type: { type: Type.STRING },
    weight_lbs: { type: Type.NUMBER },
    hazmat: { type: Type.BOOLEAN },
    non_stackable: { type: Type.BOOLEAN },
    dimensions_in: { type: Type.STRING },
    description: { type: Type.STRING },
    nmfc_code: { type: Type.STRING },
    nmfc_sub: { type: Type.STRING },
    freight_class: { type: Type.STRING },
    line_total_weight_lbs: { type: Type.NUMBER }
  }
};

const BOL_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, description: "One of: Ocean, Air, Inland" },
    shipper: { type: Type.OBJECT, properties: PARTY_PROPERTIES },
    consignee: { type: Type.OBJECT, properties: PARTY_PROPERTIES },
    notifyParty: { type: Type.STRING },
    billTo: { type: Type.OBJECT, properties: PARTY_PROPERTIES },
    blNumber: { type: Type.STRING },
    proNumber: { type: Type.STRING },
    referenceCodes: { type: Type.ARRAY, items: { type: Type.STRING } },
    specialInstructions: { type: Type.STRING },
    carrier: { type: Type.STRING },
    vesselVoyage: { type: Type.STRING },
    portLoading: { type: Type.STRING },
    portDischarge: { type: Type.STRING },
    placeReceipt: { type: Type.STRING },
    placeDelivery: { type: Type.STRING },
    containerNumbers: { type: Type.ARRAY, items: { type: Type.STRING } },
    sealNumbers: { type: Type.ARRAY, items: { type: Type.STRING } },
    descriptionGoods: { type: Type.STRING },
    line_items: { type: Type.ARRAY, items: LINE_ITEM_SCHEMA },
    hsCode: { type: Type.STRING },
    grossWeight: { type: Type.STRING },
    netWeight: { type: Type.STRING },
    measurementCBM: { type: Type.STRING },
    freightTerms: { type: Type.STRING },
    numPackages: { type: Type.STRING },
    issueDate: { type: Type.STRING }
  },
  required: ["type", "blNumber", "proNumber", "shipper", "consignee"]
};

const emptyParty = (): Party => ({
  name: '', address1: '', address2: '', city: '', state: '', zip: '', country: '', email: '', phone: '', contact: ''
});

export async function parseBOLImage(base64Data: string, mimeType: string): Promise<BOLData> {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType } },
        { text: "EXTRACT_COMPLETE_BOL: Identify all fields. CRITICAL: Capture full addresses (including ZIP/Postal codes), contact phone numbers, email addresses, and reference numbers (PO#, Cust#, etc). Map the Cargo table to line_items with specific focus on weights and NMFC codes." }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: BOL_SCHEMA,
      thinkingConfig: { thinkingBudget: 0 },
      systemInstruction: "High-precision logistics extractor. Capture every detail. Pay attention to small print contact info and reference codes near the header."
    }
  });

  const rawJson = JSON.parse(response.text || '{}');

  return {
    id: Math.random().toString(36).substr(2, 9),
    type: (rawJson.type as BOLType) || BOLType.UNKNOWN,
    timestamp: Date.now(),
    shipper: { value: { ...emptyParty(), ...(rawJson.shipper || {}) }, confidence: 0.95 },
    consignee: { value: { ...emptyParty(), ...(rawJson.consignee || {}) }, confidence: 0.95 },
    notifyParty: { value: rawJson.notifyParty || '', confidence: 0.8 },
    billTo: { value: { ...emptyParty(), ...(rawJson.billTo || {}) }, confidence: 0.8 },
    blNumber: { value: rawJson.blNumber || '', confidence: 0.98 },
    proNumber: { value: rawJson.proNumber || '', confidence: 0.9 },
    referenceCodes: { value: rawJson.referenceCodes || [], confidence: 0.85 },
    specialInstructions: { value: rawJson.specialInstructions || '', confidence: 0.8 },
    carrier: { value: rawJson.carrier || '', confidence: 0.9 },
    vesselVoyage: { value: rawJson.vesselVoyage || '', confidence: 0.85 },
    portLoading: { value: rawJson.portLoading || '', confidence: 0.9 },
    portDischarge: { value: rawJson.portDischarge || '', confidence: 0.9 },
    placeReceipt: { value: rawJson.placeReceipt || '', confidence: 0.8 },
    placeDelivery: { value: rawJson.placeDelivery || '', confidence: 0.8 },
    containerNumbers: { value: rawJson.containerNumbers || [], confidence: 0.9 },
    sealNumbers: { value: rawJson.sealNumbers || [], confidence: 0.9 },
    descriptionGoods: { value: rawJson.descriptionGoods || '', confidence: 0.85 },
    lineItems: { value: rawJson.line_items || [], confidence: 0.9 },
    hsCode: { value: rawJson.hsCode || '', confidence: 0.75 },
    grossWeight: { value: rawJson.grossWeight || '', confidence: 0.9 },
    netWeight: { value: rawJson.netWeight || '', confidence: 0.9 },
    measurementCBM: { value: rawJson.measurementCBM || '', confidence: 0.85 },
    freightTerms: { value: rawJson.freightTerms || '', confidence: 0.85 },
    numPackages: { value: rawJson.numPackages || '', confidence: 0.9 },
    issueDate: { value: rawJson.issueDate || '', confidence: 0.95 },
    rawImage: base64Data
  };
}
