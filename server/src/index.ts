import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupSocketHandlers } from './socket/handlers.js';
import type { ClientToServerEvents, ServerToClientEvents } from './types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// CORS設定（開発環境ではLAN内アクセスも許可）
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? false
    : true,
  methods: ['GET', 'POST'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Socket.io設定
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: corsOptions
});

// Socket.ioハンドラをセットアップ
setupSocketHandlers(io);

// 静的ファイル配信（本番用）
if (process.env.NODE_ENV === 'production') {
  const clientDistPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDistPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// ヘルスチェックエンドポイント
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
