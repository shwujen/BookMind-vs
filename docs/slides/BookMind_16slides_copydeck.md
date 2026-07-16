# BookMind 投影片貼稿版（16 頁）

## Slide 01
標題：BookMind 系統介紹
副標：個人書房與知識收錄管理系統
重點：React + Vite + Express + Google Sheets

## Slide 02
標題：背景與痛點
- 收藏資訊分散在不同平台
- 難以快速查找與更新
- 缺少閱讀進度與心得追蹤

## Slide 03
標題：系統目標
- 集中管理收藏項目
- 提供完整 CRUD 與搜尋篩選
- 將資料同步保存到 Google Sheets

## Slide 04
標題：使用者情境
- 快速入庫新內容
- 持續更新閱讀進度
- 依主題回顧已讀內容

## Slide 05
標題：系統架構總覽
- Frontend：React + Vite
- Proxy：Express
- Service：Google Apps Script
- Data：Google Sheets
圖：放架構流程圖

## Slide 06
標題：技術選型理由
- React：元件化、可維護
- Vite：啟動與建置快速
- Tailwind：一致設計與高效率
- Apps Script + Sheets：低成本與易管理

## Slide 07
標題：資料流程
1. 使用者新增/修改資料
2. 前端組裝 JSON
3. /gas 轉送 Apps Script
4. 寫入 Google Sheets
5. 回傳後更新列表

## Slide 08
標題：功能 A 新增與編輯
- 表單輸入完整欄位
- 卡片點擊即編輯
- 即時更新顯示結果
（放截圖 1）

## Slide 09
標題：功能 B 搜尋與篩選
- 支援書名/作者/標籤搜尋
- 支援分類與狀態篩選
- 快速縮小結果範圍
（放截圖 2）

## Slide 10
標題：功能 C 閱讀管理與心得
- 狀態、進度、評分記錄
- 入庫日期追蹤
- Markdown 心得顯示
（放截圖 3）

## Slide 11
標題：操作流程示範
- 新增資料
- 儲存並寫入
- 列表確認
- 編輯補充心得

## Slide 12
標題：代理層價值
- 集中 API 管理
- 統一錯誤處理
- 預留驗證與權限擴充

## Slide 13
標題：環境設定與啟動
- npm install
- npm run dev
- npm run backend
- PORT / GOOGLE_APP_SCRIPT_URL

## Slide 14
標題：成效 vs 限制
成效：
- 集中管理
- 查找效率提升
- 可追蹤閱讀歷程
限制：
- 單使用者為主
- 權限控管待加強
- 缺少儀表板視覺化

## Slide 15
標題：未來規劃
- 短期：資料驗證、匯入匯出
- 中期：閱讀儀表板
- 長期：帳號與角色權限

## Slide 16
標題：結論與 QA
- BookMind 已形成完整知識管理流程
- 架構輕量且可持續擴充
- 下一步聚焦治理與體驗升級
- Q and A