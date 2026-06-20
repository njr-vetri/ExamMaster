import React, { useState, useEffect } from 'react';
import { Sparkles, Layers, MessageSquareCode, GraduationCap, Menu, X, LogOut, ShieldCheck } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { Question, MockTest, ExamLanguage, ExamDifficulty } from './types';
import type { UsageStats } from './types';
import { approveQuestion, generateQuestions, saveQuestions, fetchQuestions, saveTest, fetchTests, fetchUsageStats } from './services/api';
import { auth } from './services/firebase';
import { useAuthUser } from './hooks/useAuthUser';

// Import our beautiful subviews
import DashboardView from './components/DashboardView';
import UploadMaterialView from './components/UploadMaterialView';
import AdminReviewView from './components/AdminReviewView';
import MockTestView from './components/MockTestView';
import ResultsView from './components/ResultsView';
import AiAssistantPanel from './components/AiAssistantPanel';
import QuestionBankView from './components/QuestionBankView';
import LoginView from './components/LoginView';

export default function App() {
  const { user, loading: authLoading } = useAuthUser();
  // Navigation & Core States
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [tests, setTests] = useState<MockTest[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  
  // Pending parameters during Generation and Review Mode
  const [pendingReviewQuestions, setPendingReviewQuestions] = useState<Question[]>([]);
  const [reviewSubject, setReviewSubject] = useState('');
  const [reviewLanguage, setReviewLanguage] = useState<ExamLanguage>('bilingual');
  const [reviewDifficulty, setReviewDifficulty] = useState<ExamDifficulty>('medium');
  const [reviewSource, setReviewSource] = useState<'draft' | 'pending'>('draft');
  const [toast, setToast] = useState<{ type: 'error' | 'info'; message: string } | null>(null);

  // Currently active active practice/results
  const [activeTest, setActiveTest] = useState<MockTest | null>(null);

  // AI Tutor Doubt Panel togglers
  const [doubtQuestion, setDoubtQuestion] = useState<Question | null>(null);
  const [isTutorOpen, setIsTutorOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Load data from backend API on mount
  useEffect(() => {
    if (!user) return;

    fetchTests()
      .then(setTests)
      .catch(() => console.warn('Could not load tests from backend'));

    fetchQuestions({ approved: true })
      .then(setQuestions)
      .catch(() => console.warn('Could not load questions from backend'));

    fetchUsageStats()
      .then(setUsageStats)
      .catch(() => console.warn('Could not load usage stats from backend'));
  }, [user]);

  // Persist tests to backend + local state
  const saveTestsState = (updatedTests: MockTest[]) => {
    setTests(updatedTests);
    // Save the most recently changed test to backend
    const latest = updatedTests[0];
    if (latest) saveTest(latest).catch(console.error);
  };

  // Persist questions to backend + local state
  const savePoolState = (updatedPool: Question[]) => {
    setQuestions(updatedPool);
  };

  // HANDLERS
  // 1. Generate questions via backend AI (triggers Review mode)
  const handleGenerateDraft = async (settings: {
    subject: string;
    language: ExamLanguage;
    difficulty: ExamDifficulty;
    questionCount: number;
    optionsCount: number;
    fileName?: string;
    file?: File | null;
  }) => {
    try {
      const drafts = await generateQuestions({
        subject: settings.subject,
        language: settings.language,
        difficulty: settings.difficulty,
        questionCount: settings.questionCount,
        optionsCount: settings.optionsCount,
        file: settings.file || null
      });

      setPendingReviewQuestions(drafts);
      setReviewSubject(settings.subject);
      setReviewLanguage(settings.language);
      setReviewDifficulty(settings.difficulty);
      setReviewSource('draft');
      setCurrentView('review');
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to generate questions' });
    }
  };

  const openPendingReview = async () => {
    try {
      const pending = await fetchQuestions({ approved: false });
      setPendingReviewQuestions(pending);
      setReviewSubject(pending[0]?.subject || 'Pending');
      setReviewLanguage((pending[0]?.language as ExamLanguage) || 'bilingual');
      setReviewDifficulty((pending[0]?.difficulty as ExamDifficulty) || 'medium');
      setReviewSource('pending');
      setCurrentView('review');
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Could not load pending review queue' });
    }
  };

  // 2. Publish curated list to general pool & instantly start taking test
  const handlePublishTest = (approvedQuestions: Question[]) => {
    if (approvedQuestions.length === 0) return;

    // A. Add approved questions to backend DB (deduplication handled server-side)
    if (reviewSource === 'pending') {
      Promise.all(approvedQuestions.map(q => approveQuestion(q.id, true))).catch(console.error);
    } else {
      saveQuestions(approvedQuestions).catch(console.error);
    }

    // B. Add to local pool (no duplicates)
    const newPool = [...questions];
    approvedQuestions.forEach(aq => {
      if (!newPool.some(q => q.id === aq.id)) {
        newPool.push({ ...aq, approved: true });
      }
    });
    savePoolState(newPool);

    // B. Build dynamic MockTest template
    const newTest: MockTest = {
      id: `test-${Date.now()}`,
      title: `${reviewSubject} AI Practice Exam`,
      subject: reviewSubject,
      createdAt: new Date().toISOString().split('T')[0],
      language: reviewLanguage,
      difficulty: reviewDifficulty,
      questions: approvedQuestions,
      totalTime: approvedQuestions.length * 60, // 60 seconds per question
      isCompleted: false
    };

    const newTestsList = [newTest, ...tests];
    saveTestsState(newTestsList);
    
    // Set active test and jump in!
    setActiveTest(newTest);
    setCurrentView('test');
    setPendingReviewQuestions([]);
  };

  // 3. User finishes and submits current mock answers for grading
  const handleTestSubmit = (selectedAnswers: Record<string, number>, timeSpent: number) => {
    if (!activeTest) return;

    // Grade each item
    let corrects = 0;
    activeTest.questions.forEach(q => {
      if (selectedAnswers[q.id] === q.correctOptionIndex) {
        corrects++;
      }
    });

    const score = Math.round((corrects / activeTest.questions.length) * 100);

    const updatedTestObj: MockTest = {
      ...activeTest,
      score,
      correctCount: corrects,
      timeSpent,
      selectedAnswers,
      isCompleted: true
    };

    // Update main lists
    const refreshedTests = tests.map(t => t.id === activeTest.id ? updatedTestObj : t);
    saveTestsState(refreshedTests);

    setActiveTest(updatedTestObj);
    setCurrentView('result');
  };

  // 4. Assemble questions selected from Question Bank page and initiate immediate test
  const handleAssembleCustomTest = (selectedQuestions: Question[]) => {
    const customTest: MockTest = {
      id: `test-custom-${Date.now()}`,
      title: 'Custom Compiled Practice revision',
      subject: selectedQuestions[0]?.subject || 'Custom Repository',
      createdAt: new Date().toISOString().split('T')[0],
      language: 'bilingual',
      difficulty: 'medium',
      questions: selectedQuestions,
      totalTime: selectedQuestions.length * 60,
      isCompleted: false
    };

    const updatedTests = [customTest, ...tests];
    saveTestsState(updatedTests);

    setActiveTest(customTest);
    setCurrentView('test');
  };

  // 5. Retry some test we failed or want to master again
  const handleRetryActiveTest = () => {
    if (!activeTest) return;

    const renewedTest: MockTest = {
      ...activeTest,
      score: undefined,
      correctCount: undefined,
      timeSpent: undefined,
      selectedAnswers: undefined,
      isCompleted: false
    };

    // Replace in history so it shows active taking
    const replaced = tests.map(t => t.id === activeTest.id ? renewedTest : t);
    saveTestsState(replaced);

    setActiveTest(renewedTest);
    setCurrentView('test');
  };

  // Triggering doubt solving session from explanation list on results page
  const handleInitiateDoubt = (q: Question) => {
    setDoubtQuestion(q);
    setIsTutorOpen(true);
  };

  // Select test card from dashboard
  const handleSelectDashboardTest = (t: MockTest) => {
    setActiveTest(t);
    if (t.isCompleted) {
      setCurrentView('result');
    } else {
      setCurrentView('test');
    }
  };

  const isTestTakingActive = currentView === 'test';

  if (authLoading) {
    return <div className="min-h-screen bg-stone-50 grid place-items-center text-sm font-bold text-slate-600">Loading</div>;
  }

  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-800 font-sans flex flex-col relative">
      
      {/* Top Banner & Header (Hidden during active exam to boost complete focus) */}
      {!isTestTakingActive && (
        <header className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-200 z-40 px-4 sm:px-6 py-3.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Logo Group */}
            <div
              onClick={() => setCurrentView('dashboard')}
              className="flex items-center gap-2.5 cursor-pointer group select-none"
            >
              <div className="h-10 w-10 rounded-xl bg-indigo-600 group-hover:bg-indigo-700 transition-all text-white flex items-center justify-center font-bold shadow-sm">
                <GraduationCap className="h-5.5 w-5.5 text-white" />
              </div>
              <div>
                <h1 className="font-extrabold text-indigo-900 text-sm tracking-tight flex items-center gap-1.5 leading-none">
                  ExamMaster AI
                </h1>
                <p className="text-[10px] text-slate-450 font-bold leading-normal mt-0.5">
                  தமிழ் • English Study Hub
                </p>
              </div>
            </div>

            {/* Navigation Desktop */}
            <nav className="hidden md:flex items-center gap-1.5 select-none text-xs font-semibold">
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`px-4 py-2 rounded-xl transition-all text-xs font-semibold ${
                  currentView === 'dashboard' ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-100' : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'
                }`}
                id="nav-link-dash"
              >
                Dashboard
              </button>
              <button
                onClick={() => setCurrentView('upload')}
                className={`px-4 py-2 rounded-xl transition-all inline-flex items-center gap-1 text-xs font-semibold ${
                  currentView === 'upload' ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-100' : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'
                }`}
                id="nav-link-upload"
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                Upload & Generate
              </button>
              <button
                onClick={() => setCurrentView('qbank')}
                className={`px-4 py-2 rounded-xl transition-all inline-flex items-center gap-1.5 text-xs font-semibold ${
                  currentView === 'qbank' ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-100' : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'
                }`}
                id="nav-link-qbank"
              >
                <Layers className="h-3.5 w-3.5 text-indigo-600" />
                Question Bank
              </button>
              <button
                onClick={openPendingReview}
                className={`px-4 py-2 rounded-xl transition-all inline-flex items-center gap-1.5 text-xs font-semibold ${
                  currentView === 'review' && reviewSource === 'pending' ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-100' : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'
                }`}
                id="nav-link-admin-review"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                Admin Review
              </button>
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2 select-none">
              <button
                onClick={() => signOut(auth)}
                className="h-9 w-9 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 grid place-items-center"
                title="Log out"
              >
                <LogOut className="h-4.5 w-4.5" />
              </button>

              <button
                onClick={() => setIsTutorOpen(!isTutorOpen)}
                className={`h-9 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isTutorOpen
                    ? 'bg-indigo-100 text-indigo-805'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
                id="nav-btn-coach"
              >
                <MessageSquareCode className="h-4.5 w-4.5" />
                <span className="hidden sm:inline">AI Tutor Coach</span>
              </button>

              {/* Mobile Burger Trigger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-500 hover:text-slate-905 hover:bg-slate-50 rounded-xl md:hidden"
                title="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Drawbar Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-slate-100 mt-3 pt-3.5 pb-2 flex flex-col gap-1 select-none">
              <button
                onClick={() => {
                  setCurrentView('dashboard');
                  setMobileMenuOpen(false);
                }}
                className={`px-4 py-2.5 text-left text-xs font-bold rounded-xl ${
                  currentView === 'dashboard' ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-100' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => {
                  setCurrentView('upload');
                  setMobileMenuOpen(false);
                }}
                className={`px-4 py-2.5 text-left text-xs font-bold rounded-xl ${
                  currentView === 'upload' ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-100' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                Upload & Generate Mock Test
              </button>
              <button
                onClick={() => {
                  setCurrentView('qbank');
                  setMobileMenuOpen(false);
                }}
                className={`px-4 py-2.5 text-left text-xs font-bold rounded-xl ${
                  currentView === 'qbank' ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-100' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                Question Bank
              </button>
              <button
                onClick={() => {
                  openPendingReview();
                  setMobileMenuOpen(false);
                }}
                className={`px-4 py-2.5 text-left text-xs font-bold rounded-xl ${
                  currentView === 'review' && reviewSource === 'pending' ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-100' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                Admin Review
              </button>
            </div>
          )}
        </header>
      )}

      {/* Main Container screen area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        
        {/* Navigation router views switcher */}
        {(() => {
          switch (currentView) {
            case 'dashboard':
              return (
                <DashboardView
                  onNavigate={setCurrentView}
                  tests={tests}
                  onSelectTest={handleSelectDashboardTest}
                  questionCount={questions.length}
                  usageStats={usageStats}
                />
              );
            case 'upload':
              return (
                <UploadMaterialView
                  onGenerate={handleGenerateDraft}
                />
              );
            case 'review':
              return (
                <AdminReviewView
                  questions={pendingReviewQuestions}
                  subject={reviewSubject}
                  language={reviewLanguage}
                  difficulty={reviewDifficulty}
                  onPublishTest={handlePublishTest}
                  defaultApproved={reviewSource === 'draft'}
                  onCancel={() => {
                    setPendingReviewQuestions([]);
                    setCurrentView(reviewSource === 'pending' ? 'dashboard' : 'upload');
                  }}
                />
              );
            case 'test':
              return activeTest ? (
                <MockTestView
                  test={activeTest}
                  onSubmit={handleTestSubmit}
                  onExit={() => setCurrentView('dashboard')}
                />
              ) : (
                <div className="text-center p-8 text-slate-500">No test loaded</div>
              );
            case 'result':
              return activeTest ? (
                <ResultsView
                  test={activeTest}
                  onRetry={handleRetryActiveTest}
                  onAskDoubt={handleInitiateDoubt}
                  onExit={() => setCurrentView('dashboard')}
                />
              ) : (
                <div className="text-center p-8 text-slate-500">No score loaded</div>
              );
            case 'qbank':
              return (
                <QuestionBankView
                  questions={questions}
                  onAssembleTest={handleAssembleCustomTest}
                />
              );
            default:
              return <div className="text-center p-8">View not found</div>;
          }
        })()}

      </main>

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[70] w-[calc(100%-2rem)] max-w-md rounded-xl border border-red-200 bg-white px-4 py-3 shadow-xl flex items-start justify-between gap-3 animate-slideUp">
          <p className="text-sm font-semibold text-red-700">{toast.message}</p>
          <button onClick={() => setToast(null)} className="text-red-500 hover:text-red-700 font-bold">×</button>
        </div>
      )}

      {/* Sliding Interactive AI Tutor Panel Side Drawer */}
      {isTutorOpen && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-white z-50 border-l border-slate-205 shadow-2xl flex flex-col animate-slideLeft">
          <AiAssistantPanel
            currentDoubtQuestion={doubtQuestion}
            onClose={() => {
              setIsTutorOpen(false);
              setDoubtQuestion(null);
            }}
            langSetting={reviewLanguage}
          />
        </div>
      )}

      {/* Ambient glassmorphic backdrop for Sliding Tutor Panel */}
      {isTutorOpen && (
        <div
          onClick={() => {
            setIsTutorOpen(false);
            setDoubtQuestion(null);
          }}
          className="fixed inset-0 bg-slate-900/15 backdrop-blur-xs z-45"
        />
      )}

      {/* Footer credits centered */}
      {!isTestTakingActive && (
        <footer className="py-6 text-center text-[11px] text-slate-400 select-none pb-8">
          <div className="flex items-center justify-center gap-1">
            <span>Powered by Gemini model AI</span>
            <span>•</span>
            <span>Made with Tamil & English Bilingual learners in mind</span>
          </div>
          <p className="mt-1">© 2026 AI Mock Prep — Focus-driven exam generation.</p>
        </footer>
      )}

    </div>
  );
}
