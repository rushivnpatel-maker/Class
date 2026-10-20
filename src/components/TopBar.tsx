/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PlusCircle, Radio, User, Flame } from 'lucide-react';
import { getAvatarColor } from '../utils/colors';

interface TopBarProps {
  activeTab: 'vlogs' | 'live' | 'updates' | 'members';
  onTabChange: (tab: 'vlogs' | 'live' | 'updates' | 'members') => void;
  onOpenPostVlog: () => void;
  nickname: string | null;
  onOpenSignIn: () => void;
  activeCount: number;
}

export function TopBar({
  activeTab,
  onTabChange,
  onOpenPostVlog,
  nickname,
  onOpenSignIn,
  activeCount,
}: TopBarProps) {
  const avatarColor = getAvatarColor(nickname || 'Guest');

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-6 py-3.5">
        {/* Zone 1: Brand wordmark in display face */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onTabChange('vlogs')}
            className="text-xl font-extrabold tracking-tight font-display text-white hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 text-left"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            The Class
          </button>
        </div>

        {/* Zone 2: 4 single-line concise navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-400">
          <button
            onClick={() => onTabChange('vlogs')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeTab === 'vlogs'
                ? 'text-white border-b-2 border-amber-400 font-semibold'
                : 'hover:text-slate-200'
            }`}
          >
            Vlogs
          </button>
          <button
            onClick={() => onTabChange('live')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 flex items-center gap-1.5 ${
              activeTab === 'live'
                ? 'text-white border-b-2 border-amber-400 font-semibold'
                : 'hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-rose-500" />
            Live Deck
          </button>
          <button
            onClick={() => onTabChange('updates')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeTab === 'updates'
                ? 'text-white border-b-2 border-amber-400 font-semibold'
                : 'hover:text-slate-200'
            }`}
          >
            Updates
          </button>
          <button
            onClick={() => onTabChange('members')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeTab === 'members'
                ? 'text-white border-b-2 border-amber-400 font-semibold'
                : 'hover:text-slate-200'
            }`}
          >
            Members ({activeCount})
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenPostVlog}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-all shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post Vlog</span>
          </button>

          {nickname ? (
            <button
              onClick={onOpenSignIn}
              title="Click to change your nickname in The Class"
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-slate-700 transition-colors whitespace-nowrap shrink-0"
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-950"
                style={{ backgroundColor: avatarColor }}
              >
                {nickname[0].toUpperCase()}
              </div>
              <span className="max-w-[100px] truncate">{nickname}</span>
            </button>
          ) : (
            <button
              onClick={onOpenSignIn}
              className="text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Mobile nav links */}
      <div className="flex md:hidden items-center justify-around border-t border-slate-900 px-4 py-2 bg-slate-950 text-xs">
        <button
          onClick={() => onTabChange('vlogs')}
          className={`py-1 ${activeTab === 'vlogs' ? 'text-amber-400 font-medium' : 'text-slate-400'}`}
        >
          Vlogs
        </button>
        <button
          onClick={() => onTabChange('live')}
          className={`py-1 flex items-center gap-1 ${activeTab === 'live' ? 'text-amber-400 font-medium' : 'text-slate-400'}`}
        >
          <Radio className="w-3 h-3 text-rose-500" />
          Live Deck
        </button>
        <button
          onClick={() => onTabChange('updates')}
          className={`py-1 ${activeTab === 'updates' ? 'text-amber-400 font-medium' : 'text-slate-400'}`}
        >
          Updates
        </button>
        <button
          onClick={() => onTabChange('members')}
          className={`py-1 ${activeTab === 'members' ? 'text-amber-400 font-medium' : 'text-slate-400'}`}
        >
          Members ({activeCount})
        </button>
      </div>
    </header>
  );
}
