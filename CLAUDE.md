# NeetCode Tracker - 開發進度

## 專案概述
一個 Svelte + Electron 桌面應用，用於追蹤 NeetCode 150 題目練習，使用 Anki 間隔重複學習法 (SM-2 演算法)。

## 技術棧
- Electron 39 + electron-vite 5
- Svelte 5 + TypeScript
- Tailwind CSS 4 (`@tailwindcss/vite`)
- better-sqlite3

## 完成狀態: 基本功能已完成

### Phase 1: 專案初始化
- [x] 使用 electron-vite 建立專案骨架
- [x] 配置 Tailwind CSS
- [x] 安裝 better-sqlite3 (原生模組已編譯)

### Phase 2: 資料庫層
- [x] Schema 設計 (`src/main/db/index.ts`)
  - problems 表 (150 題，含 leetcode_url 和 neetcode_url)
  - problem_progress 表 (SM-2 狀態)
  - review_history 表 (複習記錄)
  - notes 表 (筆記)
  - preferences 表 (用戶設定)
- [x] NeetCode 150 題目資料 (`resources/neetcode-150.json`)
- [x] Seed 函數 (`src/main/db/seed.ts`)

### Phase 3: 核心邏輯
- [x] SM-2 演算法 (`src/main/lib/sm2.ts`)
  - 4 級評分: Again(0), Hard(1), Good(2), Easy(3)
  - 間隔計算: 第一次 1 天, 第二次 3 天, 之後乘以 ease_factor
- [x] IPC Handlers (`src/main/ipc.ts`)
  - get-problems, get-problem, get-today-reviews
  - submit-review, update-note, get-stats
  - get-categories, save-preference, get-preference
  - start-problem
- [x] Preload API 封裝 (`src/preload/index.ts`)
- [x] TypeScript 類型定義 (`src/preload/index.d.ts`)

### Phase 4: UI 組件
- [x] App.svelte (主應用，雙面板布局)
- [x] ProblemList.svelte (題目列表，搜尋/篩選)
- [x] ProblemDetail.svelte (題目詳情，筆記編輯)
- [x] ReviewModal.svelte (複習模態框，鍵盤快捷鍵)
- [x] StatsPanel.svelte (統計面板，進度環形圖)
- [x] ThemeToggle.svelte (主題切換)
- [x] Stores: problems.ts, theme.ts, stats.ts

### Phase 5: 測試
- [x] 開發模式啟動成功
- [x] 資料庫初始化成功 (150 題已導入)
- [ ] 完整 E2E 測試
- [ ] macOS 打包測試

## 關鍵文件

```
neetcode-tracker/
├── src/
│   ├── main/
│   │   ├── index.ts          # Electron 主入口
│   │   ├── ipc.ts            # IPC 通信層 (所有 API)
│   │   ├── db/
│   │   │   ├── index.ts      # DB 初始化 + Schema
│   │   │   └── seed.ts       # 題目資料導入
│   │   └── lib/
│   │       └── sm2.ts        # SM-2 演算法
│   ├── preload/
│   │   ├── index.ts          # API 橋接
│   │   └── index.d.ts        # 類型定義
│   └── renderer/src/
│       ├── App.svelte        # 主應用
│       ├── stores/           # Svelte stores
│       │   ├── problems.ts
│       │   ├── theme.ts
│       │   └── stats.ts
│       ├── components/       # UI 組件
│       │   ├── ProblemList.svelte
│       │   ├── ProblemDetail.svelte
│       │   ├── ReviewModal.svelte
│       │   ├── StatsPanel.svelte
│       │   └── ThemeToggle.svelte
│       └── assets/
│           └── main.css      # Tailwind CSS
├── resources/
│   └── neetcode-150.json     # 150 題目資料
└── package.json
```

## 開發指令

```bash
pnpm dev        # 開發模式
pnpm build      # 打包
pnpm build:mac  # macOS 打包
```

## 資料庫位置

```
~/Library/Application Support/neetcode-tracker/neetcode-tracker.db
```

## 功能特點

1. **題目追蹤**: 150 道 NeetCode 題目，支援 LeetCode 和 NeetCode 雙連結
2. **SM-2 間隔重複**: 自動計算下次複習日期
3. **熟悉度評分**: Again / Hard / Good / Easy 四級
4. **筆記功能**: 每題可添加個人筆記
5. **統計面板**: 進度環形圖、按難度統計、複習歷史
6. **篩選搜尋**: 按難度、分類、關鍵字篩選
7. **暗黑模式**: 支援 light/dark/system 三種主題
8. **今日待複習**: 顯示今日需要複習的題目數量
9. **自訂圖標**: 使用 Cometline.png 作為應用圖標

## 已知問題

- ReviewModal 有 a11y 警告 (不影響功能)

## 後續優化

1. 添加 Markdown 筆記渲染
2. 添加匯出/備份功能
3. 添加通知提醒
4. 優化 a11y 支援
