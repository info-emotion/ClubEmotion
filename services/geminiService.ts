
import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult, InventoryItem } from "../types";

// Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
// We assume the API key is pre-configured and accessible.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeItemData = async (name: string, sku: string): Promise<AIAnalysisResult | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analizza questo prodotto di magazzino. Nome: "${name}", SKU: "${sku}". Fornisci suggerimenti per la categoria, una descrizione professionale e una breve valutazione del rischio di stoccaggio (es. infiammabile, deperibile, fragile).`,
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

    // The GenerateContentResponse object features a text property (not a method).
    const text = response.text;
    if (text) {
      try {
        return JSON.parse(text) as AIAnalysisResult;
      } catch (parseError) {
        console.error("JSON Parse Error on Gemini Response:", parseError);
        return null;
      }
    }
    return null;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return null;
  }
};

export const getInventoryAdvice = async (items: InventoryItem[]): Promise<string> => {
  try {
    if (items.length === 0) return "Aggiungi articoli per l'analisi.";
    
    const stockSummary = items.slice(0, 20).map(i => `${i.name} (Qta: ${i.quantity}, Min: ${i.minStockLevel})`).join(', ');
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Agisci come un esperto di logistica. Analizza questo inventario e fornisci 3 consigli rapidi per ottimizzare il magazzino o avvisi su prodotti in esaurimento: ${stockSummary}`,
    });
    // The GenerateContentResponse object features a text property (not a method).
    return response.text || "Nessun consiglio disponibile al momento.";
  } catch (error) {
    console.error("Gemini Advice Error:", error);
    return "Consigli AI temporaneamente non disponibili.";
  }
};
