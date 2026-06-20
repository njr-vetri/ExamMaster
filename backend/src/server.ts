import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// ── GEMINI (commented out — switch back by uncommenting these and commenting the Groq import below) ──
// import { generateQuestions } from './services/geminiService.js';
// import { chatWithTutor } from './services/tutorService.js';

// ── GROQ (active) ──
import { generateQuestions, chatWithTutor } from './services/groqService.js';

import { runOCR } from './services/ocrService.js';
import { db, initDb } from './db/database.js';
import { checkSimilarity } from './services/similarityService.js';
import { requireAuth } from './middleware/auth.js';
import type { AuthedRequest } from './middleware/auth.js';
import { limitAiGenerations } from './middleware/rateLimit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../.env'), override: true });

const app = express();
const PORT = process.env.PORT || 4000;

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json({ limit: '10mb' }));

// Multer setup — max 10MB, images/pdf only
const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, WEBP, and PDF files are allowed'));
    }
  }
});

// ──────────────────────────────────────────
// HEALTH CHECK
// ──────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', requireAuth);

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function trackUsage(userId: string, eventType: 'generation' | 'upload', estimatedTokens = 0) {
  db.prepare(`
    INSERT INTO usage_events (id, user_id, event_type, usage_date, estimated_tokens)
    VALUES (?, ?, ?, ?, ?)
  `).run(`${eventType}-${Date.now()}-${Math.random().toString(16).slice(2)}`, userId, eventType, todayKey(), estimatedTokens);
}

function getRandomApprovedQuestions(userId: string, limit: number) {
  const rows = db.prepare('SELECT * FROM questions WHERE approved = 1 AND user_id = ? ORDER BY RANDOM() LIMIT ?').all(userId, limit) as any[];
  return rows.map(r => ({
    text: r.text,
    options: JSON.parse(r.options),
    correctOptionIndex: r.correct_option_index,
    explanation: r.explanation,
    subject: r.subject
  }));
}

// ──────────────────────────────────────────
// UPLOAD & GENERATE QUESTIONS
// ──────────────────────────────────────────
app.post('/api/generate', limitAiGenerations, upload.single('file'), async (req: AuthedRequest, res) => {
  try {
    const { subject, language, difficulty, questionCount, optionsCount, reuseApproved, ownApiKey } = req.body;

    if (!subject || !language || !difficulty) {
      return res.status(400).json({ error: 'subject, language, and difficulty are required' });
    }

    let extractedText = '';
    let filePath: string | null = null;
    let mimeType: string | null = null;

    // If a file was uploaded, run OCR on it
    if (req.file) {
      filePath = req.file.path;
      mimeType = req.file.mimetype;

      if (mimeType === 'application/pdf' || mimeType?.startsWith('image/')) {
        try {
          extractedText = await runOCR(filePath, mimeType);
        } catch (ocrErr) {
          console.warn('OCR failed, proceeding with subject only:', ocrErr);
        }
      }
    }

    const requestedCount = parseInt(questionCount) || 5;
    const reuseQuestions = reuseApproved !== 'false'
      ? getRandomApprovedQuestions(req.user!.uid, Math.min(3, Math.max(1, Math.floor(requestedCount / 2))))
      : [];

    // Generate questions via Groq (switch import at top to use Gemini instead)
    const questions = await generateQuestions({
      subject,
      language,
      difficulty,
      questionCount: requestedCount,
      optionsCount: parseInt(optionsCount) || 4,
      extractedText,
      filePath: filePath || undefined,
      mimeType: mimeType || undefined,
      // apiKey: (ownApiKey || req.headers['x-gemini-api-key']) as string | undefined, // Gemini only
      reuseQuestions
    });

    const estimatedTokens = Math.ceil((extractedText.length + JSON.stringify(questions).length) / 4);
    trackUsage(req.user!.uid, 'generation', estimatedTokens);
    if (req.file) trackUsage(req.user!.uid, 'upload', 0);

    // Clean up temp file after processing
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return res.json({ questions });
  } catch (err: any) {
    console.error('Generate error:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate questions' });
  }
});

// ──────────────────────────────────────────
// QUESTION BANK — SAVE / LIST / APPROVE
// ──────────────────────────────────────────

