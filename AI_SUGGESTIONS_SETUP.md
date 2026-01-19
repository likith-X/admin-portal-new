# AI-Powered Contest Suggestions - Setup Complete! 🎉

## ✅ What Was Implemented

The system now uses **Groq AI** to generate contest suggestions from **real news sources**:

### 1. **Real News Sources**
- ✅ **CoinGecko API** - Real-time crypto prices & market data (FREE)
- ✅ **CoinGecko Trending** - Trending cryptocurrencies (FREE)
- ✅ **NewsAPI** - Optional tech/business news (requires API key)

### 2. **AI-Powered Generation**
- ✅ **Groq LLaMA 3.3 70B** - Analyzes news and generates contest suggestions
- ✅ Smart JSON parsing with markdown fallback
- ✅ Automatic fallback to sample data if API unavailable

### 3. **Features**
- ✅ Fetches 10+ crypto coins with 24h price changes
- ✅ Gets 5 trending cryptocurrencies
- ✅ Optionally fetches 10 tech/business news articles
- ✅ AI generates 5 relevant prediction market contests
- ✅ Auto-inserts into `suggested_contents` table

---

## 🚀 How to Use

### Step 1: Configure Environment Variables

Create `.env.local` in `agent-herald-admin/`:

```env
# Required: Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Required: Groq AI for suggestions
GROQ_API_KEY=your_groq_api_key

# Optional: NewsAPI for more news sources
NEWS_API_KEY=your_newsapi_key

# Blockchain (for contest creation)
CONTEST_ORACLE_ADDRESS=0xCC0C4E89F5C857FD98769d7eB03321E59F4d22F9
BASE_MAINNET_RPC=https://mainnet.base.org
ADMIN_SIGNER_PRIVATE_KEY=your_private_key
RESOLVER_PRIVATE_KEY=your_resolver_key
```

### Step 2: Get a Groq API Key (FREE)

1. Go to https://console.groq.com
2. Sign up / Log in
3. Navigate to **API Keys**
4. Create a new API key
5. Copy and paste into `.env.local`

### Step 3: (Optional) Get NewsAPI Key

1. Go to https://newsapi.org
2. Sign up for free tier (100 requests/day)
3. Copy API key
4. Add to `.env.local` as `NEWS_API_KEY`

### Step 4: Start the Dev Server

```bash
cd agent-herald-admin
npm run dev
```

### Step 5: Fetch Suggestions

**Via Admin UI:**
1. Open http://localhost:3000/suggestions
2. Click **"Fetch New Suggestions"** button

**Via API:**
```bash
curl -X POST http://localhost:3000/api/suggestions/fetch
```

---

## 📊 What Happens

1. **Fetches Real News:**
   - CoinGecko: Bitcoin, Ethereum, top 10 coins with prices
   - Trending: Top 5 trending cryptocurrencies
   - NewsAPI (if configured): Tech & business headlines

2. **AI Analysis:**
   - Groq LLaMA 3.3 70B analyzes all articles
   - Generates 5 prediction market contests
   - Each with headline, question, criteria, relevance score

3. **Database Insert:**
   - Saves to `suggested_contents` table
   - Status: `pending` (awaiting admin approval)
   - Admin can approve and create on-chain contests

---

## 🧪 Example Output

The AI will generate suggestions like:

```json
[
  {
    "headline": "Bitcoin $100K Breakout",
    "summary": "Bitcoin currently trading at $97,500 with strong bullish momentum. Will it break $100,000 in next 48 hours?",
    "question": "Will Bitcoin (BTC) reach $100,000 by Jan 11, 2026?",
    "criteria": "Resolve YES if BTC price reaches $100,000 on Coinbase, Binance, or Kraken by deadline. Otherwise NO.",
    "relevance": 0.95
  },
  {
    "headline": "Ethereum Gas Fees Drop",
    "summary": "Ethereum gas fees hit 6-month low. Will average remain under 20 gwei for 7 days?",
    "question": "Will Ethereum average gas fees stay below 20 gwei for next 7 days?",
    "criteria": "Resolve YES if average gas fees on Etherscan < 20 gwei for 7 consecutive days. Otherwise NO.",
    "relevance": 0.82
  }
]
```

---

## 🛡️ Fallback Mechanisms

The system is production-ready with multiple fallbacks:

1. **No Groq Key?** → Uses sample suggestions
2. **API fails?** → Falls back to sample articles
3. **Invalid AI response?** → Uses sample suggestions
4. **Rate limit hit?** → Graceful error handling

---

## 📈 Cost Analysis

| Service | Cost | Usage |
|---------|------|-------|
| CoinGecko | **FREE** | 50 calls/min |
| Groq AI | **FREE** | 30 req/min on free tier |
| NewsAPI | **FREE** | 100 req/day (free tier) |

**Total:** $0/month for development! 🎉

---

## 🔧 Troubleshooting

### "GROQ_API_KEY not configured"
→ Add `GROQ_API_KEY` to `.env.local`

### "Error fetching news"
→ Check internet connection, CoinGecko API may be rate-limited

### "Invalid AI response"
→ Groq returned non-JSON, fallback activated (normal behavior)

### No suggestions inserted
→ Check Supabase connection and `suggested_contents` table exists

---

## 🎯 Next Steps

1. ✅ **Done:** Real news integration with Groq AI
2. 🔲 **Optional:** Add more news sources (Google News, Hacker News)
3. 🔲 **Optional:** Add sports data (ESPN API)
4. 🔲 **Optional:** Add political prediction sources
5. 🔲 **Optional:** Schedule automatic fetching (cron job)

---

## 📚 Files Modified

- ✅ [`app/api/suggestions/fetch/route.ts`](app/api/suggestions/fetch/route.ts) - Main implementation
- ✅ `package.json` - Added `groq-sdk` dependency
- ✅ `.env.example` - Added required environment variables

---

## 🎉 Ready to Test!

```bash
# 1. Start server
npm run dev

# 2. Fetch suggestions
curl -X POST http://localhost:3000/api/suggestions/fetch

# 3. View in admin UI
open http://localhost:3000/suggestions
```

Your prediction market now has **AI-powered, real-time contest suggestions**! 🚀
