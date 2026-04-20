const functions = require("firebase-functions");
const fetch = require("node-fetch");

// 🔥 AI FUNCTION (GROQ)
exports.generatePlan = functions.https.onRequest(async (req, res) => {
  try {
    // Allow CORS (important for frontend)
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    const idea = req.body.idea;

    if (!idea) {
      return res.status(400).json({ error: "Missing idea" });
    }

    const apiKey = process.env.GROQ_API_KEY; // 🔴 paste your key here

    const prompt = `Create a structured 3-day plan for: "${idea}"

Return ONLY JSON:
{
  "title": "Plan title",
  "description": "Day 1: ...\\nDay 2: ...\\nDay 3: ..."
}`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    const data = await response.json();

    const output = data?.choices?.[0]?.message?.content;

    if (!output) {
      return res.json({
        title: "Manual Plan",
        description: "AI failed, fallback used",
      });
    }

    res.json({
      result: output,
    });

  } catch (error) {
    console.error("ERROR:", error);
    res.status(500).json({ error: "AI failed" });
  }
});