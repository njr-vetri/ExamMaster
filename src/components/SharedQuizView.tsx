import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, ChevronLeft, ChevronRight, AlertCircle, Send, LayoutGrid, X } from 'lucide-react';
import { submitQuizAttempt } from '../services/api';
import type { Quiz, Question } from '../types';

interface SharedQuizViewProps {
  quiz: Quiz;
  attemptId: string;
  questions: Question[];
  onComplete: (score: number, total: number) => void;
  onExit: () => void;
}

export default function SharedQuizView({ quiz, attemptId, questions, onComplete, onExit }: SharedQuizViewProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(quiz.timeLimitMinutes * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentQ = questions[currentIdx];
  const isLast = currentIdx === questions.length - 1;
  const isFirst = currentIdx === 0;
  const totalAnswered = Object.keys(selectedAnswers).length;

  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleSelect = (idx: number) => {
    setSelectedAnswers(prev => ({ ...prev, [currentQ.id]: idx }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await submitQuizAttempt(quiz.id, attemptId, selectedAnswers);
      onComplete(result.score, result.total);
    } catch (err: any) {
      setError(err.message || 'Failed to submit quiz');
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isWarningTime = timeLeft <= 60;

  return (
    <div className="max-w-5xl mx-auto space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm sticky top-2 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onExit} title="Exit Quiz" aria-label="Exit Quiz" className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-bold text-slate-800 text-sm sm:text-base">{quiz.title}</h1>
            <p className="text-xs text-slate-500">
              Question {currentIdx + 1} of {questions.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
            <span className="text-indigo-600">{totalAnswered}</span>/{questions.length} done
          </div>
          
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-bold text-sm transition-colors ${
            isWarningTime ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-slate-50 text-slate-700 border-slate-200'
          }`}>
            <Clock className="h-4 w-4" />
            {formatTime(Math.max(0, timeLeft))}
          </div>
        </div>
      </div>

      {/* Question Navigator Panel */}
      <div className="bg-white border border-indigo-100 rounded-2xl p-4 shadow-sm animate-fadeIn">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Jump to Question</h3>
        </div>
          <div className="flex flex-wrap gap-2">
            {questions.map((q, idx) => {
              const isAnswered = selectedAnswers[q.id] !== undefined;
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
                      : isAnswered
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-indigo-50 hover:border-indigo-200'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-indigo-600"></div> Current</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-emerald-100 border border-emerald-300"></div> Answered</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-slate-100 border border-slate-200"></div> Unanswered</div>
          </div>
        </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-2 text-sm font-bold">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Main Question Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs min-h-[400px] flex flex-col">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-block px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider">
              {currentQ.subject}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-100">
              1 Point
            </span>
          </div>
          
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-8 leading-relaxed">
            {currentQ.text}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {currentQ.options.map((opt, oIdx) => {
              const isSelected = selectedAnswers[currentQ.id] === oIdx;
              return (
                <button
                  key={oIdx}
                  onClick={() => handleSelect(oIdx)}
                  className={`relative p-4 sm:p-5 rounded-2xl border-2 text-left transition-all active:scale-[0.99] group ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-3xs'
                      : 'border-slate-200 hover:border-indigo-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`h-6 w-6 shrink-0 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'
                    }`}>
                      {String.fromCharCode(65 + oIdx)}
                    </div>
                    <span className={`text-sm leading-snug font-medium ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                      {opt}
                    </span>
                  </div>
                  {isSelected && (
                    <CheckCircle className="absolute top-4 right-4 h-5 w-5 text-indigo-600 fill-indigo-100" />
                  )}
                </button>
              );
            })}
          </div>
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
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Final Answers'}
              {!isSubmitting && <Send className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
