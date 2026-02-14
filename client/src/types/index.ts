// クライアント側の型定義
export * from '../../../shared/types';

// 画面状態
export type ScreenState = 'home' | 'lobby' | 'game' | 'result';

// ゲーム状態（クライアント側）
export interface ClientGameState {
  question: {
    text: string;
    reading: string;
  } | null;
  round: number;
  totalRounds: number;
  typedText: string;
  currentPosition: number;
  correctCount: number;
  missCount: number;
  startTime: number | null;
  isFinished: boolean;
  opponentProgress: number;
}

// 音声設定
export interface SoundSettings {
  enabled: boolean;
  volume: number;
}
