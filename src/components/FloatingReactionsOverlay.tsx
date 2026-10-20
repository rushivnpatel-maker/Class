/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { FloatingReaction } from '../types';

interface FloatingReactionsOverlayProps {
  reactions: FloatingReaction[];
}

export function FloatingReactionsOverlay({ reactions }: FloatingReactionsOverlayProps) {
  if (reactions.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {reactions.map((reaction) => (
        <div
          key={reaction.id}
          className="absolute bottom-16 animate-float-up flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 shadow-2xl text-xs backdrop-blur-xs"
          style={{
            left: `${reaction.xOffset}%`,
          }}
        >
          <span className="text-xl">{reaction.emoji}</span>
          <span className="text-[11px] font-medium text-slate-200">
            {reaction.author}
          </span>
        </div>
      ))}
    </div>
  );
}
