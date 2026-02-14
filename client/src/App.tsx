import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './hooks/useSocket';
import { Home } from './components/Home';
import { Lobby } from './components/Lobby';
import { Game } from './components/Game';
import { Result } from './components/Result';
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

  const {
    socket,
    isConnected,
    room,
    error,
    questionSets,
    createRoom,
    joinRoom,
    leaveRoom,
    updateSettings,
    setReady,
    sendTypingProgress,
    sendFinished,
    requestRematch,
    fetchQuestionSets,
    onGameStart,
    onOpponentProgress,
    onRoundEnd,
    onGameEnd,
    onRematchRequested,
    onRematchStart
  } = useSocket(serverUrl);

  // ソケットID（プレイヤーID）
  const currentPlayerId = socket?.id || '';

  // イベントハンドラを設定
  useEffect(() => {
    onGameStart((data) => {
      setCurrentQuestion(data.question);
      setRound(data.round);
      setTotalRounds(data.totalRounds);
      setOpponentProgress(0);
      setRoundResult(undefined);
      setScreen('game');
      soundManager.play('start');
    });

    onOpponentProgress((data) => {
      setOpponentProgress(data.progress);
    });

    onRoundEnd((data) => {
      setRoundResult(data.result);
      setScreen('result');
    });

    onGameEnd((data) => {
      setGameResult(data.result);
      setIsGameEnd(true);
      setScreen('result');
    });

    onRematchRequested(() => {
      // 相手が再戦をリクエストした場合、自動的に再戦を開始
      // 両者がリクエストしたら再戦開始
    });

    onRematchStart(() => {
      setScreen('lobby');
      setCurrentQuestion(null);
      setRound(0);
      setTotalRounds(0);
      setOpponentProgress(0);
      setRoundResult(undefined);
      setGameResult(undefined);
      setIsGameEnd(false);
      setRematchRequested(false);
    });
  }, [onGameStart, onOpponentProgress, onRoundEnd, onGameEnd, onRematchRequested, onRematchStart]);

  // ルームに参加したらロビーへ
  useEffect(() => {
    if (room && screen === 'home') {
      setScreen('lobby');
      soundManager.play('ready');
    }
  }, [room, screen]);

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
  }, [leaveRoom]);

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

  return (
    <div className="app">
      {screen === 'home' && (
        <Home
          isConnected={isConnected}
          error={error}
          questionSets={questionSets}
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
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
          onRematch={handleRematch}
          onLeave={handleLeave}
        />
      )}
    </div>
  );
}
