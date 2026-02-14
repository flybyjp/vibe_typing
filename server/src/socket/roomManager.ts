import type { ServerRoom, Player, RoomSettings, GameState, PlayerGameState } from '../types/index.js';

class RoomManager {
  private rooms: Map<string, ServerRoom> = new Map();
  private playerRooms: Map<string, string> = new Map(); // socketId -> roomId

  generateRoomId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = '';
    for (let i = 0; i < 6; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // 既に存在する場合は再生成
    if (this.rooms.has(id)) {
      return this.generateRoomId();
    }
    return id;
  }

  createRoom(hostPlayer: Player, settings: RoomSettings): ServerRoom {
    const roomId = this.generateRoomId();
    const room: ServerRoom = {
      id: roomId,
      players: [hostPlayer],
      settings,
      status: 'waiting',
      currentRound: 0,
      scores: { [hostPlayer.id]: 0 },
      gameState: null
    };
    this.rooms.set(roomId, room);
    this.playerRooms.set(hostPlayer.id, roomId);
    return room;
  }

  getRoom(roomId: string): ServerRoom | undefined {
    return this.rooms.get(roomId);
  }

  getRoomByPlayerId(playerId: string): ServerRoom | undefined {
    const roomId = this.playerRooms.get(playerId);
    if (roomId) {
      return this.rooms.get(roomId);
    }
    return undefined;
  }

  joinRoom(roomId: string, player: Player): ServerRoom | null {
    const room = this.rooms.get(roomId);
    if (!room) {
      return null;
    }
    if (room.players.length >= 2) {
      return null;
    }
    if (room.status !== 'waiting') {
      return null;
    }

    room.players.push(player);
    room.scores[player.id] = 0;
    this.playerRooms.set(player.id, roomId);
    return room;
  }

  leaveRoom(playerId: string): { room: ServerRoom | null; wasHost: boolean } {
    const roomId = this.playerRooms.get(playerId);
    if (!roomId) {
      return { room: null, wasHost: false };
    }

    const room = this.rooms.get(roomId);
    if (!room) {
      this.playerRooms.delete(playerId);
      return { room: null, wasHost: false };
    }

    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      this.playerRooms.delete(playerId);
      return { room: null, wasHost: false };
    }

    const wasHost = room.players[playerIndex].isHost;
    room.players.splice(playerIndex, 1);
    delete room.scores[playerId];
    this.playerRooms.delete(playerId);

    // ルームが空になったら削除
    if (room.players.length === 0) {
      this.rooms.delete(roomId);
      return { room: null, wasHost };
    }

    // ホストが抜けた場合、残りのプレイヤーをホストに
    if (wasHost && room.players.length > 0) {
      room.players[0].isHost = true;
    }

    // ゲーム中だった場合はステータスをリセット
    if (room.status === 'playing') {
      room.status = 'waiting';
      room.gameState = null;
      room.players.forEach(p => p.isReady = false);
    }

    return { room, wasHost };
  }

  updateSettings(roomId: string, settings: RoomSettings): ServerRoom | null {
    const room = this.rooms.get(roomId);
    if (!room) {
      return null;
    }
    room.settings = settings;
    return room;
  }

  setPlayerReady(playerId: string, isReady: boolean): ServerRoom | null {
    const room = this.getRoomByPlayerId(playerId);
    if (!room) {
      return null;
    }

    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.isReady = isReady;
    }

    // 全員がレディしたらステータスを更新
    if (room.players.length === 2 && room.players.every(p => p.isReady)) {
      room.status = 'ready';
    } else {
      room.status = 'waiting';
    }

    return room;
  }

  startGame(roomId: string, questions: { text: string; reading: string }[]): ServerRoom | null {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== 'ready') {
      return null;
    }

    room.status = 'playing';
    room.currentRound = 1;

    const playerStates = new Map<string, PlayerGameState>();
    room.players.forEach(player => {
      playerStates.set(player.id, {
        playerId: player.id,
        progress: 0,
        currentPosition: 0,
        correctCount: 0,
        missCount: 0,
        startTime: Date.now()
      });
    });

    room.gameState = {
      questions,
      currentQuestionIndex: 0,
      playerStates,
      roundStartTime: Date.now()
    };

    return room;
  }

  updatePlayerProgress(playerId: string, position: number, correctCount: number, missCount: number): void {
    const room = this.getRoomByPlayerId(playerId);
    if (!room || !room.gameState) return;

    const playerState = room.gameState.playerStates.get(playerId);
    if (playerState) {
      const question = room.gameState.questions[room.gameState.currentQuestionIndex];
      const totalLength = question.reading.length;
      playerState.currentPosition = position;
      playerState.progress = Math.floor((position / totalLength) * 100);
      playerState.correctCount = correctCount;
      playerState.missCount = missCount;
    }
  }

  finishRound(playerId: string, clearTime: number, correctCount: number, missCount: number): { room: ServerRoom; winnerId: string } | null {
    const room = this.getRoomByPlayerId(playerId);
    if (!room || !room.gameState) return null;

    const playerState = room.gameState.playerStates.get(playerId);
    if (playerState) {
      playerState.finishTime = Date.now();
      playerState.correctCount = correctCount;
      playerState.missCount = missCount;
      playerState.progress = 100;
    }

    // 先にフィニッシュしたプレイヤーが勝ち
    room.scores[playerId]++;

    return { room, winnerId: playerId };
  }

  nextRound(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room || !room.gameState) return false;

    room.currentRound++;
    room.gameState.currentQuestionIndex++;
    room.gameState.roundStartTime = Date.now();

    // プレイヤー状態をリセット
    room.gameState.playerStates.forEach((state, playerId) => {
      state.progress = 0;
      state.currentPosition = 0;
      state.correctCount = 0;
      state.missCount = 0;
      state.startTime = Date.now();
      state.finishTime = undefined;
    });

    return true;
  }

  endGame(roomId: string): ServerRoom | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.status = 'finished';
    room.gameState = null;
    room.players.forEach(p => p.isReady = false);

    return room;
  }

  resetForRematch(roomId: string): ServerRoom | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.status = 'waiting';
    room.currentRound = 0;
    room.gameState = null;
    room.players.forEach(player => {
      player.isReady = false;
      room.scores[player.id] = 0;
    });

    return room;
  }
}

export const roomManager = new RoomManager();
