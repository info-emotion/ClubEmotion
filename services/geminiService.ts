
import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult, InventoryItem } from "../types";

// Accesso sicuro: se process.env non è definito (es. GitHub Pages senza build step), 
// l'app non crasha ma le funzioni AI restituiranno null o errori gestiti.
const getApiKey = () => {
  try {
    return (window as any).process?.env?.API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY || "";
  } catch {
    return "";
  }
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

export const analyzeItemData = async (name: string, sku: string): Promise<AIAnalysisResult | null> => {
  if (!getApiKey()) {
    console.warn("Gemini API Key non configurata. Funzioni AI disabilitate.");
    return null;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analizza questo prodotto di magazzino. Nome: "${name}", SKU: "${sku}". Fornisci suggerimenti per la categoria, una descrizione professionale e una valutazione del rischio.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedCategory: { type: Type.STRING },
            suggestedDescription: { type: Type.STRING },
            riskAssessment: { type: Type.STRING },
          },
          required: ["suggestedCategory", "suggestedDescription", "riskAssessment"]
        },
      },
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text) as AIAnalysisResult;
    }
    return null;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return null;
  }
};

export const getInventoryAdvice = async (items: InventoryItem[]): Promise<string> => {
  if (!getApiKey() || items.length === 0) return "Configura l'API per ricevere consigli logistici.";

  try {
    const stockSummary = items.slice(0, 15).map(i => `${i.name} (${i.quantity} pz)`).join(', ');
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Fornisci un breve consiglio logistico (max 20 parole) basato su questi prodotti: ${stockSummary}`,
    });
    return response.text || "Inventario monitorato correttamente.";
  } catch (error) {
    return "Analisi AI temporaneamente non disponibile.";
  }
};
