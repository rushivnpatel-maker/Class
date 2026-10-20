/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  resultCount?: number;
  totalCount?: number;
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search vlogs, @creators, #tags, or locations...',
  resultCount,
  totalCount,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Keyboard shortcut: '/' focuses the search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="w-full relative">
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-20 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all shadow-inner"
        />

        <div className="absolute right-3 flex items-center gap-1.5">
          {value ? (
            <button
              type="button"
              onClick={() => {
                onChange('');
                inputRef.current?.focus();
              }}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="hidden sm:inline-block text-[10px] font-mono text-slate-500 border border-slate-800 rounded px-1.5 py-0.5">
              /
            </span>
          )}
        </div>
      </div>

      {value && typeof resultCount === 'number' && (
        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
          <span>
            Showing <strong className="text-white font-mono">{resultCount}</strong> of{' '}
            <span className="font-mono">{totalCount ?? resultCount}</span> matching "{value}"
          </span>
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-amber-400 hover:underline"
          >
            Clear Search
          </button>
        </div>
      )}
    </div>
  );
}
