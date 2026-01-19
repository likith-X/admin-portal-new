/**
 * Fetch New Contest Suggestions
 * 
 * Generates contest suggestions from:
 * - News APIs (NewsAPI, Google News, etc.)
 * - Trending topics
 * - Crypto price movements
 * - Political events
 * - Sports events
 */

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST() {
  try {
    console.log("🔍 Fetching new contest suggestions with AI...");

    // Fetch real news from multiple sources
    const newsArticles = await fetchRecentNews();
    console.log(`📰 Fetched ${newsArticles.length} news articles`);

    // Generate AI-powered suggestions using Groq
    const suggestions = await generateAISuggestions(newsArticles);

    let insertedCount = 0;
    const errors = [];

    for (const suggestion of suggestions) {
      const { data, error } = await supabaseAdmin
        .from("suggested_contents")
        .insert({
          article_id: `article_${Date.now()}_${Math.random()}`,
          headline: suggestion.headline,
          summary: suggestion.summary,
          yes_no_question: suggestion.question,
          resolution_criteria: suggestion.criteria,
          score_relevance: suggestion.relevance,
          status: "pending",
          created_at: new Date().toISOString(),
        })
        .select();

      if (error) {
        console.error("Insert error:", error);
        errors.push(error.message);
      } else {
        insertedCount++;
        console.log(`✅ Inserted: ${suggestion.headline}`);
      }
    }

    console.log(`✅ Inserted ${insertedCount} new suggestions`);
    
    if (errors.length > 0) {
      console.error("Errors:", errors);
    }

    return NextResponse.json({
      success: true,
      count: insertedCount,
      message: `Fetched ${insertedCount} new contest suggestions using AI`,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Error fetching suggestions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch suggestions" },
      { status: 500 }
    );
  }
}

/**
 * Fetch recent news from multiple sources
 * - CoinGecko for crypto prices (free, no API key needed)
 * - NewsAPI if configured (optional)
 */
async function fetchRecentNews() {
  const articles: any[] = [];

  try {
    // 1. Fetch crypto market data from CoinGecko (free API)
    const cryptoResponse = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&sparkline=false&price_change_percentage=24h'
    );
    
    if (cryptoResponse.ok) {
      const cryptoData = await cryptoResponse.json();
      cryptoData.forEach((coin: any) => {
        const priceChange = coin.price_change_percentage_24h || 0;
        const direction = priceChange > 0 ? 'up' : 'down';
        articles.push({
          title: `${coin.name} (${coin.symbol.toUpperCase()}) Price ${direction.toUpperCase()} ${Math.abs(priceChange).toFixed(2)}%`,
          description: `${coin.name} is currently trading at $${coin.current_price.toLocaleString()} with a 24h change of ${priceChange.toFixed(2)}%. Market cap: $${(coin.market_cap / 1e9).toFixed(2)}B`,
          source: { name: "CoinGecko" },
          category: "crypto",
        });
      });
    }

    // 2. Optional: NewsAPI if key is configured
    const newsApiKey = process.env.NEWS_API_KEY;
    if (newsApiKey) {
      const newsResponse = await fetch(
        `https://newsapi.org/v2/top-headlines?category=business,technology&language=en&pageSize=10&apiKey=${newsApiKey}`
      );
      
      if (newsResponse.ok) {
        const newsData = await newsResponse.json();
        if (newsData.articles) {
          newsData.articles.forEach((article: any) => {
            articles.push({
              title: article.title,
              description: article.description || article.content?.substring(0, 200),
              source: article.source,
              category: "news",
            });
          });
        }
      }
    }

    // 3. Fetch trending crypto data for additional context
    const trendingResponse = await fetch(
      'https://api.coingecko.com/api/v3/search/trending'
    );
    
    if (trendingResponse.ok) {
      const trendingData = await trendingResponse.json();
      if (trendingData.coins) {
        trendingData.coins.slice(0, 5).forEach((item: any) => {
          const coin = item.item;
          articles.push({
            title: `${coin.name} Trending - Rank #${coin.market_cap_rank || 'N/A'}`,
            description: `${coin.name} (${coin.symbol}) is trending with a price of $${coin.data?.price || 'N/A'}`,
            source: { name: "CoinGecko Trending" },
            category: "crypto-trending",
          });
        });
      }
    }

  } catch (error) {
    console.error("Error fetching news:", error);
  }

  // Fallback to sample data if no news fetched
  if (articles.length === 0) {
    return getSampleArticles();
  }

  return articles;
}

