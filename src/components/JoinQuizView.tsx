import React, { useState, useRef, useEffect } from 'react';
import { Target, ArrowRight, Loader2, AlertCircle, Trophy, History, Crown, ArrowUpRight, BookOpenCheck } from 'lucide-react';
import { joinQuiz, fetchGlobalLeaderboard, fetchQuizHistory } from '../services/api';
import type { Quiz, Question, GlobalLeaderboardEntry, QuizHistoryEntry } from '../types';

interface JoinQuizViewProps {
  onJoinSuccess: (attemptId: string, quiz: Quiz, questions: Question[]) => void;
  onViewLeaderboard: (quizId: string, quizTitle: string) => void;
  onReviewQuiz: (attemptId: string) => void;
  refreshKey?: number;
}

export default function JoinQuizView({ onJoinSuccess, onViewLeaderboard, onReviewQuiz, refreshKey }: JoinQuizViewProps) {
  const [code, setCode] = useState<string[]>(Array(5).fill(''));
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [globalBoard, setGlobalBoard] = useState<GlobalLeaderboardEntry[]>([]);
  const [history, setHistory] = useState<QuizHistoryEntry[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
    
    setDataLoading(true);
    Promise.all([
      fetchGlobalLeaderboard().catch(() => []),
      fetchQuizHistory().catch(() => [])
    ]).then(([board, hist]) => {
      setGlobalBoard(board);
      setHistory(hist);
      setDataLoading(false);
    });
  }, [refreshKey]);

  const handleChange = (index: number, value: string) => {
    const validValue = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (['0', 'O', '1', 'I'].includes(validValue)) return;

    if (validValue.length > 1) {
      const pasted = validValue.split('').filter(c => !['0', 'O', '1', 'I'].includes(c)).slice(0, 5);
      const newCode = [...code];
      pasted.forEach((char, i) => {
        if (index + i < 5) newCode[index + i] = char;
      });
      setCode(newCode);
      
      const nextFocus = Math.min(index + pasted.length, 4);
      inputRefs.current[nextFocus]?.focus();
    } else {
      const newCode = [...code];
      newCode[index] = validValue;
      setCode(newCode);

      if (validValue && index < 4) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newCode = [...code];
      newCode[index - 1] = '';
      setCode(newCode);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length !== 5) {
      setError('Please enter a 5-character code');
      return;
    }
    if (!displayName.trim()) {
      setError('Please enter a display name');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await joinQuiz(`EXM-${fullCode}`, displayName.trim());
      onJoinSuccess(data.attemptId, data.quiz, data.questions);
    } catch (err: any) {
      setError(err.message || 'Invalid code or already attempted');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pt-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Join Form */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm text-center sticky top-6">
          <div className="h-16 w-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xs">
            <Target className="h-8 w-8" />
          </div>
          
          <h1 className="text-2xl font-black text-slate-800 tracking-tight mb-2">
            Join a Shared Quiz
          </h1>
          <p className="text-sm text-slate-600 mb-8 leading-relaxed">
            Enter the 5-character code and your display name to enter the arena.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 text-left">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Alex M."
                maxLength={20}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-sm outline-hidden text-slate-800 font-medium transition-all"
              />
            </div>

            <div className="space-y-2 text-left pt-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">Quiz Code</label>
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                {code.map((char, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { inputRefs.current[idx] = el; }}
                    type="text"
                    maxLength={5}
                    value={char}
                    aria-label={`Quiz code character ${idx + 1}`}
                    onChange={(e) => handleChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className={`w-12 h-14 sm:w-[3.25rem] sm:h-16 text-center text-xl sm:text-2xl font-black rounded-xl border-2 outline-hidden transition-all ${
                      error ? 'border-red-300 bg-red-50 text-red-700 focus:border-red-500' 
                      : char ? 'border-indigo-500 bg-indigo-50 text-indigo-900 shadow-xs' 
                      : 'border-slate-200 bg-slate-50 text-slate-800 focus:border-indigo-400 focus:bg-white'
                    }`}
                  />
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-center justify-center gap-1.5 text-red-600 text-sm font-bold animate-slideUp bg-red-50 py-2 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || code.some(c => !c) || !displayName.trim()}
              className="w-full mt-4 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-xs transition-all flex items-center justify-center gap-2 group active:scale-[0.98]"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Enter Quiz'}
              {!loading && <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>
        </div>

        {/* Right Column: Leaderboards & History */}
        <div className="lg:col-span-7 space-y-6">
          {dataLoading ? (
            <div className="bg-white border border-slate-100 rounded-3xl p-12 flex flex-col items-center justify-center text-slate-400 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-sm font-semibold">Loading records...</span>
            </div>
          ) : (
            <>
              {/* Global Leaderboard */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                    <Trophy className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Global Top Scorers</h2>
                    <p className="text-xs text-slate-500">Overall points accumulated across all shared quizzes</p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                  <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <div className="col-span-2 sm:col-span-1 text-center">Rank</div>
                    <div className="col-span-6 sm:col-span-7">Player Name</div>
                    <div className="col-span-4 text-right">Total Points</div>
                  </div>
                  
                  <div className="divide-y divide-slate-100 max-h-[250px] overflow-y-auto">
                    {globalBoard.length === 0 ? (
                      <div className="p-6 text-center text-sm text-slate-500 font-medium">No scores yet. Be the first!</div>
                    ) : (
                      globalBoard.map((entry, idx) => (
                        <div key={entry.userId} className="grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-white transition-colors group">
                          <div className="col-span-2 sm:col-span-1 flex justify-center">
                            {idx === 0 ? <Crown className="h-5 w-5 text-amber-500" /> : 
                             idx === 1 ? <Crown className="h-5 w-5 text-slate-400" /> :
                             idx === 2 ? <Crown className="h-5 w-5 text-amber-700" /> :
                             <span className="text-sm font-bold text-slate-400">{idx + 1}</span>}
                          </div>
                          <div className="col-span-6 sm:col-span-7">
                            <span className="text-sm font-bold text-slate-800">{entry.displayName || 'Anonymous'}</span>
                            <span className="text-xs text-slate-400 ml-2 block sm:inline">{entry.quizzesTaken} quizzes taken</span>
                          </div>
                          <div className="col-span-4 text-right">
                            <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 font-black rounded-lg text-sm">
                              {entry.totalPoints} <span className="text-xs opacity-75 ml-0.5">pts</span>
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* My Recent History */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <History className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">My Quiz History</h2>
                    <p className="text-xs text-slate-500">Shared quizzes you've attended</p>
                  </div>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {history.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-500 font-medium border-2 border-dashed border-slate-200 rounded-2xl">
                      You haven't attended any shared quizzes yet.
                    </div>
                  ) : (
                    history.map(hist => (
                      <div 
                        key={hist.attemptId} 
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-slate-100 rounded-2xl hover:border-indigo-300 hover:shadow-xs transition-all bg-slate-50/50 group"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-slate-800 text-white text-[10px] font-bold rounded uppercase tracking-wider">
                              {hist.quizCode}
                            </span>
                            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                              {hist.subject}
                            </span>
                          </div>
                          <h3 className="font-bold text-slate-800 text-sm">{hist.title}</h3>
                          <p className="text-xs text-slate-500 mt-1">
                            Score: <strong className="text-slate-700">{hist.score}/{hist.totalQuestions}</strong> • 
                            {new Date(hist.completedAt).toLocaleDateString()}
                          </p>
                        </div>
                        
                        <div className="flex gap-2 shrink-0">
                          <button 
                            onClick={() => onReviewQuiz(hist.attemptId)}
                            className="px-3 py-2 bg-emerald-50 border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5"
                          >
                            <BookOpenCheck className="h-3.5 w-3.5" />
                            Review
                          </button>
                          <button 
                            onClick={() => onViewLeaderboard(hist.id, hist.title)}
                            className="px-3 py-2 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-indigo-700 font-bold text-xs rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5"
                          >
                            Leaderboard
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
