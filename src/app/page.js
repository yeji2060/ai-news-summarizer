"use client";

import { useState } from "react";

export default function Home() {
  const [inputMode, setInputMode] = useState("text"); // "text" or "url"
  const [newsText, setNewsText] = useState(""); // Stores user text input
  const [newsUrl, setNewsUrl] = useState(""); // Stores user URL input
  const [summary, setSummary] = useState(""); // Stores the summarized result
  const [loading, setLoading] = useState(false); // Indicates API call status
  const [language, setLanguage] = useState("Original"); // Stores selected language
  const [format, setFormat] = useState("paragraph"); // Stores summary format
  const [relatedArticles, setRelatedArticles] = useState([]); // Stores related articles
  const [loadingRelated, setLoadingRelated] = useState(false); // Loading state for related articles
  const [originalContent, setOriginalContent] = useState(""); // Stores original content for related articles

  // Fetches related articles based on the content
  const fetchRelatedArticles = async (content) => {
    setLoadingRelated(true);
    try {
      const response = await fetch("/api/related-articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      const data = await response.json();

      if (data.error) {
        console.error("Related articles error:", data.error);
        setRelatedArticles([]);
      } else {
        setRelatedArticles(data.relatedArticles || []);
      }
    } catch (error) {
      console.error("Error fetching related articles:", error);
      setRelatedArticles([]);
    } finally {
      setLoadingRelated(false);
    }
  };

  // Handles the API call to summarize the input text or URL
  const handleSummarize = async () => {
    const input = inputMode === "url" ? newsUrl : newsText;
    if (!input.trim()) return; // Prevents empty requests

    setLoading(true);
    setSummary("");
    setRelatedArticles([]);

    try {
      const requestBody = {
        language,
        format,
        ...(inputMode === "url" ? { url: newsUrl } : { text: newsText })
      };

      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.error) {
        setSummary(`Error: ${data.error}`);
      } else {
        const generatedSummary = data.summary || "No summary generated.";
        setSummary(generatedSummary);

        // Use the original text content (not URL) for related articles
        // If URL mode, use the summary; if text mode, use original text
        const contentForRelated = inputMode === "url" ? generatedSummary : newsText;
        setOriginalContent(contentForRelated);

        // Fetch related articles using the actual content
        fetchRelatedArticles(contentForRelated);
      }
    } catch (error) {
      console.error("Error:", error);
      setSummary("An error occurred while generating the summary.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-black mb-6">📰 AI News Summarizer</h1>

      <div className="w-full max-w-lg space-y-4">
        {/* Input Mode Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setInputMode("text")}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              inputMode === "text"
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-700 border hover:bg-gray-50"
            }`}
          >
            📝 Text Input
          </button>
          <button
            onClick={() => setInputMode("url")}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              inputMode === "url"
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-700 border hover:bg-gray-50"
            }`}
          >
            🔗 URL Input
          </button>
        </div>

        {/* Input Field - Text or URL */}
        {inputMode === "text" ? (
          <textarea
            className="w-full h-32 p-3 border rounded-lg text-black bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Paste your news article text here..."
            value={newsText}
            onChange={(e) => setNewsText(e.target.value)}
          />
        ) : (
          <input
            type="url"
            className="w-full p-3 border rounded-lg text-black bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter article URL (e.g., https://example.com/article)"
            value={newsUrl}
            onChange={(e) => setNewsUrl(e.target.value)}
          />
        )}

        {/* Format Selection */}
        <div>
          <label className="block mb-2 font-semibold text-gray-700">Summary Format:</label>
          <select
            className="w-full p-2 border rounded-lg text-black bg-white focus:ring-2 focus:ring-blue-500"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
          >
            <option value="paragraph">📄 Paragraph</option>
            <option value="bullets">• Bullet Points</option>
            <option value="keyTakeaways">🔑 Key Takeaways</option>
          </select>
        </div>

        {/* Language Selection */}
        <div>
          <label className="block mb-2 font-semibold text-gray-700">Summary Language:</label>
          <select
            className="w-full p-2 border rounded-lg text-black bg-white focus:ring-2 focus:ring-blue-500"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="Original">Original Language</option>
            <option value="English">English</option>
            <option value="Spanish">Spanish (Español)</option>
            <option value="French">French (Français)</option>
            <option value="German">German (Deutsch)</option>
            <option value="Italian">Italian (Italiano)</option>
            <option value="Portuguese">Portuguese (Português)</option>
            <option value="Chinese">Chinese (中文)</option>
            <option value="Japanese">Japanese (日本語)</option>
            <option value="Korean">Korean (한국어)</option>
            <option value="Arabic">Arabic (العربية)</option>
          </select>
        </div>

        {/* Summarize Button */}
        <button
          onClick={handleSummarize}
          className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 font-medium transition-colors"
          disabled={loading}
        >
          {loading ? "✨ Summarizing..." : "✨ Summarize"}
        </button>

        {/* Summary Display */}
        {summary && (
          <div className="mt-6 p-4 bg-white border rounded-lg shadow-sm">
            <h2 className="font-semibold text-lg mb-2 text-gray-800">
              📄 Summary ({language} - {format === "paragraph" ? "Paragraph" : format === "bullets" ? "Bullets" : "Key Takeaways"}):
            </h2>
            <div className="text-black whitespace-pre-wrap">{summary}</div>
          </div>
        )}

        {/* Related Articles Section */}
        {summary && (
          <div className="mt-6">
            <h2 className="font-semibold text-lg mb-3 text-gray-800">🔗 Related Articles</h2>

            {loadingRelated ? (
              <div className="p-4 bg-white border rounded-lg shadow-sm text-center text-gray-600">
                <div className="animate-pulse">Finding related articles...</div>
              </div>
            ) : relatedArticles.length > 0 ? (
              <div className="space-y-3">
                {relatedArticles.map((article, index) => (
                  <a
                    key={index}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 bg-white border rounded-lg shadow-sm hover:shadow-md hover:border-blue-400 transition-all"
                  >
                    <div className="flex gap-3">
                      {article.urlToImage && (
                        <img
                          src={article.urlToImage}
                          alt={article.title}
                          className="w-20 h-20 object-cover rounded flex-shrink-0"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 hover:text-blue-600 line-clamp-2 mb-1">
                          {article.title}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {article.description || "No description available"}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="font-medium">{article.source}</span>
                          {article.publishedAt && (
                            <>
                              <span>•</span>
                              <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-white border rounded-lg shadow-sm text-center text-gray-600">
                {originalContent ? "No related articles found. Try a different article." : "Related articles will appear here after summarization."}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}