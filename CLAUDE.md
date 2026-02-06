# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI News Summarizer - A Next.js 15 application that uses OpenAI's GPT-3.5 Turbo to summarize news articles. Users can input text and choose to receive summaries in the original language or English.

## Development Commands

```bash
# Start development server (uses Turbopack)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run ESLint
npm run lint
```

The dev server runs on http://localhost:3000

## Architecture

### Tech Stack
- **Framework**: Next.js 15 (App Router)
- **React**: v19
- **Styling**: Tailwind CSS
- **API Integration**: axios for OpenAI API calls
- **Font**: Geist (via next/font/google)

### Project Structure

```
src/app/
├── page.js              # Main UI - client component with text input and language selector
├── layout.js            # Root layout with Geist fonts
├── globals.css          # Global styles and Tailwind directives
└── api/
    └── summarize/
        └── route.js     # POST endpoint that calls OpenAI API
```

### Key Components

**Frontend (page.js)**
- Client component that manages state for news text input, summary output, loading state, and language selection
- Makes POST requests to `/api/summarize` with `text` and `language` parameters
- Language options: "Original" (default) or "English"

**API Route (api/summarize/route.js)**
- Accepts POST requests with `{ text, language }` body
- Calls OpenAI API (gpt-3.5-turbo model) with dynamic max_tokens:
  - English: 200 tokens
  - Original language: 500 tokens
- Returns `{ summary }` or `{ error }` responses

### Environment Variables

Required in `.env.local`:
```
OPENAI_API_KEY=sk-proj-...
```

### Data Flow

1. User enters news text and selects language in [page.js](src/app/page.js)
2. Click "Summarize" → POST request to `/api/summarize`
3. [route.js](src/app/api/summarize/route.js) receives request, calls OpenAI API
4. OpenAI response is parsed and returned to frontend
5. Summary displayed in UI

## Important Notes

- The API route validates that text is provided before making OpenAI requests
- Language selection affects both the system prompt and max_tokens setting
- Error handling is implemented for both API failures and empty inputs
