import React, { useState } from 'react';
import { BookOpen, Search, ShieldAlert, Sparkles, Check, CheckSquare, Square, Layers, Play, FolderKanban, Calendar, BookOpenCheck, Clock, Timer } from 'lucide-react';
import { Question, MockTest, ExamLanguage, ExamDifficulty } from '../types';

// Helper: format ISO string or plain date into readable date + time
function formatDateTime(raw: string): { date: string; time: string | null } {
  if (!raw) return { date: '—', time: null };
  const d = new Date(raw);
  if (isNaN(d.getTime())) return { date: raw, time: null };
  const date = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  // Only show time if the string contains 'T' (i.e., it's a full ISO timestamp)
  const time = raw.includes('T')
    ? d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    : null;
  return { date, time };
}
interface QuestionBankViewProps {
  questions: Question[];
  tests: MockTest[];
  onAssembleTest: (selectedQuestions: Question[], timeLimitMinutes?: number) => void;
  onCreateSharedQuiz?: (selectedQuestions: Question[], timeLimitMinutes?: number) => void;
}

export default function QuestionBankView({ questions, tests, onAssembleTest, onCreateSharedQuiz }: QuestionBankViewProps) {
  const [viewMode, setViewMode] = useState<'blocks' | 'questions'>('blocks');
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [langFilter, setLangFilter] = useState<string>('all');
  const [diffFilter, setDiffFilter] = useState<string>('all');
  
  // Selection states
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [selectedBlockIds, setSelectedBlockIds] = useState<Record<string, boolean>>({});

  const [timeLimit, setTimeLimit] = useState<number>(5);

  // Unique list of subjects for filters
  const subjectsList = ['all', ...Array.from(new Set(questions.map(q => q.subject)))];

  // Apply filters for individual questions
  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.text.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          q.explanation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = subjectFilter === 'all' || q.subject === subjectFilter;
    const matchesLang = langFilter === 'all' || q.language === langFilter;
    const matchesDiff = diffFilter === 'all' || q.difficulty === diffFilter;

    return matchesSearch && matchesSubject && matchesLang && matchesDiff;
  });

  // Apply filters for blocks/tests
  const filteredBlocks = tests.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = subjectFilter === 'all' || t.subject === subjectFilter;
    const matchesLang = langFilter === 'all' || t.language === langFilter;
    const matchesDiff = diffFilter === 'all' || t.difficulty === diffFilter;

    return matchesSearch && matchesSubject && matchesLang && matchesDiff;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleSelectAll = () => {
    const allSelectedInFilter = filteredQuestions.every(q => selectedIds[q.id]);
    const newState: Record<string, boolean> = { ...selectedIds };
    
    filteredQuestions.forEach(q => {
      newState[q.id] = !allSelectedInFilter;
    });

    setSelectedIds(newState);
  };

  const toggleBlockSelect = (id: string) => {
    setSelectedBlockIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleBlockSelectAll = () => {
    const allSelectedInFilter = filteredBlocks.every(b => selectedBlockIds[b.id]);
    const newState: Record<string, boolean> = { ...selectedBlockIds };
    
    filteredBlocks.forEach(b => {
      newState[b.id] = !allSelectedInFilter;
    });

    setSelectedBlockIds(newState);
  };

  const getChosenQuestionsFromBlocks = () => {
    const chosenQuestions: Question[] = [];
    const chosenBlocks = tests.filter(b => selectedBlockIds[b.id]);
    
    chosenBlocks.forEach(b => {
      b.questions.forEach(q => {
        if (!chosenQuestions.some(cq => cq.id === q.id)) {
          chosenQuestions.push({
            ...q,
            subject: q.subject || b.subject,
            language: q.language || b.language,
            difficulty: q.difficulty || b.difficulty
          });
        }
      });
    });
    return chosenQuestions;
  };

  const handleActionClick = (action: 'assemble_q' | 'assemble_b' | 'share_q' | 'share_b') => {
    if (action === 'assemble_q') {
      const chosen = questions.filter(q => selectedIds[q.id]);
      if (chosen.length > 0) onAssembleTest(chosen, timeLimit);
    } else if (action === 'assemble_b') {
      const chosen = getChosenQuestionsFromBlocks();
      if (chosen.length > 0) onAssembleTest(chosen, timeLimit);
    } else if (action === 'share_q') {
      const chosen = questions.filter(q => selectedIds[q.id]);
      if (chosen.length > 0 && onCreateSharedQuiz) onCreateSharedQuiz(chosen, timeLimit);
    } else if (action === 'share_b') {
      const chosen = getChosenQuestionsFromBlocks();
      if (chosen.length > 0 && onCreateSharedQuiz) onCreateSharedQuiz(chosen, timeLimit);
    }
  };

  const selectedCount = Object.keys(selectedIds).filter(id => selectedIds[id]).length;
  const selectedBlocksCount = Object.keys(selectedBlockIds).filter(id => selectedBlockIds[id]).length;
  const selectedBlocksTotalQuestions = tests
    .filter(b => selectedBlockIds[b.id])
    .reduce((sum, b) => sum + b.questions.length, 0);

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <Layers className="h-6.5 w-6.5 text-indigo-500" />
            Question Repository Bank
          </h1>
          <p className="text-slate-700 max-w-2xl text-xs sm:text-sm">
            Browse and package previously generated AI study sets or individual questions into custom mock tests.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Time Limit Picker */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm shrink-0">
            <Timer className="h-4 w-4 text-slate-400 mr-2" />
            <span className="text-xs font-bold text-slate-600 mr-2 uppercase tracking-wider">Minutes:</span>
            <input 
              type="number" 
              min={1} 
              max={180}
              value={timeLimit}
              title="Time Limit in Minutes"
              aria-label="Time Limit in Minutes"
              onChange={(e) => setTimeLimit(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 bg-slate-50 border border-slate-200 rounded-lg text-center font-black text-sm py-1 outline-hidden focus:border-indigo-500 transition-colors text-indigo-700"
            />
          </div>

          {/* View Mode Toggle Switch */}
          <div className="flex bg-slate-100 p-1 rounded-xl shrink-0 border border-slate-200">
            <button
              onClick={() => {
                setViewMode('blocks');
                setSearchTerm('');
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'blocks'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-700 hover:text-slate-850'
              }`}
            >
              <FolderKanban className="h-3.5 w-3.5" />
              Generated Blocks ({tests.length})
            </button>
            <button
              onClick={() => {
                setViewMode('questions');
                setSearchTerm('');
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'questions'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-700 hover:text-slate-850'
              }`}
            >
              <BookOpenCheck className="h-3.5 w-3.5" />
              All Questions ({questions.length})
            </button>
          </div>
        </div>
      </div>

      {/* ── Top Action Banner (Blocks mode) ─────────────────────────── */}
      {viewMode === 'blocks' && selectedBlocksCount > 0 && (
        <div className="animate-fadeIn select-none">
          <div className="bg-slate-900 border-2 border-indigo-500 text-white rounded-2xl px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_8px_30px_rgba(99,102,241,0.35)]">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-indigo-600/30 flex items-center justify-center shrink-0 animate-pulse">
                <Play className="h-4 w-4 text-indigo-300 fill-current" />
              </div>
              <div>
                <div className="text-sm font-bold text-white leading-tight">🎯 Ready to Practice!</div>
                <div className="text-3xs text-slate-300 font-medium mt-0.5">
                  {selectedBlocksCount} {selectedBlocksCount === 1 ? 'Block' : 'Blocks'} selected &bull; {selectedBlocksTotalQuestions} Questions ready
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleActionClick('share_b')}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider inline-flex items-center gap-1.5 transition-all shadow-md active:scale-95 shrink-0"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Publish Shared Quiz
              </button>
              <button
                onClick={() => handleActionClick('assemble_b')}
                id="btn-top-start-blocks"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider inline-flex items-center gap-1.5 transition-all shadow-md active:scale-95 shrink-0"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                Start Test Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Top Action Banner (Questions mode) ───────────────────────── */}
      {viewMode === 'questions' && selectedCount > 0 && (
        <div className="animate-fadeIn select-none">
          <div className="bg-slate-900 border-2 border-indigo-500 text-white rounded-2xl px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_8px_30px_rgba(99,102,241,0.35)]">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-indigo-600/30 flex items-center justify-center shrink-0 animate-pulse">
                <Play className="h-4 w-4 text-indigo-300 fill-current" />
              </div>
              <div>
                <div className="text-sm font-bold text-white leading-tight">🎯 Ready to Practice!</div>
                <div className="text-3xs text-slate-400 font-medium mt-0.5">
                  {selectedCount} {selectedCount === 1 ? 'Question' : 'Questions'} selected &bull; Click to begin your exam
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleActionClick('share_q')}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider inline-flex items-center gap-1.5 transition-all shadow-md active:scale-95 shrink-0"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Publish Shared Quiz
              </button>
              <button
                onClick={() => handleActionClick('assemble_q')}
                id="btn-top-start-questions"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider inline-flex items-center gap-1.5 transition-all shadow-md active:scale-95 shrink-0"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                Start Exam Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-3xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-700" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                viewMode === 'blocks'
                  ? 'Search blocks by exam titles, lesson names or topics...'
                  : 'Search by keywords, subject terms or rationales...'
              }
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-150 focus:border-indigo-500 rounded-xl text-xs outline-hidden text-slate-700 placeholder:text-slate-700"
            />
          </div>

          <button
            onClick={() => {
              setSearchTerm('');
              setSubjectFilter('all');
              setLangFilter('all');
              setDiffFilter('all');
              setSelectedIds({});
              setSelectedBlockIds({});
            }}
            className="px-4 py-2 text-xs text-indigo-650 font-bold hover:bg-indigo-50 rounded-xl transition-colors shrink-0"
          >
            Clear Filters
          </button>
        </div>

        {/* Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Subject Filter */}
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-800 uppercase">Subject Category</span>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              title="Subject Category Filter"
              aria-label="Subject Category Filter"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-655"
            >
              {subjectsList.map((sub, sIdx) => (
                <option key={sIdx} value={sub}>
                  {sub === 'all' ? 'All Subjects' : sub}
                </option>
              ))}
            </select>
          </div>

          {/* Lang Filter */}
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-800 uppercase">Language Medium</span>
            <select
              value={langFilter}
              onChange={(e) => setLangFilter(e.target.value)}
              title="Language Medium Filter"
              aria-label="Language Medium Filter"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-655"
            >
              <option value="all">All Languages</option>
              <option value="bilingual">Bilingual Only</option>
              <option value="english">English Only</option>
              <option value="tamil">Tamil Only</option>
            </select>
          </div>

          {/* Difficulty Filter */}
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-800 uppercase">Difficulty Standard</span>
            <select
              value={diffFilter}
              onChange={(e) => setDiffFilter(e.target.value)}
              title="Difficulty Standard Filter"
              aria-label="Difficulty Standard Filter"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-655"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main content display based on viewMode */}
      {viewMode === 'blocks' ? (
        <div className="space-y-3">
          {/* Header Controls */}
          <div className="bg-slate-50 px-4 py-3 border border-slate-100 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2 select-none">
              <button
                onClick={toggleBlockSelectAll}
                className="text-slate-800 hover:text-slate-800 p-1 flex items-center gap-1.5"
                title="Select all filtered blocks"
              >
                <CheckSquare className="h-4.5 w-4.5" />
                <span className="text-xs text-slate-700 font-bold">
                  {filteredBlocks.length} Generated Blocks
                </span>
              </button>
            </div>

            {selectedBlocksCount > 0 && (
              <button
                onClick={() => handleActionClick('assemble_b')}
                className="px-3.5 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-3xs font-black shadow-xs tracking-wider uppercase inline-flex items-center gap-1.5 transition-all"
              >
                <Play className="h-3 w-3 fill-current" />
                Practice Selected ({selectedBlocksCount} Blocks • {selectedBlocksTotalQuestions} Qs)
              </button>
            )}
          </div>

          {/* Blocks List */}
          {filteredBlocks.length === 0 ? (
            <div className="bg-white border border-slate-100 p-12 text-center text-slate-700 rounded-2xl text-sm">
              No generated question blocks found. Go to "Upload & Generate" to create one!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBlocks.map((b) => {
                const isSelected = selectedBlockIds[b.id] === true;

                return (
                  <div
                    key={b.id}
                    onClick={() => toggleBlockSelect(b.id)}
                    className={`bg-white border rounded-2xl p-5 hover:shadow-md cursor-pointer transition-all flex items-start gap-4 ${
                      isSelected
                        ? 'border-indigo-500 ring-2 ring-indigo-500/10 bg-indigo-50/5'
                        : 'border-slate-150'
                    }`}
                  >
                    {/* Checkbox */}
                    <div className="pt-0.5 shrink-0 text-slate-400">
                      {isSelected ? (
                        <Check className="h-5 w-5 text-indigo-600 stroke-[3px]" />
                      ) : (
                        <span className="h-4.5 w-4.5 inline-block rounded-md border border-slate-400 bg-white" />
                      )}
                    </div>

                    {/* Block Info */}
                    <div className="space-y-3 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-3xs font-bold uppercase">
                          {b.subject}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-3xs font-bold uppercase">
                          {b.difficulty}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-3xs font-bold capitalize">
                          {b.language}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-xs sm:text-sm font-bold text-slate-800 leading-snug truncate">
                          {b.title}
                        </h3>
                        {/* Date + Time row */}
                        {(() => {
                          const { date, time } = formatDateTime(b.createdAt);
                          return (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                                <Calendar className="h-3 w-3 text-slate-700" />
                                {date}
                              </span>
                              {time && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-800 bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-md">
                                  <Clock className="h-3 w-3 text-indigo-500" />
                                  {time}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Summary Stats */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                        <span className="text-3xs text-slate-700 font-medium">
                          Size: <strong className="text-slate-700">{b.questions.length} questions</strong>
                        </span>
                        {b.isCompleted && b.score !== undefined && (
                          <span className="text-3xs bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                            Best Score: {b.score}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Questions list container */
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
          {/* List Header control */}
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 select-none">
              <button
                onClick={toggleSelectAll}
                className="text-slate-800 hover:text-slate-800 p-1"
                title="Select all filtered"
              >
                <CheckSquare className="h-4.5 w-4.5" />
              </button>
              <span className="text-xs text-slate-700 font-bold">
                Found {filteredQuestions.length} Questions
              </span>
            </div>

            {selectedCount > 0 && (
              <button
                onClick={() => handleActionClick('assemble_q')}
                className="px-3.5 py-1.5 bg-indigo-650 hover:bg-indigo-755 text-white rounded-lg text-3xs font-black shadow-xs tracking-wider uppercase inline-flex items-center gap-1 transition-all"
              >
                <Play className="h-3 w-3 fill-current" />
                Assemble practice exam ({selectedCount})
              </button>
            )}
          </div>

          {/* Rows grouped by Subject */}
          {filteredQuestions.length === 0 ? (
            <div className="p-12 text-center text-slate-700 text-sm">
              No questions matched your search criteria.
            </div>
          ) : (
            <div className="divide-y divide-slate-200 select-none">
              {Object.entries(
                filteredQuestions.reduce<Record<string, Question[]>>((acc, q) => {
                  if (!acc[q.subject]) acc[q.subject] = [];
                  acc[q.subject].push(q);
                  return acc;
                }, {})
              ).map(([subject, subjectQuestions]) => {
                const allSelected = subjectQuestions.every(q => selectedIds[q.id] === true);
                const someSelected = subjectQuestions.some(q => selectedIds[q.id] === true) && !allSelected;

                const toggleSubjectAll = (e: React.MouseEvent) => {
                  e.stopPropagation();
                  const newState = { ...selectedIds };
                  subjectQuestions.forEach(q => {
                    newState[q.id] = !allSelected;
                  });
                  setSelectedIds(newState);
                };

                return (
                  <div key={subject} className="bg-white">
                    {/* Topic Group Header */}
                    <div 
                      onClick={toggleSubjectAll}
                      className="bg-slate-50/75 px-4 py-3 flex items-center justify-between border-b border-slate-100 cursor-pointer hover:bg-slate-100/60 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
                        <h2 className="text-xs sm:text-sm font-bold text-slate-700">
                          {subject}
                        </h2>
                        <span className="text-3xs bg-slate-200 text-slate-655 px-2 py-0.5 rounded-full font-semibold">
                          {subjectQuestions.length} {subjectQuestions.length === 1 ? 'Question' : 'Questions'}
                        </span>
                      </div>

                      <button
                        onClick={toggleSubjectAll}
                        className={`text-3xs font-bold px-3 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${
                          allSelected 
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' 
                            : someSelected
                            ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                            : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {allSelected ? (
                          <>
                            <Check className="h-3 w-3 stroke-[3px]" />
                            Deselect All
                          </>
                        ) : someSelected ? (
                          <>
                            <CheckSquare className="h-3 w-3" />
                            Select Remaining
                          </>
                        ) : (
                          <>
                            <Square className="h-3 w-3 text-slate-800" />
                            Select Topic
                          </>
                        )}
                      </button>
                    </div>

                    {/* Questions in this group */}
                    <div className="divide-y divide-slate-100">
                      {subjectQuestions.map((q) => {
                        const isSelected = selectedIds[q.id] === true;

                        return (
                          <div
                            key={q.id}
                            onClick={() => toggleSelect(q.id)}
                            className={`p-4 sm:p-5 flex items-start gap-4 hover:bg-slate-50/55 cursor-pointer transition-colors ${
                              isSelected ? 'bg-indigo-500/5 hover:bg-indigo-500/10' : ''
                            }`}
                          >
                            {/* Custom Checkbox */}
                            <div className="pt-0.5 shrink-0 text-slate-700">
                              {isSelected ? (
                                <Check className="h-5 w-5 text-indigo-600 stroke-[3px]" />
                              ) : (
                                <span className="h-4.5 w-4.5 inline-block rounded-xs border border-slate-400 bg-white" />
                              )}
                            </div>

                            {/* Text details */}
                            <div className="space-y-2 flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-3xs font-bold uppercase">
                                  {q.difficulty}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-3xs font-bold capitalize">
                                  {q.language}
                                </span>
                              </div>

                              <h3 className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed whitespace-pre-line">
                                {q.text}
                              </h3>

                              {/* Explanatory preview */}
                              <p className="text-3xs text-slate-800 bg-slate-100 p-2 rounded-lg italic">
                                💡 {q.explanation}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
