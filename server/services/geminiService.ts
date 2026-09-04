import { GoogleGenAI } from '@google/genai';
import type { StructuredAiEvidence, AiExplanationResponse, MarketFreshness } from '../../src/types';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (aiClient) return aiClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  try {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    return aiClient;
  } catch (err) {
    console.warn('Could not initialize GoogleGenAI client:', err);
    return null;
  }
}

/**
 * Generates an objective, calibrated explanation of the meaningful change
 * based STRICTLY on the backend structured evidence.
 */
export async function explainChangeWithGemini(
  evidence: StructuredAiEvidence,
  freshness: MarketFreshness
): Promise<AiExplanationResponse> {
  const isStale = freshness === 'stale';
  const isDelayed = freshness === 'delayed';

  const client = getAiClient();

  // If Gemini client is unavailable, generate a deterministic fact-grounded explanation
  if (!client) {
    return {
      ticker: evidence.ticker,
      explanation: generateDeterministicFallbackExplanation(evidence, isStale, isDelayed),
      generatedAt: new Date().toISOString(),
      structuredEvidence: evidence,
      modelUsed: 'deterministic-signal-synthesizer',
      isAiFallback: true,
      warningNotice: isStale ? 'Note: Market data is delayed or stale (>30m). Explanation confidence reduced.' : undefined,
    };
  }

  try {
    const prompt = `You are an expert, objective financial intelligence analyst explaining a market change detected by Pulse's deterministic change engine.
Explain what meaningfully changed based ONLY on the following structured evidence.

STRICT REQUIREMENTS:
1. Ground every sentence ONLY in the provided evidence. DO NOT invent prices, volume, news, events, or unverified claims.
2. DO NOT claim direct causation. Use calibrated phrasing like "Coincided with", "Associated with", "Likely contributors include", "Evidence suggests".
3. If the data is stale (${isStale ? 'YES, DATA IS STALE' : 'No'}), clearly acknowledge data freshness and temper confidence.
4. Keep the explanation concise (2 to 3 sentences maximum), high-signal, and suitable for a busy investor.

STRUCTURED EVIDENCE:
- Ticker: ${evidence.ticker} (${evidence.companyName})
- Sector: ${evidence.sectorName}
- Current Price: $${evidence.currentPrice.toFixed(2)}
- Last Checked Price: $${evidence.lastSeenPrice.toFixed(2)}
- Net Price Movement: ${evidence.priceChange >= 0 ? '+' : ''}${evidence.priceChange.toFixed(2)}%
- Normal Daily Volatility: ±${evidence.normalVolatilityPercent}%
- Trading Volume Multiple: ${evidence.volumeMultiple}× 30-day average
- Historical Deviation: ${evidence.historicalDeviationZScore}σ standard deviations from 30-day mean
- Recent High-Relevance News Articles: ${evidence.newsCount}
- Detected Corporate Events: ${evidence.events.length > 0 ? evidence.events.join(', ') : 'None'}
- Broader Market Movement (Benchmark Index): ${evidence.marketChange >= 0 ? '+' : ''}${evidence.marketChange.toFixed(2)}%
- Pulse Deterministic Change Score: ${evidence.totalScore}/100 (${evidence.classification})
- Data Freshness: ${freshness}`;

    const systemInstruction = `You are an expert, objective financial intelligence analyst for Pulse.
Explain what meaningfully changed based ONLY on the provided structured evidence in 2 to 3 concise, factual sentences.
Ground every statement strictly in the evidence. DO NOT claim direct causation; use calibrated phrasing such as "Coincided with", "Associated with", "Evidence suggests". Never invent unverified data.`;

    // Prioritize high-availability, low-latency models to prevent 503 demand spikes
    const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        const response = await client.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction,
            temperature: 0.2,
          },
        });

        const explanationText = response.text?.trim();
        if (explanationText && explanationText.length > 20) {
          return {
            ticker: evidence.ticker,
            explanation: explanationText,
            generatedAt: new Date().toISOString(),
            structuredEvidence: evidence,
            modelUsed: model,
            isAiFallback: false,
            warningNotice: isStale ? 'Market data updated >30m ago. Analysis reflects delayed indicators.' : undefined,
          };
        }
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || err?.status || 'service unavailable';
        // Note transition concisely without emitting alarming unhandled stack traces
        console.info(`[Pulse Gemini Service] Model ${model} response notice (${msg}), checking alternate...`);
      }
    }

    throw lastError || new Error('All candidate models exhausted');
  } catch (error) {
    console.error('Gemini API call failed, falling back to structured engine explanation:', error);
    return {
      ticker: evidence.ticker,
      explanation: generateDeterministicFallbackExplanation(evidence, isStale, isDelayed),
      generatedAt: new Date().toISOString(),
      structuredEvidence: evidence,
      modelUsed: 'deterministic-signal-synthesizer (fallback)',
      isAiFallback: true,
      warningNotice: 'AI explanation temporarily degraded to deterministic signal view.',
    };
  }
}

function generateDeterministicFallbackExplanation(
  evidence: StructuredAiEvidence,
  isStale: boolean,
  isDelayed: boolean
): string {
  const parts: string[] = [];

  const moveRatio = (Math.abs(evidence.priceChange) / Math.max(evidence.normalVolatilityPercent, 0.5)).toFixed(1);
  const direction = evidence.priceChange >= 0 ? 'gained' : 'declined';

  parts.push(
    `${evidence.ticker} ${direction} ${Math.abs(evidence.priceChange).toFixed(1)}% since your last check, a movement ${moveRatio}× larger than its typical ±${evidence.normalVolatilityPercent}% daily range.`
  );

  if (evidence.volumeMultiple >= 1.8) {
    parts.push(`Trading volume reached approximately ${evidence.volumeMultiple}× normal 30-day levels.`);
  }

  if (evidence.events.length > 0) {
    parts.push(`The movement coincided with documented company developments (${evidence.events.join(', ')}).`);
  } else if (evidence.newsCount > 0) {
    parts.push(`Activity was accompanied by ${evidence.newsCount} high-relevance news items.`);
  }

  if (Math.abs(evidence.priceChange - evidence.marketChange) >= 2.0) {
    parts.push(
      `With the broader market moving ${evidence.marketChange >= 0 ? '+' : ''}${evidence.marketChange.toFixed(2)}%, evidence indicates strong company-specific divergence.`
    );
  }

  if (isStale) {
    parts.push('Note: This data is currently marked as stale (>30 min delay).');
  }

  return parts.join(' ');
}
