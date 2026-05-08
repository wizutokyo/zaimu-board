# Zaimu Board 💰

個人財務可視化PWAアプリ。支出・収入・資産・負債を記録し、PL/BS/ダッシュボードで財務状況を把握できます。

## 特徴

- 完全オフライン動作（IndexedDB）
- PWA対応・ホーム画面追加可能
- GitHub Pages無料公開

## セットアップ

```bash
npm install
npm run dev
```

## GitHub Pages へのデプロイ手順

### 1. リポジトリを作成

GitHubで `zaimu-board` という名前のリポジトリを作成します（Publicで）。

### 2. vite.config.ts の base を確認

```ts
const REPO_NAME = 'zaimu-board'  // ← リポジトリ名と一致させる
```

### 3. GitHub Pages の設定

GitHub → Settings → Pages → **Source: GitHub Actions** を選択。

### 4. プッシュ

```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/zaimu-board.git
git push -u origin main
```

→ 自動でビルド・デプロイされます。  
→ `https://YOUR_USERNAME.github.io/zaimu-board/` でアクセス可能。

## スマホ ホーム画面への追加（iOS Safari）

1. 上記URLをiPhone Safariで開く
2. 画面下部の「共有」ボタン（↑）をタップ
3. 「ホーム画面に追加」を選択
4. 「追加」をタップ
5. ホーム画面のアイコンからオフラインで起動可能 ✅

## 技術スタック

| 項目 | 技術 |
|---|---|
| フロントエンド | React + TypeScript + Vite |
| スタイリング | Tailwind CSS |
| データ保存 | Dexie.js（IndexedDB） |
| グラフ | Recharts |
| PWA | vite-plugin-pwa |
| 公開 | GitHub Pages |
