import type { Response, NextFunction } from 'express';
import { db } from '../db/database.js';
import type { AuthedRequest } from './auth.js';

const DAILY_GENERATION_LIMIT = Number(process.env.AI_DAILY_GENERATION_LIMIT || 20);

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function limitAiGenerations(req: AuthedRequest, res: Response, next: NextFunction) {
  const uid = req.user?.uid;
  if (!uid) return res.status(401).json({ error: 'Authentication required' });

  const usageDate = todayKey();
  const row = db
    .prepare('SELECT count FROM ai_generation_usage WHERE user_id = ? AND usage_date = ?')
    .get(uid, usageDate) as { count?: number } | undefined;

  const count = Number(row?.count || 0);
  if (count >= DAILY_GENERATION_LIMIT) {
    return res.status(429).json({ error: `Daily AI generation limit reached (${DAILY_GENERATION_LIMIT}/day)` });
  }

  db.prepare(`
    INSERT INTO ai_generation_usage (user_id, usage_date, count)
    VALUES (?, ?, 1)
    ON CONFLICT(user_id, usage_date) DO UPDATE SET count = count + 1
  `).run(uid, usageDate);

  res.setHeader('X-RateLimit-Limit', String(DAILY_GENERATION_LIMIT));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(DAILY_GENERATION_LIMIT - count - 1, 0)));
  return next();
}
