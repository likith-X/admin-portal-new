/**
 * Fetch New Contest Suggestions
 * 
 * Generates contest suggestions from multiple diverse sources:
 * - CoinGecko (crypto market data - top coins + trending)
 * - Reddit (trending posts from r/all)
 * - HackerNews (top technology stories)
 * - NewsAPI (US headlines across all categories)
 * - Covers: crypto, technology, politics, sports, business, entertainment, trending topics
 */

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import Groq from "groq-sdk";
import { randomUUID } from "crypto";

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
      try {
        // Insert suggestion without article_id (make it optional/nullable)
        const { data, error } = await supabaseAdmin
          .from("suggested_contents")
          .insert({
            // article_id: removed - let database handle it or make it nullable
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
      } catch (err: any) {
        console.error("Insert exception:", err);
        errors.push(err.message);
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
 * - Reddit trending posts (free, no API key needed)
 * - HackerNews top stories (free, no API key needed)
 * - NewsAPI if configured (optional)
 */
async function fetchExaTrending() {
  if (!process.env.EXA_API_KEY) return [];
  try {
    const response = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.EXA_API_KEY,
      },
      body: JSON.stringify({
        query: "upcoming predictable events in tech, politics, and science this week",
        numResults: 10,
        useAutoprompt: true,
      }),
    });
    const data = await response.json();
    console.log(`🤖 Exa: Fetched ${data.results?.length || 0} neural search results`);
    return data.results?.map((r: any) => ({
      title: r.title,
      description: `Predictable event: ${r.url}`,
      source: { name: "Exa Neural Search" },
      category: "predictable",
    })) || [];
  } catch (error) {
    console.error("Exa suggestion error:", error);
    return [];
  }
}

async function fetchFMPMarketMovers() {
  if (!process.env.FINANCIAL_MODELING_PREP_API_KEY) return [];
  try {
    const response = await fetch(
      `https://financialmodelingprep.com/api/v3/stock_market/actives?apikey=${process.env.FINANCIAL_MODELING_PREP_API_KEY}`
    );
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.warn("FMP market movers: Response is not an array", data);
      return [];
    }

    console.log(`📊 FMP: Fetched ${data.length} market movers`);
    return data.slice(0, 5).map((stock: any) => ({
      title: `${stock.name} (${stock.symbol}) is highly active with ${stock.changesPercentage}% change`,
      description: `Current price: $${stock.price}. Daily volume: ${stock.volume}`,
      source: { name: "Financial Modeling Prep" },
      category: "business",
    }));
  } catch (error) {
    console.error("FMP market movers error:", error);
    return [];
  }
}

async function fetchTheRundownSports() {
  if (!process.env.THE_RUNDOWN_API_KEY) return [];
  try {
    const response = await fetch("https://therundown-therundown-v1.p.rapidapi.com/sports/2/events", {
      headers: {
        "X-RapidAPI-Key": process.env.THE_RUNDOWN_API_KEY,
        "X-RapidAPI-Host": "therundown-therundown-v1.p.rapidapi.com"
      }
    });
    const data = await response.json();
    
    if (!data || !Array.isArray(data.events)) {
      console.warn("The Rundown: No events array found", data);
      return [];
    }

    console.log(`🏀 The Rundown: Fetched ${data.events.length} sports events`);
    return data.events.slice(0, 5).map((e: any) => ({
      title: `${e.teams?.[0]?.name || 'Team 1'} vs ${e.teams?.[1]?.name || 'Team 2'} Game Today`,
      description: `Matchup status: ${e.score?.event_status || 'scheduled'}. Upcoming game with measurable outcome.`,
      source: { name: "The Rundown Sports" },
      category: "sports",
    }));
  } catch (error) {
    console.error("The Rundown sports error:", error);
    return [];
  }
}

/**
 * Fetch recent news from multiple sources
 * - Exa Neural Search for predictable events
 * - Financial Modeling Prep for market data
 * - The Rundown for sports matchups
 * - NewsAPI, CoinGecko, Reddit, HackerNews for diversity
 */
