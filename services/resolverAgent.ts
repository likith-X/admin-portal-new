import { ethers } from "ethers";
import Groq from "groq-sdk";

/**
 * Resolver Agent Service
 * 
 * Core logic for AI-powered contest resolution with cryptographic signing.
 * 
 * Flow:
 * 1. Receives contest data and oracle facts
 * 2. Analyzes using AI (Groq) or fallback logic
 * 3. Signs the resolution decision with resolver private key
 * 4. Returns outcome + signature + explanation for on-chain verification
 */

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

interface OracleData {
  facts: string[];
  sources: string[];
  confidence?: number;
  timestamp?: string;
}

interface ResolutionResult {
  outcome: boolean;
  signature: string;
  reasoning: string;
  explanation: string; // Detailed 2-4 sentence explanation
  confidence: number;
  sources: string[];
  evidence: string[]; // Key facts used
  resolverType: "AI_AUTO" | "FALLBACK";
}

/**
 * Initialize resolver wallet from environment variable
 */
function getResolverWallet(): ethers.Wallet {
  const privateKey = process.env.RESOLVER_PRIVATE_KEY;
  
  if (!privateKey) {
    throw new Error("RESOLVER_PRIVATE_KEY not configured");
  }

  return new ethers.Wallet(privateKey);
}

/**
 * AI-powered analysis using Groq
 */
async function analyzeWithAI(
  question: string,
  resolutionCriteria: string,
  oracleData: OracleData
): Promise<{ outcome: boolean; explanation: string; confidence: number; evidence: string[] }> {
  
  if (!process.env.GROQ_API_KEY) {
    console.warn("⚠️ GROQ_API_KEY not configured, using fallback logic");
    return analyzeWithLogic(resolutionCriteria, oracleData);
  }

  try {
    const prompt = `You are a professional prediction market oracle resolver. Analyze this contest and determine the outcome.

CONTEST QUESTION:
"${question}"

RESOLUTION CRITERIA:
${resolutionCriteria}

ORACLE DATA:
${oracleData.facts.map((fact, i) => `${i + 1}. ${fact}`).join('\n')}

DATA SOURCES:
${oracleData.sources.join(', ')}

Your task:
1. Determine if the answer is YES or NO based on the criteria
2. Provide a clear 2-4 sentence explanation
3. Rate your confidence (0.0-1.0)
4. List key evidence used

Return ONLY valid JSON:
{
  "outcome": true/false,
  "explanation": "...",
  "confidence": 0.95,
  "evidence": ["fact 1", "fact 2"]
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an impartial prediction market oracle. Always return valid JSON only. Be objective and evidence-based.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1, // Low temperature for consistency
      max_tokens: 500,
    });

    const content = completion.choices[0]?.message?.content || "{}";
    
    // Extract JSON
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/```\n?/g, '');
    }
    
    const result = JSON.parse(jsonContent);

    return {
      outcome: result.outcome,
      explanation: result.explanation,
      confidence: Math.min(Math.max(result.confidence, 0), 1),
      evidence: result.evidence || [],
    };

  } catch (error) {
    console.error("AI analysis failed, using fallback:", error);
    return analyzeWithLogic(resolutionCriteria, oracleData);
  }
}

/**
 * Deterministic resolution logic (Fallback)
 */
function analyzeWithLogic(
  resolutionCriteria: string,
  oracleData: OracleData
): { outcome: boolean; explanation: string; confidence: number; evidence: string[] } {
  
  // Simple keyword-based analysis for fallback
  const positivePhrases = [
    "official announcement",
    "confirmed",
    "published",
    "verified",
    "reached",
    "exceeded"
  ];

  const negativePhrases = [
    "no evidence",
    "denied",
    "cancelled",
    "rejected",
    "failed",
    "below"
  ];

  const factsText = oracleData.facts.join(" ").toLowerCase();
  
  const positiveCount = positivePhrases.filter(phrase => 
    factsText.includes(phrase)
  ).length;

  const negativeCount = negativePhrases.filter(phrase =>
    factsText.includes(phrase)
  ).length;

  const outcome = positiveCount > negativeCount;
  const confidence = Math.min(
    0.6 + (Math.abs(positiveCount - negativeCount) * 0.1),
    0.95
  );

  const explanation = outcome
    ? `Based on ${positiveCount} positive indicators in the oracle data, the resolution criteria appears to be met. The evidence suggests the outcome is YES.`
    : `Based on ${negativeCount} negative indicators or lack of positive evidence, the resolution criteria does not appear to be met. The outcome is NO.`;

  const evidence = oracleData.facts.slice(0, 3); // Use first 3 facts as evidence

  return { outcome, explanation, confidence, evidence };
}

/**
 * Create and sign resolution decision
 */
export async function resolveWithAgent(
  contestId: number,
  question: string,
  resolutionCriteria: string,
  oracleData: OracleData
): Promise<ResolutionResult> {
  
  // Step 1: Analyze the data with AI
  const { outcome, explanation, confidence, evidence } = await analyzeWithAI(
    question,
    resolutionCriteria,
    oracleData
  );

  // Step 2: Create message hash (must match contract logic)
  const messageHash = ethers.solidityPackedKeccak256(
    ["uint256", "bool"],
    [contestId, outcome]
  );

  // Step 3: Sign the message
  const resolverWallet = getResolverWallet();
  const signature = await resolverWallet.signMessage(
    ethers.getBytes(messageHash)
  );

  // Step 4: Build short reasoning for backward compatibility
  const reasoning = `AI Resolution: ${outcome ? "YES" : "NO"} (${(confidence * 100).toFixed(0)}% confidence)`;

  return {
    outcome,
    signature,
    reasoning, // Short version
    explanation, // Detailed 2-4 sentences
    confidence,
    sources: oracleData.sources,
    evidence,
    resolverType: process.env.GROQ_API_KEY ? "AI_AUTO" : "FALLBACK",
  };
}

/**
 * Verify a signature matches expected resolver (testing utility)
 */
export function verifyResolverSignature(
  contestId: number,
  outcome: boolean,
  signature: string
): { valid: boolean; signer: string } {
  
  const messageHash = ethers.solidityPackedKeccak256(
    ["uint256", "bool"],
    [contestId, outcome]
  );

  const signer = ethers.verifyMessage(
    ethers.getBytes(messageHash),
    signature
  );

  const expectedSigner = process.env.RESOLVER_ADDRESS;
  
  return {
    valid: signer.toLowerCase() === expectedSigner?.toLowerCase(),
    signer
  };
}
