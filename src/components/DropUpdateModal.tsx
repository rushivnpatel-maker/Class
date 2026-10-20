/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { X, Radio, Send, Image as ImageIcon, Trash2, CheckCircle2 } from 'lucide-react';

interface DropUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (content: string, tag?: string, mediaUrl?: string) => void;
  currentNickname: string;
}

const UPDATE_TAGS = [
  'Live From Set',
  'Creator Question',
  'Gear Check',
  'Behind The Scenes',
  'Status Drop',
  'Announcement',
];

export function DropUpdateModal({
  isOpen,
  onClose,
  onSubmit,
  currentNickname,
}: DropUpdateModalProps) {
  const [content, setContent] = useState('');
  const [selectedTag, setSelectedTag] = useState(UPDATE_TAGS[0]);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaFileName, setMediaFileName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleDeviceMedia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setMediaUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveMedia = () => {
    setMediaUrl(null);
    setMediaFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSubmit(content, selectedTag, mediaUrl || undefined);
    setContent('');
    handleRemoveMedia();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 relative">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base font-semibold text-white font-display">
              Drop A Live Update
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">
              Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {UPDATE_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(tag)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                    selectedTag === tag
                      ? 'border-amber-400 bg-amber-400/10 text-amber-300 font-medium'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">
              Update Message
            </label>
            <textarea
              rows={3}
              required
              placeholder={`What's happening right now, @${currentNickname}?`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Add file from device (photo or screenshot) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-slate-400 font-medium">
                Add Image / Attachment From Device
              </label>
              {!mediaUrl && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  Select Device File
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleDeviceMedia}
              className="hidden"
            />

            {mediaUrl && (
              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={mediaUrl}
                    alt="Uploaded preview"
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-white truncate block">
                      {mediaFileName || 'Image attached'}
                    </span>
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Ready to drop
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveMedia}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors cursor-pointer"
                  title="Remove image"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-500">
              Broadcasts instantly to all followers in The Class
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!content.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-semibold rounded-xl shadow transition-colors disabled:opacity-40 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Drop Update</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
