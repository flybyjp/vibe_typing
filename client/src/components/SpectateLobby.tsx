import type { Room } from '../types';
import styles from './SpectateLobby.module.css';

interface SpectateLobbyProps {
  room: Room;
  onLeave: () => void;
}

export function SpectateLobby({ room, onLeave }: SpectateLobbyProps) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>観戦ロビー</h1>
        <button className={styles.leaveButton} onClick={onLeave}>
          退出
        </button>
      </div>

      <div className={styles.roomInfo}>
        <span>ルームID:</span>
        <strong>{room.id}</strong>
      </div>

      <div className={styles.badge}>SPECTATING</div>

      <div className={styles.players}>
        <div className={`${styles.playerCard} ${room.players[0]?.isReady ? styles.ready : ''}`}>
          {room.players[0] ? (
            <>
              <div className={styles.playerName}>
                {room.players[0].name}
                {room.players[0].isHost && <span className={styles.hostBadge}>ホスト</span>}
              </div>
              <div className={styles.playerStatus}>
                {room.players[0].isReady ? '準備完了' : '待機中'}
              </div>
            </>
          ) : (
            <div className={styles.waitingText}>プレイヤー待ち...</div>
          )}
        </div>

        <div className={styles.vs}>VS</div>

        <div className={`${styles.playerCard} ${room.players[1]?.isReady ? styles.ready : ''} ${!room.players[1] ? styles.waiting : ''}`}>
          {room.players[1] ? (
            <>
              <div className={styles.playerName}>{room.players[1].name}</div>
              <div className={styles.playerStatus}>
                {room.players[1].isReady ? '準備完了' : '待機中'}
              </div>
            </>
          ) : (
            <div className={styles.waitingText}>プレイヤー待ち...</div>
          )}
        </div>
      </div>

      <div className={styles.spectatorInfo}>
        現在 {room.spectators.length} 人が観戦中
      </div>

      <div className={styles.waitingMessage}>
        対戦開始を待っています...
      </div>
    </div>
  );
}
