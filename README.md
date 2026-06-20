# ExamMaster AI — Full Stack Setup Guide

Tamil + English AI-powered mock exam generator with real backend, OCR, and AI tutor.

---

## Project Structure

```
ai-mock-exam-full/
├── src/                        # Frontend (React + Vite)
│   ├── components/             # UI components (updated)
│   ├── services/
│   │   └── api.ts              # ← All backend API calls go here (NEW)
│   ├── App.tsx                 # Main app (updated to use real API)
│   └── types.ts
├── backend/                    # Express backend (NEW)
│   ├── src/
│   │   ├── server.ts           # Main Express server
│   │   ├── db/database.ts      # SQLite setup
│   │   └── services/
│   │       ├── geminiService.ts
│   │       ├── ocrService.ts
│   │       ├── tutorService.ts
│   │       └── similarityService.ts
│   └── package.json
├── data/                       # SQLite DB (auto-created)
├── uploads/                    # Temp uploads (auto-cleaned)
└── .env.example
```

---

## Step 1 — Get a Gemini API Key

1. Go to https://aistudio.google.com/app/apikey
2. Click **Create API Key** and copy it

---

## Step 2 — Backend Setup

```bash
cd backend
cp .env.example .env
# Open .env and add your GEMINI_API_KEY
npm install
npm run dev
# Backend runs on http://localhost:4000
```

---

## Step 3 — Frontend Setup

```bash
# From root folder
cp .env.example .env
# .env already has: VITE_API_URL=http://localhost:4000
npm install
npm run dev
# Frontend runs on http://localhost:3000
```

---

## Optional: Tesseract OCR (Tamil text extraction)

Ubuntu: `sudo apt-get install tesseract-ocr tesseract-ocr-tam`
macOS:  `brew install tesseract tesseract-lang`

Without Tesseract, Gemini handles images directly — still works!
