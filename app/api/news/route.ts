import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "NEWS_API_KEY is not configured" }, { status: 500 });
  }

  try {
    // Fetch high-signal finance and tech news
    const endpoint = `https://newsapi.org/v2/top-headlines?category=business&language=en&pageSize=20&apiKey=${apiKey}`;
    
    const response = await fetch(endpoint, {
      next: { revalidate: 3600 } // Cache for 1 hour to stay under free tier limits
    });

    if (!response.ok) {
      throw new Error("Failed to fetch news from NewsAPI");
    }

    const data = await response.json();
    
    // Transform NewsAPI articles into Editorial format
    const formattedNews = data.articles.map((article: any, index: number) => {
      // Logic for random impact assignment based on popularity or source
      const impacts = ["High", "Medium", "Low"];
      const impact = (article.source.name.includes("Bloomberg") || article.source.name.includes("Reuters") || index < 3) ? "High" : impacts[index % 3];
      
      const timeDiff = Math.round((new Date().getTime() - new Date(article.publishedAt).getTime()) / (1000 * 60));
      const timeLabel = timeDiff < 60 ? `${timeDiff} mins ago` : `${Math.round(timeDiff/60)} hours ago`;

      return {
        id: `N-${100 + index}`,
        headline: article.title,
        source: article.source.name,
        category: "Market",
        impact: impact,
        time: timeLabel,
        url: article.url
      };
    });

    return NextResponse.json(formattedNews);
  } catch (error: any) {
    console.error("News API Proxy Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
