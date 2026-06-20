import React from 'react';
import { BookOpen, Upload, Award, RefreshCw, FileCheck2, ArrowRight, Zap, GraduationCap, Flame, History, Crown, Star, Sparkles, Trophy, Target, Brain, Clock, Moon, CheckCircle2, Lock, TrendingDown, BarChart3 } from 'lucide-react';
import { MockTest, UsageStats } from '../types';

const DAILY_TIPS = [
  {
    english: "When learning in a bilingual medium (Tamil & English), read the question first in your primary speaking language, then cross-reference with the other version. This triggers dual code memory pathways!",
    tamil: "கேடில் விழுச்செல்வம் கல்வி யொருவற்கு மாடல்ல மற்றைய வை."
  },
  {
    english: "Active recall is 300% more effective than passive reading. Don't just re-read your notes; close the book and try to explain the concept out loud.",
    tamil: "கற்க கசடறக் கற்பவை கற்றபின் நிற்க அதற்குத் தக."
  },
  {
    english: "Space out your study sessions. Reviewing material after 1 day, 3 days, and 1 week helps transfer information from short-term to long-term memory.",
    tamil: "எண்ணென்ப ஏனை எழுத்தென்ப இவ்விரண்டும் கண்ணென்ப வாழும் உயிர்க்கு."
  },
  {
    english: "Stay hydrated and get 8 hours of sleep before an exam. Your brain consolidates and organizes everything you learned while you are sleeping.",
    tamil: "தொட்டனைத் தூறும் மணற்கேணி மாந்தர்க்குக் கற்றனைத் தூறும் அறிவு."
  },
  {
    english: "Take frequent, short breaks using the Pomodoro technique (25 mins study, 5 mins break). This maintains peak focus without burning out.",
    tamil: "உடையார்முன் இல்லார்போல் ஏக்கற்றும் கற்றார் கடையரே கல்லா தவர்."
  }
];

interface DashboardViewProps {
  onNavigate: (view: string) => void;
  tests: MockTest[];
  onSelectTest: (test: MockTest) => void;
  questionCount: number;
  usageStats?: UsageStats | null;
}