async function fetchRecentNews() {
  const articles: any[] = [];

  try {
    // 1. Parallel fetch from all sources for efficiency
    const results = await Promise.allSettled([
      fetchExaTrending(),
      fetchFMPMarketMovers(),
      fetchTheRundownSports(),
      // Original sources
      fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=3'),
      process.env.NEWS_API_KEY ? fetch(`https://newsapi.org/v2/top-headlines?country=us&language=en&pageSize=10&apiKey=${process.env.NEWS_API_KEY}`) : null,
      fetch('https://www.reddit.com/r/all/hot.json?limit=5', { headers: { 'User-Agent': 'AgentHerald/1.0' } }),
      fetch('https://hacker-news.firebaseio.com/v0/topstories.json?limitToFirst=10')
    ]);

    // 2. Process Results 0, 1, 2 (Directly return arrays)
    if (results[0].status === 'fulfilled') articles.push(...(results[0].value as any[]));
    if (results[1].status === 'fulfilled') articles.push(...(results[1].value as any[]));
    if (results[2].status === 'fulfilled') articles.push(...(results[2].value as any[]));

    // 3. Process Result 3 (CoinGecko)
    if (results[3].status === 'fulfilled') {
      const resp = results[3].value as Response;
      if (resp.status === 200) {
        const cryptoData = await resp.json();
        if (Array.isArray(cryptoData)) {
          cryptoData.forEach((coin: any) => {
            articles.push({
              title: `${coin.name} (${coin.symbol.toUpperCase()}) Market Update`,
              description: `Current price: $${coin.current_price.toLocaleString()}, 24h Change: ${coin.price_change_percentage_24h?.toFixed(2)}%`,
              source: { name: "CoinGecko" },
              category: "crypto",
            });
          });
        }
      }
    }

    // 4. Process Result 4 (NewsAPI)
    if (results[4].status === 'fulfilled' && results[4].value) {
      const resp = results[4].value as Response;
      if (resp.status === 200) {
        const newsData = await resp.json();
        newsData.articles?.forEach((article: any) => {
          articles.push({
            title: article.title,
            description: article.description || article.content?.substring(0, 200),
            source: article.source,
            category: "news",
          });
        });
      }
    }

    // 5. Process Result 5 (Reddit)
    if (results[5].status === 'fulfilled') {
      const resp = results[5].value as Response;
      if (resp.status === 200) {
        const redditData = await resp.json();
        redditData.data?.children?.forEach((post: any) => {
          articles.push({
            title: post.data.title,
            description: `Trending on Reddit with ${post.data.ups} upvotes.`,
            source: { name: `r/${post.data.subreddit}` },
            category: "trending",
          });
        });
      }
    }

    // 6. Process Result 6 (HackerNews)
    if (results[6].status === 'fulfilled') {
      const resp = results[6].value as Response;
      if (resp.status === 200) {
        const storyIds = await resp.json();
        articles.push({
          title: "Top HackerNews Stories",
          description: `Latest trending tech discussions on HN. Top story ID: ${storyIds[0]}`,
          source: { name: "HackerNews" },
          category: "technology",
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
    const prompt = `Analyze these recent news articles and generate 15 prediction market contest suggestions.

News Articles:
${newsArticles.map((article, i) => `${i + 1}. [${article.category || 'news'}] ${article.title}
   ${article.description || ''}`).join('\n\n')}

Generate 15 contest suggestions based on this news. For each suggestion, provide:
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
- Cover diverse topics: politics, sports, technology, business, entertainment, crypto
- Create contests that appeal to different audiences and interests

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
      title: "Presidential Election Polls Show Tight Race",
      description: "Latest polls indicate narrowing gap between leading candidates ahead of elections",
      source: { name: "Political News" },
      category: "politics",
    },
    {
      title: "NBA Finals Game 7 Tonight",
      description: "Championship series goes to decisive game as teams battle for title",
      source: { name: "Sports News" },
      category: "sports",
    },
    {
      title: "Tech Giant Announces AI Breakthrough",
      description: "Major technology company reveals new artificial intelligence capabilities",
      source: { name: "Tech News" },
      category: "technology",
    },
    {
      title: "Federal Reserve Interest Rate Decision Expected",
      description: "Markets await central bank's monetary policy announcement this week",
      source: { name: "Financial News" },
      category: "business",
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
