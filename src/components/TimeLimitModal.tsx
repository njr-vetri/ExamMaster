import React, { useState } from 'react';
import { Clock, X, Check } from 'lucide-react';

interface TimeLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (minutes: number) => void;
  defaultMinutes?: number;
  title?: string;
  description?: string;
  confirmLabel?: string;
}

export default function TimeLimitModal({
  isOpen,
  onClose,
  onConfirm,
  defaultMinutes = 5,
  title = "Set Time Limit",
  description = "How many minutes do you want to allow for this test?",
  confirmLabel = "Confirm"
}: TimeLimitModalProps) {
  const [minutes, setMinutes] = useState(defaultMinutes);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-slideUp">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-600" />
            {title}
          </h2>
          <button 
            onClick={onClose}
            title="Close"
            aria-label="Close"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-sm text-slate-600 mb-6">{description}</p>
          
          <div className="flex items-center justify-center gap-4">
            <button 
              onClick={() => setMinutes(m => Math.max(1, m - 1))}
              className="w-12 h-12 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-bold text-xl transition-colors active:scale-95"
            >
              -
            </button>
            <div className="w-24 text-center">
              <span className="text-4xl font-black text-indigo-700 block">{minutes}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 block">Min</span>
            </div>
            <button 
              onClick={() => setMinutes(m => m + 1)}
              className="w-12 h-12 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-bold text-xl transition-colors active:scale-95"
            >
              +
            </button>
          </div>
          
          <div className="mt-8 flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => onConfirm(minutes)}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors active:scale-95 shadow-sm"
            >
              {confirmLabel}
              <Check className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