// Save approved questions to DB
app.post('/api/questions', async (req: AuthedRequest, res) => {
  try {
    const { questions } = req.body;
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'questions array required' });
    }

    const saved: any[] = [];
    for (const q of questions) {
      // Similarity check to avoid duplicates
      const isDuplicate = await checkSimilarity(q.text, db);
      if (!isDuplicate) {
        const inserted = db.prepare(`
          INSERT OR REPLACE INTO questions
            (id, user_id, subject, text, text_tamil, options, options_tamil,
             correct_option_index, explanation, explanation_tamil,
             language, difficulty, approved)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          q.id,
          req.user!.uid,
          q.subject,
          q.text,
          q.textTamil || null,
          JSON.stringify(q.options),
          q.optionsTamil ? JSON.stringify(q.optionsTamil) : null,
          q.correctOptionIndex,
          q.explanation,
          q.explanationTamil || null,
          q.language,
          q.difficulty,
          q.approved ? 1 : 0
        );
        saved.push(q.id);
      }
    }

    return res.json({ saved: saved.length, skipped: questions.length - saved.length });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// List all approved questions (with optional filters)
app.get('/api/questions', (req: AuthedRequest, res) => {
  try {
    const { subject, language, difficulty, approved } = req.query;
    let sql = 'SELECT * FROM questions WHERE user_id = ?';
    const params: any[] = [req.user!.uid];

    if (subject) { sql += ' AND subject = ?'; params.push(subject); }
    if (language) { sql += ' AND language = ?'; params.push(language); }
    if (difficulty) { sql += ' AND difficulty = ?'; params.push(difficulty); }
    if (approved !== undefined) { sql += ' AND approved = ?'; params.push(approved === 'true' ? 1 : 0); }

    sql += ' ORDER BY rowid DESC';

    const rows = db.prepare(sql).all(...params) as any[];
    const questions = rows.map(r => ({
      id: r.id,
      subject: r.subject,
      text: r.text,
      textTamil: r.text_tamil,
      options: JSON.parse(r.options),
      optionsTamil: r.options_tamil ? JSON.parse(r.options_tamil) : undefined,
      correctOptionIndex: r.correct_option_index,
      explanation: r.explanation,
      explanationTamil: r.explanation_tamil,
      language: r.language,
      difficulty: r.difficulty,
      approved: r.approved === 1
    }));

    return res.json({ questions });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Approve or reject a question (admin action)
app.patch('/api/questions/:id/approve', (req: AuthedRequest, res) => {
  try {
    const { id } = req.params;
    const { approved } = req.body;
    db.prepare('UPDATE questions SET approved = ? WHERE id = ? AND user_id = ?').run(approved ? 1 : 0, id, req.user!.uid);
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Delete a question
app.delete('/api/questions/:id', (req: AuthedRequest, res) => {
  try {
    db.prepare('DELETE FROM questions WHERE id = ? AND user_id = ?').run(req.params.id, req.user!.uid);
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────
// MOCK TESTS — SAVE / LIST
// ──────────────────────────────────────────
app.post('/api/tests', (req: AuthedRequest, res) => {
  try {
    const t = req.body;
    db.prepare(`
      INSERT OR REPLACE INTO mock_tests
        (id, user_id, title, subject, created_at, language, difficulty, questions,
         score, correct_count, time_spent, total_time, selected_answers, is_completed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      t.id, req.user!.uid, t.title, t.subject, t.createdAt, t.language, t.difficulty,
      JSON.stringify(t.questions),
      t.score ?? null, t.correctCount ?? null, t.timeSpent ?? null,
      t.totalTime, t.selectedAnswers ? JSON.stringify(t.selectedAnswers) : null,
      t.isCompleted ? 1 : 0
    );
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/tests', (req: AuthedRequest, res) => {
  try {
    const rows = db.prepare('SELECT * FROM mock_tests WHERE user_id = ? ORDER BY rowid DESC').all(req.user!.uid) as any[];
    const tests = rows.map(r => ({
      id: r.id,
      title: r.title,
      subject: r.subject,
      createdAt: r.created_at,
      language: r.language,
      difficulty: r.difficulty,
      questions: JSON.parse(r.questions),
      score: r.score,
      correctCount: r.correct_count,
      timeSpent: r.time_spent,
      totalTime: r.total_time,
      selectedAnswers: r.selected_answers ? JSON.parse(r.selected_answers) : undefined,
      isCompleted: r.is_completed === 1
    }));
    return res.json({ tests });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────
// AI TUTOR CHAT
// ──────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  try {
    const { message, language, doubtQuestion, history } = req.body;
    if (!message) return res.status(400).json({ error: 'message required' });

    const reply = await chatWithTutor({ message, language, doubtQuestion, history });
    return res.json({ reply });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/usage', (req: AuthedRequest, res) => {
  try {
    const userId = req.user!.uid;
    const rows = db.prepare(`
      SELECT usage_date,
        SUM(CASE WHEN event_type = 'generation' THEN 1 ELSE 0 END) AS generations,
        SUM(CASE WHEN event_type = 'upload' THEN 1 ELSE 0 END) AS uploads,
        SUM(estimated_tokens) AS estimatedTokens
      FROM usage_events
      WHERE user_id = ?
      GROUP BY usage_date
      ORDER BY usage_date DESC
      LIMIT 14
    `).all(userId) as any[];

    const daily = rows.reverse().map(row => ({
      date: row.usage_date,
      generations: Number(row.generations || 0),
      uploads: Number(row.uploads || 0),
      estimatedTokens: Number(row.estimatedTokens || 0)
    }));

    return res.json({
      totals: daily.reduce((acc, row) => ({
        generations: acc.generations + row.generations,
        uploads: acc.uploads + row.uploads,
        estimatedTokens: acc.estimatedTokens + row.estimatedTokens
      }), { generations: 0, uploads: 0, estimatedTokens: 0 }),
      daily
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────
// START SERVER
// ──────────────────────────────────────────
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ ExamMaster AI backend running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

export default app;
