import { NextResponse } from "next/server";
import axios from "axios";

/**
 * Extracts key topics and entities from article content using OpenAI
 */
async function extractKeyTopics(content) {
  try {
    const openaiResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an AI that extracts specific topics, named entities, and key concepts from news articles. Focus on proper nouns (people, places, organizations, events) and specific subject matter. Return ONLY the most specific and newsworthy terms that would help find similar articles, separated by commas. Be concise and specific."
          },
          {
            role: "user",
            content: `Extract the 3-5 most specific and newsworthy topics, entities, or events from this article that would help find related news:\n\n${content.substring(0, 2000)}`
          }
        ],
        max_tokens: 100,
        temperature: 0.3,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const topics = openaiResponse.data.choices[0].message.content.trim();
    console.log("Extracted topics:", topics);
    return topics;
  } catch (error) {
    console.error("OpenAI topic extraction error:", error);
    throw new Error("Failed to extract topics");
  }
}

/**
 * Searches NewsAPI for related articles with improved parameters
 */
async function searchRelatedArticles(query) {
  if (!process.env.NEWS_API_KEY) {
    throw new Error("NEWS_API_KEY not configured");
  }

  try {
    // Calculate date range (last 30 days for more relevant results)
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 30);

    // Format: YYYY-MM-DD
    const from = fromDate.toISOString().split('T')[0];
    const to = toDate.toISOString().split('T')[0];

    console.log("Searching NewsAPI with query:", query);

    const response = await axios.get("https://newsapi.org/v2/everything", {
      params: {
        q: query,
        from: from,
        to: to,
        sortBy: "relevancy",
        pageSize: 5,
        language: "en",
        apiKey: process.env.NEWS_API_KEY,
      },
    });

    console.log(`Found ${response.data.totalResults} articles`);

    // Filter out articles without descriptions and format results
    const articles = response.data.articles
      .filter(article => article.title && article.description && article.url)
      .map(article => ({
        title: article.title,
        description: article.description,
        url: article.url,
        source: article.source.name,
        publishedAt: article.publishedAt,
        urlToImage: article.urlToImage,
      }));

    return articles;
  } catch (error) {
    console.error("NewsAPI error:", error.response?.data || error.message);

    // If no results or API error, return empty array instead of throwing
    if (error.response?.data?.code === "rateLimited") {
      throw new Error("NewsAPI rate limit reached. Please try again later.");
    }

    return [];
  }
}

/**
 * Handles POST requests to find related articles
 */
export async function POST(req) {
  try {
    const { content } = await req.json();

    if (!content || content.trim().length < 50) {
      return NextResponse.json({ error: "Content too short to extract topics" }, { status: 400 });
    }

    // Extract key topics from the article
    const topics = await extractKeyTopics(content);

    if (!topics || topics.trim().length === 0) {
      return NextResponse.json({
        relatedArticles: [],
        searchQuery: "",
        message: "Could not extract topics from content"
      }, { status: 200 });
    }

    // Search for related articles using those topics
    const relatedArticles = await searchRelatedArticles(topics);

    return NextResponse.json({
      relatedArticles: relatedArticles || [],
      searchQuery: topics,
      message: relatedArticles.length === 0 ? "No recent articles found for these topics" : ""
    }, { status: 200 });
  } catch (error) {
    console.error("Related articles error:", error);
    return NextResponse.json({
      relatedArticles: [],
      error: error.message || "Failed to find related articles"
    }, { status: 200 });
  }
}
