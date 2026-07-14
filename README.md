# BookMind

BookMind 是一個以 React + Vite 建立的個人書房與知識收錄管理系統，主要用來管理書籍、影集、文章等收藏項目，並將資料同步儲存到 Google Sheets。

## 1. 系統目標

- 建立一個簡潔的個人書房管理介面
- 支援新增、編輯、刪除、搜尋與分類瀏覽
- 將書目資料與閱讀管理資訊保存到 Google Sheets
- 讓使用者可快速記錄書名、作者、來源、分類、標籤、加入日期、閱讀狀態、進度與心得

## 2. 系統設計

### 前端
- React 19 + Vite
- Tailwind CSS 進行畫面設計
- Lucide React 提供圖示
- Marked 用於渲染 Markdown 心得內容

### 後端與資料層
- Express 作為本地代理伺服器
- 透過 Google Apps Script Web App 與 Google Sheets 互動
- 前端透過 Vite 的代理路由 /gas 將請求轉送到 Apps Script

### 資料流程
1. 使用者在網頁上新增或修改資料
2. 前端組裝 JSON payload
3. 請求送往 Google Apps Script
4. Apps Script 將資料寫入或更新 Google Sheets
5. 重新讀取資料後，前端將結果整理並顯示在卡片列表中

## 3. 主要功能

- 新增收錄項目
- 編輯既有項目
- 刪除項目
- 搜尋書名、作者或標籤
- 依分類與閱讀狀態進行篩選
- 記錄加入書庫日期
- 記錄閱讀進度、狀態與評分
- 支援 Markdown 格式的心得筆記

## 4. 操作流程

### 啟動開發環境
1. 安裝依賴
   ```bash
   npm install
   ```
2. 啟動前端開發伺服器
   ```bash
   npm run dev
   ```
3. 前端預設可透過 http://localhost:3000 開啟

### 啟動後端代理（選用）
```bash
npm run backend
```

### 新增書籍或內容
1. 在左側表單輸入書名與相關資訊
2. 選擇分類、標籤與加入日期
3. 填寫閱讀狀態、進度與心得
4. 點擊「加入書本庫」完成新增

### 編輯現有項目
1. 點擊卡片即可進入編輯模式
2. 修改欄位內容
3. 點擊「確認修改」即可更新資料

### 刪除項目
1. 點擊卡片右上角的刪除圖示
2. 確認刪除後，資料會從清單中移除

### 搜尋與篩選
- 使用上方搜尋欄位可依書名、作者或標籤搜尋
- 使用分類與狀態下拉選單進行快速過濾

## 5. 環境設定

專案使用以下環境變數：

- PORT：Express 後端埠號，預設為 5000
- GOOGLE_APP_SCRIPT_URL：Google Apps Script Web App 的網址

範例：
```env
PORT=5000
GOOGLE_APP_SCRIPT_URL=https://your-script-url/exec
```

## 6. 專案結構

- src/App.jsx：主要 UI 與業務邏輯
- src/main.jsx：React 進入點
- server.js：Express 代理與 API 路由
- vite.config.js：Vite 伺服器與 /gas 代理設定
- public/：靜態資源

## 7. 備註

目前卡片顯示以「入庫日期」為主要日期資訊，並會依照 Sheets 中的實際內容顯示。
