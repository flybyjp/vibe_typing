import { useEffect, useRef } from 'react';
import type { Room, Question } from '../types';
import { useTyping } from '../hooks/useTyping';
import { TypingArea } from './TypingArea';
import { ProgressBar } from './ProgressBar';
import { hiraganaToRomaji } from '../utils/romajiConverter';
import styles from './Game.module.css';

interface GameProps {
  room: Room;
  currentPlayerId: string;
  question: Question;
  round: number;
  totalRounds: number;
  opponentProgress: number;
  onProgress: (position: number, correctCount: number, missCount: number) => void;
  onComplete: (clearTime: number, correctCount: number, missCount: number) => void;
}

export function Game({
  room,
  currentPlayerId,
  question,
  round,
  totalRounds,
  opponentProgress,
  onProgress,
  onComplete
}: GameProps) {
  const {
    typedRomaji,
    remainingRomaji,
    currentPosition,
    correctCount,
    missCount,
    isComplete,
    displayText,
    handleKeyDown
  } = useTyping({
    reading: question.reading,
    onProgress,
    onComplete
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // キーボードイベントをリッスン
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      handleKeyDown(e);
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleKeyDown]);

  // 自分の進捗を計算
  const myProgress = Math.floor((currentPosition / question.reading.length) * 100);

  const currentPlayer = room.players.find(p => p.id === currentPlayerId);
  const host = room.players.find(p => p.isHost);
  const guest = room.players.find(p => !p.isHost);
  const isHost = currentPlayer?.isHost ?? true;
  const myColor: 'primary' | 'secondary' = isHost ? 'primary' : 'secondary';
  const opponentColor: 'primary' | 'secondary' = isHost ? 'secondary' : 'primary';

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.header}>
        <div className={styles.roundInfo}>
          Round {round} / {totalRounds}
        </div>
        <div className={styles.scores}>
          <span className={styles.primaryScore}>
            {host?.name}: {room.scores[host?.id || ''] || 0}
          </span>
          <span className={styles.vs}>-</span>
          <span className={styles.secondaryScore}>
            {guest?.name}: {room.scores[guest?.id || ''] || 0}
          </span>
        </div>
      </div>

      <div className={styles.progressSection}>
        <ProgressBar
          progress={myProgress}
          color={myColor}
          label="あなた"
        />
        <ProgressBar
          progress={opponentProgress}
          color={opponentColor}
          label="相手"
        />
      </div>

      <TypingArea
        text={question.text}
        reading={question.reading}
        typedRomaji={displayText.typed}
        currentInput={displayText.current}
        remainingRomaji={displayText.remaining}
      />

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>正確</span>
          <span className={styles.statValue}>{correctCount}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>ミス</span>
          <span className={`${styles.statValue} ${styles.miss}`}>{missCount}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>正確率</span>
          <span className={styles.statValue}>
            {correctCount + missCount > 0
              ? Math.round((correctCount / (correctCount + missCount)) * 100)
              : 100}%
          </span>
        </div>
      </div>

      {isComplete && (
        <div className={styles.completeMessage}>
          完了！結果を待っています...
        </div>
      )}
    </div>
  );
}
