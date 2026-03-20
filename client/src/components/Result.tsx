import { useState } from 'react';
import type { Room, RoundResult, GameResult } from '../types';
import { soundManager } from '../utils/sound';
import styles from './Result.module.css';

interface ResultProps {
  room: Room;
  currentPlayerId: string;
  roundResult?: RoundResult;
  gameResult?: GameResult;
  isGameEnd: boolean;
  rematchRequested: boolean;
  opponentRematchRequested: boolean;
  onRematch: () => void;
  onLeave: () => void;
}

export function Result({
  room,
  currentPlayerId,
  roundResult,
  gameResult,
  isGameEnd,
  rematchRequested,
  opponentRematchRequested,
  onRematch,
  onLeave
}: ResultProps) {
  const [hasPlayedSound, setHasPlayedSound] = useState(false);

  const host = room.players.find(p => p.isHost);
  const guest = room.players.find(p => !p.isHost);

  // 勝敗判定
  const isWinner = isGameEnd
    ? gameResult?.winnerId === currentPlayerId
    : roundResult?.winnerId === currentPlayerId;

  const isDraw = isGameEnd
    ? gameResult?.winnerId === null
    : roundResult?.winnerId === null;

  // 効果音を再生
  if (!hasPlayedSound && isGameEnd) {
    if (isWinner) {
      soundManager.play('win');
    } else if (!isDraw) {
      soundManager.play('lose');
    }
    setHasPlayedSound(true);
  }

  // ラウンド結果の統計（ホスト→ゲスト順）
  const hostStats = roundResult?.players.find(p => p.playerId === host?.id);
  const guestStats = roundResult?.players.find(p => p.playerId === guest?.id);

  return (
    <div className={styles.container}>
      {!isGameEnd && roundResult && (
        <div className={styles.roundResult}>
          <h2>Round {roundResult.round} 結果</h2>

          <div className={`${styles.winnerBanner} ${isDraw ? styles.draw : ''}`}>
            {isDraw ? (
              'Draw!'
            ) : isWinner ? (
              'You Win!'
            ) : (
              'You Lose...'
            )}
          </div>

          <div className={styles.statsComparison}>
            <div className={styles.playerStats}>
              <h3 className={styles.primaryName}>{host?.name}</h3>
              {hostStats && (
                <>
                  <div className={styles.statItem}>
                    <span>タイム</span>
                    <strong>{(hostStats.clearTime / 1000).toFixed(2)}秒</strong>
                  </div>
                  <div className={styles.statItem}>
                    <span>KPM</span>
                    <strong>{hostStats.kpm}</strong>
                  </div>
                  <div className={styles.statItem}>
                    <span>正確率</span>
                    <strong>{hostStats.accuracy}%</strong>
                  </div>
                </>
              )}
            </div>

            <div className={styles.vs}>VS</div>

            <div className={styles.playerStats}>
              <h3 className={styles.secondaryName}>{guest?.name}</h3>
              {guestStats && (
                <>
                  <div className={styles.statItem}>
                    <span>タイム</span>
                    <strong>{(guestStats.clearTime / 1000).toFixed(2)}秒</strong>
                  </div>
                  <div className={styles.statItem}>
                    <span>KPM</span>
                    <strong>{guestStats.kpm}</strong>
                  </div>
                  <div className={styles.statItem}>
                    <span>正確率</span>
                    <strong>{guestStats.accuracy}%</strong>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className={styles.currentScore}>
            <span>現在のスコア:</span>
            <strong>
              {room.scores[host?.id || ''] || 0} - {room.scores[guest?.id || ''] || 0}
            </strong>
          </div>

          <div className={styles.nextRound}>
            次のラウンドを準備中...
          </div>
        </div>
      )}

      {isGameEnd && gameResult && (
        <div className={styles.gameResult}>
          <h1 className={`${styles.gameResultTitle} ${isWinner ? styles.winner : isDraw ? styles.draw : styles.loser}`}>
            {isDraw ? 'DRAW!' : isWinner ? 'VICTORY!' : 'DEFEAT'}
          </h1>

          <div className={styles.finalScore}>
            <div className={styles.scoreCard}>
              <span className={`${styles.playerName} ${styles.primaryName}`}>{host?.name}</span>
              <span className={styles.score}>{room.scores[host?.id || ''] || 0}</span>
            </div>
            <span className={styles.scoreDivider}>-</span>
            <div className={styles.scoreCard}>
              <span className={`${styles.playerName} ${styles.secondaryName}`}>{guest?.name}</span>
              <span className={styles.score}>{room.scores[guest?.id || ''] || 0}</span>
            </div>
          </div>

          <div className={styles.actions}>
            {opponentRematchRequested && !rematchRequested && (
              <div className={styles.opponentRematch}>
                相手が再戦をリクエストしています！
              </div>
            )}
            <button
              className={styles.rematchButton}
              onClick={onRematch}
              disabled={rematchRequested}
            >
              {rematchRequested ? '再戦リクエスト送信済み' : '再戦する'}
            </button>
            <button className={styles.leaveButton} onClick={onLeave}>
              退出する
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
