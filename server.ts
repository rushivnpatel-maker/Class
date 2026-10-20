/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import type { Vlog, LiveUpdate, ActiveMember, RealtimeMessage, VlogComment } from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json({ limit: '100mb' }));

// Disk-backed persistent storage so posted content is NEVER deleted or lost on restart
const STORAGE_DIR = path.join(__dirname, 'data');
const STORAGE_FILE = path.join(STORAGE_DIR, 'the_class_data.json');

let vlogs: Vlog[] = [];
let updates: LiveUpdate[] = [];
const connectedClients = new Map<WebSocket, { nickname: string; avatarColor: string }>();
let globalReactionsCount = 0;

function saveToDisk() {
  try {
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
    const data = {
      vlogs,
      updates,
      globalReactionsCount,
      savedAt: Date.now(),
    };
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save data to disk:', err);
  }
}

function loadFromDisk() {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const raw = fs.readFileSync(STORAGE_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data.vlogs)) vlogs = data.vlogs;
      if (Array.isArray(data.updates)) updates = data.updates;
      if (typeof data.globalReactionsCount === 'number') globalReactionsCount = data.globalReactionsCount;
    }
  } catch (err) {
    console.error('Failed to load data from disk:', err);
  }
}

// Initial load
loadFromDisk();

function getActiveMembers(): ActiveMember[] {
  const members: ActiveMember[] = [];
  const seen = new Set<string>();

  for (const clientData of connectedClients.values()) {
    if (clientData.nickname && !seen.has(clientData.nickname)) {
      seen.add(clientData.nickname);
      members.push({
        nickname: clientData.nickname,
        avatarColor: clientData.avatarColor || '#38bdf8',
        status: 'active',
        joinedAt: Date.now(),
      });
    }
  }

  return members;
}

function broadcast(message: RealtimeMessage, excludeSocket?: WebSocket) {
  const data = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client !== excludeSocket && client.readyState === WebSocket.OPEN) {
      try {
        client.send(data);
      } catch (err) {
        console.error('WebSocket send error:', err);
      }
    }
  });
}

// WebSocket Connection Management
wss.on('connection', (ws: WebSocket) => {
  // Send initial state upon connection
  const initMsg: RealtimeMessage = {
    type: 'init',
    payload: {
      vlogs,
      updates,
      members: getActiveMembers(),
      reactionsCount: globalReactionsCount,
    },
  };
  ws.send(JSON.stringify(initMsg));

  ws.on('message', (raw: string) => {
    try {
      const msg = JSON.parse(raw.toString());

      if (msg.type === 'user:join') {
        const { nickname, avatarColor } = msg.payload;
        connectedClients.set(ws, { nickname, avatarColor });
        broadcast({
          type: 'members:update',
          payload: getActiveMembers(),
        });
      } else if (msg.type === 'vlog:new') {
        const newVlog: Vlog = {
          ...msg.payload,
          id: `vlog-${Date.now()}`,
          createdAt: Date.now(),
          views: 1,
          likes: 0,
          likedBy: [],
          comments: [],
        };
        vlogs.unshift(newVlog);
        saveToDisk();
        broadcast({ type: 'vlog:new', payload: newVlog });
      } else if (msg.type === 'vlog:like') {
        const { vlogId, nickname } = msg.payload;
        const target = vlogs.find((v) => v.id === vlogId);
        if (target) {
          const index = target.likedBy.indexOf(nickname);
          if (index === -1) {
            target.likedBy.push(nickname);
            target.likes += 1;
          } else {
            target.likedBy.splice(index, 1);
            target.likes = Math.max(0, target.likes - 1);
          }
          saveToDisk();
          broadcast({
            type: 'vlog:like',
            payload: { vlogId, nickname, likes: target.likes, likedBy: target.likedBy },
          });
        }
      } else if (msg.type === 'vlog:comment') {
        const { vlogId, comment } = msg.payload;
        const target = vlogs.find((v) => v.id === vlogId);
        if (target) {
          const newComment: VlogComment = {
            id: `c-${Date.now()}`,
            author: comment.author,
            authorAvatarColor: comment.authorAvatarColor || '#38bdf8',
            text: comment.text,
            createdAt: Date.now(),
            likes: 0,
          };
          target.comments.push(newComment);
          saveToDisk();
          broadcast({
            type: 'vlog:comment',
            payload: { vlogId, comment: newComment },
          });
        }
      } else if (msg.type === 'update:new') {
        const newUpdate: LiveUpdate = {
          ...msg.payload,
          id: `up-${Date.now()}`,
          createdAt: Date.now(),
          likes: 0,
          likedBy: [],
          reactions: {},
          comments: [],
        };
        updates.unshift(newUpdate);
        saveToDisk();
        broadcast({ type: 'update:new', payload: newUpdate });
      } else if (msg.type === 'update:like') {
        const { updateId, nickname } = msg.payload;
        const target = updates.find((u) => u.id === updateId);
        if (target) {
          const index = target.likedBy.indexOf(nickname);
          if (index === -1) {
            target.likedBy.push(nickname);
            target.likes += 1;
          } else {
            target.likedBy.splice(index, 1);
            target.likes = Math.max(0, target.likes - 1);
          }
          saveToDisk();
          broadcast({
            type: 'update:like',
            payload: { updateId, nickname, likes: target.likes, likedBy: target.likedBy },
          });
        }
      } else if (msg.type === 'update:react') {
        const { updateId, emoji } = msg.payload;
        const target = updates.find((u) => u.id === updateId);
        if (target) {
          target.reactions[emoji] = (target.reactions[emoji] || 0) + 1;
          globalReactionsCount += 1;
          saveToDisk();
          broadcast({
            type: 'update:react',
            payload: { updateId, emoji, reactions: target.reactions },
          });
        }
      } else if (msg.type === 'update:comment') {
        const { updateId, comment } = msg.payload;
        const target = updates.find((u) => u.id === updateId);
        if (target) {
          const newComment: VlogComment = {
            id: `uc-${Date.now()}`,
            author: comment.author,
            authorAvatarColor: comment.authorAvatarColor || '#38bdf8',
            text: comment.text,
            createdAt: Date.now(),
            likes: 0,
          };
          target.comments.push(newComment);
          saveToDisk();
          broadcast({
            type: 'update:comment',
            payload: { updateId, comment: newComment },
          });
        }
      } else if (msg.type === 'vlog:delete') {
        const { vlogId } = msg.payload;
        vlogs = vlogs.filter((v) => v.id !== vlogId);
        saveToDisk();
        broadcast({ type: 'vlog:delete', payload: { vlogId } });
      } else if (msg.type === 'vlogs:clear') {
        vlogs = [];
        saveToDisk();
        broadcast({ type: 'vlogs:clear' });
      } else if (msg.type === 'update:delete') {
        const { updateId } = msg.payload;
        updates = updates.filter((u) => u.id !== updateId);
        saveToDisk();
        broadcast({ type: 'update:delete', payload: { updateId } });
      } else if (msg.type === 'updates:clear') {
        updates = [];
        saveToDisk();
        broadcast({ type: 'updates:clear' });
      } else if (msg.type === 'stream:reaction') {
        globalReactionsCount += 1;
        saveToDisk();
        broadcast({
          type: 'stream:reaction',
          payload: msg.payload,
        });
      }
    } catch (err) {
      console.error('Error handling WebSocket message:', err);
    }
  });

  ws.on('close', () => {
    connectedClients.delete(ws);
    broadcast({
      type: 'members:update',
      payload: getActiveMembers(),
    });
  });
});

