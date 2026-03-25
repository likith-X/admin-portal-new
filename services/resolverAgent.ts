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
  explanation: string;
  confidence: number;
  sources: string[];
  evidence: string[];
  resolverType: "AI_AUTO" | "FALLBACK";
  researchData?: any; // Added to track deep research findings
}

/**
 * Initialize resolver wallet from environment variable
 */
function getResolverWallet(): ethers.Wallet {
  const privateKey = process.env.RESOLVER_PRIVATE_KEY;
  if (!privateKey) throw new Error("RESOLVER_PRIVATE_KEY not configured");
  return new ethers.Wallet(privateKey);
}

/**
 * Deep Research Tools using new APIs
 */
async function searchExa(query: string): Promise<string[]> {
  if (!process.env.EXA_API_KEY) return [];
  try {
    const response = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.EXA_API_KEY,
      },
      body: JSON.stringify({
        query,
        numResults: 5,
        useAutoprompt: true,
        contents: { text: true }
      }),
    });
    const data = await response.json();
    return data.results?.map((r: any) => `[Exa Search] ${r.title}: ${r.text.substring(0, 300)}...`) || [];
  } catch (error) {
    console.error("Exa search error:", error);
    return [];
  }
}

async function fetchFMP(symbol: string): Promise<string[]> {
  if (!process.env.FINANCIAL_MODELING_PREP_API_KEY) return [];
  try {
    const response = await fetch(
      `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${process.env.FINANCIAL_MODELING_PREP_API_KEY}`
    );
    const data = await response.json();
    if (data && data[0]) {
      const q = data[0];
      return [`[FMP Market Data] ${q.name} (${q.symbol}): Price $${q.price}, Change ${q.changesPercentage}%, High $${q.dayHigh}, Low $${q.dayLow}`];
    }
    return [];
  } catch (error) {
    console.error("FMP fetch error:", error);
    return [];
  }
}

async function fetchTheRundown(sportId: number = 2): Promise<string[]> {
  if (!process.env.THE_RUNDOWN_API_KEY) return [];
  try {
    // Note: The Rundown often requires specific endpoints for sports. Defaulting to NBA (2) as example.
    const response = await fetch(`https://therundown-therundown-v1.p.rapidapi.com/sports/${sportId}/events`, {
      headers: {
        "X-RapidAPI-Key": process.env.THE_RUNDOWN_API_KEY,
        "X-RapidAPI-Host": "therundown-therundown-v1.p.rapidapi.com"
      }
    });
    const data = await response.json();
    return data.events?.slice(0, 3).map((e: any) => 
      `[The Rundown Sports] ${e.teams[0].name} vs ${e.teams[1].name}: Score ${e.score.score_away}-${e.score.score_home}, Status: ${e.score.event_status}`
    ) || [];
  } catch (error) {
    console.error("The Rundown error:", error);
    return [];
  }
}

/**
 * Intelligent Deep Research based on contest content
 */
async function performDeepResearch(question: string, criteria: string): Promise<string[]> {
  const findings: string[] = [];
  const qLower = question.toLowerCase();

  // 1. Always use Exa for the primary search
  console.log(`🔍 Deep research starting for: "${question}"`);
  const exaResults = await searchExa(`Latest facts and resolution for: ${question} based on criteria: ${criteria}`);
  findings.push(...exaResults);

  // 2. Market/Financial Specific Research
  if (qLower.includes("price") || qLower.includes("stock") || qLower.includes("$") || qLower.includes("market cap")) {
    const symbols = ["BTC", "ETH", "AAPL", "TSLA", "NVDA", "SPY"]; // Simple heuristic or AI could extract this
    for (const s of symbols) {
      if (qLower.includes(s.toLowerCase())) {
        const fmpData = await fetchFMP(s);
        findings.push(...fmpData);
      }
    }
  }

  // 3. Sports Specific Research
  if (qLower.includes("score") || qLower.includes("game") || qLower.includes("match") || qLower.includes("win")) {
    const sportsData = await fetchTheRundown();
    findings.push(...sportsData);
  }

  return findings;
}

/**
 * AI-powered analysis using Groq
 */
