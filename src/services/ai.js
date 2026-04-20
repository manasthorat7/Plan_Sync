import { pipeline } from "@xenova/transformers";

let generator = null;

export async function generatePlanFromIdea(ideaText) {
  try {
    if (!generator) {
      console.log("Loading lightweight AI model...");

      generator = await pipeline(
        "text-generation",
        "Xenova/distilgpt2",
        {
          progress_callback: (p) => console.log(p),
        }
      );
    }

    const prompt = `3-day trip plan for ${ideaText}:
Day 1:
Day 2:
Day 3:
`;

    const result = await generator(prompt, {
      max_new_tokens: 80,
    });

    const text = result[0].generated_text;

    return {
      title: "🤖 AI Generated Plan",
      description: text,
    };

  } catch (err) {
    console.error("MODEL LOAD ERROR:", err);

    // 🔥 IMPORTANT: fallback but smarter
    return smartFallback(ideaText);
  }
}

// smarter fallback (looks AI-like)
function smartFallback(ideaText) {
  return {
    title: "Smart Generated Plan",
    description: `Day 1: Arrival and explore ${ideaText}
Day 2: Main activities and sightseeing
Day 3: Relax and return

(Generated using fallback engine)`
  };
}