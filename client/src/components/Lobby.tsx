import { useState, useEffect } from 'react';
import type { Room, RoomSettings, QuestionSetInfo } from '../types';
import styles from './Lobby.module.css';

interface LobbyProps {
  room: Room;
  currentPlayerId: string;
  questionSets: QuestionSetInfo[];
  onReady: (isReady: boolean) => void;
  onUpdateSettings: (settings: RoomSettings) => void;
  onLeave: () => void;
}

export function Lobby({
  room,
  currentPlayerId,
  questionSets,
  onReady,
  onUpdateSettings,
  onLeave
}: LobbyProps) {
  const currentPlayer = room.players.find(p => p.id === currentPlayerId);
  const opponent = room.players.find(p => p.id !== currentPlayerId);
  const isHost = currentPlayer?.isHost ?? false;
  const isReady = currentPlayer?.isReady ?? false;

  const [rounds, setRounds] = useState(room.settings.rounds);
  const [questionSet, setQuestionSet] = useState(room.settings.questionSet);

  useEffect(() => {
    setRounds(room.settings.rounds);
    setQuestionSet(room.settings.questionSet);
  }, [room.settings]);

  const handleSettingsChange = () => {
    if (isHost) {
      onUpdateSettings({ rounds, questionSet });
    }
  };

  const handleRoundsChange = (value: number) => {
    setRounds(value);
    if (isHost) {
      onUpdateSettings({ rounds: value, questionSet });
    }
  };

  const handleQuestionSetChange = (value: string) => {
    setQuestionSet(value);
    if (isHost) {
      onUpdateSettings({ rounds, questionSet: value });
    }
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(room.id);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>対戦ロビー</h1>
        <button className={styles.leaveButton} onClick={onLeave}>
          退出
        </button>
      </div>

      <div className={styles.roomInfo}>
        <div className={styles.roomId}>
          <span>ルームID:</span>
          <strong>{room.id}</strong>
          <button className={styles.copyButton} onClick={copyRoomId} title="コピー">
            📋
          </button>
        </div>
      </div>

      <div className={styles.players}>
        <div className={`${styles.playerCard} ${currentPlayer?.isReady ? styles.ready : ''}`}>
          <div className={styles.playerName}>
            {currentPlayer?.name}
            {isHost && <span className={styles.hostBadge}>ホスト</span>}
          </div>
          <div className={styles.playerStatus}>
            {currentPlayer?.isReady ? '準備完了' : '待機中'}
          </div>
        </div>

        <div className={styles.vs}>VS</div>

        <div className={`${styles.playerCard} ${opponent?.isReady ? styles.ready : ''} ${!opponent ? styles.waiting : ''}`}>
          {opponent ? (
            <>
              <div className={styles.playerName}>{opponent.name}</div>
              <div className={styles.playerStatus}>
                {opponent.isReady ? '準備完了' : '待機中'}
              </div>
            </>
          ) : (
            <div className={styles.waitingText}>相手を待っています...</div>
          )}
        </div>
      </div>

      <div className={styles.settings}>
        <h2>ゲーム設定</h2>

        <div className={styles.settingRow}>
          <label>ラウンド数</label>
          <select
            value={rounds}
            onChange={e => handleRoundsChange(Number(e.target.value))}
            disabled={!isHost}
          >
            <option value={1}>1本勝負</option>
            <option value={3}>3本勝負</option>
            <option value={5}>5本勝負</option>
            <option value={7}>7本勝負</option>
            <option value={9}>9本勝負</option>
          </select>
        </div>

        <div className={styles.settingRow}>
          <label>問題セット</label>
          <select
            value={questionSet}
            onChange={e => handleQuestionSetChange(e.target.value)}
            disabled={!isHost}
          >
            {questionSets.map(set => (
              <option key={set.id} value={set.id}>
                {set.name} ({set.questionCount}問)
              </option>
            ))}
          </select>
        </div>

        {!isHost && (
          <p className={styles.settingsNote}>
            設定はホストのみが変更できます
          </p>
        )}
      </div>

      <div className={styles.actions}>
        {opponent ? (
          <button
            className={`${styles.readyButton} ${isReady ? styles.readyActive : ''}`}
            onClick={() => onReady(!isReady)}
          >
            {isReady ? '準備解除' : '準備完了'}
          </button>
        ) : (
          <p className={styles.waitingMessage}>
            相手プレイヤーの参加を待っています...<br />
            ルームID: <strong>{room.id}</strong> を共有してください
          </p>
        )}
      </div>

      {room.players.length === 2 && room.players.every(p => p.isReady) && (
        <div className={styles.startingMessage}>
          ゲームを開始しています...
        </div>
      )}
    </div>
  );
}
