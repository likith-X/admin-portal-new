/**
 * Oracle Data Fetcher
 * 
 * Fetches real-time data from free APIs to provide factual context
 * for AI-powered contest resolution across ALL categories:
 * - Crypto prices (CoinGecko)
 * - Sports scores & standings (ESPN, TheSportsDB)
 * - Weather data (Open-Meteo)
 * - Politics & elections (NewsAPI, Wikipedia)
 * - Technology & business (HackerNews, Reddit, NewsAPI)
 * - Entertainment (Reddit, NewsAPI)
 * - General knowledge (Wikipedia)
 */

interface OracleData {
  facts: string[];
  sources: string[];
}

/**
 * Fetch real oracle data relevant to a contest question
 */
export async function fetchOracleData(question: string): Promise<OracleData> {
  const facts: string[] = [];
  const sources: string[] = [];

  // Always add the current date/time
  facts.push(`Current date and time: ${new Date().toISOString()}`);

  const questionLower = question.toLowerCase();

  // Run all relevant data fetches in parallel
  const fetchPromises: Promise<OracleData>[] = [];

  // 1. Crypto price data
  const cryptoMentions = detectCryptoMentions(questionLower);
  if (cryptoMentions.length > 0) {
    fetchPromises.push(fetchCryptoPrices(cryptoMentions));
  }

  // 2. Sports data
  if (questionLower.match(/\b(nba|nfl|mlb|nhl|soccer|football|basketball|baseball|hockey|tennis|cricket|olympic|world cup|championship|game|match|win|score|team|player|tournament|grand slam|ufc|boxing|f1|formula|race|premier league|la liga|serie a|bundesliga|mls|ipl)\b/)) {
    fetchPromises.push(fetchSportsData(question));
  }

  // 3. Weather data
  if (questionLower.match(/\b(weather|temperature|rain|snow|storm|hurricane|tornado|flood|heat wave|cold|celsius|fahrenheit|forecast)\b/)) {
    fetchPromises.push(fetchWeatherData(question));
  }

  // 4. Stock market data
  if (questionLower.match(/\b(stock|s&p|nasdaq|dow|nyse|share price|market cap|earnings|ipo|revenue|apple|google|microsoft|amazon|tesla|nvidia|meta)\b/)) {
    fetchPromises.push(fetchStockData(questionLower));
  }

  // 5. Politics & elections
  if (questionLower.match(/\b(president|election|vote|poll|congress|senate|governor|parliament|prime minister|legislation|bill|law|policy|democrat|republican|party|campaign|political|government|sanction|war|treaty|nato|un |united nations)\b/)) {
    fetchPromises.push(fetchPoliticsData(question));
  }

  // 6. Technology
  if (questionLower.match(/\b(ai |artificial intelligence|chatgpt|openai|google|apple|microsoft|amazon|meta|startup|app|release|launch|update|software|hardware|chip|semiconductor|spacex|nasa|rocket|space)\b/)) {
    fetchPromises.push(fetchTechData(question));
  }

  // 7. Entertainment & culture
  if (questionLower.match(/\b(movie|film|oscar|grammy|emmy|album|song|artist|concert|tour|netflix|disney|streaming|box office|tv show|series|youtube|tiktok|viral|celebrity|award)\b/)) {
    fetchPromises.push(fetchEntertainmentData(question));
  }

  // 8. Always fetch relevant news (covers everything)
  fetchPromises.push(fetchRelevantNews(question));

  // 9. Wikipedia for general knowledge context
  fetchPromises.push(fetchWikipediaContext(question));

  // Execute all fetches in parallel
  const results = await Promise.allSettled(fetchPromises);

  for (const result of results) {
    if (result.status === "fulfilled") {
      facts.push(...result.value.facts);
      sources.push(...result.value.sources);
    }
  }

  // Fallback if no data fetched
  if (facts.length <= 1) {
    facts.push(`Question: ${question}`);
    facts.push("Note: No specific real-time data available. Resolve based on general knowledge.");
    sources.push("General Knowledge");
  }

  return { facts, sources };
}

