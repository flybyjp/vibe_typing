import { useState, useEffect, useCallback } from 'react';
import type { Room, Question, RoundResult, GameResult } from '../types';
import { ProgressBar } from './ProgressBar';
import { PointFlash } from './PointFlash';
import { soundManager } from '../utils/sound';
import styles from './Spectate.module.css';

interface SpectateProps {
  room: Room;
  question: Question | null;
  round: number;
  totalRounds: number;
  playerProgressMap: Record<string, number>;
  roundResult: RoundResult | undefined;
  gameResult: GameResult | undefined;
  isGameEnd: boolean;
  onLeave: () => void;
}

export function Spectate({
  room,
  question,
  round,
  totalRounds,
  playerProgressMap,
  roundResult,
  gameResult,
  isGameEnd,
  onLeave
}: SpectateProps) {
  const [flashInfo, setFlashInfo] = useState<{ side: 'left' | 'right'; playerName: string } | null>(null);
  const [lastRoundResultId, setLastRoundResultId] = useState<string | null>(null);
  const [hasPlayedEndSound, setHasPlayedEndSound] = useState(false);

  const playerLeft = room.players[0];
  const playerRight = room.players[1];

  // ラウンド結果時の演出
  useEffect(() => {
    if (!roundResult) return;
    const resultKey = `${roundResult.round}-${roundResult.winnerId}`;
    if (resultKey === lastRoundResultId) return;
    setLastRoundResultId(resultKey);

    if (roundResult.winnerId) {
      const winnerIndex = room.players.findIndex(p => p.id === roundResult.winnerId);
      const winner = room.players.find(p => p.id === roundResult.winnerId);
      if (winner && winnerIndex !== -1) {
        setFlashInfo({
          side: winnerIndex === 0 ? 'left' : 'right',
          playerName: winner.name
        });
        soundManager.play('correct');
      }
    }
  }, [roundResult, lastRoundResultId, room.players]);

  // ゲーム終了時の効果音
  useEffect(() => {
    if (isGameEnd && gameResult && !hasPlayedEndSound) {
      soundManager.play('win');
      setHasPlayedEndSound(true);
    }
  }, [isGameEnd, gameResult, hasPlayedEndSound]);

  const handleFlashEnd = useCallback(() => {
    setFlashInfo(null);
  }, []);

  const progressLeft = playerLeft ? (playerProgressMap[playerLeft.id] ?? 0) : 0;
  const progressRight = playerRight ? (playerProgressMap[playerRight.id] ?? 0) : 0;
  const scoreLeft = playerLeft ? (room.scores[playerLeft.id] ?? 0) : 0;
  const scoreRight = playerRight ? (room.scores[playerRight.id] ?? 0) : 0;

  // ゲーム終了表示
  if (isGameEnd && gameResult) {
    const winner = room.players.find(p => p.id === gameResult.winnerId);
    const isDraw = gameResult.winnerId === null;

    return (
      <div className={styles.container}>
        <div className={styles.gameEndOverlay}>
          <h1 className={`${styles.gameEndTitle} ${isDraw ? styles.drawTitle : ''}`}>
            {isDraw ? 'DRAW!' : `${winner?.name} WINS!`}
          </h1>
          <div className={styles.finalScoreDisplay}>
            <div className={styles.finalScoreCard}>
              <span className={`${styles.finalPlayerName} ${styles.leftColor}`}>
                {playerLeft?.name}
              </span>
              <span className={styles.finalScoreValue}>{scoreLeft}</span>
            </div>
            <span className={styles.finalScoreDivider}>-</span>
            <div className={styles.finalScoreCard}>
              <span className={`${styles.finalPlayerName} ${styles.rightColor}`}>
                {playerRight?.name}
              </span>
              <span className={styles.finalScoreValue}>{scoreRight}</span>
            </div>
          </div>

          {gameResult.players.length > 0 && (
            <div className={styles.finalStats}>
              {gameResult.players.map(p => (
                <div key={p.playerId} className={styles.finalStatCard}>
                  <div className={styles.finalStatName}>{p.playerName}</div>
                  <div className={styles.finalStatRow}>
                    <span>勝利数</span><strong>{p.wins}</strong>
                  </div>
                  <div className={styles.finalStatRow}>
                    <span>平均KPM</span><strong>{p.totalKpm}</strong>
                  </div>
                  <div className={styles.finalStatRow}>
                    <span>平均正確率</span><strong>{p.totalAccuracy}%</strong>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button className={styles.exitButton} onClick={onLeave}>
            退出する
          </button>
        </div>
      </div>
    );
  }

  // ラウンド結果の統計表示
  const showRoundStats = roundResult && !isGameEnd;
  const myRoundStats = showRoundStats
    ? roundResult.players.find(p => p.playerId === playerLeft?.id)
    : undefined;
  const opRoundStats = showRoundStats
    ? roundResult.players.find(p => p.playerId === playerRight?.id)
    : undefined;

  return (
    <div className={styles.container}>
      {/* ヘッダー */}
      <div className={styles.header}>
        <div className={styles.liveBadge}>LIVE</div>
        <div className={styles.roundInfo}>
          Round {round} / {totalRounds}
        </div>
        <div className={styles.spectatorCount}>
          {room.spectators.length} 人が観戦中
        </div>
        <button className={styles.headerLeaveButton} onClick={onLeave}>
          退出
        </button>
      </div>

      {/* メインアリーナ */}
      <div className={styles.arena}>
        {/* 左プレイヤー */}
        <div className={`${styles.playerPanel} ${styles.leftPanel} ${roundResult?.winnerId === playerLeft?.id ? styles.panelWin : ''}`}>
          <div className={styles.panelPlayerName}>{playerLeft?.name ?? '---'}</div>
          <div className={`${styles.panelScore} ${styles.leftScore}`}>{scoreLeft}</div>
          <div className={styles.progressWrapper}>
            <ProgressBar progress={progressLeft} color="primary" />
          </div>
          {showRoundStats && myRoundStats && (
            <div className={styles.roundStatsMini}>
              <span>{(myRoundStats.clearTime / 1000).toFixed(2)}s</span>
              <span>{myRoundStats.kpm} KPM</span>
              <span>{myRoundStats.accuracy}%</span>
            </div>
          )}
        </div>

        {/* 中央セパレーター */}
        <div className={styles.separator}>
          <div className={styles.vsText}>VS</div>
        </div>

        {/* 右プレイヤー */}
        <div className={`${styles.playerPanel} ${styles.rightPanel} ${roundResult?.winnerId === playerRight?.id ? styles.panelWin : ''}`}>
          <div className={styles.panelPlayerName}>{playerRight?.name ?? '---'}</div>
          <div className={`${styles.panelScore} ${styles.rightScore}`}>{scoreRight}</div>
          <div className={styles.progressWrapper}>
            <ProgressBar progress={progressRight} color="secondary" />
          </div>
          {showRoundStats && opRoundStats && (
            <div className={styles.roundStatsMini}>
              <span>{(opRoundStats.clearTime / 1000).toFixed(2)}s</span>
              <span>{opRoundStats.kpm} KPM</span>
              <span>{opRoundStats.accuracy}%</span>
            </div>
          )}
        </div>
      </div>

      {/* 問題表示 */}
      <div className={styles.questionArea}>
        {question ? (
          <>
            <div className={styles.questionText}>{question.text}</div>
            <div className={styles.questionReading}>{question.reading}</div>
          </>
        ) : (
          <div className={styles.questionWaiting}>問題を待っています...</div>
        )}
      </div>

      {/* ラウンド結果のバナー */}
      {showRoundStats && (
        <div className={styles.roundResultBanner}>
          次のラウンドを準備中...
        </div>
      )}

      {/* ポイント取得演出 */}
      {flashInfo && (
        <PointFlash
          side={flashInfo.side}
          playerName={flashInfo.playerName}
          onAnimationEnd={handleFlashEnd}
        />
      )}
    </div>
  );
}
