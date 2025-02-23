import { NextResponse } from "next/server";
import axios from "axios";

/**
 * Handles POST requests to summarize a news article using OpenAI API.
 */
export async function POST(req) {

  try {
    // Parse the request body
    const { text, language } = await req.json();

    // Validate input
    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }


    // Determine the target language
    const targetLanguage = language === "English" ? "English" : "the original language";

    // Dynamically set max_tokens based on language
    const maxTokens = language === "English" ? 200 : 500;

    const openaiResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: `You are an AI that summarizes news articles in ${targetLanguage}.` },
          { role: "user", content: `Summarize the following news article in ${targetLanguage}:\n\n${text}` }
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


