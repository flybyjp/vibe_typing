import type { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents, Player, RoomSettings, RoundResult } from '../types/index.js';
import { roomManager } from './roomManager.js';
import { getQuestionSets, getRandomQuestions } from '../game/questionLoader.js';
import { calculateRoundResult, calculateGameResult, isGameFinished } from '../game/gameEngine.js';

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;

export function setupSocketHandlers(io: TypedServer) {
  io.on('connection', (socket: TypedSocket) => {
    console.log(`Client connected: ${socket.id}`);

    // ルーム作成
    socket.on('createRoom', ({ playerName, settings }) => {
      const player: Player = {
        id: socket.id,
        name: playerName,
        isHost: true,
        isReady: false
      };

      const room = roomManager.createRoom(player, settings);
      socket.join(room.id);

      socket.emit('roomCreated', {
        roomId: room.id,
        room: {
          id: room.id,
          players: room.players,
          settings: room.settings,
          status: room.status,
          currentRound: room.currentRound,
          scores: room.scores
        }
      });

      console.log(`Room created: ${room.id} by ${playerName}`);
    });

    // ルーム参加
    socket.on('joinRoom', ({ roomId, playerName }) => {
      const player: Player = {
        id: socket.id,
        name: playerName,
        isHost: false,
        isReady: false
      };

      const room = roomManager.joinRoom(roomId.toUpperCase(), player);

      if (!room) {
        socket.emit('roomError', { message: 'ルームが見つからないか、満員です' });
        return;
      }

      socket.join(room.id);

      // 参加したプレイヤーにルーム情報を送信
      socket.emit('roomJoined', {
        room: {
          id: room.id,
          players: room.players,
          settings: room.settings,
          status: room.status,
          currentRound: room.currentRound,
          scores: room.scores
        }
      });

      // 他のプレイヤーに通知
      socket.to(room.id).emit('playerJoined', {
        player,
        room: {
          id: room.id,
          players: room.players,
          settings: room.settings,
          status: room.status,
          currentRound: room.currentRound,
          scores: room.scores
        }
      });

      console.log(`Player ${playerName} joined room: ${room.id}`);
    });

    // ルーム退出
    socket.on('leaveRoom', () => {
      handlePlayerLeave(socket, io);
    });

    // 設定更新
    socket.on('updateSettings', (settings) => {
      const room = roomManager.getRoomByPlayerId(socket.id);
      if (!room) return;

      const player = room.players.find(p => p.id === socket.id);
      if (!player?.isHost) return;

      const updatedRoom = roomManager.updateSettings(room.id, settings);
      if (updatedRoom) {
        io.to(room.id).emit('settingsUpdated', { settings });
      }
    });

    // 準備完了
    socket.on('ready', () => {
      const room = roomManager.setPlayerReady(socket.id, true);
      if (!room) return;

      io.to(room.id).emit('playerReady', { playerId: socket.id });

      // 全員準備完了でゲーム開始
      if (room.status === 'ready' && room.players.length === 2) {
        startGame(room.id, io);
      }
    });

    // 準備解除
    socket.on('unready', () => {
      const room = roomManager.setPlayerReady(socket.id, false);
      if (!room) return;

      io.to(room.id).emit('playerUnready', { playerId: socket.id });
    });

    // タイピング進捗
    socket.on('typing', ({ position, correctCount, missCount }) => {
      const room = roomManager.getRoomByPlayerId(socket.id);
      if (!room || room.status !== 'playing') return;

      roomManager.updatePlayerProgress(socket.id, position, correctCount, missCount);

      const playerState = room.gameState?.playerStates.get(socket.id);
      if (playerState) {
        socket.to(room.id).emit('opponentProgress', {
          playerId: socket.id,
          progress: playerState.progress
        });
      }
    });

    // 文章完了
    socket.on('finished', ({ clearTime, correctCount, missCount }) => {
      const result = roomManager.finishRound(socket.id, clearTime, correctCount, missCount);
      if (!result) return;

      const { room, winnerId } = result;

      // ラウンド結果を計算
      const roundResult = calculateRoundResult(room, winnerId, room.currentRound);

      io.to(room.id).emit('roundEnd', {
        result: roundResult,
        scores: room.scores
      });

      // ゲーム終了判定
      if (isGameFinished(room)) {
        const gameResult = calculateGameResult(room);
        roomManager.endGame(room.id);

        io.to(room.id).emit('gameEnd', { result: gameResult });
      } else {
        // 次のラウンドを開始
        setTimeout(() => {
          if (roomManager.nextRound(room.id)) {
            const question = room.gameState?.questions[room.gameState.currentQuestionIndex];
            if (question) {
              io.to(room.id).emit('gameStart', {
                question,
                round: room.currentRound,
                totalRounds: room.settings.rounds
              });
            }
          }
        }, 3000); // 3秒後に次のラウンド
      }
    });

    // 再戦リクエスト
    socket.on('requestRematch', () => {
      const room = roomManager.getRoomByPlayerId(socket.id);
      if (!room) return;

      socket.to(room.id).emit('rematchRequested', { playerId: socket.id });
    });

    // 問題セット一覧取得
    socket.on('getQuestionSets', () => {
      const sets = getQuestionSets();
      socket.emit('questionSets', { sets });
    });

    // 切断時
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      handlePlayerLeave(socket, io);
    });
  });
}

function handlePlayerLeave(socket: TypedSocket, io: TypedServer) {
  const { room } = roomManager.leaveRoom(socket.id);
  if (room) {
    io.to(room.id).emit('playerLeft', {
      playerId: socket.id,
      room: {
        id: room.id,
        players: room.players,
        settings: room.settings,
        status: room.status,
        currentRound: room.currentRound,
        scores: room.scores
      }
    });
  }
}

function startGame(roomId: string, io: TypedServer) {
  const room = roomManager.getRoom(roomId);
  if (!room) return;

  const questions = getRandomQuestions(room.settings.questionSet, room.settings.rounds);
  const startedRoom = roomManager.startGame(roomId, questions);

  if (startedRoom && startedRoom.gameState) {
    const question = startedRoom.gameState.questions[0];
    io.to(roomId).emit('gameStart', {
      question,
      round: 1,
      totalRounds: room.settings.rounds
    });
  }
}
