
export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  minStockLevel: number;
  price: number;
  location: string;
  description: string;
  lastUpdated: string;
}

export enum ViewType {
  DASHBOARD = 'DASHBOARD',
  INVENTORY = 'INVENTORY',
  SCANNER = 'SCANNER',
  SETTINGS = 'SETTINGS'
}

export interface AIAnalysisResult {
  suggestedCategory: string;
  suggestedDescription: string;
  riskAssessment: string;
}
