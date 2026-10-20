/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Video,
  Radio,
  Sparkles,
  PlusCircle,
  Play,
  Heart,
  MessageSquare,
  Users,
  Compass,
  Flame,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { useRealtime } from './hooks/useRealtime';
import { getAvatarColor } from './utils/colors';
import { TopBar } from './components/TopBar';
import { SignInModal } from './components/SignInModal';
import { VlogCard } from './components/VlogCard';
import { VlogPlayerModal } from './components/VlogPlayerModal';
import { LiveUpdateCard } from './components/LiveUpdateCard';
import { PostVlogModal } from './components/PostVlogModal';
import { DropUpdateModal } from './components/DropUpdateModal';
import { LiveDeckView } from './components/LiveDeckView';
import { ClassRollView } from './components/ClassRollView';
import { FloatingReactionsOverlay } from './components/FloatingReactionsOverlay';
import { SearchBar } from './components/SearchBar';
import type { Vlog } from './types';

export default function App() {
  const [nickname, setNickname] = useState<string | null>(() => {
    return localStorage.getItem('the_class_nickname') || null;
  });
  const [following, setFollowing] = useState<string[]>(() => {
    const saved = localStorage.getItem('the_class_following');
    return saved ? JSON.parse(saved) : ['Elena Rostova', 'Maya Lin'];
  });

  const [isSignInOpen, setIsSignInOpen] = useState<boolean>(() => {
    return !localStorage.getItem('the_class_nickname');
  });
  const [signInModalStep, setSignInModalStep] = useState<'nickname' | 'rules'>('nickname');
  const [isPostVlogOpen, setIsPostVlogOpen] = useState(false);
  const [isDropUpdateOpen, setIsDropUpdateOpen] = useState(false);
  const [selectedVlog, setSelectedVlog] = useState<Vlog | null>(null);

  const [activeTab, setActiveTab] = useState<'vlogs' | 'live' | 'updates' | 'members'>('vlogs');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const avatarColor = getAvatarColor(nickname || 'Guest');

  // Real-time hook with WebSockets
  const {
    vlogs,
    updates,
    members,
    reactionsCount,
    floatingReactions,
    publishVlog,
    toggleLikeVlog,
    addVlogComment,
    publishLiveUpdate,
    toggleLikeUpdate,
    reactToUpdate,
    addUpdateComment,
    triggerStreamReaction,
    deleteVlog,
    clearAllVlogs,
    deleteUpdate,
    clearAllUpdates,
  } = useRealtime(nickname, avatarColor);

  // Keep selected vlog up to date when new comments/likes arrive
  useEffect(() => {
    if (selectedVlog) {
      const updated = vlogs.find((v) => v.id === selectedVlog.id);
      if (updated) setSelectedVlog(updated);
    }
  }, [vlogs, selectedVlog]);

  const handleSignIn = (newNickname: string) => {
    setNickname(newNickname);
    localStorage.setItem('the_class_nickname', newNickname);
    setIsSignInOpen(false);
  };

  const handleToggleFollow = (creator: string) => {
    setFollowing((prev) => {
      const exists = prev.includes(creator);
      const next = exists ? prev.filter((c) => c !== creator) : [...prev, creator];
      localStorage.setItem('the_class_following', JSON.stringify(next));
      return next;
    });
  };

  // Filter vlogs by category and search query
  const q = searchQuery.toLowerCase().trim();

  const filteredVlogs = vlogs.filter((vlog) => {
    if (filterCategory === 'featured' && !vlog.isFeatured) return false;
    if (filterCategory === 'following' && !following.includes(vlog.author)) return false;

    if (q) {
      const cleanQ = q.replace(/^[@#]/, '');
      const matchTitle = vlog.title.toLowerCase().includes(q);
      const matchDesc = vlog.description.toLowerCase().includes(q);
      const matchAuthor = vlog.author.toLowerCase().includes(cleanQ);
      const matchLocation = vlog.location.toLowerCase().includes(cleanQ);
      const matchTags = vlog.tags.some((t) => t.toLowerCase().includes(cleanQ));
      return matchTitle || matchDesc || matchAuthor || matchLocation || matchTags;
    }
    return true;
  });

  const filteredUpdates = updates.filter((update) => {
    if (!q) return true;
    const cleanQ = q.replace(/^[@#]/, '');
    const matchContent = update.content.toLowerCase().includes(q);
    const matchAuthor = update.author.toLowerCase().includes(cleanQ);
    const matchTag = update.tag?.toLowerCase().includes(cleanQ);
    return matchContent || matchAuthor || matchTag;
  });

  const featuredVlog = vlogs.find((v) => v.isFeatured) || vlogs[0];

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Realtime Floating Reactions Canvas */}
      <FloatingReactionsOverlay reactions={floatingReactions} />

      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <TopBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenPostVlog={() => {
          if (!nickname) setIsSignInOpen(true);
          else setIsPostVlogOpen(true);
        }}
        nickname={nickname}
        onOpenSignIn={() => setIsSignInOpen(true)}
        activeCount={members.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* TAB 1: VLOGS */}
        {activeTab === 'vlogs' && (
          <div className="space-y-8">
            {/* If no vlogs exist: Empty State with Device File Addition */}
            {vlogs.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 sm:p-14 text-center max-w-3xl mx-auto shadow-2xl">
                <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 mx-auto mb-4">
                  <Video className="w-8 h-8" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display mb-2">
                  All Logs Cleared
                </h2>
                <p className="text-sm text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
                  The feed is completely clear. You can now add video files directly from your device (MP4, WebM, MOV) or record a live camera vlog for followers to watch and engage with.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      if (!nickname) setIsSignInOpen(true);
                      else setIsPostVlogOpen(true);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm rounded-xl shadow-lg transition-all cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Add Video From Device</span>
                  </button>

                  <button
                    onClick={() => {
                      if (!nickname) setIsSignInOpen(true);
                      else setIsDropUpdateOpen(true);
                    }}
                    className="flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-xl border border-slate-700 transition-all cursor-pointer"
                  >
                    <Radio className="w-4 h-4 text-emerald-400" />
                    <span>Drop A Live Update</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Split-Screen Hero Banner */}
                {featuredVlog && (
                  <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch shadow-2xl">
                    {/* Left Column: Typographic Impact */}
                    <div className="lg:col-span-6 p-6 sm:p-10 flex flex-col justify-between">
                      <div>
                        {/* Unboxed Kicker */}
                        <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-3 tracking-wide">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>FEATURED CLASS VLOG</span>
                          <span aria-hidden="true" className="text-slate-600">·</span>
                          <span className="text-slate-400">{featuredVlog.location || 'Creative Studio'}</span>
                        </div>

                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight font-display mb-4 leading-tight">
                          {featuredVlog.title}
                        </h1>

                        <p className="text-sm text-slate-300 leading-relaxed mb-6 line-clamp-3">
                          {featuredVlog.description}
                        </p>

                        {/* Unboxed Metadata */}
                        <div className="flex items-center gap-2.5 text-xs text-slate-400 mb-6">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-slate-950 text-[10px]"
                            style={{ backgroundColor: featuredVlog.authorAvatarColor || '#f59e0b' }}
                          >
                            {featuredVlog.author[0]}
                          </div>
                          <span className="font-semibold text-slate-200">
                            {featuredVlog.author}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">{featuredVlog.duration}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">{featuredVlog.views.toLocaleString()} views</span>
                        </div>
                      </div>

                      {/* Primary CTA */}
                      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-800/80">
                        <button
                          onClick={() => setSelectedVlog(featuredVlog)}
                          className="flex items-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
                        >
                          <Play className="w-4 h-4 fill-slate-950" />
                          <span>Watch & Join Chat</span>
                        </button>

                        <button
                          onClick={() => {
                            if (!nickname) setIsSignInOpen(true);
                            else setIsPostVlogOpen(true);
                          }}
                          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-all border border-slate-700 cursor-pointer"
                        >
                          <PlusCircle className="w-4 h-4 text-amber-400" />
                          <span>Post Your Vlog</span>
                        </button>
                      </div>
                    </div>

                    {/* Right Column: Hero Visual Container */}
                    <div
                      onClick={() => setSelectedVlog(featuredVlog)}
                      className="lg:col-span-6 relative bg-slate-950 min-h-[260px] lg:min-h-full cursor-pointer group overflow-hidden"
                    >
                      <img
                        src={featuredVlog.thumbnailUrl}
                        alt={featuredVlog.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20 pointer-events-none" />

                      {/* Play badge */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-amber-400/90 text-slate-950 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                          <Play className="w-6 h-6 fill-slate-950 ml-1" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4-Column Proof & Metric Strip below Hero Split */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5">
                  <div>
                    <span className="text-xl sm:text-2xl font-bold font-display text-white tabular-nums block">
                      {vlogs.length}
                    </span>
                    <span className="text-xs text-slate-400">Curated Vlogs Dropped</span>
                  </div>
                  <div>
                    <span className="text-xl sm:text-2xl font-bold font-display text-white tabular-nums block">
                      {updates.length}
                    </span>
                    <span className="text-xs text-slate-400">Live Status Updates</span>
                  </div>
                  <div>
                    <span className="text-xl sm:text-2xl font-bold font-display text-white tabular-nums block">
                      {reactionsCount}+
                    </span>
                    <span className="text-xs text-slate-400">Real-time Reactions</span>
                  </div>
                  <div>
                    <span className="text-xl sm:text-2xl font-bold font-display text-amber-400 tabular-nums block">
                      {members.length}
                    </span>
                    <span className="text-xs text-slate-400">Followers in The Class</span>
                  </div>
                </div>

                {/* Section Header & Interactive Filter Bar with Search */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4">
                  <div className="flex-1 max-w-lg">
                    <SearchBar
                      value={searchQuery}
                      onChange={setSearchQuery}
                      placeholder="Search vlogs by title, @creator, #tag, or city..."
                      resultCount={filteredVlogs.length}
                      totalCount={vlogs.length}
                    />
                  </div>

                  {/* Segmented Filter Controls & Clear All button */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto text-xs">
                      {[
                        { id: 'all', label: 'All Vlogs' },
                        { id: 'following', label: `Following (${following.length})` },
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setFilterCategory(item.id)}
                          className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
                            filterCategory === item.id
                              ? 'bg-amber-400 text-slate-950 font-semibold shadow-xs'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        if (confirm('Clear every vlog from The Class?')) {
                          clearAllVlogs();
                        }
                      }}
                      className="text-xs text-slate-500 hover:text-rose-400 border border-slate-800 hover:border-rose-900 px-3 py-1.5 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Clear All Vlogs
                    </button>
                  </div>
                </div>

                {/* Vlog Cards Grid or Search Empty State */}
                {filteredVlogs.length === 0 ? (
                  <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-10 text-center">
                    <p className="text-sm font-semibold text-white mb-1">
                      No vlogs found matching "{searchQuery}"
                    </p>
                    <p className="text-xs text-slate-400 mb-4">
                      Try searching for a different creator, keyword, or tag.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold rounded-xl border border-slate-700 cursor-pointer"
                    >
                      Reset Search Filter
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredVlogs.map((vlog) => (
                      <VlogCard
                        key={vlog.id}
                        vlog={vlog}
                        currentNickname={nickname}
                        onSelect={setSelectedVlog}
                        onToggleLike={toggleLikeVlog}
                        onDelete={deleteVlog}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* TAB 2: LIVE DECK */}
        {activeTab === 'live' && (
          featuredVlog ? (
            <LiveDeckView
              featuredVlog={featuredVlog}
              onSelectVlog={setSelectedVlog}
              currentNickname={nickname}
              onTriggerReaction={triggerStreamReaction}
              onAddComment={addVlogComment}
              onOpenSignIn={() => setIsSignInOpen(true)}
              activeMembers={members}
              reactionsCount={reactionsCount}
            />
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center max-w-2xl mx-auto shadow-2xl">
              <Radio className="w-10 h-10 text-rose-500 mx-auto mb-3" />
              <h2 className="text-2xl font-bold text-white font-display mb-2">Live Deck Standby</h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
                No active broadcast or vlogs in The Class. Add a video file from your device or go live with your camera to light up the deck!
              </p>
              <button
                onClick={() => {
                  if (!nickname) setIsSignInOpen(true);
                  else setIsPostVlogOpen(true);
                }}
                className="px-5 py-2.5 bg-amber-400 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-300 transition-colors cursor-pointer"
              >
                + Add Video From Device
              </button>
            </div>
          )
        )}

        {/* TAB 3: LIVE UPDATES FEED */}
        {activeTab === 'updates' && (
          <div className="space-y-6">
            {/* Feed Header */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 live-beacon" />
                  <h2 className="text-xl font-bold text-white font-display">
                    The Class Ticker
                  </h2>
                </div>
                <p className="text-xs text-slate-400">
                  Real-time status drops, behind-the-scenes thoughts, and follower discussions.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!nickname) setIsSignInOpen(true);
                    else setIsDropUpdateOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <Radio className="w-3.5 h-3.5 text-slate-950" />
                  <span>Drop Live Update</span>
                </button>

                {updates.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Clear all live updates?')) {
                        clearAllUpdates();
                      }
                    }}
                    className="text-xs text-slate-500 hover:text-rose-400 border border-slate-800 hover:border-rose-900 px-3 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    Clear Updates
                  </button>
                )}
              </div>
            </div>

            {/* Updates Search Bar when updates exist */}
            {updates.length > 0 && (
              <div className="max-w-3xl mx-auto">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search updates by content, @author, or category..."
                  resultCount={filteredUpdates.length}
                  totalCount={updates.length}
                />
              </div>
            )}

            {/* Updates list or empty state */}
            {updates.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-10 text-center max-w-lg mx-auto">
                <Radio className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-60" />
                <h3 className="text-sm font-bold text-white mb-1">No Updates Dropped Yet</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Be the first to drop a status update or attach an image from your device!
                </p>
                <button
                  onClick={() => {
                    if (!nickname) setIsSignInOpen(true);
                    else setIsDropUpdateOpen(true);
                  }}
                  className="px-4 py-2 bg-amber-400 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-300 cursor-pointer"
                >
                  Drop First Live Update
                </button>
              </div>
            ) : filteredUpdates.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-10 text-center max-w-lg mx-auto">
                <p className="text-sm font-semibold text-white mb-1">
                  No updates found matching "{searchQuery}"
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-3 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold rounded-xl border border-slate-700 cursor-pointer"
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-4">
                {filteredUpdates.map((update) => (
                  <LiveUpdateCard
                    key={update.id}
                    update={update}
                    currentNickname={nickname}
                    onToggleLike={toggleLikeUpdate}
                    onReact={reactToUpdate}
                    onAddComment={addUpdateComment}
                    onOpenSignIn={() => setIsSignInOpen(true)}
                    onDeleteUpdate={deleteUpdate}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: MEMBERS (CLASS ROLL) */}
        {activeTab === 'members' && (
          <ClassRollView
            members={members}
            currentNickname={nickname}
            following={following}
            onToggleFollow={handleToggleFollow}
            onOpenSignIn={() => setIsSignInOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>The Class · Live Vlogs & Real-Time Follower Community</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setSignInModalStep('rules');
                setIsSignInOpen(true);
              }}
              className="text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
            >
              Class Rules
            </button>
            <span>·</span>
            <button
              onClick={() => {
                setSignInModalStep('nickname');
                setIsSignInOpen(true);
              }}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              {nickname ? `Signed in as @${nickname}` : 'Sign In'}
            </button>
            <span>·</span>
            <span>WebSocket Live Sync</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SignInModal
        isOpen={isSignInOpen}
        onSignIn={handleSignIn}
        initialNickname={nickname || ''}
        initialStep={signInModalStep}
        onClose={() => setIsSignInOpen(false)}
      />

      <PostVlogModal
        isOpen={isPostVlogOpen}
        onClose={() => setIsPostVlogOpen(false)}
        onSubmit={publishVlog}
        currentNickname={nickname || 'Anonymous'}
        avatarColor={avatarColor}
      />

      <DropUpdateModal
        isOpen={isDropUpdateOpen}
        onClose={() => setIsDropUpdateOpen(false)}
        onSubmit={publishLiveUpdate}
        currentNickname={nickname || 'Anonymous'}
      />

      <VlogPlayerModal
        vlog={selectedVlog}
        onClose={() => setSelectedVlog(null)}
        currentNickname={nickname}
        onToggleLike={toggleLikeVlog}
        onAddComment={addVlogComment}
        onTriggerReaction={triggerStreamReaction}
        following={following}
        onToggleFollow={handleToggleFollow}
        onOpenSignIn={() => setIsSignInOpen(true)}
        onDeleteVlog={deleteVlog}
      />
    </div>
  );
}
