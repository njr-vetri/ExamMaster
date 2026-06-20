import React from 'react';
import { BookOpen, Upload, Award, FileCheck2, ArrowRight, Zap, GraduationCap, Flame, History, Crown, Star, Sparkles, Trophy, Brain, Clock, TrendingDown, BarChart3 } from 'lucide-react';
import { MockTest, UsageStats } from '../types';

const DAILY_TIPS = [
  {
    english: "When learning bilingually, read the question in your primary language first, then cross-reference. This triggers dual code memory pathways!",
    tamil: "கேடில் விழுச்செல்வம் கல்வி யொருவற்கு மாடல்ல மற்றைய வை."
  },
  {
    english: "Active recall is 3× more effective than re-reading. Close your notes and explain the concept out loud from memory.",
    tamil: "கற்க கசடறக் கற்பவை கற்றபின் நிற்க அதற்குத் தக."
  },
  {
    english: "Space your study sessions: review after 1 day, 3 days, and 1 week to move knowledge to long-term memory.",
    tamil: "எண்ணென்ப ஏனை எழுத்தென்ப இவ்விரண்டும் கண்ணென்ப வாழும் உயிர்க்கு."
  },
  {
    english: "Stay hydrated and sleep 8 hours before an exam. Your brain consolidates everything you learned while you sleep!",
    tamil: "தொட்டனைத் தூறும் மணற்கேணி மாந்தர்க்குக் கற்றனைத் தூறும் அறிவு."
  },
  {
    english: "Use the Pomodoro technique: 25 mins focused study, 5 mins break. Peak focus without burnout.",
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
  const completedTests = tests.filter(t => t.isCompleted);
  const totalScore = completedTests.reduce((acc, current) => acc + (current.score || 0), 0);
  const avgScore = completedTests.length > 0 ? Math.round(totalScore / completedTests.length) : 0;
  const totalCorrect = completedTests.reduce((acc, current) => acc + (current.correctCount || 0), 0);
  const totalAttempted = completedTests.reduce((acc, current) => acc + (current.questions.length || 0), 0);
  const correctRate = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

  // Compute streak for the badge
  let streakCount = 0;
  if (usageStats?.daily?.length) {
    const msPerDay = 1000 * 60 * 60 * 24;
    const dates = usageStats.daily.map(d => {
      const date = new Date(d.date);
      return Math.floor(date.getTime() / msPerDay);
    });
    dates.sort((a, b) => b - a);
    const uniqueDates = [...new Set(dates)];
    const today = Math.floor(Date.now() / msPerDay);
    let expectedDate = today;
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
          break;
        }
      }
    }
  }

  let badgeTitle = "Starter";
  let badgeColor = "bg-slate-100 text-slate-700 border-slate-200";
  let BadgeIcon = Sparkles;
  if (streakCount >= 30) { badgeTitle = "Legendary"; badgeColor = "bg-amber-100 text-amber-700 border-amber-200"; BadgeIcon = Crown; }
  else if (streakCount >= 14) { badgeTitle = "Master"; badgeColor = "bg-purple-100 text-purple-700 border-purple-200"; BadgeIcon = Trophy; }
  else if (streakCount >= 7) { badgeTitle = "Achiever"; badgeColor = "bg-indigo-100 text-indigo-700 border-indigo-200"; BadgeIcon = Award; }
  else if (streakCount >= 3) { badgeTitle = "On Fire"; badgeColor = "bg-orange-100 text-orange-700 border-orange-200"; BadgeIcon = Star; }

  const todayTip = DAILY_TIPS[Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % DAILY_TIPS.length];

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* Hero Banner */}
      <div className="relative overflow-hidden group bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-sm">
        {/* Background GraduationCap watermark — grey tinted */}
        <div className="absolute top-0 right-0 p-4 opacity-[0.07] transform translate-x-6 -translate-y-4 group-hover:scale-105 transition-transform pointer-events-none select-none">
          <GraduationCap className="h-60 w-60 text-slate-700" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          {/* Left — Text & Buttons */}
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
              <Zap className="h-3 w-3 fill-current" />
              AI Mock Prep Active
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950">
              வணக்கம், Ready to ace your exams?
            </h1>
            <p className="text-slate-800 leading-relaxed text-sm">
              Upload study materials, generate unlimited mock tests in Tamil, English, or Bilingual, and use the AI coach to learn from your mistakes instantly.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
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

          {/* Right — Tip of Day (fits snugly inside the box) */}
          <div className="lg:w-72 shrink-0 bg-indigo-900 text-white rounded-2xl p-4 flex flex-col gap-3 shadow-md">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-indigo-300 shrink-0" />
              <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">Study Tip of the Day</span>
            </div>
            <p className="text-[11px] font-light leading-relaxed italic text-indigo-100/90 flex-1">
              "{todayTip.english}"
            </p>
            <div className="border-t border-indigo-800 pt-2.5 space-y-1">
              <div className="text-[10px] font-semibold text-indigo-400">இன்றைய பொன்மொழி:</div>
              <p className="text-[10px] italic text-indigo-300/80 leading-relaxed">"{todayTip.tamil}"</p>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Streak */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 shadow-xs relative overflow-hidden group">
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${streakCount > 0 ? 'bg-orange-50 text-orange-500' : 'bg-slate-50 text-slate-400'}`}>
            <Flame className={`h-6 w-6 ${streakCount > 0 ? 'fill-current' : ''}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5 gap-1">
              <div className="text-xs text-slate-700 font-medium uppercase tracking-wider truncate">Streak</div>
              <div className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold border flex items-center gap-0.5 shrink-0 ${badgeColor}`}>
                <BadgeIcon className="h-2.5 w-2.5" />
                {badgeTitle}
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-800">{streakCount}d</div>
            {streakCount === 0
              ? <div className="text-xs text-slate-800">Start a test!</div>
              : <div className="text-xs text-orange-500 font-medium">Keep going 🔥</div>
            }
          </div>
        </div>

        {/* Avg Score */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 shadow-xs">
          <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-slate-700 font-medium uppercase tracking-wider">Avg Score</div>
            <div className="text-2xl font-bold text-slate-800">{avgScore}%</div>
            <div className="text-xs text-indigo-600 font-medium">{completedTests.length} tests done</div>
          </div>
        </div>

        {/* Questions Solved */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 shadow-xs">
          <div className="h-12 w-12 rounded-xl bg-slate-50 text-slate-800 flex items-center justify-center shrink-0">
            <FileCheck2 className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-slate-700 font-medium uppercase tracking-wider">Solved</div>
            <div className="text-2xl font-bold text-slate-800">{totalCorrect}/{totalAttempted}</div>
            <div className="text-xs text-indigo-600 font-medium">{correctRate}% accuracy</div>
          </div>
        </div>

        {/* Question Pool */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 shadow-xs">
          <div className="h-12 w-12 rounded-xl bg-indigo-50/60 text-indigo-700 flex items-center justify-center shrink-0">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-slate-700 font-medium uppercase tracking-wider">Question Pool</div>
            <div className="text-2xl font-bold text-slate-800">{questionCount}</div>
            <div className="text-xs text-indigo-600 font-medium">AI-generated Qs</div>
          </div>
        </div>
      </div>

      {/* Recent Practice — full width, 2-column card layout */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <History className="h-5 w-5 text-indigo-500" />
            Recent Practice Sessions
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('progress')}
              className="text-xs font-semibold text-slate-700 hover:text-indigo-700 flex items-center gap-1 transition-colors"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              View Progress
            </button>
            <button
              onClick={() => onNavigate('upload')}
              className="text-xs font-semibold text-indigo-650 hover:text-indigo-700 flex items-center gap-1"
            >
              Generate New
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {tests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-250 p-10 text-center text-slate-700 space-y-3">
            <p>No tests created yet.</p>
            <button
              onClick={() => onNavigate('upload')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold inline-flex items-center gap-1.5"
            >
              Create Mock Test
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tests.map((test) => (
              <div
                key={test.id}
                onClick={() => onSelectTest(test)}
                className="group bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-2xl p-4 flex items-center justify-between gap-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs"
              >
                <div className="space-y-1.5 flex-1 min-w-0 select-none">
                  <div className="flex flex-wrap items-center gap-1.5">
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
                  <h3 className="font-bold text-slate-800 group-hover:text-indigo-650 transition-colors text-sm leading-tight truncate">
                    {test.title}
                  </h3>
                  <p className="text-xs text-slate-800">
                    {new Date(test.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} • {test.questions.length} questions
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    {test.isCompleted ? (
                      <div>
                        <div className="text-sm font-bold text-slate-800">
                          <span className={test.score && test.score >= 70 ? "text-emerald-600" : "text-amber-600"}>{test.score}%</span>
                        </div>
                        <p className="text-3xs text-slate-800">{test.correctCount} correct</p>
                      </div>
                    ) : (
                      <span className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 text-3xs font-bold uppercase tracking-wider">
                        Ready
                      </span>
                    )}
                  </div>
                  <button
                    aria-label="Start Test"
                    className="h-8 w-8 rounded-full bg-slate-50 group-hover:bg-indigo-50 text-slate-400 group-hover:text-indigo-650 flex items-center justify-center transition-colors"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
