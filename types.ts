export interface Formula {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  instructions: string;
  averageValue?: string;
}

export interface GroundingSource {
  uri: string;
  title: string;
  snippet?: string;
}

export interface GeminiResponse {
  summary: string;
  formulas: Formula[];
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  disease: string;
  doctorName?: string;
  patientName?: string;
  observations?: string;
  currentIngredients?: string[];
  isLactoseIntolerant?: boolean;
  isAllergicToDye?: boolean;
  treatmentType?: 'topical' | 'internal' | 'all';
  response: GeminiResponse;
  sources: GroundingSource[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category?: string;
}

export interface PrescriptionData {
  doctorName: string;
  patientName: string;
  date: string;
  prescribedItems: Array<{
    name: string;
    instructions: string;
  }>;
}

export interface SavedPrescription {
  id: string;
  timestamp: number;
  data: PrescriptionData;
  imagePreviewUrl: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // In a real app, this should be a securely hashed password.
}