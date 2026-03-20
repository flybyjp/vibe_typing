// サーバー側の型定義
export * from '../../../shared/types.js';

import type { Room, Player, PlayerGameState, RoomSettings } from '../../../shared/types.js';

// サーバー内部で使用する拡張ルーム情報
export interface ServerRoom extends Room {
  gameState: GameState | null;
  spectatorIds: Set<string>;
  rematchRequests: Set<string>; // 再戦をリクエストしたプレイヤーIDの集合
}

// ゲーム状態
export interface GameState {
  questions: { text: string; reading: string }[];
  currentQuestionIndex: number;
  playerStates: Map<string, PlayerGameState>;
  roundStartTime: number;
}

// プレイヤーソケット情報
export interface PlayerSocket {
  socketId: string;
  player: Player;
  roomId: string | null;
}
