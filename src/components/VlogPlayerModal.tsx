/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Heart,
  MessageSquare,
  Share2,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Maximize2,
  Send,
  UserCheck,
  UserPlus,
  Sparkles,
  MapPin,
  Trash2,
} from 'lucide-react';
import type { Vlog } from '../types';
import { formatTimeAgo, getAvatarColor } from '../utils/colors';

interface VlogPlayerModalProps {
  vlog: Vlog | null;
  onClose: () => void;
  currentNickname: string | null;
  onToggleLike: (vlogId: string) => void;
  onAddComment: (vlogId: string, text: string) => void;
  onTriggerReaction: (emoji: string) => void;
  following: string[];
  onToggleFollow: (author: string) => void;
  onOpenSignIn: () => void;
  onDeleteVlog?: (vlogId: string) => void;
}

export function VlogPlayerModal({
  vlog,
  onClose,
  currentNickname,
  onToggleLike,
  onAddComment,
  onTriggerReaction,
  following,
  onToggleFollow,
  onOpenSignIn,
  onDeleteVlog,
}: VlogPlayerModalProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [commentInput, setCommentInput] = useState('');
  const [playbackRate, setPlaybackRate] = useState(1);
  const [copiedLink, setCopiedLink] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const commentsEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Auto scroll comments on new comments
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [vlog?.comments.length]);

  if (!vlog) return null;

  const hasLiked = currentNickname ? vlog.likedBy.includes(currentNickname) : false;
  const isFollowing = following.includes(vlog.author);
  const avatarColor = vlog.authorAvatarColor || getAvatarColor(vlog.author);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleSpeedToggle = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const nextSpeed = speeds[(speeds.indexOf(playbackRate) + 1) % speeds.length];
    setPlaybackRate(nextSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed;
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentNickname) {
      onOpenSignIn();
      return;
    }
    if (!commentInput.trim()) return;
    onAddComment(vlog.id, commentInput);
    setCommentInput('');
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const formatSeconds = (sec: number) => {
    if (isNaN(sec)) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/90 backdrop-blur-md">
      <div className="relative w-full max-w-6xl h-[92vh] max-h-[850px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col lg:flex-row overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-30 p-2 rounded-full bg-black/60 hover:bg-black/90 text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="Close (ESC)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Column: Video player & creator info */}
        <div className="flex-1 flex flex-col bg-slate-950 overflow-y-auto">
          {/* Video Container */}
          <div className="relative aspect-video w-full bg-black flex items-center justify-center">
            <video
              ref={videoRef}
              src={vlog.videoUrl}
              poster={vlog.thumbnailUrl}
              autoPlay
              playsInline
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
              className="w-full h-full object-contain cursor-pointer"
              onClick={togglePlay}
            />

            {/* Custom Video Controls Bar */}
            <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col gap-2">
              {/* Scrubber */}
              <input
                type="range"
                min="0"
                max={duration || 100}
                step="0.1"
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 bg-slate-700 accent-amber-400 rounded-lg cursor-pointer"
              />

              <div className="flex items-center justify-between text-xs text-slate-200">
                <div className="flex items-center gap-3">
                  <button onClick={togglePlay} className="p-1 hover:text-amber-400 transition-colors">
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button onClick={toggleMute} className="p-1 hover:text-amber-400 transition-colors">
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <span className="font-mono tabular-nums text-[11px] text-slate-400">
                    {formatSeconds(currentTime)} / {formatSeconds(duration || 0)}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSpeedToggle}
                    className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20"
                  >
                    {playbackRate}x
                  </button>
                  <button onClick={handleFullscreen} className="p-1 hover:text-amber-400 transition-colors">
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Vlog Details & Social Action Bar */}
          <div className="p-5 flex-1 flex flex-col justify-between">
            <div>
              {/* Creator row */}
              <div className="flex items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-slate-950 text-sm shrink-0"
                    style={{ backgroundColor: avatarColor }}
                  >
                    {vlog.author[0].toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                      {vlog.author}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>{formatTimeAgo(vlog.createdAt)}</span>
                      {vlog.location && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="flex items-center gap-0.5">
                            <MapPin className="w-3 h-3 text-amber-400" />
                            {vlog.location}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Follow Button */}
                {currentNickname !== vlog.author && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!currentNickname) onOpenSignIn();
                      else onToggleFollow(vlog.author);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      isFollowing
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-white text-slate-950 hover:bg-slate-100'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Vlog Title & Description */}
              <h2 className="text-xl font-bold text-white mb-2 font-display leading-tight">
                {vlog.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 whitespace-pre-line leading-relaxed mb-4">
                {vlog.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {vlog.tags.map((t) => (
                  <span key={t} className="text-xs text-amber-400/90 font-mono">
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            {/* Real-time Interaction Bar: Like, Live Reaction Dock & Share */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {/* Like Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (!currentNickname) onOpenSignIn();
                    else onToggleLike(vlog.id);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    hasLiked
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${hasLiked ? 'fill-rose-400 text-rose-400' : ''}`} />
                  <span className="font-mono tabular-nums">{vlog.likes}</span>
                </button>

                {/* Live stream emoji burst dock */}
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
                  {['🔥', '❤️', '👏', '⚡', '✨'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        if (!currentNickname) onOpenSignIn();
                        else onTriggerReaction(emoji);
                      }}
                      className="w-7 h-7 flex items-center justify-center hover:scale-125 active:scale-95 transition-transform text-sm cursor-pointer"
                      title={`Send ${emoji} to everyone watching`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Share & Delete */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 transition-colors cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{copiedLink ? 'Copied link!' : 'Share'}</span>
                </button>

                {onDeleteVlog && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this vlog from The Class?')) {
                        onDeleteVlog(vlog.id);
                        onClose();
                      }
                    }}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-800/60 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Delete vlog"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Real-time Live Comments & Follower Engagement */}
        <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-900 flex flex-col h-[340px] lg:h-full">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span>Live Comments</span>
              <span className="text-xs font-mono text-slate-400 tabular-nums">
                ({vlog.comments.length})
              </span>
            </div>
            <span className="text-[11px] text-slate-400">Synced live</span>
          </div>

          {/* Comments Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
            {vlog.comments.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <MessageSquare className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-xs">No comments yet. Be the first follower to leave feedback!</p>
              </div>
            ) : (
              vlog.comments.map((comment) => (
                <div key={comment.id} className="text-xs flex gap-2.5">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-950 shrink-0 mt-0.5"
                    style={{ backgroundColor: comment.authorAvatarColor || getAvatarColor(comment.author) }}
                  >
                    {comment.author[0].toUpperCase()}
                  </div>
                  <div className="flex-1 bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-semibold text-slate-200">{comment.author}</span>
                      <span className="text-[10px] text-slate-500">
                        {formatTimeAgo(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-slate-300 text-xs leading-relaxed break-words">
                      {comment.text}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={commentsEndRef} />
          </div>

          {/* Comment input box */}
          <form onSubmit={handleCommentSubmit} className="p-3 border-t border-slate-800 bg-slate-950">
            {currentNickname ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Comment as @${currentNickname}...`}
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  maxLength={300}
                />
                <button
                  type="submit"
                  disabled={!commentInput.trim()}
                  className="p-2 bg-amber-400 text-slate-950 rounded-lg hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Send comment"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenSignIn}
                className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-xs text-amber-400 font-medium rounded-lg border border-slate-800 transition-colors text-center cursor-pointer"
              >
                Sign in with your nickname to comment
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
