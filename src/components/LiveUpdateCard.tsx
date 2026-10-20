/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Heart, MessageSquare, Send, Sparkles, Trash2 } from 'lucide-react';
import type { LiveUpdate } from '../types';
import { formatTimeAgo, getAvatarColor } from '../utils/colors';

interface LiveUpdateCardProps {
  update: LiveUpdate;
  currentNickname: string | null;
  onToggleLike: (updateId: string) => void;
  onReact: (updateId: string, emoji: string) => void;
  onAddComment: (updateId: string, text: string) => void;
  onOpenSignIn: () => void;
  onDeleteUpdate?: (updateId: string) => void;
}

const COMMON_EMOJIS = ['🔥', '❤️', '👏', '⚡', '💡', '🤯'];

export function LiveUpdateCard({
  update,
  currentNickname,
  onToggleLike,
  onReact,
  onAddComment,
  onOpenSignIn,
  onDeleteUpdate,
}: LiveUpdateCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  const hasLiked = currentNickname ? update.likedBy.includes(currentNickname) : false;
  const avatarColor = update.authorAvatarColor || getAvatarColor(update.author);

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentNickname) {
      onOpenSignIn();
      return;
    }
    if (!commentText.trim()) return;
    onAddComment(update.id, commentText);
    setCommentText('');
  };

  return (
    <article className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/70 transition-all">
      {/* Header — Zero-pill discipline: unboxed text with · separators */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-slate-950 text-xs shrink-0"
            style={{ backgroundColor: avatarColor }}
          >
            {update.author[0].toUpperCase()}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white leading-tight">
              {update.author}
            </h4>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>{formatTimeAgo(update.createdAt)}</span>
              {update.tag && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-400/90">{update.tag}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Live status badge & delete button */}
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 live-beacon" />
            Live Drop
          </span>
          {onDeleteUpdate && (
            <button
              type="button"
              onClick={() => {
                if (confirm('Delete this update from The Class?')) {
                  onDeleteUpdate(update.id);
                }
              }}
              className="text-slate-500 hover:text-rose-400 transition-colors p-1"
              title="Delete update"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <p className="text-sm text-slate-200 leading-relaxed mb-4 whitespace-pre-line">
        {update.content}
      </p>

      {/* Media if present */}
      {update.mediaUrl && (
        <div className="mb-4 rounded-xl overflow-hidden border border-slate-800 max-h-80">
          <img
            src={update.mediaUrl}
            alt="Update attachment"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Real-time Emoji Reactions Bar */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3.5 pt-2 border-t border-slate-800/60">
        {COMMON_EMOJIS.map((emoji) => {
          const count = update.reactions[emoji] || 0;
          return (
            <button
              key={emoji}
              onClick={() => {
                if (!currentNickname) onOpenSignIn();
                else onReact(update.id, emoji);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950/70 hover:bg-slate-800 border border-slate-800 text-xs transition-colors cursor-pointer"
              title={`React with ${emoji}`}
            >
              <span>{emoji}</span>
              {count > 0 && (
                <span className="font-mono text-[11px] text-slate-400 tabular-nums font-semibold">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Interaction Footer: Likes & Comments toggle */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/40">
        <button
          onClick={() => {
            if (!currentNickname) onOpenSignIn();
            else onToggleLike(update.id);
          }}
          className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
            hasLiked ? 'text-rose-400' : 'hover:text-rose-400'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-rose-400' : ''}`} />
          <span className="font-mono tabular-nums">{update.likes} Likes</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 hover:text-amber-400 transition-colors cursor-pointer"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span className="font-mono tabular-nums">
            {update.comments.length} Comments
          </span>
        </button>
      </div>

      {/* Collapsible Follower Comments Thread */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
          {update.comments.length > 0 && (
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {update.comments.map((comment) => (
                <div key={comment.id} className="flex gap-2 text-xs">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-slate-950 text-[9px] shrink-0 mt-0.5"
                    style={{ backgroundColor: comment.authorAvatarColor || getAvatarColor(comment.author) }}
                  >
                    {comment.author[0].toUpperCase()}
                  </div>
                  <div className="flex-1 bg-slate-950/80 border border-slate-800/80 rounded-lg p-2">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-semibold text-slate-200">{comment.author}</span>
                      <span className="text-[10px] text-slate-500">
                        {formatTimeAgo(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-slate-300">{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Comment Form */}
          <form onSubmit={handleCommentSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder={
                currentNickname
                  ? `Reply as @${currentNickname}...`
                  : 'Sign in with your nickname to reply...'
              }
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              disabled={!commentText.trim()}
              className="px-3 py-1.5 bg-amber-400 text-slate-950 font-semibold rounded-lg text-xs hover:bg-amber-300 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <Send className="w-3 h-3" />
            </button>
          </form>
        </div>
      )}
    </article>
  );
}
