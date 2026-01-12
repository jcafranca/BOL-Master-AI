
import { GoogleGenAI, Type } from "@google/genai";
import { BOLData, BOLType, Party } from "../types";

// Always use named parameter for apiKey and obtain it directly from process.env.API_KEY
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

const BOL_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, description: "Type of BOL: 'Ocean', 'Air', or 'Inland'" },
    shipper: { type: Type.OBJECT, properties: PARTY_PROPERTIES },
    consignee: { type: Type.OBJECT, properties: PARTY_PROPERTIES },
    notifyParty: { type: Type.STRING },
    billTo: { type: Type.OBJECT, properties: PARTY_PROPERTIES, description: "The party responsible for paying the freight charges" },
    blNumber: { type: Type.STRING },
    proNumber: { type: Type.STRING, description: "The Progressive Number (PRO#) often used for LTL tracking" },
    referenceCodes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Any PO numbers, account numbers, or reference codes found" },
    specialInstructions: { type: Type.STRING, description: "Delivery or handling instructions, driver notes, or special requirements" },
    carrier: { type: Type.STRING },
    vesselVoyage: { type: Type.STRING },
    portLoading: { type: Type.STRING },
    portDischarge: { type: Type.STRING },
    placeReceipt: { type: Type.STRING },
    placeDelivery: { type: Type.STRING },
    containerNumbers: { type: Type.ARRAY, items: { type: Type.STRING } },
    sealNumbers: { type: Type.ARRAY, items: { type: Type.STRING } },
    descriptionGoods: { type: Type.STRING },
    hsCode: { type: Type.STRING },
    grossWeight: { type: Type.STRING },
    netWeight: { type: Type.STRING },
    measurementCBM: { type: Type.STRING },
    freightTerms: { type: Type.STRING },
    numPackages: { type: Type.STRING },
    issueDate: { type: Type.STRING },
    confidenceScores: { 
      type: Type.OBJECT, 
      properties: {
        shipper: { type: Type.NUMBER },
        consignee: { type: Type.NUMBER },
        billTo: { type: Type.NUMBER },
        blNumber: { type: Type.NUMBER },
        proNumber: { type: Type.NUMBER },
        carrier: { type: Type.NUMBER },
        vesselVoyage: { type: Type.NUMBER },
        overall: { type: Type.NUMBER }
      }
    }
  },
  required: ["type", "blNumber", "shipper", "consignee"]
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
        { text: "Extract all Bill of Lading fields. For Shipper, Consignee, and Bill To, break down the text into specific components: name, address1, address2, city, state, zip, country, email, phone, and contact person. If a component is not found, use an empty string. Estimate confidence scores for key fields." }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: BOL_SCHEMA,
      systemInstruction: "You are a specialized logistics document AI. Your task is to extract structured data from Bill of Lading documents. You handle multi-layout formats and handwritten notes. Respond ONLY in valid JSON."
    }
  });

  const rawJson = JSON.parse(response.text || '{}');
  const scores = rawJson.confidenceScores || {};

  return {
    id: Math.random().toString(36).substr(2, 9),
    type: (rawJson.type as BOLType) || BOLType.UNKNOWN,
    timestamp: Date.now(),
    shipper: { value: { ...emptyParty(), ...(rawJson.shipper || {}) }, confidence: scores.shipper || 0.8 },
    consignee: { value: { ...emptyParty(), ...(rawJson.consignee || {}) }, confidence: scores.consignee || 0.8 },
    notifyParty: { value: rawJson.notifyParty || '', confidence: 0.7 },
    billTo: { value: { ...emptyParty(), ...(rawJson.billTo || {}) }, confidence: scores.billTo || 0.75 },
    blNumber: { value: rawJson.blNumber || '', confidence: scores.blNumber || 0.9 },
    proNumber: { value: rawJson.proNumber || '', confidence: scores.proNumber || 0.8 },
    referenceCodes: { value: rawJson.referenceCodes || [], confidence: 0.7 },
    specialInstructions: { value: rawJson.specialInstructions || '', confidence: 0.65 },
    carrier: { value: rawJson.carrier || '', confidence: scores.carrier || 0.85 },
    vesselVoyage: { value: rawJson.vesselVoyage || '', confidence: scores.vesselVoyage || 0.8 },
    portLoading: { value: rawJson.portLoading || '', confidence: 0.8 },
    portDischarge: { value: rawJson.portDischarge || '', confidence: 0.8 },
    placeReceipt: { value: rawJson.placeReceipt || '', confidence: 0.7 },
    placeDelivery: { value: rawJson.placeDelivery || '', confidence: 0.7 },
    containerNumbers: { value: rawJson.containerNumbers || [], confidence: 0.85 },
    sealNumbers: { value: rawJson.sealNumbers || [], confidence: 0.8 },
    descriptionGoods: { value: rawJson.descriptionGoods || '', confidence: 0.75 },
    hsCode: { value: rawJson.hsCode || '', confidence: 0.6 },
    grossWeight: { value: rawJson.grossWeight || '', confidence: 0.85 },
    netWeight: { value: rawJson.netWeight || '', confidence: 0.8 },
    measurementCBM: { value: rawJson.measurementCBM || '', confidence: 0.8 },
    freightTerms: { value: rawJson.freightTerms || '', confidence: 0.7 },
    numPackages: { value: rawJson.numPackages || '', confidence: 0.85 },
    issueDate: { value: rawJson.issueDate || '', confidence: 0.9 },
    rawImage: base64Data
  };
}
