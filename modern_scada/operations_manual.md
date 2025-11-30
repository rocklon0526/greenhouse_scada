# 維運者手冊 (Operations Manual)

## 1. 系統部署

### 1.1 部署架構
本系統所有服務皆容器化，透過 `docker-compose.yml` 進行統一管理。
*   **Frontend Container**: Nginx 伺服器，託管 React 靜態檔案。
*   **Backend Container**: FastAPI 應用程式伺服器。
*   **Database Container**: PostgreSQL 資料庫。
*   **Simulator Container**: Modbus TCP 模擬器（生產環境可替換為真實 PLC）。

### 1.2 部署步驟
1.  **準備環境**：確保伺服器已安裝 Docker Engine 與 Docker Compose。
2.  **取得程式碼**：將專案程式碼複製到伺服器。
3.  **設定環境變數**：
    *   檢查 `backend/.env` 檔案（若無則需建立），設定資料庫密碼與密鑰。
    *   範例：
        ```env
        DATABASE_URL=postgresql://user:password@timeseries-db:5432/scada
        SECRET_KEY=your_secret_key
        ```
4.  **啟動服務**：
    ```bash
    docker-compose up -d --build
    ```
5.  **驗證部署**：
    *   檢查容器狀態：`docker-compose ps`
    *   訪問前端頁面：`http://<server-ip>:80` (或設定的 Port)。

## 2. 參數設定

### 2.1 系統設定檔 (`backend/config.yaml`)
此檔案定義了 SCADA 系統的核心配置，修改後需重啟 `backend-core` 容器生效。
*   **Modbus 連線**：
    ```yaml
    modbus:
      host: plc-sim  # PLC IP 位址
      port: 502      # PLC Port
    ```
*   **感測器標籤 (Tags)**：
    定義每個感測器的 Modbus 地址與數據類型。
    ```yaml
    tags:
      - name: sensor_1_top_temp
        address: 100
        type: float
      # ... 其他標籤
    ```

### 2.2 前端設定
*   **API URL**: 預設透過 Nginx 反向代理 `/api` 至後端。若需修改，請調整 `frontend/nginx.conf` 或 `frontend/vite.config.ts` (開發環境)。

## 3. 維護與監控

### 3.1 資料庫備份
定期備份 PostgreSQL 資料庫：
```bash
docker exec -t timeseries-db pg_dumpall -c -U postgres > dump_`date +%d-%m-%Y"_"%H_%M_%S`.sql
```

### 3.2 系統更新
1.  拉取最新程式碼 (`git pull`)。
2.  重新建置並啟動容器：
    ```bash
    docker-compose up -d --build
    ```

### 3.3 故障排除
*   **服務無法啟動**：檢查 Port 是否被佔用（預設 80, 8000, 502, 5432）。
*   **資料庫連線錯誤**：檢查 `docker-compose.yml` 中的 `POSTGRES_PASSWORD` 是否與後端 `DATABASE_URL` 一致。
