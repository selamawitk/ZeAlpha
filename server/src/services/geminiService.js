import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

export const getGiftRecommendation = async ({ budget, relationship, intent, weddingData }) => {
  if (!genAI) {
    throw new Error('Gemini API key not configured. Set GEMINI_API_KEY in .env');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const registrySummary = weddingData.gifts
    .map(g => `- ${g.name}: ${g.currentCollected}/${g.totalPrice} ETB (${Math.round((g.currentCollected/g.totalPrice)*100)}% funded, type: ${g.type})`)
    .join('\n');

  const prompt = `You are a wedding gift recommendation assistant for ZeAlpha, a collaborative wedding registry platform.

Wedding: ${weddingData.weddingName || 'A Wedding'}
Budget: ${budget} ETB
Guest Relationship: ${relationship || 'Not specified'}
Guest Intent: ${intent || 'Not specified'}

Current Registry:
${registrySummary}

Based on the guest's budget of ${budget} ETB and their relationship as "${relationship || 'a guest'}", recommend ONE specific gift from the registry above. 

Return ONLY a JSON object (no markdown, no code fences) with EXACTLY this structure:
{
  "recommendedGift": "Name of the recommended gift",
  "recommendedAmount": 123,
  "reasoning": "1-2 sentence explanation of why this gift and amount are appropriate"
}

Consider:
- The guest's budget
- Remaining amount needed for each gift
- Gift type (fractional = shareable, individual = unique)
- The guest's relationship to the couple
- Their stated intent

If the budget exceeds remaining amounts, recommend contributing to the gift closest to being fully funded to help complete it.`;

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
    throw new Error('Failed to get AI recommendation. Please try again.');
  }
};
