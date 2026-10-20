/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Vlog, LiveUpdate, ActiveMember, RealtimeMessage, VlogComment, FloatingReaction } from '../types';

export function useRealtime(currentNickname: string | null, avatarColor: string) {
  const [vlogs, setVlogs] = useState<Vlog[]>(() => {
    try {
      const saved = localStorage.getItem('the_class_vlogs_cache');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [updates, setUpdates] = useState<LiveUpdate[]>(() => {
    try {
      const saved = localStorage.getItem('the_class_updates_cache');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [members, setMembers] = useState<ActiveMember[]>([]);
  const [reactionsCount, setReactionsCount] = useState<number>(0);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem('the_class_vlogs_cache', JSON.stringify(vlogs));
    } catch {
      // ignore quota errors
    }
  }, [vlogs]);

  useEffect(() => {
    try {
      localStorage.setItem('the_class_updates_cache', JSON.stringify(updates));
    } catch {
      // ignore quota errors
    }
  }, [updates]);

  // Trigger floating reaction animation locally
  const spawnReaction = useCallback((emoji: string, author: string) => {
    const id = `float-${Date.now()}-${Math.random()}`;
    const xOffset = Math.floor(Math.random() * 80) + 10; // 10% to 90%
    setFloatingReactions((prev) => [...prev, { id, emoji, author, xOffset }]);
    setReactionsCount((prev) => prev + 1);

    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2000);
  }, []);

  // Connect WebSocket
  const connect = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        if (currentNickname) {
          ws.send(
            JSON.stringify({
              type: 'user:join',
              payload: { nickname: currentNickname, avatarColor },
            })
          );
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg: RealtimeMessage = JSON.parse(event.data);

          switch (msg.type) {
            case 'init': {
              const serverVlogs = msg.payload.vlogs || [];
              const serverUpdates = msg.payload.updates || [];

              // If server has data, use it as source of truth; if server is empty, preserve local posted items
              setVlogs((local) => {
                if (serverVlogs.length > 0) return serverVlogs;
                // If local has items and server is empty, sync local items to server
                if (local.length > 0 && ws.readyState === WebSocket.OPEN) {
                  local.forEach((v) => {
                    ws.send(JSON.stringify({ type: 'vlog:new', payload: v }));
                  });
                }
                return local;
              });

              setUpdates((local) => {
                if (serverUpdates.length > 0) return serverUpdates;
                if (local.length > 0 && ws.readyState === WebSocket.OPEN) {
                  local.forEach((u) => {
                    ws.send(JSON.stringify({ type: 'update:new', payload: u }));
                  });
                }
                return local;
              });

              setMembers(msg.payload.members || []);
              setReactionsCount(msg.payload.reactionsCount || 0);
              break;
            }

            case 'vlog:new':
              setVlogs((prev) => {
                if (prev.some((v) => v.id === msg.payload.id)) return prev;
                return [msg.payload, ...prev];
              });
              break;

            case 'vlog:like':
              setVlogs((prev) =>
                prev.map((v) =>
                  v.id === msg.payload.vlogId
                    ? { ...v, likes: msg.payload.likes, likedBy: msg.payload.likedBy }
                    : v
                )
              );
              break;

            case 'vlog:comment':
              setVlogs((prev) =>
                prev.map((v) =>
                  v.id === msg.payload.vlogId
                    ? {
                        ...v,
                        comments: v.comments.some((c) => c.id === msg.payload.comment.id)
                          ? v.comments
                          : [...v.comments, msg.payload.comment],
                      }
                    : v
                )
              );
              break;

            case 'vlog:delete':
              setVlogs((prev) => prev.filter((v) => v.id !== msg.payload.vlogId));
              break;

            case 'vlogs:clear':
              setVlogs([]);
              break;

            case 'update:new':
              setUpdates((prev) => {
                if (prev.some((u) => u.id === msg.payload.id)) return prev;
                return [msg.payload, ...prev];
              });
              break;

            case 'update:delete':
              setUpdates((prev) => prev.filter((u) => u.id !== msg.payload.updateId));
              break;

            case 'update:like':
              setUpdates((prev) =>
                prev.map((u) =>
                  u.id === msg.payload.updateId
                    ? { ...u, likes: msg.payload.likes, likedBy: msg.payload.likedBy }
                    : u
                )
              );
              break;

            case 'update:react':
              setUpdates((prev) =>
                prev.map((u) =>
                  u.id === msg.payload.updateId
                    ? { ...u, reactions: msg.payload.reactions }
                    : u
                )
              );
              break;

            case 'update:comment':
              setUpdates((prev) =>
                prev.map((u) =>
                  u.id === msg.payload.updateId
                    ? {
                        ...u,
                        comments: u.comments.some((c) => c.id === msg.payload.comment.id)
                          ? u.comments
                          : [...u.comments, msg.payload.comment],
                      }
                    : u
                )
              );
              break;

            case 'stream:reaction':
              spawnReaction(msg.payload.emoji, msg.payload.author);
              break;

            case 'members:update':
              setMembers(msg.payload);
              break;
          }
        } catch (e) {
          console.error('Error parsing WS message', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        socketRef.current = null;
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.onerror = () => {
        setIsConnected(false);
      };

      socketRef.current = ws;
    } catch (err) {
      console.error('WebSocket connection error:', err);
      setIsConnected(false);
    }
  }, [currentNickname, avatarColor, spawnReaction]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  // When nickname changes, notify server
  useEffect(() => {
    if (currentNickname && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'user:join',
          payload: { nickname: currentNickname, avatarColor },
        })
      );
    }
  }, [currentNickname, avatarColor]);

  const sendEvent = (type: string, payload: unknown) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, payload }));
    }
  };

  const publishVlog = (vlogData: Omit<Vlog, 'id' | 'createdAt' | 'views' | 'likes' | 'likedBy' | 'comments'>) => {
    const tempId = `vlog-${Date.now()}`;
    const newVlog: Vlog = {
      ...vlogData,
      id: tempId,
      createdAt: Date.now(),
      views: 1,
      likes: 0,
      likedBy: [],
      comments: [],
    };

    // Optimistic update
    setVlogs((prev) => [newVlog, ...prev]);
    sendEvent('vlog:new', vlogData);

    // Fallback REST
    fetch('/api/vlogs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vlogData),
    }).catch(() => {});
  };

  const toggleLikeVlog = (vlogId: string) => {
    if (!currentNickname) return;
    setVlogs((prev) =>
      prev.map((v) => {
        if (v.id === vlogId) {
          const hasLiked = v.likedBy.includes(currentNickname);
          const newLikedBy = hasLiked
            ? v.likedBy.filter((n) => n !== currentNickname)
            : [...v.likedBy, currentNickname];
          return {
            ...v,
            likes: hasLiked ? Math.max(0, v.likes - 1) : v.likes + 1,
            likedBy: newLikedBy,
          };
        }
        return v;
      })
    );

    sendEvent('vlog:like', { vlogId, nickname: currentNickname });
  };

  const addVlogComment = (vlogId: string, text: string) => {
    if (!currentNickname || !text.trim()) return;
    const newComment: VlogComment = {
      id: `c-${Date.now()}`,
      author: currentNickname,
      authorAvatarColor: avatarColor,
      text: text.trim(),
      createdAt: Date.now(),
      likes: 0,
    };

    // Optimistic
    setVlogs((prev) =>
      prev.map((v) =>
        v.id === vlogId ? { ...v, comments: [...v.comments, newComment] } : v
      )
    );

    sendEvent('vlog:comment', { vlogId, comment: newComment });
  };

  const publishLiveUpdate = (content: string, tag?: string) => {
    if (!currentNickname || !content.trim()) return;
    const newUpdateData = {
      author: currentNickname,
      authorAvatarColor: avatarColor,
      content: content.trim(),
      tag: tag || 'Live Note',
    };

    sendEvent('update:new', newUpdateData);

    // Fallback REST
    fetch('/api/updates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUpdateData),
    }).catch(() => {});
  };

  const toggleLikeUpdate = (updateId: string) => {
    if (!currentNickname) return;
    setUpdates((prev) =>
      prev.map((u) => {
        if (u.id === updateId) {
          const hasLiked = u.likedBy.includes(currentNickname);
          const newLikedBy = hasLiked
            ? u.likedBy.filter((n) => n !== currentNickname)
            : [...u.likedBy, currentNickname];
          return {
            ...u,
            likes: hasLiked ? Math.max(0, u.likes - 1) : u.likes + 1,
            likedBy: newLikedBy,
          };
        }
        return u;
      })
    );

    sendEvent('update:like', { updateId, nickname: currentNickname });
  };

  const reactToUpdate = (updateId: string, emoji: string) => {
    if (!currentNickname) return;
    setUpdates((prev) =>
      prev.map((u) => {
        if (u.id === updateId) {
          const currentCount = u.reactions[emoji] || 0;
          return {
            ...u,
            reactions: { ...u.reactions, [emoji]: currentCount + 1 },
          };
        }
        return u;
      })
    );

    spawnReaction(emoji, currentNickname);
    sendEvent('update:react', { updateId, emoji });
  };

  const addUpdateComment = (updateId: string, text: string) => {
    if (!currentNickname || !text.trim()) return;
    const newComment: VlogComment = {
      id: `uc-${Date.now()}`,
      author: currentNickname,
      authorAvatarColor: avatarColor,
      text: text.trim(),
      createdAt: Date.now(),
      likes: 0,
    };

    setUpdates((prev) =>
      prev.map((u) =>
        u.id === updateId ? { ...u, comments: [...u.comments, newComment] } : u
      )
    );

    sendEvent('update:comment', { updateId, comment: newComment });
  };

  const deleteVlog = (vlogId: string) => {
    setVlogs((prev) => prev.filter((v) => v.id !== vlogId));
    sendEvent('vlog:delete', { vlogId });
    fetch(`/api/vlogs/${vlogId}`, { method: 'DELETE' }).catch(() => {});
  };

  const clearAllVlogs = () => {
    setVlogs([]);
    sendEvent('vlogs:clear', {});
    fetch('/api/vlogs', { method: 'DELETE' }).catch(() => {});
  };

  const deleteUpdate = (updateId: string) => {
    setUpdates((prev) => prev.filter((u) => u.id !== updateId));
    sendEvent('update:delete', { updateId });
    fetch(`/api/updates/${updateId}`, { method: 'DELETE' }).catch(() => {});
  };

  const clearAllUpdates = () => {
    setUpdates([]);
    sendEvent('updates:clear', {});
    fetch('/api/updates', { method: 'DELETE' }).catch(() => {});
  };

  const triggerStreamReaction = (emoji: string) => {
    if (!currentNickname) return;
    spawnReaction(emoji, currentNickname);
    sendEvent('stream:reaction', { emoji, author: currentNickname });
  };

  return {
    vlogs,
    updates,
    members,
    reactionsCount,
    floatingReactions,
    isConnected,
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
  };
}