// REST Fallback API routes
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, name: 'The Class API', activeMembers: connectedClients.size, vlogsCount: vlogs.length });
});

app.get('/api/vlogs', (_req, res) => {
  res.json(vlogs);
});

app.post('/api/vlogs', (req, res) => {
  const newVlog: Vlog = {
    ...req.body,
    id: `vlog-${Date.now()}`,
    createdAt: Date.now(),
    views: 1,
    likes: 0,
    likedBy: [],
    comments: [],
  };
  vlogs.unshift(newVlog);
  saveToDisk();
  broadcast({ type: 'vlog:new', payload: newVlog });
  res.status(201).json(newVlog);
});

app.delete('/api/vlogs/:id', (req, res) => {
  const vlogId = req.params.id;
  vlogs = vlogs.filter((v) => v.id !== vlogId);
  saveToDisk();
  broadcast({ type: 'vlog:delete', payload: { vlogId } });
  res.json({ ok: true });
});

app.delete('/api/vlogs', (_req, res) => {
  vlogs = [];
  saveToDisk();
  broadcast({ type: 'vlogs:clear' });
  res.json({ ok: true });
});

app.get('/api/updates', (_req, res) => {
  res.json(updates);
});

app.post('/api/updates', (req, res) => {
  const newUpdate: LiveUpdate = {
    ...req.body,
    id: `up-${Date.now()}`,
    createdAt: Date.now(),
    likes: 0,
    likedBy: [],
    reactions: {},
    comments: [],
  };
  updates.unshift(newUpdate);
  saveToDisk();
  broadcast({ type: 'update:new', payload: newUpdate });
  res.status(201).json(newUpdate);
});

app.delete('/api/updates/:id', (req, res) => {
  const updateId = req.params.id;
  updates = updates.filter((u) => u.id !== updateId);
  saveToDisk();
  broadcast({ type: 'update:delete', payload: { updateId } });
  res.json({ ok: true });
});

app.delete('/api/updates', (_req, res) => {
  updates = [];
  saveToDisk();
  broadcast({ type: 'updates:clear' });
  res.json({ ok: true });
});

app.get('/api/members', (_req, res) => {
  res.json(getActiveMembers());
});

// Setup Vite middleware in dev or static files in production
const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[The Class] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
