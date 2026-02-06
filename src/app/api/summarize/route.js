import { NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";

/**
 * Fetches and extracts text content from a URL
 */
async function fetchArticleFromURL(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);

    // Remove unwanted elements
    $('script, style, nav, header, footer, aside, iframe').remove();

    // Try to find main content - common article selectors
    let content = '';
    const selectors = ['article', 'main', '[role="main"]', '.article-content', '.post-content', '.entry-content'];

    for (const selector of selectors) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.text();
        break;
      }
    }

    // Fallback to body if no main content found
    if (!content) {
      content = $('body').text();
    }

    // Clean up whitespace
    content = content.replace(/\s+/g, ' ').trim();

    if (!content || content.length < 100) {
      throw new Error("Could not extract enough content from URL");
    }

    return content;
  } catch (error) {
    throw new Error(`Failed to fetch URL: ${error.message}`);
  }
}

/**
 * Validates if a string is a valid URL
 */
function isValidURL(string) {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Generates the appropriate prompt based on format selection
 */
function getPromptForFormat(format) {
  const formatInstructions = {
    paragraph: `Provide a concise summary in paragraph form.`,
    bullets: `Provide a summary as bullet points, highlighting the key points.`,
    keyTakeaways: `Extract and list the 3-5 most important key takeaways from the article.`
  };

  return formatInstructions[format] || formatInstructions.paragraph;
}

/**
 * Handles POST requests to summarize a news article using OpenAI API.
 */
export async function POST(req) {
  try {
    // Parse the request body
    const { text, url, language, format = "paragraph" } = await req.json();

    // Validate input - need either text or URL
    if (!text && !url) {
      return NextResponse.json({ error: "No text or URL provided" }, { status: 400 });
    }

    // Get content either from text or URL
    let content;
    if (url && isValidURL(url)) {
      try {
        content = await fetchArticleFromURL(url);
      } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    } else {
      content = text;
    }

    // Determine the target language
    const targetLanguage = language === "Original" ? "the original language" : language;

    // Dynamically set max_tokens based on format and language
    const maxTokens = format === "keyTakeaways" ? 300 : (language === "English" ? 200 : 500);

    // Get format-specific instructions
    const formatInstructions = getPromptForFormat(format);

    const openaiResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are an AI that summarizes news articles in ${targetLanguage}. ${formatInstructions}`
          },
          {
            role: "user",
            content: `Summarize the following news article in ${targetLanguage}:\n\n${content}`
          }
        ],
        max_tokens: maxTokens,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const summary = openaiResponse.data.choices[0].message.content;
    return NextResponse.json({ summary }, { status: 200 });
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 });
  }
}


