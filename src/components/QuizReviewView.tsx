import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, AlertCircle, Award, BookOpen, Loader2 } from 'lucide-react';
import { fetchQuizReview } from '../services/api';
import type { QuizReviewData, Question } from '../types';

interface QuizReviewViewProps {
  attemptId: string;
  onExit: () => void;
}

export default function QuizReviewView({ attemptId, onExit }: QuizReviewViewProps) {
  const [data, setData] = useState<QuizReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    fetchQuizReview(attemptId)
      .then(setData)
      .catch(err => setError(err.message || 'Failed to load review'))
      .finally(() => setLoading(false));
  }, [attemptId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mx-auto mb-4" />
        <p className="text-slate-500 font-medium">Loading review...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center">
        <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-4" />
        <p className="text-red-600 font-bold">{error || 'No data available'}</p>
        <button onClick={onExit} className="mt-4 px-4 py-2 bg-slate-100 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors">
          Go Back
        </button>
      </div>
    );
  }

  const { questions, selectedAnswers, score, totalQuestions, quizTitle } = data;
  const currentQ = questions[currentIdx];
  const userAnswer = selectedAnswers[currentQ.id];
  const isCorrect = userAnswer === currentQ.correctOptionIndex;
  const isLast = currentIdx === questions.length - 1;
  const isFirst = currentIdx === 0;
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm sticky top-2 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onExit} title="Back" aria-label="Back to History" className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-bold text-slate-800 text-sm sm:text-base">{quizTitle} — Review</h1>
            <p className="text-xs text-slate-500">
              Question {currentIdx + 1} of {questions.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${
            percentage >= 70 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
            percentage >= 40 ? 'bg-amber-50 text-amber-700 border-amber-200' :
            'bg-red-50 text-red-700 border-red-200'
          }`}>
            <Award className="h-3.5 w-3.5" />
            {score}/{totalQuestions} ({percentage}%)
          </div>
        </div>
      </div>

      {/* Question Navigator */}
      <div className="bg-white border border-indigo-100 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Jump to Question</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {questions.map((q, idx) => {
            const uAns = selectedAnswers[q.id];
            const correct = uAns === q.correctOptionIndex;
            const answered = uAns !== undefined;
            const isCurrent = idx === currentIdx;
            return (
              <button
                key={idx}
                onClick={() => setCurrentIdx(idx)}
                title={`Go to Question ${idx + 1}`}
                aria-label={`Go to Question ${idx + 1}`}
                className={`w-9 h-9 rounded-xl text-xs font-black transition-all active:scale-95 border-2 ${
                  isCurrent
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                    : answered && correct
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : answered && !correct
                    ? 'bg-red-50 text-red-600 border-red-300'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-500">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-indigo-600"></div> Current</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-emerald-100 border border-emerald-300"></div> Correct</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-100 border border-red-300"></div> Wrong</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-slate-100 border border-slate-200"></div> Unanswered</div>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs min-h-[400px] flex flex-col">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-block px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider">
              {currentQ.subject}
            </span>
            {userAnswer !== undefined ? (
              isCorrect ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                  <CheckCircle className="h-3.5 w-3.5" /> Correct
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold border border-red-200">
                  <XCircle className="h-3.5 w-3.5" /> Incorrect
                </span>
              )
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-bold border border-slate-200">
                Unanswered
              </span>
            )}
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-8 leading-relaxed">
            {currentQ.text}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {currentQ.options.map((opt, oIdx) => {
              const isUserChoice = userAnswer === oIdx;
              const isCorrectOption = currentQ.correctOptionIndex === oIdx;
              let borderClass = 'border-slate-200 bg-white';
              let labelClass = 'bg-slate-100 text-slate-500';

              if (isCorrectOption) {
                borderClass = 'border-emerald-400 bg-emerald-50/50';
                labelClass = 'bg-emerald-600 text-white';
              } else if (isUserChoice && !isCorrectOption) {
                borderClass = 'border-red-400 bg-red-50/50';
                labelClass = 'bg-red-500 text-white';
              }

              return (
                <div
                  key={oIdx}
                  className={`relative p-4 sm:p-5 rounded-2xl border-2 ${borderClass}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`h-6 w-6 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${labelClass}`}>
                      {String.fromCharCode(65 + oIdx)}
                    </div>
                    <span className="text-sm leading-snug font-medium text-slate-700">
                      {opt}
                    </span>
                  </div>
                  {isCorrectOption && (
                    <CheckCircle className="absolute top-4 right-4 h-5 w-5 text-emerald-500 fill-emerald-100" />
                  )}
                  {isUserChoice && !isCorrectOption && (
                    <XCircle className="absolute top-4 right-4 h-5 w-5 text-red-500 fill-red-100" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Explanation */}
          {currentQ.explanation && (
            <div className="mt-6 bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider mb-2">
                <BookOpen className="h-4 w-4" /> Explanation
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{currentQ.explanation}</p>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => setCurrentIdx(p => Math.max(0, p - 1))}
            disabled={isFirst}
            className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>

          {!isLast ? (
            <button
              onClick={() => setCurrentIdx(p => Math.min(questions.length - 1, p + 1))}
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={onExit}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2"
            >
              Back to Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
