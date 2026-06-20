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
