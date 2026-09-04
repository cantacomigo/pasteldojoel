import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';

export const generateCreativeDescription = async (itemName: string, category: string): Promise<string> => {
  if (!apiKey) {
    console.warn("API Key is missing. Skipping AI generation.");
    return "";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Using flash model for speed and cost effectiveness for simple text tasks
    const modelId = 'gemini-1.5-flash'; 

    const prompt = `Escreva uma descrição curta, apetitosa e vendedora para um item de menu de uma pastelaria brasileira chamada "Pastelaria do Joel".
    Item: ${itemName}
    Categoria: ${category}
    Limite: Máximo 20 palavras.
    Tom: Divertido e caseiro.`;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });

    return response.text?.trim() || "";
  } catch (error) {
    console.error("Error generating description:", error);
    return "";
  }
};