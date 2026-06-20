/**
 * api.ts — All frontend → backend communication goes through here.
 * Set VITE_API_URL in your .env file (default: http://localhost:4000)
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// ─── Types ───────────────────────────────────────────────────────────────────
import type { Question, MockTest, ExamLanguage, ExamDifficulty, ChatMessage, UsageStats } from '../types';
import { auth } from './firebase';

export type GenerateSettings = {
  subject: string;
  language: ExamLanguage;
  difficulty: ExamDifficulty;
  questionCount: number;
  optionsCount: number;
  file?: File | null;
  reuseApproved?: boolean;
  ownApiKey?: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function authHeaders(includeJson = true): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  if (includeJson) headers['Content-Type'] = 'application/json';
  const token = await auth.currentUser?.getIdToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const ownApiKey = localStorage.getItem('exammaster_own_gemini_key');
  if (ownApiKey) headers['X-Gemini-Api-Key'] = ownApiKey;
  return headers;
}

async function apiGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(BASE_URL + path);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { headers: await authHeaders(false) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(BASE_URL + path, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

// ─── Health ───────────────────────────────────────────────────────────────────
export async function checkHealth(): Promise<boolean> {
  try {
    await apiGet('/api/health');
    return true;
  } catch {
    return false;
  }
}

// ─── Generate Questions ───────────────────────────────────────────────────────
export async function generateQuestions(settings: GenerateSettings): Promise<Question[]> {
  const formData = new FormData();
  formData.append('subject', settings.subject);
  formData.append('language', settings.language);
  formData.append('difficulty', settings.difficulty);
  formData.append('questionCount', String(settings.questionCount));
  formData.append('optionsCount', String(settings.optionsCount));
  formData.append('reuseApproved', String(settings.reuseApproved ?? true));
  if (settings.ownApiKey) formData.append('ownApiKey', settings.ownApiKey);
  if (settings.file) {
    formData.append('file', settings.file);
  }

  const res = await fetch(BASE_URL + '/api/generate', {
    method: 'POST',
    headers: await authHeaders(false),
    body: formData // NO Content-Type header — browser sets multipart boundary
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Question generation failed');
  }

  const data = await res.json();
  return data.questions as Question[];
}

// ─── Question Bank ────────────────────────────────────────────────────────────
export async function saveQuestions(questions: Question[]): Promise<{ saved: number; skipped: number }> {
  return apiPost('/api/questions', { questions });
}

export async function fetchQuestions(filters?: {
  subject?: string;
  language?: ExamLanguage;
  difficulty?: ExamDifficulty;
  approved?: boolean;
}): Promise<Question[]> {
  const params: Record<string, string> = {};
  if (filters?.subject) params.subject = filters.subject;
  if (filters?.language) params.language = filters.language;
  if (filters?.difficulty) params.difficulty = filters.difficulty;
  if (filters?.approved !== undefined) params.approved = String(filters.approved);

  const data = await apiGet<{ questions: Question[] }>('/api/questions', params);
  return data.questions;
}

export async function approveQuestion(id: string, approved: boolean): Promise<void> {
  await fetch(`${BASE_URL}/api/questions/${id}/approve`, {
    method: 'PATCH',
    headers: await authHeaders(),
    body: JSON.stringify({ approved })
  });
}

export async function deleteQuestion(id: string): Promise<void> {
  await fetch(`${BASE_URL}/api/questions/${id}`, { method: 'DELETE', headers: await authHeaders(false) });
}

// ─── Mock Tests ───────────────────────────────────────────────────────────────
export async function saveTest(test: MockTest): Promise<void> {
  await apiPost('/api/tests', test);
}

export async function fetchTests(): Promise<MockTest[]> {
  const data = await apiGet<{ tests: MockTest[] }>('/api/tests');
  return data.tests;
}

export async function fetchUsageStats(): Promise<UsageStats> {
  return apiGet<UsageStats>('/api/admin/usage');
}

// ─── AI Tutor Chat ────────────────────────────────────────────────────────────
export async function sendChatMessage(params: {
  message: string;
  language: ExamLanguage;
  doubtQuestion?: Question | null;
  history?: Pick<ChatMessage, 'sender' | 'text'>[];
}): Promise<string> {
  const data = await apiPost<{ reply: string }>('/api/chat', {
    message: params.message,
    language: params.language,
    doubtQuestion: params.doubtQuestion
      ? {
          text: params.doubtQuestion.text,
          options: params.doubtQuestion.options,
          correctOptionIndex: params.doubtQuestion.correctOptionIndex,
          explanation: params.doubtQuestion.explanation,
          subject: params.doubtQuestion.subject
        }
      : null,
    history: params.history || []
  });
  return data.reply;
}
