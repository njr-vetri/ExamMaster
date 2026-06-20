import React, { useState } from 'react';
import { Award, RefreshCw, MessageSquareCode, Check, X, AlertCircle, Sparkles, Filter, ChevronDown, ChevronUp, BookOpen, Clock, ArrowRight } from 'lucide-react';
import { MockTest, Question } from '../types';

interface ResultsViewProps {
  test: MockTest;
  onRetry: () => void;
  onAskDoubt: (question: Question) => void;
  onExit: () => void;
}

export default function ResultsView({ test, onRetry, onAskDoubt, onExit }: ResultsViewProps) {
  const [filterType, setFilterType] = useState<'all' | 'correct' | 'incorrect'>('all');
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(test.questions[0]?.id || null);

  const correctCount = test.correctCount || 0;
  const incorrectCount = test.questions.length - correctCount;
  const scorePercent = test.score || 0;

  const getVerdict = (score: number) => {
    if (score === 100) return { title: 'Perfect Score! 🎉', desc: 'Outstanding job! You have fully mastered these concepts.', color: 'text-emerald-600', bg: 'bg-emerald-50' };
    if (score >= 80) return { title: 'Excellent Work! 🌟', desc: 'Amazing effort. Just a little more review of explanations to grasp 100%.', color: 'text-teal-600', bg: 'bg-teal-50' };
    if (score >= 50) return { title: 'Good Attempt! 👍', desc: 'You have a stable grasp, but some key topics require a quick re-run.', color: 'text-amber-600', bg: 'bg-amber-50' };
    return { title: 'Keep Learning! 📚', desc: 'No worries! Practice makes perfect. Review the explanations and initiate doubts with the tutor.', color: 'text-rose-600', bg: 'bg-rose-50' };
  };

  const verdict = getVerdict(scorePercent);

  // Filter questions based on selected tab
  const filteredQuestions = test.questions.filter((q, qIndex) => {
    const userAns = test.selectedAnswers?.[q.id];
    const isCorrect = userAns === q.correctOptionIndex;
    if (filterType === 'correct') return isCorrect;
    if (filterType === 'incorrect') return !isCorrect || userAns === undefined;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      
      {/* Overview Card */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="absolute right-0 top-0 p-8 opacity-10 translate-x-3 -translate-y-3 hidden sm:block">
          <Award className="h-44 w-44 text-emerald-600" />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-8 relative z-10">
          {/* Circular Score Ring */}
          <div className="relative h-32 w-32 shrink-0 flex items-center justify-center">
            {/* SVG Arc Background */}
            <svg className="absolute inset-0 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#f1f5f9"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke={scorePercent >= 70 ? "#10b981" : "#f59e0b"}
                strokeWidth="8"
                fill="transparent"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * scorePercent) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="text-center select-none">
              <span className="text-3xl font-black text-slate-800">{scorePercent}%</span>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Score</p>
            </div>
          </div>

          {/* Verdict Info */}
          <div className="space-y-3 text-center sm:text-left flex-1">
            <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${verdict.bg} ${verdict.color}`}>
              {verdict.title}
            </div>
            <p className="text-sm font-medium text-slate-600 leading-relaxed max-w-lg">
              {verdict.desc}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs pt-1">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Check className="h-4 w-4 text-emerald-600" />
                <span><strong>{correctCount}</strong> Correct</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500">
                <X className="h-4 w-4 text-red-500" />
                <span><strong>{incorrectCount}</strong> Wrong</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500">
                <Clock className="h-4 w-4 text-slate-400" />
                <span>Spent <strong>{Math.round((test.timeSpent || 0) / 60)} minutes</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Option action links bottom */}
        <div className="flex flex-wrap gap-2 pt-6 border-t border-slate-50 mt-6 justify-center sm:justify-start select-none">
          <button
            onClick={onRetry}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs active:scale-[0.98] transition-all flex items-center gap-1.5"
            id="result-btn-retry"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry This Test
          </button>
          
          <button
            onClick={onExit}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs active:scale-[0.98] transition-all flex items-center gap-1.5"
          >
            Dashboard
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Answer Key / Explanation list */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-500" />
            Detailed Review & Rationales
          </h2>

          {/* Filter selector */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterType === 'all' ? 'bg-white text-slate-800 shadow-3xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All ({test.questions.length})
            </button>
            <button
              onClick={() => setFilterType('correct')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterType === 'correct' ? 'bg-white text-emerald-700 shadow-3xs' : 'text-slate-500 hover:text-emerald-700'
              }`}
            >
              Correct ({correctCount})
            </button>
            <button
              onClick={() => setFilterType('incorrect')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterType === 'incorrect' ? 'bg-white text-red-700 shadow-3xs' : 'text-slate-500 hover:text-red-700'
              }`}
            >
              Incorrect ({incorrectCount})
            </button>
          </div>
        </div>

        {filteredQuestions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500 text-sm">
            No questions match this filter criteria.
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredQuestions.map((q, filteredIdx) => {
              // find absolute index in main array
              const absoluteIdx = test.questions.findIndex(trueQ => trueQ.id === q.id);
              const userSelectedOpt = test.selectedAnswers?.[q.id];
              const isUserCorrect = userSelectedOpt === q.correctOptionIndex;
              const isExpanded = expandedQuestionId === q.id;

              return (
                <div
                  key={q.id}
                  className={`bg-white border rounded-2xl transition-all ${
                    isExpanded ? 'border-indigo-200/80 shadow-2xs' : 'border-slate-100 hover:border-slate-200 shadow-3xs'
                  }`}
                >
                  {/* Row Trigger Title */}
                  <div
                    onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                    className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer select-none"
                  >
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      {/* Circle indicator of success */}
                      <div className={`h-6 w-6 rounded-full shrink-0 flex items-center justify-center mt-0.5 ${
                        userSelectedOpt === undefined
                          ? 'bg-amber-100 text-amber-700'
                          : isUserCorrect
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                      }`}>
                        {userSelectedOpt === undefined ? (
                          <span className="text-[10px] font-bold">Skipped</span>
                        ) : isUserCorrect ? (
                          <Check className="h-4 w-4 stroke-[3px]" />
                        ) : (
                          <X className="h-4 w-4 stroke-[3px]" />
                        )}
                      </div>

                      <div className="space-y-0.5 min-w-0 flex-1">
                        <span className="text-[10px] font-mono text-slate-400 font-bold">
                          QUESTION {(absoluteIdx + 1).toString().padStart(2, '0')}
                        </span>
                        <h4 className="text-sm font-semibold text-slate-800 truncate">
                          {q.text}
                        </h4>
                      </div>
                    </div>

                    <button className="h-7 w-7 rounded-full text-slate-400 hover:bg-slate-50 flex items-center justify-center">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Expanded Body */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-1 border-t border-slate-50 space-y-4">
                      {/* Full question Text */}
                      <p className="text-sm font-semibold text-slate-750 leading-relaxed whitespace-pre-line text-slate-700 bg-slate-50/40 p-3 rounded-xl border border-slate-100/50">
                        {q.text}
                      </p>

                      {/* Options Review list */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {q.options.map((opt, oIdx) => {
                          const isCorrectChoice = q.correctOptionIndex === oIdx;
                          const isUserSelected = userSelectedOpt === oIdx;
                          
                          let cardStyle = 'bg-slate-50/50 text-slate-600 border-slate-100';
                          if (isCorrectChoice) cardStyle = 'bg-emerald-500/5 border-emerald-500/20 text-emerald-800 font-bold';
                          if (isUserSelected && !isCorrectChoice) cardStyle = 'bg-red-500/5 border-red-500/20 text-red-800 font-bold';

                          return (
                            <div
                              key={oIdx}
                              className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 transition-all ${cardStyle}`}
                            >
                              <span className={`h-6 w-6 rounded-lg text-3xs font-black flex items-center justify-center shrink-0 ${
                                isCorrectChoice
                                  ? 'bg-emerald-600 text-white'
                                  : isUserSelected
                                    ? 'bg-red-650 text-red-700 border border-red-400/30 bg-red-100'
                                    : 'bg-slate-200 text-slate-500'
                              }`}>
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              
                              <span className="flex-1">{opt}</span>

                              {isCorrectChoice && (
                                <span className="ml-auto text-[8px] font-black uppercase bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-sm">
                                  Correct
                                </span>
                              )}
                              {isUserSelected && !isCorrectChoice && (
                                <span className="ml-auto text-[8px] font-black uppercase bg-red-100 text-red-700 px-1.5 py-0.5 rounded-sm">
                                  Your Choice
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation box */}
                      <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                          <Sparkles className="h-3 w-3 fill-current" />
                          Explanation & Learning Points
                        </span>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {q.explanation}
                        </p>
                      </div>

                      {/* Ask AI Doubt Button */}
                      <div className="flex justify-end pt-1 select-none">
                        <button
                          type="button"
                          onClick={() => onAskDoubt(q)}
                          className="px-4 py-2 bg-slate-900 hover:bg-black text-white hover:shadow-xs active:scale-95 text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 transition-all"
                          id={`btn-ask-doubt-${q.id}`}
                        >
                          <MessageSquareCode className="h-4 w-4" />
                          Debate with AI Coach
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
