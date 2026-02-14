import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  Room,
  Player,
  Question,
  RoomSettings,
  RoundResult,
  GameResult,
  QuestionSetInfo
} from '../types';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface UseSocketReturn {
  socket: TypedSocket | null;
  isConnected: boolean;
  room: Room | null;
  error: string | null;
  questionSets: QuestionSetInfo[];

  // ルーム操作
  createRoom: (playerName: string, settings: RoomSettings) => void;
  joinRoom: (roomId: string, playerName: string) => void;
  leaveRoom: () => void;
  updateSettings: (settings: RoomSettings) => void;

  // ゲーム操作
  setReady: (isReady: boolean) => void;
  sendTypingProgress: (position: number, correctCount: number, missCount: number) => void;
  sendFinished: (clearTime: number, correctCount: number, missCount: number) => void;
  requestRematch: () => void;
  fetchQuestionSets: () => void;

  // イベントハンドラ設定
  onGameStart: (handler: (data: { question: Question; round: number; totalRounds: number }) => void) => void;
  onOpponentProgress: (handler: (data: { playerId: string; progress: number }) => void) => void;
  onRoundEnd: (handler: (data: { result: RoundResult; scores: Record<string, number> }) => void) => void;
  onGameEnd: (handler: (data: { result: GameResult }) => void) => void;
  onRematchRequested: (handler: (data: { playerId: string }) => void) => void;
  onRematchStart: (handler: () => void) => void;
}

export function useSocket(serverUrl: string): UseSocketReturn {
  const socketRef = useRef<TypedSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [questionSets, setQuestionSets] = useState<QuestionSetInfo[]>([]);

  // イベントハンドラの参照を保持
  const handlersRef = useRef<{
    onGameStart?: (data: { question: Question; round: number; totalRounds: number }) => void;
    onOpponentProgress?: (data: { playerId: string; progress: number }) => void;
    onRoundEnd?: (data: { result: RoundResult; scores: Record<string, number> }) => void;
    onGameEnd?: (data: { result: GameResult }) => void;
    onRematchRequested?: (data: { playerId: string }) => void;
    onRematchStart?: () => void;
  }>({});

  useEffect(() => {
    const socket = io(serverUrl, {
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
      console.log('Connected to server');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    });

    socket.on('connect_error', (err) => {
      setError(`接続エラー: ${err.message}`);
      setIsConnected(false);
    });

    // ルーム関連イベント
    socket.on('roomCreated', ({ roomId, room }) => {
      setRoom(room);
      setError(null);
    });

    socket.on('roomJoined', ({ room }) => {
      setRoom(room);
      setError(null);
    });

    socket.on('playerJoined', ({ player, room }) => {
      setRoom(room);
    });

    socket.on('playerLeft', ({ playerId, room }) => {
      setRoom(room);
    });

    socket.on('settingsUpdated', ({ settings }) => {
      setRoom(prev => prev ? { ...prev, settings } : null);
    });

    socket.on('roomError', ({ message }) => {
      setError(message);
    });

    socket.on('playerReady', ({ playerId }) => {
      setRoom(prev => {
        if (!prev) return null;
        return {
          ...prev,
          players: prev.players.map(p =>
            p.id === playerId ? { ...p, isReady: true } : p
          )
        };
      });
    });

    socket.on('playerUnready', ({ playerId }) => {
      setRoom(prev => {
        if (!prev) return null;
        return {
          ...prev,
          players: prev.players.map(p =>
            p.id === playerId ? { ...p, isReady: false } : p
          )
        };
      });
    });

    // ゲーム関連イベント
    socket.on('gameStart', (data) => {
      setRoom(prev => prev ? { ...prev, status: 'playing' } : null);
      handlersRef.current.onGameStart?.(data);
    });

    socket.on('opponentProgress', (data) => {
      handlersRef.current.onOpponentProgress?.(data);
    });

    socket.on('roundEnd', (data) => {
      setRoom(prev => prev ? { ...prev, scores: data.scores } : null);
      handlersRef.current.onRoundEnd?.(data);
    });

    socket.on('gameEnd', (data) => {
      setRoom(prev => prev ? { ...prev, status: 'finished' } : null);
      handlersRef.current.onGameEnd?.(data);
    });

    socket.on('rematchRequested', (data) => {
      handlersRef.current.onRematchRequested?.(data);
    });

    socket.on('rematchStart', () => {
      setRoom(prev => prev ? {
        ...prev,
        status: 'waiting',
        currentRound: 0,
        players: prev.players.map(p => ({ ...p, isReady: false })),
        scores: Object.fromEntries(prev.players.map(p => [p.id, 0]))
      } : null);
      handlersRef.current.onRematchStart?.();
    });

    socket.on('questionSets', ({ sets }) => {
      setQuestionSets(sets);
    });

    return () => {
      socket.disconnect();
    };
  }, [serverUrl]);

  // ルーム操作
  const createRoom = useCallback((playerName: string, settings: RoomSettings) => {
    socketRef.current?.emit('createRoom', { playerName, settings });
  }, []);

  const joinRoom = useCallback((roomId: string, playerName: string) => {
    socketRef.current?.emit('joinRoom', { roomId, playerName });
  }, []);

  const leaveRoom = useCallback(() => {
    socketRef.current?.emit('leaveRoom');
    setRoom(null);
  }, []);

  const updateSettings = useCallback((settings: RoomSettings) => {
    socketRef.current?.emit('updateSettings', settings);
  }, []);

  // ゲーム操作
  const setReady = useCallback((isReady: boolean) => {
    if (isReady) {
      socketRef.current?.emit('ready');
    } else {
      socketRef.current?.emit('unready');
    }
  }, []);

  const sendTypingProgress = useCallback((position: number, correctCount: number, missCount: number) => {
    socketRef.current?.emit('typing', { position, correctCount, missCount });
  }, []);

  const sendFinished = useCallback((clearTime: number, correctCount: number, missCount: number) => {
    socketRef.current?.emit('finished', { clearTime, correctCount, missCount });
  }, []);

  const requestRematch = useCallback(() => {
    socketRef.current?.emit('requestRematch');
  }, []);

  const fetchQuestionSets = useCallback(() => {
    socketRef.current?.emit('getQuestionSets');
  }, []);

  // イベントハンドラ設定
  const onGameStart = useCallback((handler: (data: { question: Question; round: number; totalRounds: number }) => void) => {
    handlersRef.current.onGameStart = handler;
  }, []);

  const onOpponentProgress = useCallback((handler: (data: { playerId: string; progress: number }) => void) => {
    handlersRef.current.onOpponentProgress = handler;
  }, []);

  const onRoundEnd = useCallback((handler: (data: { result: RoundResult; scores: Record<string, number> }) => void) => {
    handlersRef.current.onRoundEnd = handler;
  }, []);

  const onGameEnd = useCallback((handler: (data: { result: GameResult }) => void) => {
    handlersRef.current.onGameEnd = handler;
  }, []);

  const onRematchRequested = useCallback((handler: (data: { playerId: string }) => void) => {
    handlersRef.current.onRematchRequested = handler;
  }, []);

  const onRematchStart = useCallback((handler: () => void) => {
    handlersRef.current.onRematchStart = handler;
  }, []);

  return {
    socket: socketRef.current,
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
  };
}
