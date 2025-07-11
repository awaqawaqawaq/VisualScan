
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AddressData } from '../types';

if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable not set. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const generateAddressSummary = async (addressData: AddressData): Promise<string> => {
  if (!process.env.API_KEY) {
    return "AI analysis is currently unavailable. Please configure the Gemini API key.";
  }
  
  const { pnlData } = addressData;

  const fansCount = typeof pnlData.twitter_fans_num === 'number'
    ? pnlData.twitter_fans_num.toLocaleString()
    : pnlData.twitter_fans_num;

  const prompt = `
    Analyze the following Web3 wallet based on its detailed PNL, trading, and social data. Provide a concise, insightful summary (max 3-4 sentences) of the user's likely profile and trading strategy.

    **Address:** ${addressData.address}
    **Name/ENS:** ${pnlData.name || pnlData.ens || 'Not available'}
    **Twitter:** @${pnlData.twitter_username} (${fansCount} fans)
    **Community Tags:** ${pnlData.tags.join(', ')}

    **Key Performance Metrics:**
    - Total Profit: $${pnlData.total_profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    - Realized Profit: $${pnlData.realized_profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    - Total Volume: $${pnlData.total_volume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    - Win Rate: ${(pnlData.winrate * 100).toFixed(2)}%
    - Last Active: ${new Date(pnlData.last_active_timestamp * 1000).toLocaleDateString()}
    - Gas Cost: $${pnlData.gas_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

    **Risk Profile:**
    - Honeypot Tokens Traded: ${pnlData.risk.token_honeypot}
    - Fast Transaction Ratio: ${(pnlData.risk.fast_tx_ratio * 100).toFixed(2)}% of transactions are high-speed.

    **Analysis Task:**
    Based on the data above, describe the wallet's persona. Consider their profitability, win rate, risk-taking behavior (e.g., honeypots, fast transactions), and social presence. Are they a sophisticated KOL, a high-frequency degen trader, a cautious investor, or something else? Highlight any notable patterns or insights from their trading activity.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating address summary with Gemini:", error);
    // Throw the error so the UI can handle it specifically
    throw error;
  }
};