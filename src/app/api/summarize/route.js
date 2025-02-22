import { NextResponse } from "next/server";
import axios from "axios";

/**
 * Handles POST requests to summarize a news article using OpenAI API.
 */
export async function POST(req) {
  console.log("API Key:", process.env.OPENAI_API_KEY);

  try {
    const { text } = await req.json();
    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const openaiResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are an AI that summarizes news articles." },
          { role: "user", content: `Summarize the following news article:\n\n${text}` }
        ],
        max_tokens: 200,
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


