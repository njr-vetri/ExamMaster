import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, Trash2, ArrowRight, BookOpen, AlertCircle, Sparkles, Loader2, ChevronDown, ChevronRight, Target } from 'lucide-react';
import { ExamLanguage, ExamDifficulty } from '../types';

interface UploadMaterialViewProps {
  onGenerate: (settings: {
    subject: string;
    language: ExamLanguage;
    difficulty: ExamDifficulty;
    questionCount: number;
    optionsCount: number;
    fileName?: string;
    file?: File | null;
    reuseApproved?: boolean;
    ownApiKey?: string;
  }) => void;
}

const EXAM_SYLLABI = [
  {
    exam: 'TNPSC Group 4',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    chapters: ['General Tamil (Part A)', 'General Science', 'Indian Polity', 'Geography of India', 'Indian Economy', 'Indian National Movement', 'Aptitude & Mental Ability']
  },
  {
    exam: 'UPSC Prelims',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    chapters: ['Current Events', 'History of India', 'Indian & World Geography', 'Indian Polity & Governance', 'Economic & Social Development', 'General Science', 'Environment & Ecology']
  },
  {
    exam: 'NEET UG (Biology)',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    chapters: ['Diversity in Living World', 'Structural Organisation in Plants/Animals', 'Cell Structure and Function', 'Plant Physiology', 'Human Physiology', 'Genetics and Evolution', 'Biotechnology']
  },
  {
    exam: 'JEE Main (Physics)',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    chapters: ['Kinematics', 'Laws of Motion', 'Thermodynamics', 'Electromagnetism', 'Optics', 'Modern Physics', 'Electronic Devices']
  }
];

