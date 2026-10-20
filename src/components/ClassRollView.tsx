/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Users, UserPlus, UserCheck, Radio, Eye } from 'lucide-react';
import type { ActiveMember } from '../types';
import { getAvatarColor } from '../utils/colors';

interface ClassRollViewProps {
  members: ActiveMember[];
  currentNickname: string | null;
  following: string[];
  onToggleFollow: (nickname: string) => void;
  onOpenSignIn: () => void;
}

export function ClassRollView({
  members,
  currentNickname,
  following,
  onToggleFollow,
  onOpenSignIn,
}: ClassRollViewProps) {
  return (
    <div className="space-y-6">
      {/* Intro strip */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white font-display">
              The Class Roll
            </h2>
            <p className="text-xs text-slate-400">
              Active creators, filmmakers, and followers currently connected in real time.
            </p>
          </div>
        </div>
      </div>

      {/* 3-column member cards according to design guidelines */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((member) => {
          const isMe = currentNickname === member.nickname;
          const isFollowing = following.includes(member.nickname);
          const avatarColor = member.avatarColor || getAvatarColor(member.nickname);

          return (
            <div
              key={member.nickname}
              className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-slate-950 font-bold text-sm shrink-0"
                  style={{ backgroundColor: avatarColor }}
                >
                  {member.nickname[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-semibold text-white truncate">
                      {member.nickname}
                    </h4>
                    {isMe && (
                      <span className="text-[10px] text-amber-400 font-mono">
                        (You)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    {member.status === 'broadcasting' && (
                      <span className="text-rose-400 flex items-center gap-1">
                        <Radio className="w-3 h-3" />
                        Broadcasting
                      </span>
                    )}
                    {member.status === 'watching' && (
                      <span className="text-slate-400 flex items-center gap-1">
                        <Eye className="w-3 h-3 text-amber-400" />
                        Watching
                      </span>
                    )}
                    {member.status === 'active' && (
                      <span className="text-emerald-400">Online</span>
                    )}
                  </div>
                </div>
              </div>

              {!isMe && (
                <button
                  type="button"
                  onClick={() => {
                    if (!currentNickname) onOpenSignIn();
                    else onToggleFollow(member.nickname);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                    isFollowing
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-white text-slate-950 hover:bg-slate-200'
                  }`}
                >
                  {isFollowing ? (
                    <span className="flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-emerald-400" />
                      Following
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <UserPlus className="w-3 h-3" />
                      Follow
                    </span>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
