import type { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents, Player, RoomSettings, RoundResult, Spectator, Room } from '../types/index.js';
import type { ServerRoom } from '../types/index.js';
import { roomManager } from './roomManager.js';
import { getQuestionSets, getRandomQuestions } from '../game/questionLoader.js';
import { calculateRoundResult, calculateGameResult, isGameFinished } from '../game/gameEngine.js';

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;

function toClientRoom(room: ServerRoom): Room {
  return {
    id: room.id,
    players: room.players,
    spectators: room.spectators,
    settings: room.settings,
    status: room.status,
    currentRound: room.currentRound,
    scores: room.scores
  };
}

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
        room: toClientRoom(room)
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
        room: toClientRoom(room)
      });

      // 他のプレイヤーに通知
      socket.to(room.id).emit('playerJoined', {
        player,
        room: toClientRoom(room)
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
      if (roomManager.isSpectator(socket.id)) return;
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
      if (roomManager.isSpectator(socket.id)) return;
      const room = roomManager.setPlayerReady(socket.id, false);
      if (!room) return;

      io.to(room.id).emit('playerUnready', { playerId: socket.id });
    });

    // タイピング進捗
    socket.on('typing', ({ position, correctCount, missCount }) => {
      if (roomManager.isSpectator(socket.id)) return;
      const room = roomManager.getRoomByPlayerId(socket.id);
      if (!room || room.status !== 'playing') return;

      roomManager.updatePlayerProgress(socket.id, position, correctCount, missCount);

      const playerState = room.gameState?.playerStates.get(socket.id);
      if (playerState) {
        // 対戦者同士の進捗通知（既存）
        socket.to(room.id).emit('opponentProgress', {
          playerId: socket.id,
          progress: playerState.progress
        });
        // 観戦者向け: プレイヤー個別の進捗配信
        io.to(room.id).emit('playerProgress', {
          playerId: socket.id,
          progress: playerState.progress
        });
      }
    });

    // 文章完了
    socket.on('finished', ({ clearTime, correctCount, missCount }) => {
      if (roomManager.isSpectator(socket.id)) return;
      const result = roomManager.finishRound(socket.id, clearTime, correctCount, missCount);
      if (!result) return;

      const { room, winnerId } = result;

      // ラウンド結果を計算
      const roundResult = calculateRoundResult(room, winnerId, room.currentRound);
      room.roundResults.push(roundResult);

      // 完了プレイヤーの進捗を100%に更新（観戦者向け）
      io.to(room.id).emit('playerProgress', {
        playerId: winnerId,
        progress: 100
      });

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
      if (roomManager.isSpectator(socket.id)) return;
      const result = roomManager.requestRematch(socket.id);
      if (!result) return;

      const { room, allAgreed } = result;

      // 相手に再戦リクエストを通知
      socket.to(room.id).emit('rematchRequested', { playerId: socket.id });

      // 両者が合意したら再戦開始
      if (allAgreed) {
        const resetRoom = roomManager.resetForRematch(room.id);
        if (resetRoom) {
          io.to(room.id).emit('rematchStart');
        }
      }
    });

    // 問題セット一覧取得
    socket.on('getQuestionSets', () => {
      const sets = getQuestionSets();
      socket.emit('questionSets', { sets });
    });

    // 観戦参加
    socket.on('watchRoom', ({ roomId, spectatorName }) => {
      const room = roomManager.getRoom(roomId.toUpperCase());
      if (!room) {
        socket.emit('watchError', { message: 'ルームが見つかりません' });
        return;
      }
      if (room.status === 'finished') {
        socket.emit('watchError', { message: 'このゲームは終了しました' });
        return;
      }

      const spectator: Spectator = {
        id: socket.id,
        name: spectatorName
      };

      const updatedRoom = roomManager.joinAsSpectator(room.id, spectator);
      if (!updatedRoom) {
        socket.emit('watchError', { message: '観戦参加に失敗しました' });
        return;
      }

      socket.join(room.id);

      const snapshot = roomManager.getSpectatorSnapshot(room.id);
      socket.emit('watchJoined', {
        room: toClientRoom(updatedRoom),
        snapshot
      });

      socket.to(room.id).emit('spectatorJoined', {
        spectator,
        spectatorCount: updatedRoom.spectators.length
      });

      console.log(`Spectator ${spectatorName} joined room: ${room.id}`);
    });

    // 観戦離脱
    socket.on('leaveSpectate', () => {
      handleSpectatorLeave(socket, io);
    });

    // 切断時
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      if (roomManager.isSpectator(socket.id)) {
        handleSpectatorLeave(socket, io);
      } else {
        handlePlayerLeave(socket, io);
      }
    });
  });
}

function handlePlayerLeave(socket: TypedSocket, io: TypedServer) {
  // ルーム削除前にルームIDを取得（観戦者通知用）
  const roomBefore = roomManager.getRoomByPlayerId(socket.id);
  const roomId = roomBefore?.id;

  const { room } = roomManager.leaveRoom(socket.id);
  if (room) {
    io.to(room.id).emit('playerLeft', {
      playerId: socket.id,
      room: toClientRoom(room)
    });
  } else if (roomId) {
    // ルームが削除された場合、残っている観戦者に通知
    io.to(roomId).emit('roomClosed');
  }
}

function handleSpectatorLeave(socket: TypedSocket, io: TypedServer) {
  const room = roomManager.leaveSpectate(socket.id);
  if (room) {
    io.to(room.id).emit('spectatorLeft', {
      spectatorId: socket.id,
      spectatorCount: room.spectators.length
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
