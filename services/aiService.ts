
import { GoogleGenAI, Type } from "@google/genai";
import { BOLData, BOLType, Party, AIConfig, AIProvider, ProviderProfile } from "../types";

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
    issueDate: { type: Type.STRING },
    confidences: {
      type: Type.OBJECT,
      description: "Confidence scores (0.0 to 1.0) for the extracted data sections.",
      properties: {
        shipper: { type: Type.NUMBER },
        consignee: { type: Type.NUMBER },
        billTo: { type: Type.NUMBER },
        blNumber: { type: Type.NUMBER },
        proNumber: { type: Type.NUMBER },
        lineItems: { type: Type.NUMBER },
        logistics: { type: Type.NUMBER }
      }
    }
  },
  required: ["type", "blNumber", "shipper", "consignee"]
};

const emptyParty = (): Party => ({
  name: '', address1: '', address2: '', city: '', state: '', zip: '', country: '', email: '', phone: '', contact: ''
});

const DEFAULT_GEMINI_PROFILE: ProviderProfile = {
  id: 'default-gemini',
  name: 'Gemini Flash (Default)',
  provider: AIProvider.GEMINI,
  model: 'gemini-3-flash-preview',
  endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent',
  isDefault: true
};
const EXTRACTION_PROMPT = `
EXTRACT_COMPLETE_BOL: Extract every field from the Bill of Lading document. 
CRITICAL: Capture all addresses in full (including address1, address2, city, state, ZIP/postal code, country), 
all contact phone numbers, emails, and all reference numbers (PO#, Cust#, SO#, PRO#, etc.). 
Parse Shipper, Consignee, and Bill To into separate fields: name, address1, address2, city, state, zip, country, email, phone, contact_person.
Map the Cargo/Commodity table to line_items with full details, focusing on weights, units, piece counts, and NMFC codes. 
Include confidence scores (0.0–1.0) for key fields. 
If any field is missing, return an empty string. 
Do not infer or guess missing values.
`;

const INSTRUCTION_PROMPT = `
You are a high-precision logistics document AI. 
Capture every detail from the BOL, including small-print contact info, header reference codes, and handwritten notes. 
Always return a complete structured JSON containing all fields, line_items, and confidence scores. 
Do not skip any field or make assumptions.
`;

