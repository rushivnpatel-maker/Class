/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ArrowRight, Video, ShieldCheck, HeartHandshake, CheckCircle2, ChevronLeft } from 'lucide-react';
import { getAvatarColor } from '../utils/colors';

interface SignInModalProps {
  isOpen: boolean;
  onSignIn: (nickname: string) => void;
  initialNickname?: string;
  initialStep?: 'nickname' | 'rules';
  onClose?: () => void;
}

export function SignInModal({
  isOpen,
  onSignIn,
  initialNickname = '',
  initialStep = 'nickname',
  onClose,
}: SignInModalProps) {
  const [step, setStep] = useState<'nickname' | 'rules'>(initialStep);
  const [nicknameInput, setNicknameInput] = useState(initialNickname);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNicknameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nicknameInput.trim();
    if (!trimmed) {
      setError('Please provide a nickname to enter');
      return;
    }
    if (trimmed.length < 2) {
      setError('Nickname must be at least 2 characters');
      return;
    }
    if (trimmed.length > 24) {
      setError('Nickname cannot exceed 24 characters');
      return;
    }
    setError(null);
    // After the sign up / nickname prompt, show the rules
    setStep('rules');
  };

  const handleAcceptRules = () => {
    const trimmed = nicknameInput.trim() || initialNickname || 'Creator';
    onSignIn(trimmed);
  };

  const previewColor = getAvatarColor(nicknameInput.trim() || 'Guest');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900/95 border border-slate-800 rounded-3xl p-8 shadow-2xl text-slate-100 relative overflow-hidden">
        {/* Decorative glow */}
        <div
          className="absolute -top-24 -left-24 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: previewColor }}
        />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full blur-3xl bg-amber-500/10 pointer-events-none" />

        {/* STEP 1: ONE-QUESTION SIGN IN */}
        {step === 'nickname' && (
          <>
            {/* Brand identity: The Class */}
            <div className="flex flex-col items-center text-center mb-8 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4 text-amber-400">
                <Video className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight font-display text-white">
                The Class
              </h1>
              <p className="text-sm text-slate-400 mt-1.5 max-w-xs">
                Live vlogs & real-time creator updates for followers who show up.
              </p>
            </div>

            {/* The single question sign-in form */}
            <form onSubmit={handleNicknameSubmit} className="space-y-6 relative z-10">
              <div className="space-y-2">
                <label
                  htmlFor="nickname-input"
                  className="block text-sm font-semibold text-slate-200"
                >
                  What is your nickname?
                </label>
                <div className="relative">
                  <input
                    id="nickname-input"
                    type="text"
                    autoFocus
                    placeholder="e.g. samurai_sam, maya_directs, nova..."
                    value={nicknameInput}
                    onChange={(e) => {
                      setNicknameInput(e.target.value);
                      if (error) setError(null);
                    }}
                    className="w-full px-4 py-3 bg-slate-950/70 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/80 focus:ring-1 focus:ring-amber-400/80 transition-colors text-base"
                    maxLength={24}
                  />
                  {nicknameInput.trim().length > 0 && (
                    <div
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-slate-950"
                      style={{ backgroundColor: previewColor }}
                    >
                      {nicknameInput.trim()[0].toUpperCase()}
                    </div>
                  )}
                </div>

                {error ? (
                  <p className="text-xs text-rose-400">{error}</p>
                ) : (
                  <p className="text-xs text-slate-500">
                    Only a nickname is required. You will review the community rules next.
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 active:scale-[0.99] transition-all shadow-lg shadow-amber-400/10 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick starter suggestions */}
            <div className="mt-6 pt-5 border-t border-slate-800 text-center relative z-10">
              <span className="text-xs text-slate-500 block mb-2.5">
                Quick pick or inspiration
              </span>
              <div className="flex flex-wrap justify-center gap-2">
                {['cinemax', 'studio_lead', 'wanderer', 'soundpulse'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setNicknameInput(tag)}
                    className="text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-800 transition-colors cursor-pointer"
                  >
                    @{tag}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* STEP 2: RULES OF USING THE CLASS */}
        {step === 'rules' && (
          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <button
                type="button"
                onClick={() => setStep('nickname')}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <span className="text-xs text-amber-400 font-mono">
                Signing in as @{nicknameInput.trim() || 'Creator'}
              </span>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center mx-auto mb-3 text-amber-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-white font-display">
                Rules of Using The Class
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Please follow our community standards to maintain a safe, inspiring environment.
              </p>
            </div>

            {/* Core Rules List */}
            <div className="space-y-3 bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
              {/* PRIMARY USER-REQUESTED RULE */}
              <div className="flex items-start gap-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl">
                <div className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  1
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-wide">
                    No bullying or troubling anyone
                  </h4>
                  <p className="text-xs text-rose-200/80 mt-0.5 leading-relaxed">
                    Zero tolerance for harassment, targeted insults, threats, or causing distress to fellow creators and followers.
                  </p>
                </div>
              </div>

              {/* RULE 2 */}
              <div className="flex items-start gap-3 p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl">
                <div className="w-6 h-6 rounded-lg bg-slate-800 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  2
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">
                    Respectful real-time interactions
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Keep live comments, stream chats, and emoji reactions constructive, respectful, and supportive.
                  </p>
                </div>
              </div>

              {/* RULE 3 */}
              <div className="flex items-start gap-3 p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl">
                <div className="w-6 h-6 rounded-lg bg-slate-800 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  3
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">
                    Authentic vlogs & honest creative work
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Share genuine perspectives, original videos, and true behind-the-scenes moments from your journey.
                  </p>
                </div>
              </div>
            </div>

            {/* Accept & Enter Button */}
            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={handleAcceptRules}
                className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 active:scale-[0.99] transition-all shadow-lg shadow-amber-400/10 cursor-pointer text-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>I Agree — Enter The Class</span>
              </button>

              <p className="text-[11px] text-center text-slate-500">
                By entering, you confirm you will adhere to all community rules.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
