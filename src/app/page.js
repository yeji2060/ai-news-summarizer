"use client";

import { useState } from "react";

export default function Home() {
  const [newsText, setNewsText] = useState(""); // Stores user input
  const [summary, setSummary] = useState(""); // Stores the summarized result
  const [loading, setLoading] = useState(false); // Indicates API call status

  //Handles the API call to summarize the input text.

  const handleSummarize = async () => {
    if (!newsText.trim()) return; // Prevents empty requests
    setLoading(true);
    setSummary("");

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newsText }),
      });

      const data = await response.json();
      setSummary(data.summary || "No summary generated.");
    } catch (error) {
      console.error("Error:", error);
      setSummary("An error occurred while generating the summary.")
    } finally {
      setLoading(false);
    }

  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold text-black mb-4">📰 AI News Summarizer</h1>

      <textarea
        className="w-full max-w-lg h-32 p-3 border rounded-lg text-black bg-white"
        placeholder="Enter news text here..."
        value={newsText}
        onChange={(e) => setNewsText(e.target.value)}
      />

      <button
        onClick={handleSummarize}
        className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
        disabled={loading}
      >
        {loading ? "Summarizing..." : "Summarize"}
      </button>

      {summary && (
        <div className="mt-6 p-4 bg-white border rounded-lg w-full max-w-lg">
          <h2 className="font-semibold text-black">📄 Summary:</h2>
          <p className="text-black">{summary}</p>
        </div>
      )}
    </div>
  );
}