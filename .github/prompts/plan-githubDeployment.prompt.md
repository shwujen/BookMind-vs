## Plan: GitHub 部署流程（初學者版）

目標：協助使用者在沒有 Git 經驗的情況下，將目前專案上傳到 GitHub，並了解是否要進一步部署成 GitHub Pages。

### 1. 準備工作
- 確認已安裝 Git
- 註冊 GitHub 帳號並登入
- 先確認專案已在本機可正常執行

### 2. 初始化 Git 與建立儲存庫
- 在專案根目錄執行 `git init`
- 建立 `.gitignore`，排除 `node_modules`、`dist`、`.env` 等不需要上傳的檔案
- 執行 `git add .` 與 `git commit -m "Initial commit"`

### 3. 建立 GitHub 遠端儲存庫
- 在 GitHub 網站建立新的 Repository
- 取得遠端網址，例如 `https://github.com/使用者名稱/專案名稱.git`
- 執行 `git remote add origin <repo-url>`
- 執行 `git branch -M main`
- 執行 `git push -u origin main`

### 4. 若要部署成網站（選用）
- 若要部署到 GitHub Pages，需在 GitHub Repo 設定 Pages
- 可選擇使用 `gh-pages` 套件或直接使用 GitHub Actions
- 這一步屬於進階部署，建議先完成「上傳到 GitHub」再決定

### 5. 後續建議
- 每次修改後重複：`git add .` → `git commit -m "..."` → `git push`
- 若想要更順手，可安裝 GitHub Desktop 來減少命令列操作

### 6. 需先確認的事項
- 是否只是要把程式碼放上 GitHub
- 或是要把網站實際部署到 GitHub Pages
- 目前專案是否需要先設定 `.env` 與敏感資訊排除
