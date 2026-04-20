/**
 * Securely bridges internal application scope across the global Gemini AI framework
 * automatically structuring string outputs explicitly into valid strict JSON map blocks.
 */
export async function generatePlanFromIdea(ideaText) {
  // Configured precisely utilizing Vite environment mapping
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Feature locked: Missing VITE_GEMINI_API_KEY inside your .env configuration.");
  }

  const prompt = `You are a professional luxury event coordinator and itinerary architect.
The user wants to plan the following: "${ideaText}"

You must respond ONLY with a valid JSON object matching exactly this schema, with no markdown formatting whatsoever. Do not wrap it in \`\`\`json.
{
  "title": "A short, incredibly catchy and premium title for the plan",
  "description": "A highly detailed, well-structured, and enthusiastic multi-line group description or itinerary outline establishing precisely what this gathering involves."
}`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
       responseMimeType: "application/json" // Strict explicit formatting lock
    }
  };

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
       throw new Error(`Remote AI server rejected processing logic: ${response.status}`);
    }

    const data = await response.json();
    const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textOutput) throw new Error("No payload was returned.");

    return JSON.parse(textOutput);

  } catch (error) {
    console.error("AI Generation Critical Error:", error);
    throw new Error(error.message || "Failed to interact natively with the intelligence node.");
  }
}
