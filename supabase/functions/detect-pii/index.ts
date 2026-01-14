import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PIIItem {
  span: string;
  type: "email" | "phone" | "name" | "address" | "health" | "financial" | "ssn" | "dob" | "id-number";
  category: "contact" | "identity" | "health" | "financial" | "location";
  sensitivity: "basic" | "sensitive";
  inferred: boolean;
  explanation: string;
  replacement: string;
}

/**
 * Gemini sometimes wraps JSON in ```json ... ```
 * This safely extracts raw JSON before parsing.
 */
function extractJson(text: string): string {
  return text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    const MAX_TEXT_LENGTH = 10_000; // hard cap to control cost
    if (!text || typeof text !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'text' field" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return new Response(
        JSON.stringify({ error: "Text too long" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    const prompt = `
You are a PII detection system.

Analyze the text and return ONLY valid JSON.
Do NOT include markdown, explanations, or extra text.

Return exactly this schema:

{
  "items": [
    {
      "span": "exact text",
      "type": "email | phone | name | address | health | financial | ssn | dob | id-number",
      "category": "contact | identity | health | financial | location",
      "sensitivity": "basic | sensitive",
      "inferred": false,
      "explanation": "why this is PII",
      "replacement": "[EMAIL] | [PHONE] | [NAME] | etc"
    }
  ]
}

Rules:
- Only include explicitly present PII
- inferred must ALWAYS be false
- Be conservative (no hallucination)

Text:
"""${text}"""
`;

    const geminiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=" +
        GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 800,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const err = await geminiResponse.text();
      console.error("Gemini API error:", err);
      return new Response(
        JSON.stringify({ error: "Gemini request failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiJson = await geminiResponse.json();
    const rawText =
      geminiJson.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error("Empty Gemini response");
    }

    let parsed: { items: PIIItem[] };
    try {
      parsed = JSON.parse(extractJson(rawText));
    } catch (e) {
      console.error("Invalid JSON from Gemini:", rawText);
      return new Response(
        JSON.stringify({ error: "Gemini returned invalid JSON", raw: rawText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ items: parsed.items ?? [] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("detect-pii error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