export async function parseBOLImage(base64Data: string, mimeType: string, config: AIConfig): Promise<BOLData> {
  const profile = config.profiles.find(p => p.id === config.activeProfileId) || DEFAULT_GEMINI_PROFILE;
  let rawJson: any = {};

  const isDefaultGemini = profile.provider === AIProvider.GEMINI && 
    (!profile.endpoint || profile.endpoint.includes('generativelanguage.googleapis.com'));

  if (isDefaultGemini) {
    const customAi = profile.apiKey ? new GoogleGenAI({ apiKey: profile.apiKey }) : ai;
    const response = await customAi.models.generateContent({
      model: profile.model || 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: EXTRACTION_PROMPT }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: BOL_SCHEMA,
        thinkingConfig: { thinkingBudget: 0 },
        systemInstruction: INSTRUCTION_PROMPT
      }
    });
    rawJson = JSON.parse(response.text || '{}');
  } 
  else if (profile.provider === AIProvider.GEMINI && !isDefaultGemini) {
    try {
      const response = await fetch(profile.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': profile.apiKey || process.env.API_KEY || ''
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { data: base64Data, mime_type: mimeType } },
              { text: EXTRACTION_PROMPT }
            ]
          }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: BOL_SCHEMA
          }
        })
      });
      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      rawJson = JSON.parse(text);
    } catch (e) {
      console.error("Gemini Custom Link Error:", e);
      throw new Error("Failed to connect to Gemini endpoint.");
    }
  }
  else if (profile.provider === AIProvider.OPENAI) {
    try {
      const response = await fetch(profile.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${profile.apiKey || process.env.API_KEY}`
        },
        body: JSON.stringify({
          model: profile.model,
          messages: [
            { role: "system", content: INSTRUCTION_PROMPT },
            { role: "user", content: [
              { type: "text", text: EXTRACTION_PROMPT },
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } }
            ]}
          ],
          response_format: { type: "json_object" }
        })
      });
      const result = await response.json();
      const content = result.choices?.[0]?.message?.content || '{}';
      rawJson = typeof content === 'string' ? JSON.parse(content) : content;
    } catch (e) {
      console.error("OpenAI Provider Error:", e);
      throw new Error("OpenAI extraction failed.");
    }
  }
  else if (profile.provider === AIProvider.CUSTOM) {
    try {
      const response = await fetch(profile.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(profile.apiKey ? { 'Authorization': `Bearer ${profile.apiKey}` } : {})
        },
        body: JSON.stringify({
          image: base64Data,
          mimeType: mimeType,
          model: profile.model,
          prompt: EXTRACTION_PROMPT
        })
      });
      if (!response.ok) throw new Error(`Custom API Error: ${response.status}`);
      rawJson = await response.json();
    } catch (e) {
      console.error("Custom AI Error:", e);
      throw new Error("Custom AI endpoint failed.");
    }
  }

  // Helper to get dynamic confidence from rawJson.confidences or fallback
  const getConf = (key: string, fallback: number = 0.88) => {
    return rawJson.confidences?.[key] ?? fallback;
  };

  return {
    id: Math.random().toString(36).substr(2, 9),
    type: (rawJson.type as BOLType) || BOLType.UNKNOWN,
    timestamp: Date.now(),
    shipper: { value: { ...emptyParty(), ...(rawJson.shipper || {}) }, confidence: getConf('shipper', 0.94) },
    consignee: { value: { ...emptyParty(), ...(rawJson.consignee || {}) }, confidence: getConf('consignee', 0.94) },
    notifyParty: { value: rawJson.notifyParty || '', confidence: getConf('logistics', 0.85) },
    billTo: { value: { ...emptyParty(), ...(rawJson.billTo || {}) }, confidence: getConf('billTo', 0.88) },
    blNumber: { value: rawJson.blNumber || '', confidence: getConf('blNumber', 0.96) },
    proNumber: { value: rawJson.proNumber || '', confidence: getConf('proNumber', 0.92) },
    referenceCodes: { value: rawJson.referenceCodes || [], confidence: getConf('logistics', 0.88) },
    specialInstructions: { value: rawJson.specialInstructions || '', confidence: getConf('logistics', 0.8) },
    carrier: { value: rawJson.carrier || '', confidence: getConf('blNumber', 0.9) },
    vesselVoyage: { value: rawJson.vesselVoyage || '', confidence: getConf('logistics', 0.85) },
    portLoading: { value: rawJson.portLoading || '', confidence: getConf('logistics', 0.9) },
    portDischarge: { value: rawJson.portDischarge || '', confidence: getConf('logistics', 0.9) },
    placeReceipt: { value: rawJson.placeReceipt || '', confidence: getConf('logistics', 0.8) },
    placeDelivery: { value: rawJson.placeDelivery || '', confidence: getConf('logistics', 0.8) },
    containerNumbers: { value: rawJson.containerNumbers || [], confidence: getConf('logistics', 0.9) },
    sealNumbers: { value: rawJson.sealNumbers || [], confidence: getConf('logistics', 0.9) },
    descriptionGoods: { value: rawJson.descriptionGoods || '', confidence: getConf('lineItems', 0.85) },
    lineItems: { value: rawJson.line_items || rawJson.lineItems || [], confidence: getConf('lineItems', 0.92) },
    hsCode: { value: rawJson.hsCode || '', confidence: getConf('logistics', 0.75) },
    grossWeight: { value: rawJson.grossWeight || '', confidence: getConf('lineItems', 0.9) },
    netWeight: { value: rawJson.netWeight || '', confidence: getConf('lineItems', 0.9) },
    measurementCBM: { value: rawJson.measurementCBM || '', confidence: getConf('lineItems', 0.85) },
    freightTerms: { value: rawJson.freightTerms || '', confidence: getConf('logistics', 0.85) },
    numPackages: { value: rawJson.numPackages || '', confidence: getConf('lineItems', 0.9) },
    issueDate: { value: rawJson.issueDate || '', confidence: getConf('blNumber', 0.95) },
    rawImage: base64Data
  };
}
