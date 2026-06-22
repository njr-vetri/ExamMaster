import React, { useEffect, useState } from 'react';
import { Trophy, Clock, Target, ArrowLeft, RefreshCw } from 'lucide-react';
import { fetchQuizLeaderboard } from '../services/api';
import type { LeaderboardEntry } from '../types';

interface QuizLeaderboardViewProps {
  quizId: string;
  quizTitle: string;
  onExit: () => void;
}

export default function QuizLeaderboardView({ quizId, quizTitle, onExit }: QuizLeaderboardViewProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchQuizLeaderboard(quizId);
      setLeaderboard(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [quizId]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <button onClick={onExit} className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>
        <button onClick={loadData} title="Refresh Leaderboard" aria-label="Refresh Leaderboard" className="p-2 text-slate-500 hover:bg-white rounded-lg hover:shadow-xs transition-all">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-md flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-indigo-100 font-bold text-xs uppercase tracking-wider mb-2">
            <Trophy className="h-4 w-4" /> Global Leaderboard
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">{quizTitle}</h1>
          <p className="text-indigo-100 mt-2 text-sm">Ranked by score (highest) then time taken (lowest).</p>
        </div>
        <div className="hidden sm:flex h-20 w-20 bg-white/10 rounded-full items-center justify-center backdrop-blur-xs">
          <Trophy className="h-10 w-10 text-amber-300" />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-medium">Loading rankings...</div>
        ) : leaderboard.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-medium">No one has completed this quiz yet. Be the first!</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {leaderboard.map((entry, idx) => (
              <div key={idx} className="p-4 sm:p-5 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                <div className={`h-10 w-10 sm:h-12 sm:w-12 shrink-0 rounded-2xl flex items-center justify-center font-black text-lg ${
                  idx === 0 ? 'bg-amber-100 text-amber-700' : 
                  idx === 1 ? 'bg-slate-200 text-slate-700' :
                  idx === 2 ? 'bg-orange-100 text-orange-800' :
                  'bg-slate-50 border border-slate-200 text-slate-500'
                }`}>
                  #{idx + 1}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 text-sm sm:text-base truncate">
                    {entry.displayName || `User ${entry.userId.substring(0, 8)}...`}
                  </h3>
                  <div className="flex items-center gap-4 mt-1 text-xs font-semibold text-slate-500">
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {entry.score} / {entry.totalQuestions}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(entry.durationSeconds)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
