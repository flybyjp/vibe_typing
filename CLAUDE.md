# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Language

ユーザーには日本語で応答してください。

## Commands

```bash
# 開発（サーバー + クライアント同時起動）
npm run dev

# サーバーのみ（localhost:3001）
npm run dev:server

# クライアントのみ（localhost:5173）
npm run dev:client

# 全パッケージインストール
npm run install:all

# クライアントビルド → server/dist から配信
npm run build
npm start
```

テストフレームワークは未導入。

## Architecture

Socket.ioベースのリアルタイムタイピング対戦ゲーム（2人対戦）。

```
shared/types.ts          ← クライアント・サーバー共有の型定義
server/src/index.ts      ← Express + Socket.io サーバー (port 3001)
server/src/socket/       ← handlers.ts (イベントルーティング), roomManager.ts (ルーム・ゲーム状態管理)
server/src/game/         ← gameEngine.ts (スコア計算), questionLoader.ts (CSV読み込み)
server/data/questions/   ← 問題CSV (日本語文,ひらがな読み)
client/src/App.tsx       ← 画面遷移管理 (home → lobby → game → result)
client/src/hooks/        ← useSocket.ts (Socket.io通信), useTyping.ts (入力判定)
client/src/utils/        ← romajiConverter.ts (ひらがな→ローマ字変換), sound.ts (Web Audio効果音)
client/src/components/   ← Home, Lobby, Game, Result, TypingArea, ProgressBar
```

### 通信フロー

クライアント↔サーバー間はSocket.ioイベントで通信。型定義は `shared/types.ts` の `ClientToServerEvents` / `ServerToClientEvents` で管理。サーバー側は `TypedSocket` / `TypedServer` で型安全に使用。

### ゲームフロー

1. ルーム作成/参加 → 2. ロビーで設定・準備 → 3. 両者準備完了でゲーム開始 → 4. タイピング（進捗リアルタイム配信）→ 5. ラウンド結果 → 6. 次ラウンドまたは最終結果

### ローマ字変換

`romajiConverter.ts` は複数の入力パターン（si/shi/ci等）、拗音、促音（っ→子音重複）に対応するステートマシン。`useTyping.ts` がキー入力ごとに変換器を呼び出し、進捗を5%刻みでサーバーに送信。

### ルーム管理

`roomManager.ts` が全ルーム・ゲーム状態をMapで管理（シングルトン）。ルームIDは大文字6文字。ホスト退出時は残りプレイヤーにホスト権移行。勝利条件は `Math.ceil(rounds / 2)` 勝。

## Key Conventions

- CSS Modules（`*.module.css`）でスタイリング
- 問題追加は `server/data/questions/` に CSV（`日本語文,ひらがな読み`）を配置するだけで自動認識
- CORS設定: 開発環境は `origin: true`（LAN対戦対応）、本番は `false`（静的配信のみ）
- Vite設定: `host: true` でLAN公開済み
