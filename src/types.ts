/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserSession {
  nickname: string;
  avatarColor: string;
  joinedAt: number;
  following: string[];
}

export interface VlogComment {
  id: string;
  author: string;
  authorAvatarColor: string;
  text: string;
  createdAt: number;
  likes: number;
}

export interface Vlog {
  id: string;
  author: string;
  authorAvatarColor: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: string;
  createdAt: number;
  views: number;
  likes: number;
  likedBy: string[];
  tags: string[];
  location: string;
  comments: VlogComment[];
  isFeatured?: boolean;
}

export interface LiveUpdate {
  id: string;
  author: string;
  authorAvatarColor: string;
  content: string;
  createdAt: number;
  tag?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  likes: number;
  likedBy: string[];
  reactions: Record<string, number>;
  comments: VlogComment[];
}

export interface ActiveMember {
  nickname: string;
  avatarColor: string;
  status: 'watching' | 'broadcasting' | 'active';
  joinedAt: number;
}

export interface FloatingReaction {
  id: string;
  emoji: string;
  author: string;
  xOffset: number;
}

export type RealtimeMessage =
  | { type: 'init'; payload: { vlogs: Vlog[]; updates: LiveUpdate[]; members: ActiveMember[]; reactionsCount: number } }
  | { type: 'user:join'; payload: { nickname: string; avatarColor: string } }
  | { type: 'user:leave'; payload: { nickname: string } }
  | { type: 'vlog:new'; payload: Vlog }
  | { type: 'vlog:like'; payload: { vlogId: string; nickname: string; likes: number; likedBy: string[] } }
  | { type: 'vlog:comment'; payload: { vlogId: string; comment: VlogComment } }
  | { type: 'vlog:delete'; payload: { vlogId: string } }
  | { type: 'vlogs:clear'; payload?: Record<string, never> }
  | { type: 'update:new'; payload: LiveUpdate }
  | { type: 'update:like'; payload: { updateId: string; nickname: string; likes: number; likedBy: string[] } }
  | { type: 'update:react'; payload: { updateId: string; emoji: string; reactions: Record<string, number> } }
  | { type: 'update:comment'; payload: { updateId: string; comment: VlogComment } }
  | { type: 'update:delete'; payload: { updateId: string } }
  | { type: 'updates:clear'; payload?: Record<string, never> }
  | { type: 'stream:reaction'; payload: { emoji: string; author: string } }
  | { type: 'members:update'; payload: ActiveMember[] };
