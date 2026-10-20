/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Radio,
  Flame,
  Heart,
  Sparkles,
  Zap,
  PartyPopper,
  Users,
  MessageSquare,
  Send,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import type { Vlog, ActiveMember } from '../types';
import { formatTimeAgo, getAvatarColor } from '../utils/colors';

interface LiveDeckViewProps {
  featuredVlog: Vlog;
  onSelectVlog: (vlog: Vlog) => void;
  currentNickname: string | null;
  onTriggerReaction: (emoji: string) => void;
  onAddComment: (vlogId: string, text: string) => void;
  onOpenSignIn: () => void;
  activeMembers: ActiveMember[];
  reactionsCount: number;
}

export function LiveDeckView({
  featuredVlog,
  onSelectVlog,
  currentNickname,
  onTriggerReaction,
  onAddComment,
  onOpenSignIn,
  activeMembers,
  reactionsCount,
}: LiveDeckViewProps) {
  const [chatInput, setChatInput] = useState('');
  const [burstCount, setBurstCount] = useState(0);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentNickname) {
      onOpenSignIn();
      return;
    }
    if (!chatInput.trim()) return;
    onAddComment(featuredVlog.id, chatInput);
    setChatInput('');
  };

  const handleEmojiTap = (emoji: string) => {
    if (!currentNickname) {
      onOpenSignIn();
      return;
    }
    onTriggerReaction(emoji);
    setBurstCount((c) => c + 1);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Ticker */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-rose-500 live-beacon" />
          <h2 className="text-base font-bold text-white font-display">
            The Class Live Deck
          </h2>
          <span className="text-xs text-slate-400">
            Real-time stage synced with {activeMembers.length} active members
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-400 tabular-nums">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-amber-400" />
            <span>{activeMembers.length} Connected</span>
          </div>
          <span aria-hidden="true">·</span>
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-rose-500" />
            <span>{reactionsCount + burstCount} Reactions shared</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Live Broadcast Screen & Live Follower Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Broadcast Viewport */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-slate-800 group shadow-2xl">
            <img
              src={featuredVlog.thumbnailUrl}
              alt={featuredVlog.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30 pointer-events-none" />

            {/* Live Badge */}
            <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 bg-rose-600/90 backdrop-blur-xs rounded-lg text-white text-xs font-bold uppercase tracking-wider shadow">
              <span className="w-2 h-2 rounded-full bg-white live-beacon" />
              <span>LIVE TRANSMISSION</span>
            </div>

            {/* Viewer Count */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 bg-black/60 backdrop-blur-xs rounded-lg text-slate-200 text-xs font-mono tabular-nums">
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span>{featuredVlog.views + 42} watching</span>
            </div>

            {/* Broadcaster Info */}
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-slate-950 text-xs"
                    style={{ backgroundColor: featuredVlog.authorAvatarColor || '#f59e0b' }}
                  >
                    {featuredVlog.author[0]}
                  </div>
                  <span className="text-sm font-semibold text-white">
                    {featuredVlog.author}
                  </span>
                  <span className="text-xs text-amber-400 font-mono">
                    {featuredVlog.location}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white line-clamp-1">
                  {featuredVlog.title}
                </h3>
              </div>

              <button
                onClick={() => onSelectVlog(featuredVlog)}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-xs rounded-xl shadow-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                Open Full Theater
              </button>
            </div>
          </div>

          {/* Interactive Live Reaction Deck for Followers */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-center sm:text-left">
              <h4 className="text-xs font-semibold text-white mb-0.5">
                Send Live Energy to {featuredVlog.author}
              </h4>
              <p className="text-[11px] text-slate-400">
                Tapping emojis floats them onto everyone's screen in real time
              </p>
            </div>

            <div className="flex items-center gap-2">
              {[
                { emoji: '🔥', label: 'Fire' },
                { emoji: '❤️', label: 'Love' },
                { emoji: '👏', label: 'Applause' },
                { emoji: '⚡', label: 'Energy' },
                { emoji: '✨', label: 'Vibes' },
                { emoji: '🎉', label: 'Celebrate' },
              ].map(({ emoji, label }) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiTap(emoji)}
                  className="w-10 h-10 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-lg hover:scale-125 active:scale-95 transition-all shadow-sm cursor-pointer"
                  title={label}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Follower Chat Column */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col h-[520px]">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-semibold text-white">Live Follower Stream</h4>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {featuredVlog.comments.length} messages
            </span>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {featuredVlog.comments.map((comment) => (
              <div key={comment.id} className="text-xs flex gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-slate-950 text-[10px] shrink-0 mt-0.5"
                  style={{ backgroundColor: comment.authorAvatarColor || getAvatarColor(comment.author) }}
                >
                  {comment.author[0].toUpperCase()}
                </div>
                <div className="flex-1 bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-semibold text-slate-200">{comment.author}</span>
                    <span className="text-[10px] text-slate-500">
                      {formatTimeAgo(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{comment.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Chat Form */}
          <form onSubmit={handleSendChat} className="p-3 border-t border-slate-800 bg-slate-950 rounded-b-2xl">
            {currentNickname ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Send live chat as @${currentNickname}...`}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="p-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenSignIn}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 rounded-xl text-xs font-medium transition-colors cursor-pointer"
              >
                Sign in with your nickname to chat
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
