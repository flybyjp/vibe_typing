import { useState, useCallback, useRef, useEffect } from 'react';
import { RomajiConverter, hiraganaToRomaji } from '../utils/romajiConverter';
import { soundManager } from '../utils/sound';

interface UseTypingProps {
  reading: string;
  onProgress?: (position: number, correctCount: number, missCount: number) => void;
  onComplete?: (clearTime: number, correctCount: number, missCount: number) => void;
}

interface UseTypingReturn {
  typedRomaji: string;
  remainingRomaji: string;
  currentPosition: number;
  correctCount: number;
  missCount: number;
  isComplete: boolean;
  displayText: {
    typed: string;
    current: string;
    remaining: string;
  };
  handleKeyDown: (event: KeyboardEvent) => void;
  reset: (newReading?: string) => void;
}

export function useTyping({
  reading,
  onProgress,
  onComplete
}: UseTypingProps): UseTypingReturn {
  const [typedRomaji, setTypedRomaji] = useState('');
  const [correctCount, setCorrectCount] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const converterRef = useRef<RomajiConverter>(new RomajiConverter(reading));
  const startTimeRef = useRef<number | null>(null);
  const lastProgressRef = useRef(0);

  // 表示用のローマ字テキスト
  const fullRomaji = hiraganaToRomaji(reading);

  // 入力済み・現在入力中・残りの表示
  const getDisplayText = useCallback(() => {
    const converter = converterRef.current;
    const currentInput = converter.getCurrentInput();
    const progress = converter.getProgress();

    // 入力済みのひらがな部分のローマ字
    const typedHiragana = reading.slice(0, progress);
    const typed = hiraganaToRomaji(typedHiragana);

    // 残りのひらがな部分のローマ字
    const remainingHiragana = reading.slice(progress);
    const remaining = hiraganaToRomaji(remainingHiragana);

    return {
      typed: typedRomaji,
      current: currentInput,
      remaining: remaining.slice(currentInput.length)
    };
  }, [reading, typedRomaji]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // 特殊キーは無視
    if (event.ctrlKey || event.altKey || event.metaKey) return;
    if (event.key.length !== 1) return;
    if (isComplete) return;

    // 開始時刻を記録
    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now();
    }

    const key = event.key.toLowerCase();
    const converter = converterRef.current;
    const result = converter.processKey(key);

    if (result.isCorrect) {
      soundManager.play('type');
      setCorrectCount(prev => prev + 1);

      if (result.consumed > 0) {
        // ひらがなを消費した場合、入力済みローマ字を更新
        const newPosition = converter.getProgress();
        setCurrentPosition(newPosition);

        // 表示用のローマ字を更新
        const typedHiragana = reading.slice(0, newPosition);
        setTypedRomaji(hiraganaToRomaji(typedHiragana));
      }

      // 完了チェック
      if (converter.isComplete()) {
        setIsComplete(true);
        soundManager.play('correct');

        const clearTime = Date.now() - (startTimeRef.current || Date.now());
        onComplete?.(clearTime, correctCount + 1, missCount);
      } else {
        // 進捗を通知（5%ごと、または位置が変わった場合）
        const newProgress = Math.floor((converter.getProgress() / reading.length) * 100);
        if (newProgress > lastProgressRef.current) {
          lastProgressRef.current = newProgress;
          onProgress?.(converter.getProgress(), correctCount + 1, missCount);
        }
      }
    } else {
      soundManager.play('miss');
      setMissCount(prev => {
        const newMissCount = prev + 1;
        onProgress?.(converter.getProgress(), correctCount, newMissCount);
        return newMissCount;
      });
    }
  }, [reading, isComplete, correctCount, missCount, onProgress, onComplete]);

  const reset = useCallback((newReading?: string) => {
    const targetReading = newReading ?? reading;
    converterRef.current = new RomajiConverter(targetReading);
    setTypedRomaji('');
    setCorrectCount(0);
    setMissCount(0);
    setCurrentPosition(0);
    setIsComplete(false);
    startTimeRef.current = null;
    lastProgressRef.current = 0;
  }, [reading]);

  // reading が変更されたらリセット
  useEffect(() => {
    reset(reading);
  }, [reading]);

  const displayText = getDisplayText();

  return {
    typedRomaji,
    remainingRomaji: displayText.remaining,
    currentPosition,
    correctCount,
    missCount,
    isComplete,
    displayText,
    handleKeyDown,
    reset
  };
}
