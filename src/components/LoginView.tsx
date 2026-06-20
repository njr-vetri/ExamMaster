import React, { useState } from 'react';
import { BookOpen, LogIn, Zap, Globe, BarChart3, Star, Target } from 'lucide-react';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '../services/firebase';

export default function LoginView() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submitEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-slate-900 grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="px-6 sm:px-10 lg:px-16 py-10 flex flex-col justify-between bg-[#f6f1e8] relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-slate-950 text-white grid place-items-center shadow-md">
              <BookOpen className="h-5 w-5" />
            </div>
            <span className="font-extrabold tracking-tight text-slate-900">ExamMaster AI</span>
          </div>

          <div className="max-w-xl py-12 lg:py-16">
            <p className="text-sm font-bold text-teal-700 mb-4 inline-flex items-center gap-2 bg-teal-50 px-3 py-1.5 rounded-full border border-teal-100 shadow-xs">
               <span className="relative flex h-2 w-2">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
               </span>
               Live Mock Exam Workspace
            </p>
            
            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.1] tracking-tight text-slate-900">
              Practice with AI,<br/>save every session.
            </h1>

            {/* Feature Highlights */}
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-5">
               <div className="bg-white/60 backdrop-blur-md p-6 rounded-2xl border border-slate-200/50 shadow-sm hover:-translate-y-1 transition-transform">
                 <Zap className="h-7 w-7 text-amber-500 mb-4" />
                 <h3 className="text-sm font-extrabold text-slate-800">Instant Answers</h3>
                 <p className="text-xs font-medium text-slate-500 mt-2 leading-relaxed">AI-driven rationales for every question.</p>
               </div>
               <div className="bg-white/60 backdrop-blur-md p-6 rounded-2xl border border-slate-200/50 shadow-sm hover:-translate-y-1 transition-transform">
                 <Globe className="h-7 w-7 text-indigo-500 mb-4" />
                 <h3 className="text-sm font-extrabold text-slate-800">Bilingual Support</h3>
                 <p className="text-xs font-medium text-slate-500 mt-2 leading-relaxed">Study in both English and Tamil simultaneously.</p>
               </div>
               <div className="bg-white/60 backdrop-blur-md p-6 rounded-2xl border border-slate-200/50 shadow-sm hover:-translate-y-1 transition-transform">
                 <BarChart3 className="h-7 w-7 text-emerald-500 mb-4" />
                 <h3 className="text-sm font-extrabold text-slate-800">Deep Analytics</h3>
                 <p className="text-xs font-medium text-slate-500 mt-2 leading-relaxed">Track your progress and uncover weak spots.</p>
               </div>
            </div>

            {/* Popular Exams with interactive tags */}
            <div className="mt-12 space-y-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                 <Target className="h-4 w-4 text-teal-600" />
                 Supported Exams
              </p>
              <div className="flex flex-wrap gap-2">
                {['UPSC', 'TNPSC', 'SSC', 'RRB', 'Banking', 'NEET', 'JEE', 'GATE', 'CAT'].map((exam) => (
                  <span 
                    key={exam} 
                    className="px-4 py-1.5 bg-white text-teal-800 text-xs font-bold rounded-full border border-teal-700/10 shadow-xs hover:scale-105 hover:bg-teal-50 hover:border-teal-200 hover:shadow-sm transition-all cursor-default"
                  >
                    {exam}
                  </span>
                ))}
              </div>
            </div>
            
          </div>
        </div>

        <p className="relative z-10 text-xs font-bold text-slate-600 mb-2">✨ 20 AI generations per day per user.</p>
      </section>

      <section className="px-6 sm:px-10 lg:px-16 py-10 flex items-center">
        <div className="w-full max-w-md mx-auto">
          <h2 className="text-2xl font-extrabold tracking-tight">{mode === 'signin' ? 'Log in' : 'Create account'}</h2>

          <form onSubmit={submitEmail} className="mt-7 space-y-4">
            <label className="block">
              <span className="text-xs font-bold text-slate-600">Email</span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                required
                className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-4 py-3 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-slate-600">Password</span>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                required
                minLength={6}
                className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-4 py-3 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              />
            </label>

            {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

            <button
              disabled={loading}
              className="w-full h-12 rounded-lg bg-slate-950 text-white font-bold inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <LogIn className="h-4 w-4" />
              {mode === 'signin' ? 'Log in' : 'Create account'}
            </button>
          </form>

          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className="mt-3 w-full h-12 rounded-lg border border-slate-250 bg-white text-slate-900 font-bold disabled:opacity-60"
          >
            Continue with Google
          </button>

          <button
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            className="mt-5 text-sm font-bold text-teal-700"
          >
            {mode === 'signin' ? 'Create account' : 'Use existing account'}
          </button>
        </div>
      </section>
    </div>
  );
}
