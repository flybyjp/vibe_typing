import type { RoundResult, PlayerRoundStats, GameResult, PlayerFinalStats, ServerRoom } from '../types/index.js';

export function calculateRoundResult(
  room: ServerRoom,
  winnerId: string,
  round: number
): RoundResult {
  const players: PlayerRoundStats[] = [];

  if (!room.gameState) {
    return { round, winnerId, players };
  }

  room.players.forEach(player => {
    const state = room.gameState!.playerStates.get(player.id);
    if (!state) return;

    const clearTime = state.finishTime
      ? state.finishTime - (state.startTime || room.gameState!.roundStartTime)
      : Date.now() - (state.startTime || room.gameState!.roundStartTime);

    const totalKeystrokes = state.correctCount + state.missCount;
    const accuracy = totalKeystrokes > 0
      ? Math.round((state.correctCount / totalKeystrokes) * 100)
      : 0;

    // KPM = (正しいキー数 / 経過時間(分))
    const minutes = clearTime / 60000;
    const kpm = minutes > 0 ? Math.round(state.correctCount / minutes) : 0;

    players.push({
      playerId: player.id,
      playerName: player.name,
      clearTime,
      kpm,
      accuracy,
      correctCount: state.correctCount,
      missCount: state.missCount
    });
  });

  return { round, winnerId, players };
}

export function calculateGameResult(room: ServerRoom): GameResult {
  const playerFinalStats: PlayerFinalStats[] = [];

  // 勝者を決定
  let winnerId: string | null = null;
  let maxScore = 0;
  let isTie = false;

  for (const [playerId, score] of Object.entries(room.scores)) {
    if (score > maxScore) {
      maxScore = score;
      winnerId = playerId;
      isTie = false;
    } else if (score === maxScore && maxScore > 0) {
      isTie = true;
    }
  }

  if (isTie) {
    winnerId = null;
  }

  // 各プレイヤーの最終統計を計算（ラウンド結果から平均を算出）
  room.players.forEach(player => {
    const playerRoundStats = room.roundResults
      .flatMap(r => r.players)
      .filter(p => p.playerId === player.id);

    const roundCount = playerRoundStats.length;
    const totalKpm = roundCount > 0
      ? Math.round(playerRoundStats.reduce((sum, s) => sum + s.kpm, 0) / roundCount)
      : 0;
    const totalAccuracy = roundCount > 0
      ? Math.round(playerRoundStats.reduce((sum, s) => sum + s.accuracy, 0) / roundCount)
      : 0;

    playerFinalStats.push({
      playerId: player.id,
      playerName: player.name,
      wins: room.scores[player.id] || 0,
      totalKpm,
      totalAccuracy
    });
  });

  return {
    winnerId,
    rounds: room.roundResults,
    players: playerFinalStats
  };
}

export function isGameFinished(room: ServerRoom): boolean {
  const targetWins = Math.ceil(room.settings.rounds / 2);

  for (const score of Object.values(room.scores)) {
    if (score >= targetWins) {
      return true;
    }
  }

  return room.currentRound >= room.settings.rounds;
}
