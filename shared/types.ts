// 共通型定義

// プレイヤー情報
export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
}

// 観戦者情報
export interface Spectator {
  id: string;
  name: string;
}

// ルーム設定
export interface RoomSettings {
  rounds: number; // ラウンド数 (1, 3, 5, 7, 9)
  questionSet: string; // 問題セットのファイル名
}

// ルーム情報
export interface Room {
  id: string;
  players: Player[];
  spectators: Spectator[];
  settings: RoomSettings;
  status: RoomStatus;
  currentRound: number;
  scores: Record<string, number>; // playerId -> score
}

// 観戦者向けゲームスナップショット（途中参加時の状態同期）
export interface SpectatorGameSnapshot {
  question: Question;
  round: number;
  totalRounds: number;
  playerStates: {
    playerId: string;
    playerName: string;
    progress: number;
  }[];
  scores: Record<string, number>;
}

export type RoomStatus = 'waiting' | 'ready' | 'playing' | 'finished';

// 問題データ
export interface Question {
  text: string; // 日本語文
  reading: string; // 読みがな（ひらがな）
}

// ゲーム中のプレイヤー状態
export interface PlayerGameState {
  playerId: string;
  progress: number; // 0-100 のパーセンテージ
  currentPosition: number; // 現在の入力位置
  correctCount: number; // 正しくタイプした数
  missCount: number; // ミスタイプした数
  startTime?: number; // 開始時刻
  finishTime?: number; // 終了時刻
}

// ラウンド結果
export interface RoundResult {
  round: number;
  winnerId: string | null; // 引き分けの場合はnull
  players: PlayerRoundStats[];
}

// プレイヤーのラウンド統計
export interface PlayerRoundStats {
  playerId: string;
  playerName: string;
  clearTime: number; // ミリ秒
  kpm: number; // Keys Per Minute
  accuracy: number; // 正確率 (0-100)
  correctCount: number;
  missCount: number;
}

// 最終結果
export interface GameResult {
  winnerId: string | null;
  rounds: RoundResult[];
  players: PlayerFinalStats[];
}

// プレイヤーの最終統計
export interface PlayerFinalStats {
  playerId: string;
  playerName: string;
  wins: number;
  totalKpm: number;
  totalAccuracy: number;
}

// 問題セット情報
export interface QuestionSetInfo {
  id: string;
  name: string;
  questionCount: number;
}

// =====================================
// Socket.io イベント型定義
// =====================================

// クライアント → サーバー
export interface ClientToServerEvents {
  // ルーム操作
  createRoom: (data: { playerName: string; settings: RoomSettings }) => void;
  joinRoom: (data: { roomId: string; playerName: string }) => void;
  leaveRoom: () => void;
  updateSettings: (settings: RoomSettings) => void;

  // ゲーム操作
  ready: () => void;
  unready: () => void;
  typing: (data: { position: number; correctCount: number; missCount: number }) => void;
  finished: (data: { clearTime: number; correctCount: number; missCount: number }) => void;

  // 再戦
  requestRematch: () => void;

  // 問題セット一覧取得
  getQuestionSets: () => void;

  // 観戦
  watchRoom: (data: { roomId: string; spectatorName: string }) => void;
  leaveSpectate: () => void;
}

// サーバー → クライアント
export interface ServerToClientEvents {
  // ルーム関連
  roomCreated: (data: { roomId: string; room: Room }) => void;
  roomJoined: (data: { room: Room }) => void;
  playerJoined: (data: { player: Player; room: Room }) => void;
  playerLeft: (data: { playerId: string; room: Room }) => void;
  settingsUpdated: (data: { settings: RoomSettings }) => void;
  roomError: (data: { message: string }) => void;

  // ゲーム関連
  playerReady: (data: { playerId: string }) => void;
  playerUnready: (data: { playerId: string }) => void;
  gameStart: (data: { question: Question; round: number; totalRounds: number }) => void;
  opponentProgress: (data: { playerId: string; progress: number }) => void;
  roundEnd: (data: { result: RoundResult; scores: Record<string, number> }) => void;
  gameEnd: (data: { result: GameResult }) => void;

  // 再戦
  rematchRequested: (data: { playerId: string }) => void;
  rematchStart: () => void;

  // 問題セット
  questionSets: (data: { sets: QuestionSetInfo[] }) => void;

  // 観戦
  watchJoined: (data: { room: Room; snapshot: SpectatorGameSnapshot | null }) => void;
  watchError: (data: { message: string }) => void;
  spectatorJoined: (data: { spectator: Spectator; spectatorCount: number }) => void;
  spectatorLeft: (data: { spectatorId: string; spectatorCount: number }) => void;
  playerProgress: (data: { playerId: string; progress: number }) => void;
  roomClosed: () => void;
}
