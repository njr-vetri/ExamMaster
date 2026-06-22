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
import crypto from 'crypto';

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

async function trackUsage(userId: string, eventType: 'generation' | 'upload', estimatedTokens = 0) {
  await db.prepare(`
    INSERT INTO usage_events (id, user_id, event_type, usage_date, estimated_tokens)
    VALUES (?, ?, ?, ?, ?)
  `).run(`${eventType}-${Date.now()}-${Math.random().toString(16).slice(2)}`, userId, eventType, todayKey(), estimatedTokens);
}

async function getRandomApprovedQuestions(userId: string, limit: number) {
  const rows = await db.prepare('SELECT * FROM questions WHERE approved = 1 AND user_id = ? ORDER BY RANDOM() LIMIT ?').all(userId, limit) as any[];
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
      ? await getRandomApprovedQuestions(req.user!.uid, Math.min(3, Math.max(1, Math.floor(requestedCount / 2))))
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
      reuseQuestions
    });

    const estimatedTokens = Math.ceil((extractedText.length + JSON.stringify(questions).length) / 4);
    await trackUsage(req.user!.uid, 'generation', estimatedTokens);
    if (req.file) await trackUsage(req.user!.uid, 'upload', 0);

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
        await db.prepare(`
          INSERT INTO questions
            (id, user_id, subject, text, text_tamil, options, options_tamil,
             correct_option_index, explanation, explanation_tamil,
             language, difficulty, approved)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            user_id = EXCLUDED.user_id,
            subject = EXCLUDED.subject,
            text = EXCLUDED.text,
            text_tamil = EXCLUDED.text_tamil,
            options = EXCLUDED.options,
            options_tamil = EXCLUDED.options_tamil,
            correct_option_index = EXCLUDED.correct_option_index,
            explanation = EXCLUDED.explanation,
            explanation_tamil = EXCLUDED.explanation_tamil,
            language = EXCLUDED.language,
            difficulty = EXCLUDED.difficulty,
            approved = EXCLUDED.approved
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

// List all questions (with optional filters)
app.get('/api/questions', async (req: AuthedRequest, res) => {
  try {
    const { subject, language, difficulty, approved } = req.query;
    let sql = 'SELECT * FROM questions WHERE user_id = ?';
    const params: any[] = [req.user!.uid];

    if (subject) { sql += ' AND subject = ?'; params.push(subject); }
    if (language) { sql += ' AND language = ?'; params.push(language); }
    if (difficulty) { sql += ' AND difficulty = ?'; params.push(difficulty); }
    if (approved !== undefined) { sql += ' AND approved = ?'; params.push(approved === 'true' ? 1 : 0); }

    sql += ' ORDER BY created_at DESC';

    const rows = await db.prepare(sql).all(...params) as any[];
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

// Approve or reject a question
app.patch('/api/questions/:id/approve', async (req: AuthedRequest, res) => {
  try {
    const { id } = req.params;
    const { approved } = req.body;
    await db.prepare('UPDATE questions SET approved = ? WHERE id = ? AND user_id = ?').run(approved ? 1 : 0, id, req.user!.uid);
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Delete a question
app.delete('/api/questions/:id', async (req: AuthedRequest, res) => {
  try {
    await db.prepare('DELETE FROM questions WHERE id = ? AND user_id = ?').run(req.params.id, req.user!.uid);
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────
// MOCK TESTS — SAVE / LIST
// ──────────────────────────────────────────
app.post('/api/tests', async (req: AuthedRequest, res) => {
  try {
    const t = req.body;
    await db.prepare(`
      INSERT INTO mock_tests
        (id, user_id, title, subject, created_at, language, difficulty, questions,
         score, correct_count, time_spent, total_time, selected_answers, is_completed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        title = EXCLUDED.title,
        subject = EXCLUDED.subject,
        created_at = EXCLUDED.created_at,
        language = EXCLUDED.language,
        difficulty = EXCLUDED.difficulty,
        questions = EXCLUDED.questions,
        score = EXCLUDED.score,
        correct_count = EXCLUDED.correct_count,
        time_spent = EXCLUDED.time_spent,
        total_time = EXCLUDED.total_time,
        selected_answers = EXCLUDED.selected_answers,
        is_completed = EXCLUDED.is_completed
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

app.get('/api/tests', async (req: AuthedRequest, res) => {
  try {
    const rows = await db.prepare('SELECT * FROM mock_tests WHERE user_id = ? ORDER BY created_at DESC').all(req.user!.uid) as any[];
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

app.get('/api/admin/usage', async (req: AuthedRequest, res) => {
  try {
    const userId = req.user!.uid;
    const rows = await db.prepare(`
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
// QUIZ ROUTES
// ──────────────────────────────────────────

function generateQuizCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No 0, O, 1, I
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `EXM-${code}`;
}

app.post('/api/quiz/create', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { title, questionIds, timeLimitMinutes } = req.body;
    const quizId = `quiz-${Date.now()}`;

    await db.prepare(`
      INSERT INTO quizzes (id, title, created_by, time_limit_minutes) 
      VALUES (?, ?, ?, ?)
    `).run(quizId, title, req.user!.uid, timeLimitMinutes);

    for (let idx = 0; idx < questionIds.length; idx++) {
      await db.prepare(`
        INSERT INTO quiz_questions (quiz_id, question_id, question_order) 
        VALUES (?, ?, ?)
      `).run(quizId, questionIds[idx], idx);
    }

    return res.json({ id: quizId, status: 'draft' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/quiz/:id/publish', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { id } = req.params;
    let quizCode = '';
    let success = false;

    // retry logic for quiz code collision
    for (let i = 0; i < 10; i++) {
      quizCode = generateQuizCode();
      try {
        await db.prepare(`
          UPDATE quizzes 
          SET status = 'published', quiz_code = ?, published_at = CURRENT_TIMESTAMP 
          WHERE id = ? AND created_by = ?
        `).run(quizCode, id, req.user!.uid);
        success = true;
        break;
      } catch (err: any) {
        if (!err.message?.includes('UNIQUE')) throw err;
      }
    }

    if (!success) {
      return res.status(500).json({ error: 'Failed to generate unique quiz code' });
    }

    return res.json({ id, status: 'published', quizCode });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/quiz/:id/unpublish', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { id } = req.params;
    await db.prepare(`
      UPDATE quizzes SET status = 'unpublished' WHERE id = ? AND created_by = ?
    `).run(id, req.user!.uid);
    return res.json({ id, status: 'unpublished' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/quiz/join', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { quizCode, displayName } = req.body;

    if (!displayName || typeof displayName !== 'string') {
      return res.status(400).json({ error: 'Display name is required' });
    }

    const quiz = await db.prepare(`SELECT * FROM quizzes WHERE quiz_code = ? AND status = 'published'`).get(quizCode);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found or not published' });

    const existingAttempt = await db.prepare(`SELECT * FROM quiz_attempts WHERE quiz_id = ? AND user_id = ?`).get(quiz.id, req.user!.uid);
    if (existingAttempt) return res.status(403).json({ error: 'You have already attempted this quiz' });

    const questionsRows = await db.prepare(`
      SELECT q.id, q.text, q.options, q.subject, q.language 
      FROM quiz_questions qq 
      JOIN questions q ON qq.question_id = q.id 
      WHERE qq.quiz_id = ? 
      ORDER BY qq.question_order ASC
    `).all(quiz.id) as any[];

    const questions = questionsRows.map(r => ({
      id: r.id,
      text: r.text,
      options: JSON.parse(r.options),
      subject: r.subject,
      language: r.language
    }));

    // Start attempt
    const attemptId = `att-${Date.now()}`;
    await db.prepare(`
      INSERT INTO quiz_attempts (id, quiz_id, user_id, display_name, total_questions, started_at) 
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(attemptId, quiz.id, req.user!.uid, displayName, questions.length);

    return res.json({
      attemptId,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        timeLimitMinutes: quiz.time_limit_minutes,
      },
      questions
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/quiz/:id/submit', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { id } = req.params; // quiz_id
    const { attemptId, selectedAnswers } = req.body;

    const attempt = await db.prepare(`SELECT * FROM quiz_attempts WHERE id = ? AND quiz_id = ? AND user_id = ?`).get(attemptId, id, req.user!.uid);
    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
    if (attempt.submitted_at) return res.status(400).json({ error: 'Already submitted' });

    const quiz = await db.prepare(`SELECT time_limit_minutes FROM quizzes WHERE id = ?`).get(id);

    // Convert UTC string to valid timestamp
    const startedAtStr = attempt.started_at + (attempt.started_at.endsWith('Z') ? '' : 'Z');
    const startedAt = new Date(startedAtStr).getTime();
    const now = new Date().getTime();

    // Add 1 minute grace period
    const allowedMs = (quiz.time_limit_minutes + 1) * 60 * 1000;
    if (now - startedAt > allowedMs) {
      return res.status(400).json({ error: 'Time limit exceeded' });
    }

    const questionsRows = await db.prepare(`
      SELECT q.id, q.correct_option_index 
      FROM quiz_questions qq 
      JOIN questions q ON qq.question_id = q.id 
      WHERE qq.quiz_id = ?
    `).all(id) as any[];

    let score = 0;
    questionsRows.forEach(q => {
      if (selectedAnswers[q.id] === q.correct_option_index) score++;
    });

    await db.prepare(`
      UPDATE quiz_attempts 
      SET score = ?, submitted_at = CURRENT_TIMESTAMP, answers_json = ? 
      WHERE id = ?
    `).run(score, JSON.stringify(selectedAnswers), attemptId);

    return res.json({ score, total: questionsRows.length });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/quiz/attempt/:attemptId/review', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { attemptId } = req.params;

    const attempt = await db.prepare(`SELECT * FROM quiz_attempts WHERE id = ? AND user_id = ?`).get(attemptId, req.user!.uid);
    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
    if (!attempt.submitted_at) return res.status(400).json({ error: 'Quiz not yet submitted' });

    const quiz = await db.prepare(`SELECT * FROM quizzes WHERE id = ?`).get(attempt.quiz_id);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const questionRows = await db.prepare(`
      SELECT q.id, q.text, q.options, q.correct_option_index, q.explanation, q.subject, q.language, q.difficulty, qq.question_order
      FROM quiz_questions qq
      JOIN questions q ON qq.question_id = q.id
      WHERE qq.quiz_id = ?
      ORDER BY qq.question_order ASC
    `).all(attempt.quiz_id) as any[];

    const questions = questionRows.map(r => ({
      id: r.id,
      text: r.text,
      options: JSON.parse(r.options),
      correctOptionIndex: r.correct_option_index,
      explanation: r.explanation || '',
      subject: r.subject,
      language: r.language,
      difficulty: r.difficulty
    }));

    const selectedAnswers = attempt.answers_json ? JSON.parse(attempt.answers_json) : {};

    return res.json({
      attemptId: attempt.id,
      quizTitle: quiz.title,
      score: attempt.score,
      totalQuestions: attempt.total_questions,
      questions,
      selectedAnswers
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/quiz/:id/leaderboard', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { id } = req.params;

    // Use Postgres EXTRACT(EPOCH) when DATABASE_URL is set, else SQLite julianday()
    const durationExpr = process.env.DATABASE_URL
      ? `EXTRACT(EPOCH FROM (submitted_at::timestamp - started_at::timestamp))`
      : `(julianday(submitted_at) - julianday(started_at)) * 86400`;

    const attempts = await db.prepare(`
      SELECT user_id, display_name, score, total_questions, 
             ${durationExpr} as duration_seconds 
      FROM quiz_attempts 
      WHERE quiz_id = ? AND submitted_at IS NOT NULL
      ORDER BY score DESC, duration_seconds ASC
      LIMIT 100
    `).all(id) as any[];

    const result = attempts.map(a => ({
      userId: a.user_id,
      displayName: a.display_name,
      score: a.score,
      totalQuestions: a.total_questions,
      durationSeconds: Math.round(a.duration_seconds || 0)
    }));

    return res.json({ leaderboard: result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/quiz/history/me', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const history = await db.prepare(`
      SELECT 
        q.id, q.title, q.quiz_code, 
        (SELECT subject FROM questions qst JOIN quiz_questions qq ON qq.question_id = qst.id WHERE qq.quiz_id = q.id LIMIT 1) as subject,
        qa.id as attempt_id, qa.score, qa.total_questions, qa.submitted_at as completed_at
      FROM quiz_attempts qa
      JOIN quizzes q ON qa.quiz_id = q.id
      WHERE qa.user_id = ? AND qa.submitted_at IS NOT NULL
      ORDER BY qa.submitted_at DESC
      LIMIT 50
    `).all(req.user!.uid) as any[];

    const result = history.map(h => ({
      id: h.id,
      attemptId: h.attempt_id,
      title: h.title,
      quizCode: h.quiz_code,
      subject: h.subject,
      score: h.score,
      totalQuestions: h.total_questions,
      completedAt: h.completed_at
    }));

    return res.json({ history: result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/quiz/leaderboard/global', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const globalBoard = await db.prepare(`
      SELECT qa.user_id, 
             (SELECT display_name FROM quiz_attempts qa2 WHERE qa2.user_id = qa.user_id AND qa2.display_name IS NOT NULL ORDER BY qa2.started_at DESC LIMIT 1) as display_name,
             SUM(CAST(qa.score AS FLOAT) / qa.total_questions * 10.0) as total_points, 
             COUNT(qa.id) as quizzes_taken
      FROM quiz_attempts qa
      WHERE qa.submitted_at IS NOT NULL AND qa.total_questions > 0
      GROUP BY qa.user_id
      ORDER BY total_points DESC
      LIMIT 15
    `).all() as any[];

    const result = globalBoard.map(g => ({
      userId: g.user_id,
      displayName: g.display_name,
      totalPoints: Math.round((g.total_points || 0) * 10) / 10,
      quizzesTaken: g.quizzes_taken || 0
    }));

    return res.json({ leaderboard: result });
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
