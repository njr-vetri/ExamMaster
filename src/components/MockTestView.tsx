import React, { useState, useEffect, useRef } from 'react';
import { Clock, Flag, ArrowLeft, CheckCircle2, ShieldAlert, Check, ChevronRight, ChevronLeft, Maximize2, Minimize2 } from 'lucide-react';
import { MockTest, Question } from '../types';

interface MockTestViewProps {
  test: MockTest;
  onSubmit: (selectedAnswers: Record<string, number>, timeSpent: number) => void;
  onExit: () => void;
}

export default function MockTestView({ test, onSubmit, onExit }: MockTestViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(test.totalTime);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [focusMode, setFocusMode] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize selected answers if resuming (or keep empty)
  useEffect(() => {
    if (test.selectedAnswers) {
      setSelectedAnswers({ ...test.selectedAnswers });
    }
  }, [test]);

  // Start the ticking timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          // Timer finished! Auto submit
          handleSubmitFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const currentQuestion = test.questions[currentIndex];

  const handleSelectOption = (optIdx: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: optIdx
    }));
  };

  const toggleFlag = () => {
    setFlaggedQuestions(prev => ({
      ...prev,
      [currentQuestion.id]: !prev[currentQuestion.id]
    }));
  };

  const handleNext = () => {
    if (currentIndex < test.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmitFinish = () => {
    const spent = test.totalTime - timeLeft;
    onSubmit(selectedAnswers, spent);
  };

  // Status for each question square
  // - current: current index
  // - answered: has key in selectedAnswers
  // - flagged: labeled was true
  // - untouched: none of the above
  const getQuestionState = (idx: number) => {
    const qId = test.questions[idx].id;
    const isCurrent = currentIndex === idx;
    const isAnswered = selectedAnswers[qId] !== undefined;
    const isFlagged = flaggedQuestions[qId] === true;

    return { isCurrent, isAnswered, isFlagged };
  };

  const answeredCount = Object.keys(selectedAnswers).length;
  const flaggedCount = Object.keys(flaggedQuestions).filter(k => flaggedQuestions[k]).length;

  const toggleFullscreen = async () => {
    setFocusMode(prev => !prev);
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen?.().catch(() => undefined);
    } else {
      await document.exitFullscreen?.().catch(() => undefined);
    }
  };

  return (
    <div className={`${focusMode ? 'fixed inset-0 z-50 overflow-y-auto bg-slate-50 px-4 sm:px-6 py-4' : 'max-w-6xl mx-auto'} space-y-6 animate-fadeIn pb-12 select-none`}>
      
      {/* Test Active Header */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 sm:px-6 flex items-center justify-between shadow-2xs gap-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (confirm('Are you sure you want to exit? Your progress in this draft test will be discarded.')) {
                onExit();
              }
            }}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
            title="Abandon exam"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Practice Exam</h4>
            <h2 className="text-sm sm:text-base font-bold text-slate-800 leading-tight truncate max-w-xs sm:max-w-sm">
              {test.subject}: {test.title}
            </h2>
          </div>
        </div>

        {/* Live Countdown Clock */}
          <div className="flex items-center gap-3">
          <button
            onClick={toggleFullscreen}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
            title={focusMode ? 'Exit full-screen exam view' : 'Enter full-screen exam view'}
          >
            {focusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>

          <div className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-mono font-bold flex items-center gap-2 border ${
            timeLeft < 60 
              ? 'bg-red-50 text-red-600 border-red-500/20 animate-pulse' 
              : 'bg-indigo-50 text-indigo-700 border-indigo-500/15'
          }`}>
            <Clock className="h-4 w-4" />
            <span>{formatTime(timeLeft)}</span>
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-750 text-white font-bold rounded-xl text-xs sm:text-sm shadow-xs hover:shadow-md transition-all active:scale-[0.98]"
            id="test-trigger-submit"
          >
            Submit Test
          </button>
        </div>
      </div>

      {/* Main Workspace split */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left block - Questions list progress map (Responsive sidebar desktop / Row mobile) */}
        <div className="lg:col-span-1 bg-white border border-slate-150/60 rounded-3xl p-5 space-y-4 shadow-3xs order-last lg:order-first">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Test Progress
            </h3>
            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-sm font-semibold">
              {answeredCount} of {test.questions.length} Solved
            </span>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-10 lg:grid-cols-4 gap-2">
            {test.questions.map((_, idx) => {
              const { isCurrent, isAnswered, isFlagged } = getQuestionState(idx);
              
              let bgClass = 'bg-slate-50 text-slate-500 border-slate-200/60 hover:bg-slate-100';
              if (isAnswered) bgClass = 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 hover:bg-emerald-500/15';
              if (isFlagged) bgClass = 'bg-amber-500/10 text-amber-700 border-amber-500/25 hover:bg-amber-500/15';
              if (isCurrent) bgClass = 'bg-slate-800 text-white border-slate-800 ring-2 ring-indigo-500/10 ring-offset-2';

              return (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-9 w-full rounded-xl border text-xs font-bold transition-all flex items-center justify-center ${bgClass}`}
                >
                  {(idx + 1).toString().padStart(2, '0')}
                </button>
              );
            })}
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-2 select-none">
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
              <span className="h-2.5 w-2.5 rounded-xs bg-slate-800 inline-block"></span>
              <span>Active Question</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
              <span className="h-2.5 w-2.5 rounded-xs bg-emerald-100 border border-emerald-300 inline-block"></span>
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
              <span className="h-2.5 w-2.5 rounded-xs bg-amber-100 border border-amber-300 inline-block"></span>
              <span>Marked for Review</span>
            </div>
          </div>
        </div>

        {/* Right block - Current Question content and Options */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xs">
            {/* Subject and Flag */}
            <div className="flex items-center justify-between gap-4 border-b border-slate-50 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-full uppercase">
                  Question {currentIndex + 1} of {test.questions.length}
                </span>
                <span className="text-xs bg-amber-50 text-amber-700 font-bold px-2.5 py-1 rounded-full border border-amber-100">
                  1 Point
                </span>
              </div>

              <button
                type="button"
                onClick={toggleFlag}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all ${
                  flaggedQuestions[currentQuestion.id]
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border border-transparent'
                }`}
              >
                <Flag className={`h-3.5 w-3.5 ${flaggedQuestions[currentQuestion.id] ? 'fill-current' : ''}`} />
                {flaggedQuestions[currentQuestion.id] ? 'Flagged for review' : 'Flag for review'}
              </button>
            </div>

            {/* Question Text */}
            <div className="space-y-4">
              <p className="text-base sm:text-lg text-slate-850 font-bold leading-relaxed whitespace-pre-line text-slate-800">
                {currentQuestion.text}
              </p>
            </div>

            {/* Options Choices Grid selector */}
            <div className="space-y-3 pt-2">
              {currentQuestion.options.map((option, optIdx) => {
                const isSelected = selectedAnswers[currentQuestion.id] === optIdx;
                
                return (
                  <div
                    key={optIdx}
                    onClick={() => handleSelectOption(optIdx)}
                    className={`group w-full p-4 rounded-2xl border text-left cursor-pointer transition-all flex items-center justify-between gap-4 ${
                      isSelected
                        ? 'bg-indigo-50/40 border-indigo-500 ring-1 ring-indigo-500 text-indigo-900 font-bold shadow-2xs'
                        : 'bg-slate-50/50 hover:bg-slate-50 border-slate-100 hover:border-slate-200 text-slate-700'
                    }`}
                    id={`opt-btn-${currentIndex}-${optIdx}`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Round Indicator */}
                      <span className={`h-8 w-8 rounded-xl font-mono text-sm font-bold flex items-center justify-center transition-all shrink-0 ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-500 group-hover:border-slate-300'
                      }`}>
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="text-sm">
                        {option}
                      </span>
                    </div>

                    {/* Radio bullet */}
                    <div className={`h-5 w-5 rounded-full border flex items-center justify-center transition-all shrink-0 ${
                      isSelected
                        ? 'border-indigo-600'
                        : 'border-slate-200 group-hover:border-slate-300 bg-white'
                    }`}>
                      {isSelected && (
                        <div className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Previous / Next footer workspace navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="px-4 py-2 bg-white border border-slate-200 disabled:opacity-40 disabled:pointer-events-none hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs active:scale-[0.98]"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            {currentIndex < test.questions.length - 1 ? (
              <button
                onClick={handleNext}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs active:scale-[0.98]"
              >
                Next Question
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowSubmitModal(true)}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-md active:scale-[0.98]"
              >
                Assemble & Submit
                <CheckCircle2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Verification submission Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-55 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-xl border border-slate-100 relative">
            
            <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
              <Check className="h-6 w-6 stroke-[3px]" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-850">
                Submit Practice Exam?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                You are about to finish and submit the test. The AI model will calculate your instant score, highlight mistaken topics, and draft detailed answer justifications.
              </p>
            </div>

            {/* Checklist breakdown */}
            <div className="bg-slate-50 rounded-2xl p-4 text-xs space-y-3 font-semibold text-slate-500">
              <div className="flex justify-between">
                <span>Total Questions:</span>
                <span className="text-slate-800">{test.questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Attempted/Answered:</span>
                <span className={answeredCount === test.questions.length ? "text-emerald-700" : "text-amber-700"}>
                  {answeredCount} of {test.questions.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Flagged for Review:</span>
                <span className={flaggedCount > 0 ? "text-amber-700" : "text-slate-700"}>
                  {flaggedCount}
                </span>
              </div>
            </div>

            {answeredCount < test.questions.length && (
              <div className="bg-rose-50/60 border border-rose-100 rounded-xl p-3 flex gap-2.5 text-xs text-rose-800">
                <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Warning!</strong> You still have {test.questions.length - answeredCount} unanswered questions. Blank answers score zero.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-bold text-xs"
              >
                Back to Exam
              </button>
              
              <button
                type="button"
                onClick={handleSubmitFinish}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm shadow-indigo-500/20"
                id="modal-confirm-submit"
              >
                Yes, Grade Exam
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