async function analyzeWithAI(
  question: string,
  resolutionCriteria: string,
  oracleData: OracleData,
  researchFindings: string[] = [] // New parameter
): Promise<{ outcome: boolean; explanation: string; confidence: number; evidence: string[] }> {
  
  if (!process.env.GROQ_API_KEY) {
    console.warn("⚠️ GROQ_API_KEY not configured, using fallback logic");
    return analyzeWithLogic(resolutionCriteria, oracleData);
  }

  try {
    const combinedFacts = [...oracleData.facts, ...researchFindings];
    
    const prompt = `You are a professional prediction market oracle resolver. Analyze this contest and determine the outcome.

CONTEST QUESTION:
"${question}"

RESOLUTION CRITERIA:
${resolutionCriteria}

ORACLE FACTS (BASE):
${oracleData.facts.length > 0 ? oracleData.facts.map((fact, i) => `${i + 1}. ${fact}`).join('\n') : "No base facts."}

DEEP RESEARCH FINDINGS (REAL-TIME):
${researchFindings.length > 0 ? researchFindings.map((fact, i) => `${i + 1}. ${fact}`).join('\n') : "No additional findings."}

Your task:
1. Evaluate if the answer is YES or NO based EXCLUSIVELY on the criteria.
2. If the data is insufficient, provide your best estimate but note the uncertainty.
3. Provide a clear 2-4 sentence explanation.
4. Rate your confidence (0.0-1.0).
5. List EXACT evidence strings from the data used.

Return ONLY valid JSON:
{
  "outcome": true/false,
  "explanation": "...",
  "confidence": 0.95,
  "evidence": ["...", "..."]
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an impartial, evidence-based prediction market oracle. Accuracy and adherence to criteria are paramount. Return ONLY valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      max_tokens: 800,
    });

    const content = completion.choices[0]?.message?.content || "{}";
    let jsonContent = content.trim();
    if (jsonContent.includes('```json')) jsonContent = jsonContent.split('```json')[1].split('```')[0].trim();
    else if (jsonContent.includes('```')) jsonContent = jsonContent.split('```')[1].trim();
    
    const result = JSON.parse(jsonContent);

    return {
      outcome: !!result.outcome,
      explanation: result.explanation,
      confidence: Math.min(Math.max(result.confidence || 0.5, 0.0), 1.0),
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
  const positivePhrases = ["official announcement", "confirmed", "verified", "reached", "exceeded", "above", "higher", "true"];
  const negativePhrases = ["no evidence", "denied", "cancelled", "rejected", "failed", "below", "lower", "false"];

  const factsText = oracleData.facts.join(" ").toLowerCase();
  const positiveCount = positivePhrases.filter(p => factsText.includes(p)).length;
  const negativeCount = negativePhrases.filter(p => factsText.includes(p)).length;

  const outcome = positiveCount > negativeCount;
  const confidence = Math.min(0.6 + (Math.abs(positiveCount - negativeCount) * 0.1), 0.9);
  const explanation = outcome
    ? `Heuristic check: ${positiveCount} positive signals vs ${negativeCount} negative. Data leans towards YES.`
    : `Heuristic check: ${negativeCount} negative signals vs ${positiveCount} positive. Data leans towards NO.`;

  return { outcome, explanation, confidence, evidence: oracleData.facts.slice(0, 3) };
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
  
  // Step 1: Perform Deep Research using new APIs
  const researchFindings = await performDeepResearch(question, resolutionCriteria);

  // Step 2: Analyze everything with AI
  const { outcome, explanation, confidence, evidence } = await analyzeWithAI(
    question,
    resolutionCriteria,
    oracleData,
    researchFindings
  );

  // Step 3: Create message hash (must match contract logic)
  const messageHash = ethers.solidityPackedKeccak256(
    ["uint256", "bool"],
    [contestId, outcome]
  );

  // Step 4: Sign the message
  const resolverWallet = getResolverWallet();
  const signature = await resolverWallet.signMessage(
    ethers.getBytes(messageHash)
  );

  return {
    outcome,
    signature,
    reasoning: `Resolution: ${outcome ? "YES" : "NO"} (${(confidence * 100).toFixed(0)}% confidence)`,
    explanation,
    confidence,
    sources: [...oracleData.sources, "Exa Deep Research", "FMP Market Data", "The Rundown Sports"],
    evidence: [...evidence, ...researchFindings.slice(0, 2)],
    resolverType: process.env.GROQ_API_KEY ? "AI_AUTO" : "FALLBACK",
  };
}

/**
 * Verify a signature matches expected resolver
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
