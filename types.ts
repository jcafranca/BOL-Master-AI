
export enum BOLType {
  OCEAN = 'Ocean',
  AIR = 'Air',
  INLAND = 'Inland',
  UNKNOWN = 'Unknown'
}

export enum AIProvider {
  GEMINI = 'Gemini',
  OPENAI = 'OpenAI',
  CUSTOM = 'Custom'
}

export interface ProviderProfile {
  id: string;
  name: string;
  provider: AIProvider;
  model: string;
  endpoint: string;
  apiKey?: string;
  isDefault?: boolean;
}

export interface AIConfig {
  activeProfileId: string;
  profiles: ProviderProfile[];
}

export interface Party {
  name: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  email: string;
  phone: string;
  contact: string;
}

export interface LineItem {
  qty: number;
  pieces: number;
  package_type: string;
  handling_unit_type: string;
  weight_lbs: number;
  hazmat: boolean;
  non_stackable: boolean;
  dimensions_in: string;
  description: string;
  nmfc_code: string;
  nmfc_sub: string;
  freight_class: string;
  line_total_weight_lbs: number;
}

export interface BOLField<T> {
  value: T;
  confidence: number; // 0 to 1
}

export interface BOLData {
  id: string;
  type: BOLType;
  timestamp: number;
  shipper: BOLField<Party>;
  consignee: BOLField<Party>;
  notifyParty: BOLField<string>;
  billTo: BOLField<Party>;
  blNumber: BOLField<string>;
  proNumber: BOLField<string>;
  referenceCodes: BOLField<string[]>;
  specialInstructions: BOLField<string>;
  carrier: BOLField<string>;
  vesselVoyage: BOLField<string>;
  portLoading: BOLField<string>;
  portDischarge: BOLField<string>;
  placeReceipt: BOLField<string>;
  placeDelivery: BOLField<string>;
  containerNumbers: BOLField<string[]>;
  sealNumbers: BOLField<string[]>;
  descriptionGoods: BOLField<string>;
  lineItems: BOLField<LineItem[]>;
  hsCode: BOLField<string>;
  grossWeight: BOLField<string>;
  netWeight: BOLField<string>;
  measurementCBM: BOLField<string>;
  freightTerms: BOLField<string>;
  numPackages: BOLField<string>;
  issueDate: BOLField<string>;
  rawImage?: string; // base64
}

export type ViewState = 'dashboard' | 'scan' | 'history' | 'edit' | 'info' | 'settings';

export interface HistoryItem extends BOLData {
  status: 'draft' | 'verified' | 'archived';
}
