import { GoogleGenAI } from "@google/genai";
import { FundamentalAnalysis, MarketData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const analyzeMarket = async (marketData: MarketData): Promise<FundamentalAnalysis> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analise o mercado para o ativo ${marketData.symbol}. 
      Preço atual: ${marketData.price}. 
      Variação: ${marketData.changePercent}%.
      Volume: ${marketData.volume}.
      
      Como um especialista fundamentalista em daytrade, forneça uma análise técnica e fundamentalista rápida.
      Decida se é uma boa oportunidade para uma operação com risco-retorno 2:1.
      
      Responda estritamente em JSON com o seguinte formato:
      {
        "sentiment": "BULLISH" | "BEARISH" | "NEUTRAL",
        "score": number (0-100),
        "reasoning": "string",
        "keyFactors": ["string"],
        "recommendation": "BUY" | "SELL" | "WAIT"
      }`,
      config: {
        responseMimeType: "application/json",
      }
    });

    const result = JSON.parse(response.text || "{}");
    return {
      sentiment: result.sentiment || 'NEUTRAL',
      score: result.score || 50,
      reasoning: result.reasoning || "Sem análise disponível.",
      keyFactors: result.keyFactors || [],
      recommendation: result.recommendation || "WAIT"
    };
  } catch (error) {
    console.error("Erro na análise do Gemini:", error);
    return {
      sentiment: 'NEUTRAL',
      score: 50,
      reasoning: "Erro ao processar análise fundamentalista.",
      keyFactors: [],
      recommendation: "WAIT"
    };
  }
};
