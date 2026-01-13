import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ---------- HARD LIMITS ----------
const MAX_TEXT_LENGTH = 8000;          // chars
const MAX_OUTPUT_TOKENS = 512;         // Gemini hard cap
const MAX_REQUESTS_PER_MONTH = 5_000;  // safety net (~€10)

// Simple in-memory counter (resets on deploy)
let monthlyRequestCount = 0;
// --------------------------------

interface PIIItem {
  span: string;
  type: string;
  category: string;
  sensitivity: "basic" | "sensitive";
  inferred: boolean;
  explanation: string;
  replacement: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ---- Budget guard ----
    monthlyRequestCount++;
    if (monthlyRequestCount > MAX_REQUESTS_PER_MONTH) {
      return new Response(
        JSON.stringify({ error: "Monthly AI budget exceeded." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'text' field" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return new Response(
        JSON.stringify({ error: "Text too long." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY not set");
    }

    // ---- Gemini request ----
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Detect PII and return JSON only.
Schema:
{
  "items": [{
    "span": string,
    "type": "email" | "phone" | "name" | "address" | "health" | "financial" | "ssn" | "dob" | "id-number",
    "category": "contact" | "identity" | "health" | "financial" | "location",
    "sensitivity": "basic" | "sensitive",
    "inferred": boolean,
    "explanation": string,
    "replacement": string
  }]
}

Text:
"""${text}"""`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: MAX_OUTPUT_TOKENS,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("Gemini error:", err);
      throw new Error("Gemini request failed");
    }

    const data = await response.json();

    // Gemini returns text → parse JSON safely
    const rawText =
      data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = { items: [] };
    }

    return new Response(
      JSON.stringify({ items: parsed.items ?? [] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("detect-pii error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
