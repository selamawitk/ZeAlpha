import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = (process.env.GEMINI_API_KEY || '').replace(/^["']|["']$/g, '').trim();
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const MODELS = ['gemini-1.5-flash', 'gemini-2.0-flash-exp'];

const generateWithFallback = async (prompt) => {
  if (!genAI) {
    throw new Error('Gemini API key not configured. Set GEMINI_API_KEY in .env');
  }
  let lastError;
  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response;
    } catch (err) {
      lastError = err;
      console.warn(`Gemini model ${modelName} failed:`, err.message);
    }
  }
  throw lastError;
};

export const getGiftRecommendation = async ({ budget, relationship, weddingData }) => {
  if (!genAI) {
    throw new Error('Gemini API key not configured. Set GEMINI_API_KEY in .env');
  }

  const registrySummary = weddingData.gifts
    .map(g => `- ${g.name}: ${g.currentCollected}/${g.totalPrice} ETB (${Math.round((g.currentCollected/g.totalPrice)*100)}% funded, type: ${g.type}, category: ${g.category || 'general'})`)
    .join('\n');

  const prompt = `You are an AI gift advisor for ZeAlpha — a modern Ethiopian collaborative wedding registry platform.

APP FEATURES:
- Guests contribute money toward gifts on the couple's registry
- Gifts marked "fractional" allow multiple guests to pool contributions (great for expensive items)
- Gifts marked "unique" require one full contribution
- Guests can leave messages with their contribution
- Digital thank-you cards are generated for contributors
- Email receipts are sent to contributors who provide an email

USER DETAILS:
- Wedding: ${weddingData.weddingName || 'A Wedding'}
- Couple: ${weddingData.coupleName || 'the couple'}
- Guest's Budget: ${budget} ETB
- Guest's Relationship: ${relationship || 'Not specified'}

CURRENT REGISTRY:
${registrySummary || 'The registry is still empty — the couple needs gift ideas.'}

YOUR TASK:
Recommend up to 3 options. Each option must be either:
A) An existing registry gift the guest can contribute to ("join_existing")
B) A new gift idea the couple could add ("create_new")

Return ONLY a JSON array (no markdown, no code fences) with EXACTLY this structure:
[
  {
    "giftId": "existing_gift_id_or_null",
    "giftName": "Name of gift",
    "reason": "One clear sentence explaining why this fits the guest's budget and relationship",
    "recommendedAmount": 123,
    "action": "join_existing"
  }
]

RULES:
- join_existing: only if remaining cost (totalPrice - currentCollected) <= budget. Include the gift's _id as giftId.
- If remaining cost exceeds budget, suggest a partial contribution to the closest-funded gift that the guest can meaningfully help finish.
- create_new: suggest a new gift when existing ones don't fit the budget. Suggest culturally relevant Ethiopian wedding gifts (coffee sets, textiles, kitchenware, furniture, electronics).
- Keep reasons short — one sentence max.
- Return 1-3 recommendations only.
- Be practical: a "Best Friend" with 5000 ETB deserves a better suggestion than a "Coworker" with 500 ETB.`;

  try {
    const response = await generateWithFallback(prompt);
    const text = response.text().trim();
    
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(text);
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to get AI recommendation. Please try again.');
  }
};

export const getRegistryPlanner = async ({ weddingData, question }) => {
  if (!genAI) {
    throw new Error('Gemini API key not configured. Set GEMINI_API_KEY in .env');
  }

  const registrySummary = weddingData.gifts
    .map(g => `- ${g.name}: ${g.totalPrice} ETB (${Math.round((g.currentCollected/g.totalPrice)*100)}% funded, type: ${g.type}, category: ${g.category || 'general'})`)
    .join('\n');

  const prompt = `You are an AI wedding registry planner for ZeAlpha — a modern Ethiopian collaborative wedding registry platform.

APP FEATURES:
- Gifts can be "fractional" (many guests pool money) or "unique" (one guest pays full price)
- Guests contribute money, not physical items — the couple receives cash that they can use to buy the gift themselves
- Digital thank-you cards are sent to contributors
- Email receipts are sent to contributors who provide their email
- The couple can track funding progress in real-time
- When fully funded, the couple can request a payout

COUPLE DETAILS:
- Wedding: ${weddingData.weddingName || 'A Wedding'}
- Couple: ${weddingData.coupleName || ''}
- Wedding Date: ${weddingData.weddingDate || 'Not set'}

CURRENT REGISTRY:
${registrySummary || 'Registry is empty — the couple needs initial gift ideas.'}

THE COUPLE ASKS: "${question}"

YOUR TASK:
Give 4-5 specific, practical gift suggestions for an Ethiopian wedding. Consider:
- Traditional Ethiopian needs: coffee ceremony sets, mesob (woven table), habesha kemis, Ethiopian textiles
- Modern essentials: sofa set, bed frame, refrigerator, blender, cookware, dining table
- Items under 3000 ETB can be "unique" (one guest covers it)
- Items over 5000 ETB MUST be "fractional" (so multiple guests can contribute)
- The summary should be 2-3 sentences of clear, actionable advice

Return ONLY a JSON object (no markdown, no code fences) with EXACTLY this structure:
{
  "suggestions": [
    {
      "name": "Gift name",
      "category": "Furniture|Kitchen|Electronics|Traditional|Home",
      "estimatedPrice": 5000,
      "type": "fractional",
      "reason": "One clear sentence why this gift is perfect for them",
      "shareableNote": "If over 5000 ETB, explain why sharing works. Otherwise null."
    }
  ],
  "summary": "2-3 sentences of clear, actionable advice for the couple"
}

Make the summary short, direct, and helpful — not generic. Example: "Focus on kitchen essentials first since your wedding is 2 months away. Add a coffee set for tradition and a sofa for the living room. Make big items shareable so guests can contribute together."`;

  try {
    const response = await generateWithFallback(prompt);
    const text = response.text().trim();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(text);
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to get planning suggestion. Please try again.');
  }
};
