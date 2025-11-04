# CRM DevLog - 開發日誌工具

一個獨立的開發日誌和監控工具，用於 CRM 5.0 系統。支持多環境監控、實時日誌查看、數據庫管理和數據遷移。

## 功能特性

### 📈 儀表板
- 實時環境狀態監控
- 數據庫連接狀態
- 連接池信息
- PostgreSQL 版本信息

### 📝 日誌系統
- 實時日誌流
- 按級別篩選（INFO, WARN, ERROR）
- 日誌搜索和分頁
- 清空日誌功能

### 🗄️ 數據庫管理
- 連接到 OFFLINE 和 ONLINE 環境
- 查看表格列表
- 執行 SQL 查詢
- 查看表格數據
- 支持分頁查看

### 🔄 數據遷移工具
- 從 OFFLINE 遷移到 ONLINE
- 單個表格遷移
- 批量遷移所有表格
- 數據完整性驗證
- 遷移進度追蹤

## 環境配置

### 必需的環境變數

```bash
# OFFLINE 環境（測試數據庫）
OFFLINE_DB_URL=postgresql://user:password@host:port/database

# ONLINE 環境（正式數據庫）
ONLINE_DB_URL=postgresql://user:password@host:port/database

# 服務器配置
PORT=3000
NODE_ENV=production
```

### 自動偵測

如果未提供 `OFFLINE_DB_URL`，系統將使用 `DATABASE_URL` 作為 OFFLINE 環境的連接字符串。

## 本地開發

### 安裝依賴
```bash
npm install
```

### 開發模式
```bash
npm run dev
```

### 生產模式
```bash
npm start
```

訪問 http://localhost:3000

## Railway 部署

### 1. 創建新應用
在 Railway 上創建新應用 `crm-devlog`

### 2. 連接 GitHub
連接到 `crm-devlog` GitHub 倉庫

### 3. 配置環境變數
在 Railway 儀表板中配置：
- `OFFLINE_DB_URL` - OFFLINE 環境的數據庫連接字符串
- `ONLINE_DB_URL` - ONLINE 環境的數據庫連接字符串
- `NODE_ENV=production`

### 4. 自動部署
推送到 GitHub 後，Railway 將自動部署

## API 端點

### 日誌 API
- `GET /api/logs` - 獲取日誌
- `POST /api/logs/clear` - 清空日誌

### 環境 API
- `GET /api/environments` - 獲取環境狀態

### 數據庫 API
- `GET /api/tables/:env` - 獲取表格列表
- `GET /api/table/:env/:table` - 獲取表格數據
- `POST /api/query` - 執行 SQL 查詢

### 遷移 API
- `POST /api/migrate` - 遷移單個表格
- `POST /api/migrate-all` - 遷移所有表格
- `POST /api/verify` - 驗證數據完整性

## 使用示例

### 查看環境狀態
訪問 http://devlog.railway.app/

### 查看日誌
1. 點擊 "📝 日誌" 標籤
2. 選擇日誌級別
3. 查看實時日誌

### 執行 SQL 查詢
1. 點擊 "🗄️ 數據庫" 標籤
2. 選擇環境（OFFLINE 或 ONLINE）
3. 輸入 SQL 查詢
4. 點擊 "▶️ 執行查詢"

### 遷移數據
1. 點擊 "🔄 數據遷移" 標籤
2. 點擊 "⚡ 遷移所有表格" 或選擇單個表格
3. 確認操作
4. 查看遷移結果

### 驗證數據
1. 點擊 "🔄 數據遷移" 標籤
2. 點擊 "✓ 驗證所有表格"
3. 查看驗證結果

## 安全性

- 完全開放訪問（無認證）- 適用於內部開發環境
- 建議在生產環境中添加認證層
- 所有 SQL 查詢使用參數化查詢防止 SQL 注入
- 表名驗證防止無效表格訪問

## 故障排除

### 無法連接到數據庫
1. 檢查環境變數是否正確配置
2. 驗證數據庫連接字符串
3. 檢查防火牆和網絡設置

### 遷移失敗
1. 檢查 OFFLINE 和 ONLINE 數據庫是否都可連接
2. 驗證表格結構是否相同
3. 查看日誌中的詳細錯誤信息

### 日誌未顯示
1. 檢查應用是否正常運行
2. 刷新頁面
3. 檢查瀏覽器控制台是否有錯誤

## 技術棧

- **後端**: Node.js + Express.js
- **數據庫**: PostgreSQL
- **前端**: HTML5 + CSS3 + Vanilla JavaScript
- **部署**: Railway

## 許可證

MIT

## 支持

如有問題或建議，請聯繫開發團隊。
