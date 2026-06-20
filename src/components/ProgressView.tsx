import React from 'react';
import { Trophy, TrendingDown, Target, CheckCircle2, Star, Crown, Flame, Brain, Clock, Lock, BarChart3, Zap, Award, ShieldCheck, BookOpen, CheckCircle } from 'lucide-react';
import { MockTest, UsageStats } from '../types';

interface ProgressViewProps {
  tests: MockTest[];
  usageStats?: UsageStats | null;
  streakCount: number;
  onNavigate: (view: string) => void;
}

export default function ProgressView({ tests, usageStats, streakCount, onNavigate }: ProgressViewProps) {
  const completedTests = tests.filter(t => t.isCompleted);
  const totalScore = completedTests.reduce((acc, t) => acc + (t.score || 0), 0);
  const avgScore = completedTests.length > 0 ? Math.round(totalScore / completedTests.length) : 0;
  const totalCorrect = completedTests.reduce((acc, t) => acc + (t.correctCount || 0), 0);
  const totalAttempted = completedTests.reduce((acc, t) => acc + (t.questions.length || 0), 0);

  const recentScores = completedTests.slice(0, 8).reverse();
  const scorePoints = recentScores.map((test, index) => {
    const x = recentScores.length <= 1 ? 50 : (index / (recentScores.length - 1)) * 100;
    const y = 100 - (test.score || 0);
    return `${x},${y}`;
  }).join(' ');

  // Achievement Badges
  const achievements = [
    {
      id: 'first_test', title: 'First Step', description: 'Complete your first test',
      icon: CheckCircle2, unlocked: completedTests.length >= 1,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      lockedColor: 'text-slate-700 bg-slate-100 border-slate-300',
    },
    {
      id: 'five_tests', title: 'Dedicated', description: 'Complete 5 tests',
      icon: Star, unlocked: completedTests.length >= 5,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      lockedColor: 'text-slate-700 bg-slate-100 border-slate-300',
    },
    {
      id: 'perfect_score', title: 'Perfectionist', description: 'Score 100% on any test',
      icon: Crown, unlocked: completedTests.some(t => t.score === 100),
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      lockedColor: 'text-slate-700 bg-slate-100 border-slate-300',
    },
    {
      id: 'speed_demon', title: 'Speed Demon', description: 'Finish a test in under 5 min',
      icon: Clock, unlocked: completedTests.some(t => (t.timeSpent || Infinity) < 300),
      color: 'text-rose-600 bg-rose-50 border-rose-200',
      lockedColor: 'text-slate-700 bg-slate-100 border-slate-300',
    },
    {
      id: 'streak_7', title: '7-Day Warrior', description: 'Maintain a 7-day streak',
      icon: Flame, unlocked: streakCount >= 7,
      color: 'text-orange-600 bg-orange-50 border-orange-200',
      lockedColor: 'text-slate-700 bg-slate-100 border-slate-300',
    },
    {
      id: 'brain_power', title: 'Brain Power', description: 'Answer 50 questions correctly',
      icon: Brain, unlocked: totalCorrect >= 50,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      lockedColor: 'text-slate-700 bg-slate-100 border-slate-300',
    },
    {
      id: 'ten_tests', title: 'Consistent', description: 'Complete 10 tests',
      icon: Award, unlocked: completedTests.length >= 10,
      color: 'text-sky-600 bg-sky-50 border-sky-200',
      lockedColor: 'text-slate-700 bg-slate-100 border-slate-300',
    },
    {
      id: 'high_score', title: 'High Scorer', description: 'Average score above 80%',
      icon: TrendingDown, unlocked: avgScore >= 80 && completedTests.length > 0,
      color: 'text-teal-600 bg-teal-50 border-teal-200',
      lockedColor: 'text-slate-700 bg-slate-100 border-slate-300',
    },
  ];
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  // Weak Topics
  const subjectStats: Record<string, { correct: number; total: number }> = {};
  completedTests.forEach(test => {
    const subj = test.subject || 'General';
    if (!subjectStats[subj]) subjectStats[subj] = { correct: 0, total: 0 };
    subjectStats[subj].total += test.questions.length;
    subjectStats[subj].correct += test.correctCount || 0;
  });
  const allTopics = Object.entries(subjectStats)
    .map(([subject, stats]) => ({
      subject,
      accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
      total: stats.total,
      correct: stats.correct,
    }))
    .sort((a, b) => a.accuracy - b.accuracy);
  const weakTopics = allTopics.slice(0, 4);

  // Weekly Challenge
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const testsThisWeek = completedTests.filter(t => new Date(t.createdAt) >= weekStart).length;
  const weeklyGoal = 5;
  const weeklyProgress = Math.min(Math.round((testsThisWeek / weeklyGoal) * 100), 100);

  return (
    <div className="space-y-8 animate-fadeIn">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
            <BarChart3 className="h-3.5 w-3.5" />
            Personal Analytics
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Progress &amp; Insights
          </h1>
          <p className="text-sm text-slate-700 max-w-xl">
            Track your score history, unlock achievements, identify weak spots, and crush your weekly targets.
          </p>
        </div>
        <button
          onClick={() => onNavigate('upload')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-sm active:scale-95 shrink-0"
        >
          <Zap className="h-3.5 w-3.5" />
          Generate More Tests
        </button>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center shadow-xs">
          <div className="text-3xl font-black text-indigo-700">{completedTests.length}</div>
          <div className="text-xs text-slate-700 font-semibold mt-1">Tests Completed</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center shadow-xs">
          <div className={`text-3xl font-black ${avgScore >= 70 ? 'text-emerald-600' : avgScore >= 40 ? 'text-amber-600' : 'text-rose-600'}`}>{avgScore}%</div>
          <div className="text-xs text-slate-700 font-semibold mt-1">Average Score</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center shadow-xs">
          <div className="text-3xl font-black text-slate-800">{totalCorrect}<span className="text-lg text-slate-400">/{totalAttempted}</span></div>
          <div className="text-xs text-slate-700 font-semibold mt-1">Questions Correct</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center shadow-xs">
          <div className="text-3xl font-black text-orange-500">{streakCount}</div>
          <div className="text-xs text-slate-700 font-semibold mt-1">Day Streak 🔥</div>
        </div>
      </div>

      {/* Score History + Weekly Challenge */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Score History Chart */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-800 text-sm tracking-wide uppercase flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-indigo-500" />
              Score History
            </h2>
            <span className="text-[10px] text-slate-800 font-medium">Last {recentScores.length} tests</span>
          </div>
          {recentScores.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-slate-800 text-sm">
              Complete a test to see your score trend here.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="h-40 bg-slate-50 rounded-2xl p-3 relative overflow-hidden">
                {/* Y-axis labels */}
                <div className="absolute left-2 top-2 bottom-2 flex flex-col justify-between text-[9px] text-slate-700 font-mono">
                  <span>100%</span>
                  <span>50%</span>
                  <span>0%</span>
                </div>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible pl-4">
                  {/* Grid lines */}
                  <line x1="0" y1="50" x2="100" y2="50" stroke="#e2e8f0" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
                  <line x1="0" y1="30" x2="100" y2="30" stroke="#e2e8f0" strokeWidth="0.5" vectorEffect="non-scaling-stroke" strokeDasharray="2,2" />
                  <line x1="0" y1="70" x2="100" y2="70" stroke="#e2e8f0" strokeWidth="0.5" vectorEffect="non-scaling-stroke" strokeDasharray="2,2" />
                  {/* Area fill */}
                  <polygon
                    points={`0,100 ${scorePoints} 100,100`}
                    fill="rgba(99,102,241,0.07)"
                  />
                  <polyline points={scorePoints} fill="none" stroke="#4f46e5" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
                  {recentScores.map((test, index) => {
                    const x = recentScores.length <= 1 ? 50 : (index / (recentScores.length - 1)) * 100;
                    const y = 100 - (test.score || 0);
                    return (
                      <circle key={test.id} cx={x} cy={y} r="3" fill="#4f46e5" vectorEffect="non-scaling-stroke" />
                    );
                  })}
                </svg>
              </div>
              {/* Score list */}
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                {recentScores.map((test, i) => (
                  <div key={test.id} className="text-center">
                    <div className={`text-xs font-bold ${(test.score || 0) >= 70 ? 'text-emerald-600' : (test.score || 0) >= 40 ? 'text-amber-600' : 'text-rose-600'}`}>
                      {test.score}%
                    </div>
                    <div className="text-[9px] text-slate-800 font-semibold truncate">T{i + 1}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Weekly Challenge */}
        <div className="lg:col-span-2 bg-gradient-to-br from-indigo-600 to-violet-700 text-white rounded-3xl p-6 shadow-sm space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-white flex items-center gap-2 text-sm">
                <Target className="h-4.5 w-4.5 text-indigo-200" />
                Weekly Challenge
              </h2>
              <span className="text-[10px] font-bold bg-white/20 px-2.5 py-1 rounded-full">
                {testsThisWeek}/{weeklyGoal} Tests
              </span>
            </div>
            <p className="text-sm text-indigo-100 font-light leading-relaxed">
              Complete <span className="font-bold text-white">{weeklyGoal} tests</span> this week to earn the <span className="font-bold text-amber-300">Weekly Warrior</span> badge!
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                <svg width="100%" height="100%" preserveAspectRatio="none">
                  <rect width={`${weeklyProgress}%`} height="100%" className="fill-white transition-all duration-700" />
                </svg>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-indigo-200">{weeklyProgress}% complete</span>
                {weeklyProgress >= 100 ? (
                  <span className="font-bold text-amber-300 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Challenge Complete! 🎉
                  </span>
                ) : (
                  <span className="text-indigo-200">{weeklyGoal - testsThisWeek} more to go</span>
                )}
              </div>
            </div>

            {weeklyProgress < 100 && (
              <button
                onClick={() => onNavigate('upload')}
                className="w-full px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-white/20"
              >
                <Zap className="h-3.5 w-3.5" />
                Take a Test Now
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Achievements + Focus Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Achievement Badges */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-800 text-sm tracking-wide uppercase flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              Achievements
            </h2>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
              {unlockedCount}/{achievements.length} Unlocked
            </span>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {achievements.map((badge) => {
              const Icon = badge.icon;
              return (
                <div
                  key={badge.id}
                  title={badge.unlocked ? `${badge.title}: ${badge.description}` : `🔒 ${badge.description}`}
                  className={`relative flex flex-col items-center gap-2 p-3 rounded-2xl border text-center transition-all ${
                    badge.unlocked
                      ? `${badge.color} shadow-xs hover:scale-105 cursor-default`
                      : `${badge.lockedColor} opacity-40 grayscale`
                  }`}
                >
                  {!badge.unlocked && (
                    <Lock className="h-2.5 w-2.5 absolute top-2 right-2 text-slate-700" />
                  )}
                  <Icon className={`h-5 w-5 ${badge.unlocked ? '' : 'text-slate-300'}`} />
                  <span className="text-[10px] font-bold leading-tight">{badge.title}</span>
                </div>
              );
            })}
          </div>

          {unlockedCount === 0 && (
            <p className="text-xs text-slate-800 text-center py-2">Complete your first test to start unlocking badges!</p>
          )}
        </div>

        {/* Focus Areas */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-800 text-sm tracking-wide uppercase flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-rose-500" />
              Focus Areas
            </h2>
            <span className="text-[10px] text-slate-800 font-medium">Weakest topics first</span>
          </div>

          {weakTopics.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
              <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <TrendingDown className="h-6 w-6" />
              </div>
              <p className="text-xs text-slate-800 max-w-xs">Complete a few tests to see which subjects need more practice.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {allTopics.slice(0, 6).map((topic) => (
                <div key={topic.subject} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 truncate max-w-[60%]">{topic.subject}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-800 font-semibold">{topic.correct}/{topic.total}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        topic.accuracy >= 70 ? 'bg-emerald-50 text-emerald-700' :
                        topic.accuracy >= 40 ? 'bg-amber-50 text-amber-700' :
                        'bg-rose-50 text-rose-700'
                      }`}>
                        {topic.accuracy}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <svg width="100%" height="100%" preserveAspectRatio="none">
                      <rect
                        width={`${topic.accuracy}%`}
                        height="100%"
                        className={`transition-all duration-500 ${
                          topic.accuracy >= 70 ? 'fill-emerald-500' :
                          topic.accuracy >= 40 ? 'fill-amber-500' :
                          'fill-rose-500'
                        }`}
                      />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Admin Usage */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5 shadow-xs">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-800 text-sm tracking-wide uppercase flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-slate-700" />
            Admin Usage Stats
          </h2>
          <span className="text-[10px] text-slate-800 font-medium">API consumption overview</span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-4 text-center">
            <div className="text-2xl font-black text-indigo-700">{usageStats?.totals.generations || 0}</div>
            <div className="text-[10px] font-bold text-indigo-500 mt-1">AI Runs</div>
          </div>
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-center">
            <div className="text-2xl font-black text-slate-700">{usageStats?.totals.uploads || 0}</div>
            <div className="text-[10px] font-bold text-slate-700 mt-1">Uploads</div>
          </div>
          <div className="rounded-2xl bg-violet-50 border border-violet-100 p-4 text-center">
            <div className="text-2xl font-black text-violet-700">{Math.round((usageStats?.totals.estimatedTokens || 0) / 1000)}k</div>
            <div className="text-[10px] font-bold text-violet-500 mt-1">Tokens</div>
          </div>
          <div className="col-span-3 rounded-2xl bg-slate-50 border border-slate-100 p-4">
            <div className="text-[10px] font-bold text-slate-800 uppercase tracking-wide mb-3">Recent Activity</div>
            <div className="space-y-2">
              {(usageStats?.daily || []).slice(-5).reverse().map(day => (
                <div key={day.date} className="flex items-center justify-between text-xs text-slate-800">
                  <span className="font-semibold text-slate-700 text-[11px]">{day.date}</span>
                  <div className="flex items-center gap-3 text-[10px] text-slate-700">
                    <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-semibold">{day.generations} runs</span>
                    <span className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-semibold">{day.uploads} uploads</span>
                    <span className="bg-violet-50 text-violet-700 px-1.5 py-0.5 rounded font-semibold">{day.estimatedTokens} tokens</span>
                  </div>
                </div>
              ))}
              {(usageStats?.daily || []).length === 0 && (
                <p className="text-xs text-slate-800">No usage data yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
