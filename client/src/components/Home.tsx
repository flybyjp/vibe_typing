import { useState, useEffect } from 'react';
import type { RoomSettings, QuestionSetInfo } from '../types';
import styles from './Home.module.css';

interface HomeProps {
  isConnected: boolean;
  error: string | null;
  questionSets: QuestionSetInfo[];
  onCreateRoom: (playerName: string, settings: RoomSettings) => void;
  onJoinRoom: (roomId: string, playerName: string) => void;
  onWatchRoom: (roomId: string, spectatorName: string) => void;
  onFetchQuestionSets: () => void;
  onChangeServer: (url: string) => void;
  currentServerUrl: string;
}

export function Home({
  isConnected,
  error,
  questionSets,
  onCreateRoom,
  onJoinRoom,
  onWatchRoom,
  onFetchQuestionSets,
  onChangeServer,
  currentServerUrl
}: HomeProps) {
  const [mode, setMode] = useState<'menu' | 'create' | 'join' | 'server' | 'watch'>('menu');
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [rounds, setRounds] = useState(3);
  const [questionSet, setQuestionSet] = useState('default.csv');
  const [serverUrl, setServerUrl] = useState(currentServerUrl);

  useEffect(() => {
    if (isConnected && questionSets.length === 0) {
      onFetchQuestionSets();
    }
  }, [isConnected, questionSets.length, onFetchQuestionSets]);

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      alert('名前を入力してください');
      return;
    }
    onCreateRoom(playerName.trim(), { rounds, questionSet });
  };

  const handleJoinRoom = () => {
    if (!playerName.trim()) {
      alert('名前を入力してください');
      return;
    }
    if (!roomId.trim()) {
      alert('ルームIDを入力してください');
      return;
    }
    onJoinRoom(roomId.trim().toUpperCase(), playerName.trim());
  };

  const handleWatchRoom = () => {
    if (!playerName.trim()) {
      alert('名前を入力してください');
      return;
    }
    if (!roomId.trim()) {
      alert('ルームIDを入力してください');
      return;
    }
    onWatchRoom(roomId.trim().toUpperCase(), playerName.trim());
  };

  const handleChangeServer = () => {
    if (!serverUrl.trim()) {
      alert('サーバーURLを入力してください');
      return;
    }
    onChangeServer(serverUrl.trim());
    setMode('menu');
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Vibe Typing</h1>
      <p className={styles.subtitle}>タイピング対戦ゲーム</p>

      {!isConnected && (
        <div className={styles.connectionStatus}>
          <span className={styles.statusDot} />
          接続中...
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}

      {mode === 'menu' && (
        <div className={styles.menu}>
          <button
            className={styles.menuButton}
            onClick={() => setMode('create')}
            disabled={!isConnected}
          >
            ルームを作成
          </button>
          <button
            className={styles.menuButton}
            onClick={() => setMode('join')}
            disabled={!isConnected}
          >
            ルームに参加
          </button>
          <button
            className={styles.menuButton}
            onClick={() => setMode('watch')}
            disabled={!isConnected}
          >
            観戦する
          </button>
          <button
            className={`${styles.menuButton} ${styles.secondary}`}
            onClick={() => setMode('server')}
          >
            サーバー設定
          </button>
        </div>
      )}

      {mode === 'create' && (
        <div className={styles.form}>
          <h2>ルーム作成</h2>

          <div className={styles.formGroup}>
            <label>あなたの名前</label>
            <input
              type="text"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              placeholder="名前を入力"
              maxLength={20}
            />
          </div>

          <div className={styles.formGroup}>
            <label>ラウンド数</label>
            <select value={rounds} onChange={e => setRounds(Number(e.target.value))}>
              <option value={1}>1本勝負</option>
              <option value={3}>3本勝負</option>
              <option value={5}>5本勝負</option>
              <option value={7}>7本勝負</option>
              <option value={9}>9本勝負</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>問題セット</label>
            <select value={questionSet} onChange={e => setQuestionSet(e.target.value)}>
              {questionSets.map(set => (
                <option key={set.id} value={set.id}>
                  {set.name} ({set.questionCount}問)
                </option>
              ))}
            </select>
          </div>

          <div className={styles.buttons}>
            <button className={styles.primaryButton} onClick={handleCreateRoom}>
              作成
            </button>
            <button className={styles.secondaryButton} onClick={() => setMode('menu')}>
              戻る
            </button>
          </div>
        </div>
      )}

      {mode === 'join' && (
        <div className={styles.form}>
          <h2>ルームに参加</h2>

          <div className={styles.formGroup}>
            <label>あなたの名前</label>
            <input
              type="text"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              placeholder="名前を入力"
              maxLength={20}
            />
          </div>

          <div className={styles.formGroup}>
            <label>ルームID</label>
            <input
              type="text"
              value={roomId}
              onChange={e => setRoomId(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              style={{ textTransform: 'uppercase' }}
            />
          </div>

          <div className={styles.buttons}>
            <button className={styles.primaryButton} onClick={handleJoinRoom}>
              参加
            </button>
            <button className={styles.secondaryButton} onClick={() => setMode('menu')}>
              戻る
            </button>
          </div>
        </div>
      )}

      {mode === 'watch' && (
        <div className={styles.form}>
          <h2>観戦する</h2>

          <div className={styles.formGroup}>
            <label>あなたの名前</label>
            <input
              type="text"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              placeholder="名前を入力"
              maxLength={20}
            />
          </div>

          <div className={styles.formGroup}>
            <label>ルームID</label>
            <input
              type="text"
              value={roomId}
              onChange={e => setRoomId(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              style={{ textTransform: 'uppercase' }}
            />
          </div>

          <div className={styles.buttons}>
            <button className={styles.primaryButton} onClick={handleWatchRoom}>
              観戦開始
            </button>
            <button className={styles.secondaryButton} onClick={() => setMode('menu')}>
              戻る
            </button>
          </div>
        </div>
      )}

      {mode === 'server' && (
        <div className={styles.form}>
          <h2>サーバー設定</h2>

          <div className={styles.formGroup}>
            <label>サーバーURL</label>
            <input
              type="text"
              value={serverUrl}
              onChange={e => setServerUrl(e.target.value)}
              placeholder="http://localhost:3001"
            />
          </div>

          <p className={styles.hint}>
            インターネット対戦: 公開サーバーのURLを入力<br />
            LAN対戦: ローカルサーバーのアドレスを入力
          </p>

          <div className={styles.buttons}>
            <button className={styles.primaryButton} onClick={handleChangeServer}>
              接続
            </button>
            <button className={styles.secondaryButton} onClick={() => setMode('menu')}>
              戻る
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