export default function DashboardView({ onNavigate, tests, onSelectTest, questionCount, usageStats }: DashboardViewProps) {
  // Compute some realistic stats
  const completedTests = tests.filter(t => t.isCompleted);
  const totalScore = completedTests.reduce((acc, current) => acc + (current.score || 0), 0);
  const avgScore = completedTests.length > 0 ? Math.round(totalScore / completedTests.length) : 0;
  
  const totalCorrect = completedTests.reduce((acc, current) => acc + (current.correctCount || 0), 0);
  const totalAttempted = completedTests.reduce((acc, current) => acc + (current.questions.length || 0), 0);
  const correctRate = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;
  const recentScores = completedTests.slice(0, 8).reverse();
  const scorePoints = recentScores.map((test, index) => {
    const x = recentScores.length <= 1 ? 50 : (index / (recentScores.length - 1)) * 100;
    const y = 100 - (test.score || 0);
    return `${x},${y}`;
  }).join(' ');

  // Calculate Realistic Streak
  let streakCount = 0;
  if (usageStats?.daily?.length) {
    const msPerDay = 1000 * 60 * 60 * 24;
    const dates = usageStats.daily.map(d => {
      // Normalize to midnight UTC to avoid timezone shifts
      const date = new Date(d.date);
      return Math.floor(date.getTime() / msPerDay);
    });
    
    // Sort descending (most recent first)
    dates.sort((a, b) => b - a);
    // Remove duplicates just in case
    const uniqueDates = [...new Set(dates)];
    
    const today = Math.floor(Date.now() / msPerDay);
    let expectedDate = today;

    // Check if user was active today or yesterday
    if (uniqueDates.includes(today)) {
      streakCount = 1;
      expectedDate = today - 1;
    } else if (uniqueDates.includes(today - 1)) {
      streakCount = 1;
      expectedDate = today - 2;
    }

    if (streakCount > 0) {
      for (let d of uniqueDates) {
        if (d === expectedDate) {
          streakCount++;
          expectedDate--;
        } else if (d < expectedDate) {
          // Gap found, streak broken
          break;
        }
      }
    }
  }

  // Determine Badge based on streak
  let badgeTitle = "Starter";
  let badgeColor = "bg-slate-100 text-slate-700 border-slate-200";
  let BadgeIcon = Sparkles;
  
  if (streakCount >= 30) {
    badgeTitle = "Legendary";
    badgeColor = "bg-amber-100 text-amber-700 border-amber-200";
    BadgeIcon = Crown;
  } else if (streakCount >= 14) {
    badgeTitle = "Master";
    badgeColor = "bg-purple-100 text-purple-700 border-purple-200";
    BadgeIcon = Trophy;
  } else if (streakCount >= 7) {
    badgeTitle = "Achiever";
    badgeColor = "bg-indigo-100 text-indigo-700 border-indigo-200";
    BadgeIcon = Award;
  } else if (streakCount >= 3) {
    badgeTitle = "On Fire";
    badgeColor = "bg-orange-100 text-orange-700 border-orange-200";
    BadgeIcon = Flame;
  }

  // Achievement Badges system
  const achievements = [
    {
      id: 'first_test',
      title: 'First Step',
      description: 'Complete your first test',
      icon: CheckCircle2,
      unlocked: completedTests.length >= 1,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      lockedColor: 'text-slate-300 bg-slate-50 border-slate-200',
    },
    {
      id: 'five_tests',
      title: 'Dedicated',
      description: 'Complete 5 tests',
      icon: Star,
      unlocked: completedTests.length >= 5,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      lockedColor: 'text-slate-300 bg-slate-50 border-slate-200',
    },
    {
      id: 'perfect_score',
      title: 'Perfectionist',
      description: 'Score 100% on any test',
      icon: Crown,
      unlocked: completedTests.some(t => t.score === 100),
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      lockedColor: 'text-slate-300 bg-slate-50 border-slate-200',
    },
    {
      id: 'speed_demon',
      title: 'Speed Demon',
      description: 'Finish a test in under 5 min',
      icon: Clock,
      unlocked: completedTests.some(t => (t.timeSpent || Infinity) < 300),
      color: 'text-rose-600 bg-rose-50 border-rose-200',
      lockedColor: 'text-slate-300 bg-slate-50 border-slate-200',
    },
    {
      id: 'streak_7',
      title: '7-Day Warrior',
      description: 'Maintain a 7-day streak',
      icon: Flame,
      unlocked: streakCount >= 7,
      color: 'text-orange-600 bg-orange-50 border-orange-200',
      lockedColor: 'text-slate-300 bg-slate-50 border-slate-200',
    },
    {
      id: 'brain_power',
      title: 'Brain Power',
      description: 'Answer 50 questions correctly',
      icon: Brain,
      unlocked: totalCorrect >= 50,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      lockedColor: 'text-slate-300 bg-slate-50 border-slate-200',
    },
  ];

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  // Weak Topics Analysis
  const subjectStats: Record<string, { correct: number; total: number }> = {};
  completedTests.forEach(test => {
    const subj = test.subject || 'General';
    if (!subjectStats[subj]) subjectStats[subj] = { correct: 0, total: 0 };
    subjectStats[subj].total += test.questions.length;
    subjectStats[subj].correct += test.correctCount || 0;
  });

  const weakTopics = Object.entries(subjectStats)
    .map(([subject, stats]) => ({
      subject,
      accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
      total: stats.total,
      correct: stats.correct,
    }))
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 4);

  // Weekly Challenge
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const testsThisWeek = completedTests.filter(t => new Date(t.createdAt) >= weekStart).length;
  const weeklyGoal = 5;
  const weeklyProgress = Math.min(Math.round((testsThisWeek / weeklyGoal) * 100), 100);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Dynamic Student Banner */}
      <div className="relative overflow-hidden group bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-sm">
        <div className="absolute top-0 right-0 p-4 opacity-5 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
          <GraduationCap className="h-64 w-64 text-indigo-600" />
        </div>
        
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
            <Zap className="h-3 w-3 fill-current" />
            AI Mock Prep Active
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950">
            வணக்கம், Ready to ace your exams?
          </h1>
          <p className="text-slate-650 leading-relaxed font-sans text-sm">
            Upload study materials, notes, or lectures. Generate unlimited mock tests in Tamil, English, or Bilingual, and use the AI coach to learn from your mistakes instantly.
          </p>
          
          <div className="pt-4 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('upload')}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-sm active:scale-95 transition-all text-sm inline-flex items-center gap-2"
              id="dash-btn-upload"
            >
              <Upload className="h-4 w-4" />
              Upload Material
            </button>
            <button
              onClick={() => onNavigate('qbank')}
              className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-medium shadow-xs active:scale-95 transition-all text-sm inline-flex items-center gap-2"
              id="dash-btn-qbank"
            >
              <BookOpen className="h-4 w-4" />
              Question Bank
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Streak Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 shadow-xs relative overflow-hidden group">
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${
            streakCount > 0 ? 'bg-orange-50 text-orange-500' : 'bg-slate-50 text-slate-400'
          }`}>
            <Flame className={`h-6 w-6 ${streakCount > 0 ? 'fill-current' : ''}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-0.5">
              <div className="text-xs text-slate-550 font-medium uppercase tracking-wider">Current Streak</div>
              <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${badgeColor}`}>
                <BadgeIcon className="h-3 w-3" />
                {badgeTitle}
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-800">
              {streakCount} {streakCount === 1 ? 'Day' : 'Days'}
            </div>
            {streakCount === 0 ? (
              <div className="text-xs text-slate-500 font-medium">Do a test to start!</div>
            ) : (
              <div className="text-xs text-orange-600 font-medium">Keep it up! 🔥</div>
            )}
          </div>
        </div>

        {/* Avg Score Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 shadow-xs">
          <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-slate-550 font-medium uppercase tracking-wider">Average Score</div>
            <div className="text-2xl font-bold text-slate-800">{avgScore}%</div>
            <div className="text-xs text-indigo-600 font-medium">From {completedTests.length} tests</div>
          </div>
        </div>

        {/* Accuracy Rate */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 shadow-xs">
          <div className="h-12 w-12 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center">
            <FileCheck2 className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-slate-550 font-medium uppercase tracking-wider">Questions Solved</div>
            <div className="text-2xl font-bold text-slate-800">{totalCorrect} / {totalAttempted}</div>
            <div className="text-xs text-indigo-600 font-medium">{correctRate}% accuracy rate</div>
          </div>
        </div>

        {/* Active Pool */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 shadow-xs">
          <div className="h-12 w-12 rounded-xl bg-indigo-50/50 text-indigo-700 flex items-center justify-center">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-slate-550 font-medium uppercase tracking-wider">Question Pool</div>
            <div className="text-2xl font-bold text-slate-800">{questionCount} Qs</div>
            <div className="text-xs text-indigo-600 font-medium">Auto-generated items</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Mock Tests History */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <History className="h-5 w-5 text-indigo-500" />
              Recent Practice Sessions
            </h2>
            <button
              onClick={() => onNavigate('upload')}
              className="text-xs font-semibold text-indigo-650 hover:text-indigo-700 flex items-center gap-1"
            >
              Generate New
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {tests.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-250 p-8 text-center text-slate-500 space-y-3">
                <p>No tests created yet.</p>
                <button
                  onClick={() => onNavigate('upload')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold inline-flex items-center gap-1.5"
                >
                  Create Mock Test
                </button>
              </div>
            ) : (
              tests.map((test) => (
                <div
                  key={test.id}
                  onClick={() => onSelectTest(test)}
                  className="group bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs"
                >
                  <div className="space-y-1.5 flex-1 select-none">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {test.subject}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-rose-50 text-rose-700 uppercase">
                        {test.difficulty}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-indigo-50 text-indigo-700 capitalize">
                        {test.language}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-800 group-hover:text-indigo-650 transition-colors">
                      {test.title}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Created on {test.createdAt} • {test.questions.length} questions
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-150">
                    <div className="text-right">
                      {test.isCompleted ? (
                        <div>
                          <div className="text-sm font-bold text-slate-800">
                            Score: <span className={test.score && test.score >= 70 ? "text-emerald-600" : "text-amber-600"}>{test.score}%</span>
                          </div>
                          <p className="text-3xs text-slate-400">
                            {test.correctCount} correct • {Math.round((test.timeSpent || 0) / 60)}m spent
                          </p>
                        </div>
                      ) : (
                        <span className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 text-3xs font-bold uppercase tracking-wider">
                          Ready to Take
                        </span>
                      )}
                    </div>
                    
                    <button aria-label="Start Test" title="Start Test" className="h-8 w-8 rounded-full bg-slate-50 group-hover:bg-indigo-50 text-slate-400 group-hover:text-indigo-650 flex items-center justify-center transition-colors">
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Side Panel: Study Checklist & Tips */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase">Score History</h3>
            {recentScores.length === 0 ? (
              <p className="text-xs text-slate-500">Complete a test to see score trends.</p>
            ) : (
              <div className="h-32">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
                  <polyline points={scorePoints} fill="none" stroke="#4f46e5" strokeWidth="3" vectorEffect="non-scaling-stroke" />
                  {recentScores.map((test, index) => {
                    const x = recentScores.length <= 1 ? 50 : (index / (recentScores.length - 1)) * 100;
                    const y = 100 - (test.score || 0);
                    return <circle key={test.id} cx={x} cy={y} r="2.5" fill="#0f172a" vectorEffect="non-scaling-stroke" />;
                  })}
                </svg>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase">Admin Usage</h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="text-lg font-black text-slate-800">{usageStats?.totals.generations || 0}</div>
                <div className="text-[10px] font-bold text-slate-500">AI runs</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="text-lg font-black text-slate-800">{usageStats?.totals.uploads || 0}</div>
                <div className="text-[10px] font-bold text-slate-500">Uploads</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="text-lg font-black text-slate-800">{Math.round((usageStats?.totals.estimatedTokens || 0) / 1000)}k</div>
                <div className="text-[10px] font-bold text-slate-500">Tokens</div>
              </div>
            </div>
            <div className="space-y-2">
              {(usageStats?.daily || []).slice(-5).map(day => (
                <div key={day.date} className="flex items-center justify-between text-xs text-slate-600">
                  <span className="font-semibold">{day.date}</span>
                  <span>{day.generations} runs • {day.uploads} uploads • {day.estimatedTokens} tokens</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-indigo-900 text-indigo-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-indigo-300" />
              Study Tip of the Day
            </h3>
            
            <p className="text-sm font-light leading-relaxed italic text-indigo-100/90">
              "{DAILY_TIPS[Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % DAILY_TIPS.length].english}"
            </p>

            <div className="border-t border-indigo-800 pt-4 text-xs space-y-1 text-indigo-200">
              <div className="font-semibold text-indigo-300">இன்றைய பொன்மொழி:</div>
              <p className="italic">"{DAILY_TIPS[Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % DAILY_TIPS.length].tamil}"</p>
            </div>
          </div>

          {/* Achievement Badges */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                Achievements
              </h3>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                {unlockedCount}/{achievements.length}
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {achievements.map((badge) => {
                const Icon = badge.icon;
                return (
                  <div
                    key={badge.id}
                    title={badge.unlocked ? `${badge.title}: ${badge.description}` : `🔒 ${badge.description}`}
                    className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
                      badge.unlocked
                        ? `${badge.color} shadow-xs hover:scale-105 cursor-default`
                        : `${badge.lockedColor} opacity-50 grayscale`
                    }`}
                  >
                    {!badge.unlocked && (
                      <Lock className="h-2.5 w-2.5 absolute top-1.5 right-1.5 text-slate-400" />
                    )}
                    <Icon className={`h-5 w-5 ${badge.unlocked ? '' : 'text-slate-300'}`} />
                    <span className="text-[10px] font-bold leading-tight">{badge.title}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weak Topics Radar */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-rose-500" />
              Focus Areas
            </h3>
            {weakTopics.length === 0 ? (
              <p className="text-xs text-slate-500">Complete a test to see your weak areas.</p>
            ) : (
              <div className="space-y-3">
                {weakTopics.map((topic) => (
                  <div key={topic.subject} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700 truncate">{topic.subject}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        topic.accuracy >= 70 ? 'bg-emerald-50 text-emerald-700' :
                        topic.accuracy >= 40 ? 'bg-amber-50 text-amber-700' :
                        'bg-rose-50 text-rose-700'
                      }`}>
                        {topic.accuracy}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
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
                    <div className="text-[10px] text-slate-400">
                      {topic.correct}/{topic.total} correct
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Weekly Challenge */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                <Target className="h-4 w-4 text-indigo-200" />
                Weekly Challenge
              </h3>
              <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">
                {testsThisWeek}/{weeklyGoal}
              </span>
            </div>

            <p className="text-sm text-indigo-100 font-light">
              Complete <span className="font-bold text-white">{weeklyGoal} tests</span> this week to earn the Weekly Warrior badge!
            </p>

            <div className="space-y-2">
              <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                <svg width="100%" height="100%" preserveAspectRatio="none">
                  <rect
                    width={`${weeklyProgress}%`}
                    height="100%"
                    className="fill-white transition-all duration-700 ease-out"
                  />
                </svg>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-indigo-200">{weeklyProgress}% complete</span>
                {weeklyProgress >= 100 ? (
                  <span className="font-bold text-amber-300 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
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
                className="w-full mt-1 px-4 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <Zap className="h-3.5 w-3.5" />
                Take a Test Now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
