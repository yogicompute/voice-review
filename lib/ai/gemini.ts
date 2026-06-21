import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface ReviewMetrics {
  rating: number;           // 1–5
  sentiment: "superhappy" | "happy" | "neutral" | "sad" | "angry";
  likelyReturnRate: number; // 0–100
  issueFlag: boolean;       // true if customer mentions a problem
  summary: string;          // one-line summary of the feedback
}

const SYSTEM_PROMPT = `You are a customer feedback analyst for local service businesses.
You will receive a transcript of a short voice review (5 seconds or less) left by a customer immediately after receiving a service.

Analyze the transcript and return ONLY a valid JSON object with exactly these fields:
{
  "rating": <integer 1-5>,
  "sentiment": <one of: "superhappy", "happy", "neutral", "sad", "angry">,
  "likelyReturnRate": <integer 0-100>,
  "issueFlag": <boolean, true if customer mentions any problem, complaint, or negative experience>,
  "summary": <single sentence summarizing the feedback, max 20 words>
}

Rating guide:
1 = very negative, 2 = negative, 3 = neutral/mixed, 4 = positive, 5 = very positive

likelyReturnRate guide:
Estimate how likely (0-100%) the customer is to return based on tone and content.

Rules:
- Return ONLY the JSON object, no markdown, no backticks, no explanation
- If the transcript is empty or inaudible, return: {"rating":3,"sentiment":"neutral","likelyReturnRate":50,"issueFlag":false,"summary":"No clear feedback provided"}
- Never include extra fields`;

export async function analyzeReview(transcript: string): Promise<ReviewMetrics> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2, // low temp for consistent structured output
    },
  });

  const prompt = `${SYSTEM_PROMPT}\n\nTranscript: "${transcript}"`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  try {
    const parsed = JSON.parse(text) as ReviewMetrics;

    // Sanitize just in case
    return {
      rating: Math.min(5, Math.max(1, Math.round(parsed.rating))),
      sentiment: parsed.sentiment ?? "neutral",
      likelyReturnRate: Math.min(100, Math.max(0, Math.round(parsed.likelyReturnRate))),
      issueFlag: Boolean(parsed.issueFlag),
      summary: parsed.summary ?? "",
    };
  } catch {
    // Fallback if Gemini returns malformed JSON
    return {
      rating: 3,
      sentiment: "neutral",
      likelyReturnRate: 50,
      issueFlag: false,
      summary: "Could not analyze feedback",
    };
  }
}