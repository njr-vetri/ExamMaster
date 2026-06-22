export type ExamLanguage = 'english' | 'tamil' | 'bilingual';
export type ExamDifficulty = 'easy' | 'medium' | 'hard';

export interface Question {
  id: string;
  subject: string;
  text: string; // bilingual/tamil will contain Tamil translation or mixed
  textTamil?: string; // Optional Tamil text for bilingual display
  options: string[];
  optionsTamil?: string[]; // Optional Tamil options for bilingual display
  correctOptionIndex: number;
  explanation: string;
  explanationTamil?: string;
  language: ExamLanguage;
  difficulty: ExamDifficulty;
  approved: boolean;
}

export interface MockTest {
  id: string;
  title: string;
  subject: string;
  createdAt: string;
  language: ExamLanguage;
  difficulty: ExamDifficulty;
  questions: Question[];
  score?: number; // e.g. 80 out of 100
  correctCount?: number;
  timeSpent?: number; // in seconds
  totalTime: number; // in seconds
  selectedAnswers?: Record<string, number>; // questionId -> optionIndex
  isCompleted: boolean;
}

export interface UsageStats {
  totals: {
    generations: number;
    uploads: number;
    estimatedTokens: number;
  };
  daily: {
    date: string;
    generations: number;
    uploads: number;
    estimatedTokens: number;
  }[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  relatedQuestionId?: string;
}

export interface Quiz {
  id: string;
  quizCode?: string;
  title: string;
  createdBy?: string;
  status: 'draft' | 'published' | 'unpublished';
  timeLimitMinutes: number;
  createdAt?: string;
  publishedAt?: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  score?: number;
  totalQuestions: number;
  startedAt: string;
  submittedAt?: string;
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  score: number;
  totalQuestions: number;
  durationSeconds: number;
}

export interface GlobalLeaderboardEntry {
  userId: string;
  displayName: string;
  totalPoints: number;
  quizzesTaken: number;
}

export interface QuizHistoryEntry {
  id: string;
  attemptId: string;
  title: string;
  quizCode: string;
  subject: string;
  score: number;
  totalQuestions: number;
  completedAt: string;
}

export interface QuizReviewData {
  attemptId: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  questions: Question[];
  selectedAnswers: Record<string, number>;
}
