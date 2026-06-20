import React, { useState } from 'react';
import { BookOpen, LogIn } from 'lucide-react';
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
      <section className="px-6 sm:px-10 lg:px-16 py-10 flex flex-col justify-between bg-[#f6f1e8]">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-slate-950 text-white grid place-items-center">
            <BookOpen className="h-5 w-5" />
          </div>
          <span className="font-extrabold tracking-tight">ExamMaster AI</span>
        </div>

        <div className="max-w-xl py-16 lg:py-0">
          <p className="text-sm font-bold text-teal-700 mb-4">Mock exam workspace</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-normal">
            Practice with AI, save every session.
          </h1>
          <p className="mt-5 text-base sm:text-lg text-slate-650 max-w-lg">
            Generate bilingual questions, review them, and continue your test history from a protected account.
          </p>
        </div>

        <p className="text-xs text-slate-500">20 AI generations per day per user.</p>
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
