/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Play, Heart, MessageSquare, MapPin, Trash2 } from 'lucide-react';
import type { Vlog } from '../types';
import { formatTimeAgo, getAvatarColor } from '../utils/colors';

interface VlogCardProps {
  vlog: Vlog;
  currentNickname: string | null;
  onSelect: (vlog: Vlog) => void;
  onToggleLike: (vlogId: string) => void;
  onDelete?: (vlogId: string) => void;
}

export function VlogCard({ vlog, currentNickname, onSelect, onToggleLike, onDelete }: VlogCardProps) {
  const [imageError, setImageError] = useState(false);
  const hasLiked = currentNickname ? vlog.likedBy.includes(currentNickname) : false;
  const avatarColor = vlog.authorAvatarColor || getAvatarColor(vlog.author);
  const canDelete = Boolean(onDelete && (currentNickname === vlog.author || currentNickname));

  return (
    <article className="group bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden hover:border-slate-700/80 transition-all duration-200 flex flex-col">
      {/* Media thumbnail area */}
      <div
        onClick={() => onSelect(vlog)}
        className="relative aspect-video w-full bg-slate-950 overflow-hidden cursor-pointer"
      >
        {!imageError && vlog.thumbnailUrl ? (
          <img
            src={vlog.thumbnailUrl}
            alt={vlog.title}
            onError={() => setImageError(true)}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 text-slate-500 p-4 text-center">
            <Play className="w-8 h-8 mb-2 text-amber-400/80" />
            <span className="text-xs">{vlog.title}</span>
          </div>
        )}

        {/* Scrim gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20 pointer-events-none" />

        {/* Play button hover indicator */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
            <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
          </div>
        </div>

        {/* Duration badge */}
        <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 bg-black/75 backdrop-blur-xs text-[11px] font-mono tabular-nums text-slate-200 rounded">
          {vlog.duration}
        </div>

        {/* Location if present */}
        {vlog.location && (
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 bg-black/60 backdrop-blur-xs text-[11px] text-slate-300 rounded">
            <MapPin className="w-3 h-3 text-amber-400" />
            <span>{vlog.location}</span>
          </div>
        )}
      </div>

      {/* Content info */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Author metadata — Zero-pill discipline: unboxed text with · separator */}
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-950 shrink-0"
              style={{ backgroundColor: avatarColor }}
            >
              {vlog.author[0].toUpperCase()}
            </div>
            <span className="font-medium text-slate-200">{vlog.author}</span>
            <span aria-hidden="true">·</span>
            <span>{formatTimeAgo(vlog.createdAt)}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{vlog.views.toLocaleString()} views</span>
          </div>

          {/* Title */}
          <h3
            onClick={() => onSelect(vlog)}
            className="text-base font-semibold text-white group-hover:text-amber-400 transition-colors line-clamp-2 cursor-pointer leading-snug mb-1.5"
          >
            {vlog.title}
          </h3>

          {/* Short description */}
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
            {vlog.description}
          </p>
        </div>

        {/* Footer actions & tags */}
        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
          {/* Tags */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500 overflow-hidden">
            {vlog.tags.slice(0, 2).map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>

          {/* Interaction counts: likes & comments */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleLike(vlog.id);
              }}
              className={`flex items-center gap-1.5 text-xs transition-colors cursor-pointer ${
                hasLiked ? 'text-rose-400' : 'text-slate-400 hover:text-rose-400'
              }`}
              title="Like vlog"
            >
              <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-rose-400' : ''}`} />
              <span className="font-mono tabular-nums">{vlog.likes}</span>
            </button>

            <button
              type="button"
              onClick={() => onSelect(vlog)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
              title="View comments"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="font-mono tabular-nums">{vlog.comments.length}</span>
            </button>

            {canDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Delete this vlog from The Class?')) {
                    onDelete?.(vlog.id);
                  }
                }}
                className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                title="Delete vlog"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
