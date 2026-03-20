import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from './hooks/useSocket';
import { Home } from './components/Home';
import { Lobby } from './components/Lobby';
import { Game } from './components/Game';
import { Result } from './components/Result';
import { SpectateLobby } from './components/SpectateLobby';
import { Spectate } from './components/Spectate';
import { soundManager } from './utils/sound';
import type { ScreenState, Question, RoundResult, GameResult } from './types';
import './App.css';

const DEFAULT_SERVER_URL = 'http://localhost:3001';

export default function App() {
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL);
  const [screen, setScreen] = useState<ScreenState>('home');

  // ゲーム状態
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [round, setRound] = useState(0);
  const [totalRounds, setTotalRounds] = useState(0);
  const [opponentProgress, setOpponentProgress] = useState(0);
  const [roundResult, setRoundResult] = useState<RoundResult | undefined>();
  const [gameResult, setGameResult] = useState<GameResult | undefined>();
  const [isGameEnd, setIsGameEnd] = useState(false);
  const [rematchRequested, setRematchRequested] = useState(false);
  const [opponentRematchRequested, setOpponentRematchRequested] = useState(false);

  // 観戦用状態
  const [playerProgressMap, setPlayerProgressMap] = useState<Record<string, number>>({});

  const {
    socket,
    isConnected,
    room,
    error,
    questionSets,
    isSpectator,
    createRoom,
    joinRoom,
    leaveRoom,
    updateSettings,
    setReady,
    sendTypingProgress,
    sendFinished,
    requestRematch,
    fetchQuestionSets,
    watchRoom,
    leaveSpectate,
    onGameStart,
    onOpponentProgress,
    onRoundEnd,
    onGameEnd,
    onRematchRequested,
    onRematchStart,
    onWatchJoined,
    onWatchError,
    onPlayerProgress,
    onSpectatorJoined,
    onSpectatorLeft,
    onRoomClosed,
    onPlayerLeft
  } = useSocket(serverUrl);

  // ソケットID（プレイヤーID）
  const currentPlayerId = socket?.id || '';

  // isSpectator の最新値をrefで保持（stale closure対策）
  const isSpectatorRef = useRef(isSpectator);
  useEffect(() => { isSpectatorRef.current = isSpectator; }, [isSpectator]);

  // イベントハンドラを設定
  useEffect(() => {
    onGameStart((data) => {
      setCurrentQuestion(data.question);
      setRound(data.round);
      setTotalRounds(data.totalRounds);
      setOpponentProgress(0);
      setRoundResult(undefined);
      if (isSpectatorRef.current) {
        setPlayerProgressMap({});
        setScreen('spectate');
      } else {
        setScreen('game');
      }
      soundManager.play('start');
    });

    onOpponentProgress((data) => {
      setOpponentProgress(data.progress);
    });

    onRoundEnd((data) => {
      setRoundResult(data.result);
      if (!isSpectatorRef.current) {
        setScreen('result');
      }
    });

    onGameEnd((data) => {
      setGameResult(data.result);
      setIsGameEnd(true);
      if (!isSpectatorRef.current) {
        setScreen('result');
      }
    });

    onRematchRequested(() => {
      setOpponentRematchRequested(true);
    });

    onRematchStart(() => {
      if (isSpectatorRef.current) {
        setScreen('spectate-lobby');
      } else {
        setScreen('lobby');
      }
      setCurrentQuestion(null);
      setRound(0);
      setTotalRounds(0);
      setOpponentProgress(0);
      setRoundResult(undefined);
      setGameResult(undefined);
      setIsGameEnd(false);
      setRematchRequested(false);
      setOpponentRematchRequested(false);
    });

    // 観戦イベント
    onWatchJoined((data) => {
      if (data.snapshot) {
        setCurrentQuestion(data.snapshot.question);
        setRound(data.snapshot.round);
        setTotalRounds(data.snapshot.totalRounds);
        const progressMap: Record<string, number> = {};
        data.snapshot.playerStates.forEach(s => {
          progressMap[s.playerId] = s.progress;
        });
        setPlayerProgressMap(progressMap);
        setRoundResult(undefined);
        setGameResult(undefined);
        setIsGameEnd(false);
        setScreen('spectate');
      } else {
        setScreen('spectate-lobby');
      }
    });

    onWatchError(() => {
      // エラーはuseSocket内でerror stateにセットされる
    });

    onPlayerProgress((data) => {
      setPlayerProgressMap(prev => ({ ...prev, [data.playerId]: data.progress }));
    });

    onSpectatorJoined(() => {});
    onSpectatorLeft(() => {});

    // ルームが閉じられた場合（プレイヤー全員退出）
    onRoomClosed(() => {
      setScreen('home');
      setCurrentQuestion(null);
      setPlayerProgressMap({});
      setRoundResult(undefined);
      setGameResult(undefined);
      setIsGameEnd(false);
    });

    // プレイヤー退出時（観戦者のゲーム中断対応）
    onPlayerLeft((data) => {
      if (isSpectatorRef.current && data.room.status === 'waiting') {
        setScreen('spectate-lobby');
        setCurrentQuestion(null);
        setPlayerProgressMap({});
        setRoundResult(undefined);
        setGameResult(undefined);
        setIsGameEnd(false);
      }
    });
  }, [onGameStart, onOpponentProgress, onRoundEnd, onGameEnd, onRematchRequested, onRematchStart,
      onWatchJoined, onWatchError, onPlayerProgress, onSpectatorJoined, onSpectatorLeft,
      onRoomClosed, onPlayerLeft]);

  // ルームに参加したらロビーへ
  useEffect(() => {
    if (room && screen === 'home' && !isSpectator) {
      setScreen('lobby');
      soundManager.play('ready');
    }
  }, [room, screen, isSpectator]);

  // サーバーURL変更
  const handleChangeServer = useCallback((url: string) => {
    setServerUrl(url);
    setScreen('home');
  }, []);

  // ルーム退出
  const handleLeave = useCallback(() => {
    leaveRoom();
    setScreen('home');
    setCurrentQuestion(null);
    setRound(0);
    setTotalRounds(0);
    setOpponentProgress(0);
    setRoundResult(undefined);
    setGameResult(undefined);
    setIsGameEnd(false);
    setRematchRequested(false);
    setOpponentRematchRequested(false);
  }, [leaveRoom]);

  // 観戦離脱
  const handleSpectatorLeave = useCallback(() => {
    leaveSpectate();
    setScreen('home');
    setCurrentQuestion(null);
    setRound(0);
    setTotalRounds(0);
    setPlayerProgressMap({});
    setRoundResult(undefined);
    setGameResult(undefined);
    setIsGameEnd(false);
  }, [leaveSpectate]);

  // 再戦リクエスト
  const handleRematch = useCallback(() => {
    requestRematch();
    setRematchRequested(true);
  }, [requestRematch]);

  // 進捗送信
  const handleProgress = useCallback((position: number, correctCount: number, missCount: number) => {
    sendTypingProgress(position, correctCount, missCount);
  }, [sendTypingProgress]);

  // 完了送信
  const handleComplete = useCallback((clearTime: number, correctCount: number, missCount: number) => {
    sendFinished(clearTime, correctCount, missCount);
  }, [sendFinished]);

  // 観戦参加
  const handleWatchRoom = useCallback((roomId: string, spectatorName: string) => {
    watchRoom(roomId, spectatorName);
  }, [watchRoom]);

  return (
    <div className="app">
      {screen === 'home' && (
        <Home
          isConnected={isConnected}
          error={error}
          questionSets={questionSets}
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          onWatchRoom={handleWatchRoom}
          onFetchQuestionSets={fetchQuestionSets}
          onChangeServer={handleChangeServer}
          currentServerUrl={serverUrl}
        />
      )}

      {screen === 'lobby' && room && (
        <Lobby
          room={room}
          currentPlayerId={currentPlayerId}
          questionSets={questionSets}
          onReady={setReady}
          onUpdateSettings={updateSettings}
          onLeave={handleLeave}
        />
      )}

      {screen === 'game' && room && currentQuestion && (
        <Game
          room={room}
          currentPlayerId={currentPlayerId}
          question={currentQuestion}
          round={round}
          totalRounds={totalRounds}
          opponentProgress={opponentProgress}
          onProgress={handleProgress}
          onComplete={handleComplete}
        />
      )}

      {screen === 'result' && room && (
        <Result
          room={room}
          currentPlayerId={currentPlayerId}
          roundResult={roundResult}
          gameResult={gameResult}
          isGameEnd={isGameEnd}
          rematchRequested={rematchRequested}
          opponentRematchRequested={opponentRematchRequested}
          onRematch={handleRematch}
          onLeave={handleLeave}
        />
      )}

      {screen === 'spectate-lobby' && room && (
        <SpectateLobby
          room={room}
          onLeave={handleSpectatorLeave}
        />
      )}

      {screen === 'spectate' && room && (
        <Spectate
          room={room}
          question={currentQuestion}
          round={round}
          totalRounds={totalRounds}
          playerProgressMap={playerProgressMap}
          roundResult={roundResult}
          gameResult={gameResult}
          isGameEnd={isGameEnd}
          onLeave={handleSpectatorLeave}
        />
      )}
    </div>
  );
}
