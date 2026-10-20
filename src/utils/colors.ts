/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const AVATAR_COLORS = [
  '#f59e0b', // Amber
  '#3b82f6', // Blue
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#8b5cf6', // Purple
  '#f97316', // Orange
  '#14b8a6', // Teal
  '#6366f1', // Indigo
  '#06b6d4', // Cyan
  '#e11d48', // Rose
];

export function getAvatarColor(name: string): string {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

export function formatTimeAgo(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
