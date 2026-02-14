import styles from './TypingArea.module.css';

interface TypingAreaProps {
  text: string; // 日本語の出題文
  reading: string; // 読みがな
  typedRomaji: string; // 入力済みローマ字
  currentInput: string; // 現在入力中のローマ字
  remainingRomaji: string; // 残りのローマ字
}

export function TypingArea({
  text,
  reading,
  typedRomaji,
  currentInput,
  remainingRomaji
}: TypingAreaProps) {
  return (
    <div className={styles.container}>
      <div className={styles.questionText}>{text}</div>
      <div className={styles.reading}>{reading}</div>
      <div className={styles.romajiLine}>
        <span className={styles.typed}>{typedRomaji}</span>
        <span className={styles.current}>{currentInput}</span>
        <span className={styles.remaining}>{remainingRomaji}</span>
      </div>
    </div>
  );
}