/**
 * Detect cryptocurrency mentions in a question
 */
function detectCryptoMentions(question: string): string[] {
  const cryptoMap: Record<string, string> = {
    bitcoin: "bitcoin",
    btc: "bitcoin",
    ethereum: "ethereum",
    eth: "ethereum",
    solana: "solana",
    sol: "solana",
    dogecoin: "dogecoin",
    doge: "dogecoin",
    xrp: "ripple",
    ripple: "ripple",
    cardano: "cardano",
    ada: "cardano",
    polkadot: "polkadot",
    dot: "polkadot",
    chainlink: "chainlink",
    link: "chainlink",
    avalanche: "avalanche",
    avax: "avalanche",
    polygon: "matic-network",
    matic: "matic-network",
    tether: "tether",
    usdt: "tether",
    "pudgy penguins": "pudgy-penguins",
    pengu: "pudgy-penguins",
    coinbase: "coinbase",
    bnb: "binancecoin",
    binance: "binancecoin",
    tron: "tron",
    trx: "tron",
    litecoin: "litecoin",
    ltc: "litecoin",
    shiba: "shiba-inu",
    shib: "shiba-inu",
    pepe: "pepe",
  };

  const found: string[] = [];
  for (const [keyword, coinId] of Object.entries(cryptoMap)) {
    // Use word boundary to avoid false matches (e.g., "the" matching "eth")
    const regex = new RegExp(`\\b${keyword}\\b`, "i");
    if (regex.test(question) && !found.includes(coinId)) {
      found.push(coinId);
    }
  }
  return found;
}

/**
 * Fetch real-time crypto prices from CoinGecko (free, no API key)
 */
async function fetchCryptoPrices(coinIds: string[]): Promise<OracleData> {
  const facts: string[] = [];
  const sources: string[] = [];

  try {
    const ids = coinIds.join(",");
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=1h,24h,7d`
    );

    if (response.ok) {
      const data = await response.json();
      for (const coin of data) {
        const priceChange1h = coin.price_change_percentage_1h_in_currency?.toFixed(2) || "N/A";
        const priceChange24h = coin.price_change_percentage_24h?.toFixed(2) || "N/A";
        const priceChange7d = coin.price_change_percentage_7d_in_currency?.toFixed(2) || "N/A";
        
        facts.push(
          `${coin.name} (${coin.symbol.toUpperCase()}) current price: $${coin.current_price.toLocaleString()} USD`
        );
        facts.push(
          `${coin.name} price changes: 1h: ${priceChange1h}%, 24h: ${priceChange24h}%, 7d: ${priceChange7d}%`
        );
        facts.push(
          `${coin.name} 24h high: $${coin.high_24h?.toLocaleString() || "N/A"}, 24h low: $${coin.low_24h?.toLocaleString() || "N/A"}`
        );
        facts.push(
          `${coin.name} market cap: $${(coin.market_cap / 1e9).toFixed(2)}B, 24h volume: $${(coin.total_volume / 1e9).toFixed(2)}B`
        );
      }
      sources.push("CoinGecko (real-time price data)");
    }
  } catch (error) {
    console.error("Error fetching crypto prices:", error);
    facts.push("Failed to fetch real-time crypto price data");
  }

  return { facts, sources };
}

/**
 * Fetch stock-related data from Yahoo Finance (free)
 */
async function fetchStockData(question: string): Promise<OracleData> {
  const facts: string[] = [];
  const sources: string[] = [];

  // Detect stock tickers
  const tickers: Record<string, string> = {
    apple: "AAPL", google: "GOOGL", microsoft: "MSFT", amazon: "AMZN",
    tesla: "TSLA", nvidia: "NVDA", meta: "META", netflix: "NFLX",
    "s&p": "^GSPC", nasdaq: "^IXIC", dow: "^DJI",
  };

  for (const [name, ticker] of Object.entries(tickers)) {
    if (question.includes(name)) {
      try {
        const response = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=5d`
        );
        if (response.ok) {
          const data = await response.json();
          const result = data.chart?.result?.[0];
          if (result) {
            const meta = result.meta;
            facts.push(`${name.toUpperCase()} (${ticker}) current price: $${meta.regularMarketPrice?.toFixed(2)}`);
            facts.push(`${name.toUpperCase()} previous close: $${meta.previousClose?.toFixed(2)}`);
            const change = ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose * 100).toFixed(2);
            facts.push(`${name.toUpperCase()} daily change: ${change}%`);
          }
        }
      } catch (e) {
        console.error(`Error fetching stock data for ${ticker}:`, e);
      }
    }
  }

  if (facts.length > 0) sources.push("Yahoo Finance (real-time stock data)");
  else {
    facts.push("Note: Stock market operates Mon-Fri 9:30 AM - 4:00 PM ET");
    sources.push("Market Knowledge");
  }

  return { facts, sources };
}