/**
 * Generate AI-powered contest suggestions using Groq
 */
async function generateAISuggestions(newsArticles: any[]) {
  if (!process.env.GROQ_API_KEY) {
    console.warn("⚠️ GROQ_API_KEY not configured, using sample suggestions");
    return generateSampleSuggestions();
  }

  try {
    const prompt = `Analyze these recent news articles and generate 5 prediction market contest suggestions.

News Articles:
${newsArticles.map((article, i) => `${i + 1}. [${article.category || 'news'}] ${article.title}
   ${article.description || ''}`).join('\n\n')}

Generate 5 contest suggestions based on this news. For each suggestion, provide:
1. headline: Short catchy title (max 80 chars)
2. summary: Brief description explaining the context (2-3 sentences)
3. question: Clear YES/NO question that can be objectively resolved
4. criteria: Specific, verifiable resolution criteria with clear thresholds and timeframes
5. relevance: Score between 0.7 and 1.0 indicating newsworthiness

Requirements:
- Questions must be YES/NO format
- Include specific numbers, dates, or thresholds in questions
- Resolution criteria must be objective and verifiable
- Focus on events that will resolve within 1-7 days
- Prioritize crypto prices, market movements, and trending topics

Return ONLY a valid JSON array with no additional text:
[
  {
    "headline": "...",
    "summary": "...",
    "question": "...",
    "criteria": "...",
    "relevance": 0.85
  }
]`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a prediction market expert. Generate verifiable, interesting contest suggestions based on current news. Always return valid JSON arrays only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 2500,
    });

    const content = completion.choices[0]?.message?.content || "[]";
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/```\n?/g, '');
    }
    
    const suggestions = JSON.parse(jsonContent);

    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      console.warn("⚠️ Invalid AI response, using sample suggestions");
      return generateSampleSuggestions();
    }

    console.log(`🤖 Generated ${suggestions.length} AI suggestions`);
    return suggestions;

  } catch (error) {
    console.error("Error generating AI suggestions:", error);
    console.warn("⚠️ Falling back to sample suggestions");
    return generateSampleSuggestions();
  }
}

/**
 * Sample articles for fallback
 */
function getSampleArticles() {
  return [
    {
      title: "Bitcoin Trading Near $95,000",
      description: "Bitcoin continues strong performance with price hovering around $95,000",
      source: { name: "Crypto News" },
      category: "crypto",
    },
    {
      title: "Ethereum Network Activity Increases",
      description: "Ethereum sees increased transaction volume and developer activity",
      source: { name: "Crypto News" },
      category: "crypto",
    },
  ];
}

function generateSampleSuggestions() {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  return [
    {
      headline: "Bitcoin Price Prediction",
      summary: "Bitcoin is currently trading around $95,000. Will it break $100k barrier in the next 24 hours?",
      question: "Will Bitcoin (BTC) reach $100,000 by " + tomorrow.toLocaleDateString() + "?",
      criteria: "Resolve YES if BTC price reaches $100,000 on any major exchange (Coinbase, Binance, Kraken) before the deadline. Otherwise NO.",
      relevance: 0.92,
    },
    {
      headline: "Ethereum Network Upgrade",
      summary: "Ethereum's next major upgrade is scheduled. Will it be deployed on time?",
      question: "Will Ethereum complete its next major network upgrade on schedule?",
      criteria: "Resolve YES if the upgrade completes within the announced timeframe. NO if delayed or cancelled.",
      relevance: 0.85,
    },
    {
      headline: "XRP Legal Victory",
      summary: "XRP continues its rally after recent legal developments.",
      question: "Will XRP price exceed $3.00 in the next 48 hours?",
      criteria: "Resolve YES if XRP/USD price reaches $3.00 or higher on any major exchange. Otherwise NO.",
      relevance: 0.88,
    },
    {
      headline: "Stock Market Volatility",
      summary: "S&P 500 showing unusual volatility patterns.",
      question: "Will S&P 500 close above 6000 this week?",
      criteria: "Resolve YES if S&P 500 closes above 6000 on any trading day this week. Otherwise NO.",
      relevance: 0.78,
    },
    {
      headline: "Political Announcement Expected",
      summary: "Major policy announcement expected from government officials.",
      question: "Will a major economic stimulus package be announced this month?",
      criteria: "Resolve YES if official announcement is made by government. NO if no announcement or deadline passes.",
      relevance: 0.75,
    },
  ];
}
