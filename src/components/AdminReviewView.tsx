import React, { useEffect, useState } from 'react';
import { Eye, Check, X, Edit3, Trash, CheckCircle2, ChevronDown, ChevronUp, Play, Save } from 'lucide-react';
import { Question, ExamLanguage, ExamDifficulty } from '../types';

interface AdminReviewViewProps {
  questions: Question[];
  subject: string;
  language: ExamLanguage;
  difficulty: ExamDifficulty;
  onPublishTest: (approvedQuestions: Question[]) => void;
  onSaveToBank: (approvedQuestions: Question[]) => void;
  onCancel: () => void;
  defaultApproved?: boolean;
}

export default function AdminReviewView({
  questions: initialQuestions,
  subject,
  language,
  difficulty,
  onPublishTest,
  onSaveToBank,
  onCancel,
  defaultApproved = true
}: AdminReviewViewProps) {
  const [questions, setQuestions] = useState<Question[]>(
    initialQuestions.map(q => ({ ...q, approved: defaultApproved ? true : q.approved }))
  );
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(initialQuestions[0]?.id || null);

  // Buffer state while editing a question
  const [editText, setEditText] = useState('');
  const [editExplanation, setEditExplanation] = useState('');
  const [editOptions, setEditOptions] = useState<string[]>([]);
  const [editCorrectIdx, setEditCorrectIdx] = useState<number>(0);

  useEffect(() => {
    setQuestions(initialQuestions.map(q => ({ ...q, approved: defaultApproved ? true : q.approved })));
    setExpandedId(initialQuestions[0]?.id || null);
  }, [initialQuestions, defaultApproved]);

  const startEditing = (q: Question) => {
    setEditingId(q.id);
    setEditText(q.text);
    setEditExplanation(q.explanation);
    setEditOptions([...q.options]);
    setEditCorrectIdx(q.correctOptionIndex);
  };

  const saveEdit = (id: string) => {
    setQuestions(prev => prev.map(q => {
      if (q.id === id) {
        return {
          ...q,
          text: editText,
          explanation: editExplanation,
          options: editOptions,
          correctOptionIndex: editCorrectIdx
        };
      }
      return q;
    }));
    setEditingId(null);
  };

  const toggleApprove = (id: string) => {
    setQuestions(prev => prev.map(q => {
      if (q.id === id) {
        return { ...q, approved: !q.approved };
      }
      return q;
    }));
  };

  const deleteQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const handleOptionChange = (index: number, val: string) => {
    setEditOptions(prev => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const approvedCount = questions.filter(q => q.approved).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header section with actions */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-3xs font-extrabold uppercase bg-amber-100 text-amber-800 tracking-wider">
              Verification Mode
            </span>
            <span className="text-xs font-semibold text-slate-800 capitalize">
              {subject} • {language} • {difficulty}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Curate AI-Generated Questions
          </h1>
          <p className="text-xs text-slate-700">
            Review the questions built by the AI model. Tweak texts, swap answers, or discard any before deploying the test.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 text-xs font-bold text-slate-700 hover:text-slate-805 rounded-xl transition-colors select-none text-center"
          >
            Discard All
          </button>
          
          <button
            type="button"
            onClick={() => onSaveToBank(questions.filter(q => q.approved))}
            disabled={approvedCount === 0}
            className="px-4 py-2.5 bg-white border border-indigo-200 hover:bg-indigo-50/50 disabled:opacity-50 disabled:pointer-events-none text-indigo-700 rounded-xl text-xs font-bold shadow-3xs transition-all inline-flex items-center justify-center gap-1.5"
            id="admin-save-bank"
          >
            <Save className="h-3.5 w-3.5" />
            Save to Bank ({approvedCount})
          </button>

          <button
            type="button"
            onClick={() => onPublishTest(questions.filter(q => q.approved))}
            disabled={approvedCount === 0}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:pointer-events-none text-white rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all inline-flex items-center justify-center gap-1.5"
            id="admin-publish-exam"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            Publish & Start Test
          </button>
        </div>
      </div>

      {/* Progress of review */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-indigo-905 font-bold">
          <CheckCircle2 className="h-4 w-4 text-indigo-600 fill-current" />
          <span>Approved: {approvedCount} of {questions.length} total questions</span>
        </div>
        <span className="text-slate-700">Select any question below to expand & edit</span>
      </div>

      {/* Question Accordion List */}
      <div className="space-y-4">
        {questions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center text-slate-700">
            No questions to review. Discarded all?
          </div>
        ) : (
          questions.map((q, qIndex) => {
            const isExpanded = expandedId === q.id;
            const isEditing = editingId === q.id;

            return (
              <div
                key={q.id}
                className={`border rounded-2xl transition-all ${
                  q.approved
                    ? isExpanded ? 'bg-white border-indigo-200 shadow-xs' : 'bg-white border-slate-205 hover:border-slate-300 shadow-2xs'
                    : 'bg-slate-50/50 border-slate-200 opacity-60'
                }`}
              >
                {/* Header line of accordion */}
                <div className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer select-none">
                  <div
                    onClick={() => {
                      if (!isEditing) setExpandedId(isExpanded ? null : q.id);
                    }}
                    className="flex items-start gap-3.5 flex-1 min-w-0"
                  >
                    <span className="text-xs font-mono font-bold text-slate-800 mt-0.5">
                      Q{(qIndex + 1).toString().padStart(2, '0')}
                    </span>
                    <div className="space-y-1 flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-slate-850 truncate">
                        {q.text}
                      </h3>
                      <div className="flex items-center gap-3 text-[10px] text-slate-800">
                        <span>{q.options.length} options</span>
                        <span>•</span>
                        <span className="text-indigo-605 font-semibold font-mono">
                          Correct: Option {q.correctOptionIndex + 1}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions right */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleApprove(q.id)}
                      className={`h-7 px-2.5 rounded-lg text-[10px] font-bold transition-all inline-flex items-center gap-1 ${
                        q.approved
                          ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100'
                          : 'bg-slate-200 text-slate-650 hover:bg-slate-300'
                      }`}
                      title={q.approved ? "Approved" : "Rejected/Inactive"}
                    >
                      {q.approved ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-indigo-600" />
                          Approved
                        </>
                      ) : (
                        <>
                          <X className="h-3.5 w-3.5 text-slate-700" />
                          Disabled
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteQuestion(q.id)}
                      className="h-7 w-7 rounded-lg bg-slate-50 hover:bg-red-50 text-slate-700 hover:text-red-600 flex items-center justify-center transition-colors"
                      title="Delete Question"
                    >
                      <Trash className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (!isEditing) setExpandedId(isExpanded ? null : q.id);
                      }}
                      className="h-7 w-7 text-slate-700 flex items-center justify-center"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 border-t border-slate-100 space-y-4">
                    {isEditing ? (
                      /* EDITING MODE FORM */
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-3xs font-bold text-slate-800 uppercase">Question Text</label>
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={3}
                            title="Question Text"
                            placeholder="Enter the question text"
                            className="w-full text-slate-800 text-sm p-3 bg-slate-50 border border-slate-205 rounded-xl focus:border-indigo-500 outline-hidden placeholder:text-slate-700"
                          />
                        </div>

                        {/* Options Editor */}
                        <div className="space-y-2">
                          <label className="text-3xs font-bold text-slate-800 uppercase block">MCQ Options (Select the correct radio)</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {editOptions.map((opt, oIdx) => (
                              <div
                                key={oIdx}
                                className={`flex items-center gap-2 p-2 rounded-xl border ${
                                  editCorrectIdx === oIdx
                                    ? 'bg-emerald-500/5 border-emerald-500/20'
                                    : 'bg-slate-50 border-transparent'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`correct-${q.id}`}
                                  checked={editCorrectIdx === oIdx}
                                  onChange={() => setEditCorrectIdx(oIdx)}
                                  title={`Mark Option ${String.fromCharCode(65 + oIdx)} as Correct`}
                                  aria-label={`Mark Option ${String.fromCharCode(65 + oIdx)} as Correct`}
                                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300"
                                />
                                <span className="text-xs font-semibold text-slate-800 min-w-[15px]">
                                  {String.fromCharCode(65 + oIdx)}.
                                </span>
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => handleOptionChange(oIdx, e.target.value)}
                                  title={`Option ${String.fromCharCode(65 + oIdx)} text`}
                                  aria-label={`Option ${String.fromCharCode(65 + oIdx)} text`}
                                  placeholder={`Option ${String.fromCharCode(65 + oIdx)} text`}
                                  className="bg-transparent border-b border-dashed border-slate-300 focus:border-slate-800 outline-hidden py-0.5 text-xs text-slate-700 flex-1 placeholder:text-slate-700"
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Explanation Editor */}
                        <div className="space-y-1.5">
                          <label className="text-3xs font-bold text-slate-800 uppercase">Explanation / Rationalization</label>
                          <textarea
                            value={editExplanation}
                            onChange={(e) => setEditExplanation(e.target.value)}
                            rows={2}
                            title="Explanation"
                            placeholder="Enter explanation details"
                            className="w-full text-slate-700 text-xs p-3 bg-slate-50 border border-slate-205 rounded-xl focus:border-indigo-500 outline-hidden placeholder:text-slate-700"
                          />
                        </div>

                        {/* Save Edit Toolbar */}
                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1.5 text-xs text-slate-700 hover:text-slate-800"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => saveEdit(q.id)}
                            className="px-4 py-1.5 bg-slate-800 hover:bg-black text-white rounded-lg text-xs font-bold flex items-center gap-1"
                          >
                            <Save className="h-3 w-3" />
                            Save Alterations
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* READ-ONLY REVIEW MODE */
                      <div className="space-y-4">
                        {/* Options List */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800">Answer Options</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {q.options.map((opt, oIdx) => {
                              const isCorrect = q.correctOptionIndex === oIdx;
                              return (
                                <div
                                  key={oIdx}
                                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                                    isCorrect
                                      ? 'bg-emerald-500/5 text-emerald-800 border-emerald-500/20 font-medium'
                                      : 'bg-slate-50/50 text-slate-800 border-slate-100'
                                  }`}
                                >
                                  <span className={`h-5 w-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                                    isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200/80 text-slate-700'
                                  }`}>
                                    {String.fromCharCode(65 + oIdx)}
                                  </span>
                                  <span>{opt}</span>
                                  {isCorrect && (
                                    <span className="ml-auto text-[9px] uppercase font-bold tracking-wider text-emerald-600">
                                      Correct
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Explanation Box */}
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-800 block">AI Rational explanation</span>
                          <p className="text-xs text-slate-800 leading-relaxed">
                            {q.explanation}
                          </p>
                        </div>

                        {/* Edit Button */}
                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => startEditing(q)}
                            className="px-3 py-1.5 hover:bg-slate-100 text-slate-700 hover:text-slate-800 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                          >
                            <Edit3 className="h-3 w-3" />
                            Edit Question Cards
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