export default function UploadMaterialView({ onGenerate }: UploadMaterialViewProps) {
  const [subject, setSubject] = useState('');
  const [language, setLanguage] = useState<ExamLanguage>('bilingual');
  const [difficulty, setDifficulty] = useState<ExamDifficulty>('medium');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [optionsCount, setOptionsCount] = useState<number>(4);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string; previewUrl?: string } | null>(null);
  const [actualFile, setActualFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageWarning, setImageWarning] = useState('');
  const [reuseApproved, setReuseApproved] = useState(true);
  const [ownApiKey, setOwnApiKey] = useState(() => localStorage.getItem('exammaster_own_gemini_key') || '');
  const [expandedExam, setExpandedExam] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const inspectImageQuality = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setImageWarning('');
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 96;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0, size, size);
      const pixels = ctx.getImageData(0, 0, size, size).data;
      let edgeScore = 0;
      let samples = 0;

      for (let y = 1; y < size - 1; y++) {
        for (let x = 1; x < size - 1; x++) {
          const i = (y * size + x) * 4;
          const left = (y * size + x - 1) * 4;
          const right = (y * size + x + 1) * 4;
          const top = ((y - 1) * size + x) * 4;
          const bottom = ((y + 1) * size + x) * 4;
          const gray = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
          const laplace =
            Math.abs(4 * gray
              - (pixels[left] + pixels[left + 1] + pixels[left + 2]) / 3
              - (pixels[right] + pixels[right + 1] + pixels[right + 2]) / 3
              - (pixels[top] + pixels[top + 1] + pixels[top + 2]) / 3
              - (pixels[bottom] + pixels[bottom + 1] + pixels[bottom + 2]) / 3);
          edgeScore += laplace;
          samples++;
        }
      }

      URL.revokeObjectURL(url);
      setImageWarning(edgeScore / samples < 8 ? 'Image may be blurry. Upload a sharper screenshot for better OCR.' : '');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setImageWarning('');
    };
    img.src = url;
  };

  const simulateFileUpload = (name: string, sizeBytes: number, previewUrl?: string) => {
    const sizeStr = `${(sizeBytes / 1024 / 1024).toFixed(2)} MB`;
    setUploadedFile({ name, size: sizeStr, previewUrl });
  };

  const acceptFile = (file: File) => {
    setActualFile(file);
    const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
    simulateFileUpload(file.name, file.size, previewUrl);
    inspectImageQuality(file);
    guessSubjectFromFileName(file.name);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      acceptFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      acceptFile(e.target.files[0]);
    }
  };

  const guessSubjectFromFileName = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('chemistry') || lower.includes('acid') || lower.includes('chemical')) setSubject('Chemistry');
    else if (lower.includes('physics') || lower.includes('motion') || lower.includes('gravity')) setSubject('Physics');
    else if (lower.includes('history') || lower.includes('chola') || lower.includes('dynasty')) setSubject('History');
    else if (lower.includes('tamil') || lower.includes('kural') || lower.includes('thirukkural')) setSubject('Tamil Literature');
    else if (lower.includes('math') || lower.includes('geometry') || lower.includes('algebra')) setSubject('Mathematics');
  };

  const removeFile = () => {
    if (uploadedFile?.previewUrl) URL.revokeObjectURL(uploadedFile.previewUrl);
    setUploadedFile(null);
    setActualFile(null);
    setImageWarning('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleTopicSelect = (examName: string, chapter: string) => {
    // Set the subject and remove any uploaded file to use "Pure AI" generation
    setSubject(`${chapter} (${examName})`);
    removeFile();
    // Scroll to form or show a visual cue
    document.getElementById('subject-input')?.focus();
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      await onGenerate({
        subject: subject || 'General Knowledge',
        language,
        difficulty,
        questionCount,
        optionsCount,
        fileName: uploadedFile?.name,
        file: actualFile,
        reuseApproved,
        ownApiKey: ownApiKey.trim()
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
          <Upload className="h-6 w-6 text-indigo-600" />
          Create AI Mock Test
        </h1>
        <p className="text-slate-500 max-w-2xl text-sm">
          Upload slides, syllabi, PDF notes, or screenshots, choose exam options, and watch our artificial intelligence build custom academic questions with rich explanations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns - Form and Drop zone */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6 bg-white border border-slate-205 rounded-3xl p-6 sm:p-8 shadow-xs">
          
          {/* Upload Area */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              1. Study Material Source
            </label>
            
            {!uploadedFile ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-indigo-500 bg-indigo-50/30'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <input
                  type="file"
                  id="image-pdf-picker"
                  title="Upload Study Material"
                  aria-label="Upload Study Material"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  className="hidden"
                />
                
                <div className="mx-auto h-12 w-12 rounded-xl bg-white shadow-xs border border-slate-100 text-slate-400 flex items-center justify-center mb-3">
                  <Upload className="h-6 w-6 text-indigo-600" />
                </div>
                
                <h3 className="text-sm font-semibold text-slate-850">
                  Drag and drop files here, or <span className="text-indigo-600 hover:underline">browse</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Supports PDF, PNG, JPG, DOCX (Max 25MB)
                </p>
              </div>
            ) : (
              <div className="border border-indigo-100 bg-indigo-50/20 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {uploadedFile.previewUrl ? (
                    <div className="h-12 w-12 rounded-lg overflow-hidden border border-slate-200">
                      <img src={uploadedFile.previewUrl} referrerPolicy="no-referrer" alt="preview" className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <FileText className="h-6 w-6" />
                    </div>
                  )}
                  <div className="select-none">
                    <div className="text-sm font-bold text-slate-805 truncate max-w-xs sm:max-w-md">{uploadedFile.name}</div>
                    <div className="text-xs text-indigo-650 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 fill-current" />
                      Ready for AI parsing • {uploadedFile.size}
                    </div>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={removeFile}
                  className="h-8 w-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-colors"
                  title="Remove uploaded source"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}

            {imageWarning && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {imageWarning}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Subject Input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                2. Academic Subject
              </label>
              <div className="relative">
                <input
                  id="subject-input"
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Physics, Chemistry, Indian History..."
                  className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-50/60 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-150 rounded-xl outline-hidden text-sm transition-all text-slate-800"
                />
              </div>
            </div>

            {/* Language Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                3. Language Medium
              </label>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
                {(['english', 'tamil', 'bilingual'] as ExamLanguage[]).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setLanguage(lang)}
                    className={`py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                      language === lang
                        ? 'bg-white text-slate-800 shadow-3xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {lang === 'bilingual' ? 'Bilingual (இருமொழி)' : lang}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Difficulty Picker */}
            <div className="space-y-2">
              <label htmlFor="difficulty-picker" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                4. Exam Difficulty
              </label>
              <select
                id="difficulty-picker"
                title="Exam Difficulty"
                aria-label="Exam Difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as ExamDifficulty)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 rounded-xl outline-hidden text-xs text-slate-700 font-medium"
              >
                <option value="easy">Easy (ஆரம்ப நிலை)</option>
                <option value="medium">Medium (நடுத்தரம்)</option>
                <option value="hard">Hard (கடினம்)</option>
              </select>
            </div>

            {/* Number of queries */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                5. Total Questions
              </label>
              <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl justify-between">
                {[3, 5, 8, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setQuestionCount(num)}
                    className={`w-full py-1.5 text-xs font-bold rounded-lg transition-all ${
                      questionCount === num
                        ? 'bg-white text-indigo-700 shadow-3xs'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* MCQ Option Count selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                6. Options per MCQ
              </label>
              <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl justify-between">
                {[2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setOptionsCount(num)}
                    className={`w-full py-1.5 text-xs font-bold rounded-lg transition-all ${
                      optionsCount === num
                        ? 'bg-white text-indigo-700 shadow-3xs'
                        : 'text-slate-500 hover:text-slate-705'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-150">
            <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <span className="text-xs font-bold text-slate-650">Reuse approved questions</span>
                <input
                  type="checkbox"
                  checked={reuseApproved}
                  onChange={(e) => setReuseApproved(e.target.checked)}
                  className="h-4 w-4 accent-indigo-600"
                />
              </label>
              <input
                type="password"
                value={ownApiKey}
                onChange={(e) => {
                  setOwnApiKey(e.target.value);
                  localStorage.setItem('exammaster_own_gemini_key', e.target.value);
                }}
                placeholder="Optional Gemini API key"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs outline-hidden focus:border-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl font-bold shadow-xs hover:shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              id="btn-generate-exam"
            >
              {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
              {isGenerating ? 'Generating...' : 'Generate Exam via Copilot AI'}
              {!isGenerating && <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
        </form>

        {/* Right column - Syllabus Explorer */}
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 select-none">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-indigo-600" />
              AI Syllabus Explorer
            </h3>
            <p className="text-slate-500 text-xs mb-4">
              Don't have a PDF? Pick a topic from a major exam syllabus below. The AI will generate a test purely from its own knowledge!
            </p>
            
            <div className="space-y-3">
              {EXAM_SYLLABI.map((examData, idx) => {
                const isExpanded = expandedExam === examData.exam;
                
                return (
                  <div key={idx} className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-all duration-300 shadow-3xs hover:shadow-xs">
                    <button
                      type="button"
                      onClick={() => setExpandedExam(isExpanded ? null : examData.exam)}
                      className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-lg ${examData.bg} ${examData.color} flex items-center justify-center shrink-0`}>
                          <BookOpen className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-800">
                          {examData.exam}
                        </span>
                      </div>
                      <div className="text-slate-400">
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </div>
                    </button>
                    
                    {isExpanded && (
                      <div className="p-3 pt-0 border-t border-slate-100 bg-slate-50/50 space-y-1.5 animate-fadeIn">
                        {examData.chapters.map((chapter, cIdx) => (
                          <button
                            key={cIdx}
                            type="button"
                            onClick={() => handleTopicSelect(examData.exam, chapter)}
                            className="w-full text-left px-3 py-2 rounded-lg text-[11px] font-medium text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all flex items-center justify-between group"
                          >
                            <span className="truncate pr-2">{chapter}</span>
                            <Sparkles className="h-3 w-3 opacity-0 group-hover:opacity-100 text-indigo-500 shrink-0 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-indigo-50/40 border border-indigo-550/10 rounded-2xl p-5 text-indigo-900 text-xs flex gap-3">
            <AlertCircle className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold">Next Stage: Admin Review</h4>
              <p className="text-indigo-805 leading-relaxed">
                After clicking generation, you will enters the **Questions Review Panel**. Here you have the superpower to verify, tweak option weights, edit text translations, and approve each generated MCQ card before publishing!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