/**
 * Fetch sports data from ESPN and TheSportsDB (free, no API key)
 */
async function fetchSportsData(question: string): Promise<OracleData> {
  const facts: string[] = [];
  const sources: string[] = [];
  const qLower = question.toLowerCase();

  // Detect sport league
  const leagues: Record<string, string> = {
    nba: "basketball/nba", nfl: "football/nfl", mlb: "baseball/mlb",
    nhl: "hockey/nhl", soccer: "soccer/eng.1", "premier league": "soccer/eng.1",
    "la liga": "soccer/esp.1", mls: "soccer/usa.1",
  };

  // Try ESPN API for scores/results
  for (const [keyword, league] of Object.entries(leagues)) {
    if (qLower.includes(keyword)) {
      try {
        const response = await fetch(
          `https://site.api.espn.com/apis/site/v2/sports/${league}/scoreboard`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.events && data.events.length > 0) {
            facts.push(`📅 ${data.leagues?.[0]?.name || keyword.toUpperCase()} - Recent/Upcoming Games:`);
            data.events.slice(0, 5).forEach((event: any) => {
              const status = event.status?.type?.description || "Unknown";
              const competitors = event.competitions?.[0]?.competitors || [];
              if (competitors.length === 2) {
                const home = competitors.find((c: any) => c.homeAway === "home");
                const away = competitors.find((c: any) => c.homeAway === "away");
                facts.push(
                  `${away?.team?.displayName || "Away"} ${away?.score || "?"} @ ${home?.team?.displayName || "Home"} ${home?.score || "?"} - ${status}`
                );
              } else {
                facts.push(`${event.name} - ${status}`);
              }
            });
            sources.push(`ESPN ${keyword.toUpperCase()} Scoreboard`);
          }
        }
      } catch (e) {
        console.error(`Error fetching ESPN ${keyword}:`, e);
      }
      break;
    }
  }

  // Try to find specific team info
  const teamKeywords = question.match(/\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\b/g);
  if (teamKeywords && teamKeywords.length > 0) {
    for (const team of teamKeywords.slice(0, 2)) {
      if (team.length < 3 || ["Will", "The", "Within", "Next"].includes(team)) continue;
      try {
        const response = await fetch(
          `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(team)}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.teams && data.teams.length > 0) {
            const t = data.teams[0];
            facts.push(`Team: ${t.strTeam} (${t.strLeague}) - ${t.strCountry}`);
            if (t.strStadium) facts.push(`Stadium: ${t.strStadium}`);
          }
        }
      } catch (e) { /* skip */ }
    }
  }

  // Olympic data
  if (qLower.includes("olympic")) {
    facts.push("Note: Check official Olympic website for medal counts and event results");
    sources.push("Olympic Knowledge");
  }

  return { facts, sources };
}

/**
 * Fetch weather data from Open-Meteo (free, no API key)
 */
async function fetchWeatherData(question: string): Promise<OracleData> {
  const facts: string[] = [];
  const sources: string[] = [];

  // Common cities for weather questions
  const cities: Record<string, { lat: number; lon: number }> = {
    "new york": { lat: 40.71, lon: -74.01 },
    "los angeles": { lat: 34.05, lon: -118.24 },
    london: { lat: 51.51, lon: -0.13 },
    tokyo: { lat: 35.68, lon: 139.69 },
    paris: { lat: 48.86, lon: 2.35 },
    sydney: { lat: -33.87, lon: 151.21 },
    mumbai: { lat: 19.08, lon: 72.88 },
    delhi: { lat: 28.61, lon: 77.21 },
    dubai: { lat: 25.20, lon: 55.27 },
    singapore: { lat: 1.35, lon: 103.82 },
  };

  const qLower = question.toLowerCase();
  let targetCity: { name: string; lat: number; lon: number } | null = null;

  for (const [city, coords] of Object.entries(cities)) {
    if (qLower.includes(city)) {
      targetCity = { name: city, ...coords };
      break;
    }
  }

  // Default to New York if no specific city mentioned
  if (!targetCity) {
    targetCity = { name: "New York (default)", lat: 40.71, lon: -74.01 };
  }

  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${targetCity.lat}&longitude=${targetCity.lon}&current=temperature_2m,wind_speed_10m,relative_humidity_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=7`
    );

    if (response.ok) {
      const data = await response.json();
      if (data.current) {
        facts.push(`Weather in ${targetCity.name}: ${data.current.temperature_2m}°C, Wind: ${data.current.wind_speed_10m} km/h, Humidity: ${data.current.relative_humidity_2m}%`);
      }
      if (data.daily) {
        data.daily.time.slice(0, 3).forEach((date: string, i: number) => {
          facts.push(`Forecast ${date}: High ${data.daily.temperature_2m_max[i]}°C, Low ${data.daily.temperature_2m_min[i]}°C, Rain: ${data.daily.precipitation_sum[i]}mm`);
        });
      }
      sources.push("Open-Meteo (weather forecast)");
    }
  } catch (e) {
    console.error("Error fetching weather:", e);
  }

  return { facts, sources };
}

/**
 * Fetch politics and government data
 */
async function fetchPoliticsData(question: string): Promise<OracleData> {
  const facts: string[] = [];
  const sources: string[] = [];

  // Fetch political news via Reddit
  try {
    const response = await fetch(
      "https://www.reddit.com/r/politics/hot.json?limit=5",
      { headers: { "User-Agent": "AgentHerald/1.0" } }
    );
    if (response.ok) {
      const data = await response.json();
      if (data.data?.children) {
        facts.push("Recent political developments:");
        data.data.children.slice(0, 5).forEach((post: any) => {
          if (!post.data.over_18) {
            facts.push(`- ${post.data.title} (${post.data.ups} upvotes)`);
          }
        });
        sources.push("Reddit r/politics");
      }
    }
  } catch (e) {
    console.error("Error fetching politics data:", e);
  }

  return { facts, sources };
}

/**
 * Fetch technology news from HackerNews (free, no API key)
 */
async function fetchTechData(question: string): Promise<OracleData> {
  const facts: string[] = [];
  const sources: string[] = [];

  try {
    const hnResponse = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json?limitToFirst=5");
    if (hnResponse.ok) {
      const storyIds = await hnResponse.json();
      const storyPromises = storyIds.slice(0, 5).map((id: number) =>
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(r => r.json())
      );
      const stories = await Promise.all(storyPromises);
      facts.push("Top tech news:");
      stories.forEach((story: any) => {
        if (story?.title) {
          facts.push(`- ${story.title} (${story.score} points)`);
        }
      });
      sources.push("HackerNews (top stories)");
    }
  } catch (e) {
    console.error("Error fetching tech data:", e);
  }

  return { facts, sources };
}

/**
 * Fetch entertainment data from Reddit
 */
async function fetchEntertainmentData(question: string): Promise<OracleData> {
  const facts: string[] = [];
  const sources: string[] = [];

  // Determine relevant subreddit
  const qLower = question.toLowerCase();
  let subreddit = "entertainment";
  if (qLower.match(/movie|film|oscar|box office/)) subreddit = "movies";
  if (qLower.match(/album|song|artist|grammy|concert|tour/)) subreddit = "music";
  if (qLower.match(/tv show|series|netflix|streaming/)) subreddit = "television";
  if (qLower.match(/youtube|tiktok|viral/)) subreddit = "youtube";

  try {
    const response = await fetch(
      `https://www.reddit.com/r/${subreddit}/hot.json?limit=5`,
      { headers: { "User-Agent": "AgentHerald/1.0" } }
    );
    if (response.ok) {
      const data = await response.json();
      if (data.data?.children) {
        facts.push(`Recent ${subreddit} news:`);
        data.data.children.slice(0, 5).forEach((post: any) => {
          if (!post.data.over_18) {
            facts.push(`- ${post.data.title} (${post.data.ups} upvotes)`);
          }
        });
        sources.push(`Reddit r/${subreddit}`);
      }
    }
  } catch (e) {
    console.error(`Error fetching ${subreddit} data:`, e);
  }

  return { facts, sources };
}

/**
 * Fetch Wikipedia context for general knowledge questions
 */
async function fetchWikipediaContext(question: string): Promise<OracleData> {
  const facts: string[] = [];
  const sources: string[] = [];

  // Extract meaningful search terms
  const searchTerms = question
    .replace(/\bwill\b|\bthe\b|\bbe\b|\babove\b|\bbelow\b|\bexceed\b|\bwithin\b|\bnext\b|\bin\b|\bby\b|\bmore\b|\bthan\b|\bits\b|\bfrom\b|\bthis\b|\bthat\b|\ba\b|\ban\b|\bof\b|\bto\b|\bfor\b|\band\b|\bor\b|\bdo\b|\bdoes\b|\bhow\b|\bwhat\b|\bwhen\b|\bwhere\b|\bwho\b/gi, "")
    .replace(/[?!.,'"]/g, "")
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 2)
    .slice(0, 3)
    .join(" ");

  if (!searchTerms || searchTerms.length < 3) return { facts, sources };

  try {
    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTerms)}`
    );
    if (response.ok) {
      const data = await response.json();
      if (data.extract && data.extract.length > 20) {
        facts.push(`Wikipedia context: ${data.extract.substring(0, 300)}`);
        sources.push("Wikipedia");
      }
    }
  } catch (e) {
    // Wikipedia search may not always find a match, that's okay
  }

  return { facts, sources };
}

/**
 * Fetch relevant news articles via NewsAPI
 */
async function fetchRelevantNews(question: string): Promise<OracleData> {
  const facts: string[] = [];
  const sources: string[] = [];

  const newsApiKey = process.env.NEWS_API_KEY;
  if (!newsApiKey) return { facts, sources };

  try {
    // Extract key terms from the question for search
    const searchTerms = question
      .replace(/will|the|be|above|below|exceed|within|next|in|by|more|than|its|from|this|that|a|an|of|to|for|and|or/gi, "")
      .replace(/[?!.,]/g, "")
      .trim()
      .split(/\s+/)
      .filter(w => w.length > 2)
      .slice(0, 3)
      .join(" ");

    if (!searchTerms) return { facts, sources };

    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(searchTerms)}&sortBy=publishedAt&pageSize=5&language=en&apiKey=${newsApiKey}`
    );

    if (response.ok) {
      const data = await response.json();
      if (data.articles && data.articles.length > 0) {
        data.articles.forEach((article: any, i: number) => {
          facts.push(
            `Recent news (${new Date(article.publishedAt).toLocaleDateString()}): ${article.title}`
          );
          if (article.description) {
            facts.push(`  Details: ${article.description.substring(0, 150)}`);
          }
        });
        sources.push("NewsAPI (recent articles)");
      }
    }
  } catch (error) {
    console.error("Error fetching news:", error);
  }

  return { facts, sources };
}
