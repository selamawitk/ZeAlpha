import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

export const getGiftRecommendation = async ({ budget, relationship, weddingData }) => {
  if (!genAI) {
    throw new Error('Gemini API key not configured. Set GEMINI_API_KEY in .env');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const registrySummary = weddingData.gifts
    .map(g => `- ${g.name}: ${g.currentCollected}/${g.totalPrice} ETB (${Math.round((g.currentCollected/g.totalPrice)*100)}% funded, type: ${g.type}, category: ${g.category || 'general'})`)
    .join('\n');

  const prompt = `You are a wedding gift recommendation assistant for ZeAlpha, an Ethiopian collaborative wedding registry platform.

Wedding: ${weddingData.weddingName || 'A Wedding'}
Couple: ${weddingData.coupleName || 'the couple'}
Budget: ${budget} ETB
Guest Relationship: ${relationship || 'Not specified'}

Current Registry:
${registrySummary || 'No gifts yet in the registry.'}

Based on the guest's budget of ${budget} ETB and their relationship as "${relationship || 'a guest'}", recommend up to 3 options from the registry AND suggest 1 new gift idea if appropriate.

Ethiopian context: Consider culturally relevant gifts like traditional coffee sets, Ethiopian textiles, kitchen equipment for large family gatherings.

Return ONLY a JSON array (no markdown, no code fences) with EXACTLY this structure:
[
  {
    "giftId": "existing_gift_id_or_null",
    "giftName": "Name of gift",
    "reason": "1 sentence why this fits",
    "recommendedAmount": 123,
    "action": "join_existing"
  }
]

Rules:
- For gifts already in the registry with remaining amount <= budget: action = "join_existing", include the gift's _id as giftId
- If budget is small and remaining amounts are high, suggest partial contribution to closest-funded gift
- If no affordable existing gifts, suggest creating a new gift: action = "create_new", giftId = null
- For expensive items (> 5000 ETB) that make sense, suggest them as shareable with action = "create_new"
- Return 1-3 recommendations`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
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

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const registrySummary = weddingData.gifts
    .map(g => `- ${g.name}: ${g.totalPrice} ETB (${Math.round((g.currentCollected/g.totalPrice)*100)}% funded, type: ${g.type}, category: ${g.category || 'general'})`)
    .join('\n');

  const prompt = `You are a wedding registry planning assistant for ZeAlpha, an Ethiopian collaborative wedding gift platform.

Wedding: ${weddingData.weddingName || 'A Wedding'}
Couple: ${weddingData.coupleName || ''}
Wedding Date: ${weddingData.weddingDate || 'Not set'}

Current Registry:
${registrySummary || 'Registry is empty.'}

The couple asks: "${question}"

Provide helpful, practical gift suggestions for an Ethiopian wedding. Consider:
- Traditional Ethiopian wedding needs (coffee ceremony set, mesob, habesha kemis)
- Modern household essentials (bed, sofa, fridge, electronics, kitchen equipment)
- Which items should be shareable (fractional) because multiple guests can contribute
- Budget-conscious recommendations

Return ONLY a JSON object (no markdown, no code fences) with EXACTLY this structure:
{
  "suggestions": [
    {
      "name": "Gift name",
      "category": "Furniture|Kitchen|Electronics|Traditional|Home",
      "estimatedPrice": 5000,
      "type": "fractional",
      "reason": "Why this gift is appropriate",
      "shareableNote": "If expensive, explain why this should be shareable. Otherwise null."
    }
  ],
  "summary": "Overall advice for the couple"
}

For any item over 5000 ETB, MUST set type to "fractional" and provide a shareableNote explaining why multiple guests should contribute.`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
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
