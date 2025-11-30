# 🌿 Greenhouse OS - 現代化溫室 SCADA 系統

Greenhouse OS 是一個專為智慧溫室管理設計的現代化 SCADA 系統。它結合了即時監控、互動式 3D 可視化和自動化控制邏輯，並採用穩健的微服務架構。

## 🎯 專案目標

本專案旨在提供一個全方位的溫室管理解決方案，主要目標包括：

1.  **即時環境監控**：透過部署於溫室各處的感測器，即時採集溫度、濕度、CO2 濃度等關鍵數據，並計算區域平均值以供決策參考。
2.  **直觀的 3D 可視化**：利用 Web 3D 技術 (Three.js)，將溫室現場狀況以數位孿生 (Digital Twin) 的方式呈現，讓管理者能直觀地掌握設備狀態與環境分佈。
3.  **精確的設備控制**：提供對攪拌桶 (Mixer)、營養液桶 (Rack Tank)、閥門與幫浦的遠端控制功能，並支援自動化生產流程（如自動補水、配方混合）。
4.  **數據驅動決策**：整合戶外氣象站數據與歷史生產數據，協助優化種植策略。

## 🚀 快速啟動 (Quick Start)

### 前置需求
*   Docker & Docker Compose
*   Git

### 安裝與啟動

1.  **複製專案 (Clone Repository)**
    ```bash
    git clone <repository_url>
    cd greenhouse-scada
    ```

2.  **啟動系統 (Start System)**
    進入 `modern_scada` 目錄並啟動 Docker 容器：
    ```bash
    cd modern_scada
    docker-compose up -d --build
    ```

3.  **訪問應用程式**
    *   **儀表板 (Dashboard)**: [http://localhost:5173](http://localhost:5173) (開發模式) 或 [http://localhost](http://localhost) (生產模式)
    *   **API 文件**: [http://localhost:8000/docs](http://localhost:8000/docs)
    *   **預設登入帳號**: `admin` / `admin123`

## 📚 詳細文件 (Documentation)

本專案包含完整的技術文件，位於 `modern_scada/` 目錄下：

*   **[使用者手冊 (User Manual)](modern_scada/user_manual.md)**:
    *   系統登入與介面導覽
    *   3D 視圖操作與數據查看
    *   設備控制與生產流程操作
*   **[開發者手冊 (Developer Manual)](modern_scada/developer_manual.md)**:
    *   系統架構與微服務說明
    *   本地開發環境建置 (Frontend/Backend)
    *   測試指南 (E2E Test) 與除錯技巧
*   **[維運者手冊 (Operations Manual)](modern_scada/operations_manual.md)**:
    *   Docker 容器部署與管理
    *   系統參數設定 (`config.yaml`)
    *   資料庫備份與還原
*   **[系統規格書 (System Specification)](modern_scada/system_spec.md)**:
    *   專案目錄結構詳解
    *   核心資料流 (Data Flow) 與 Modbus 通訊邏輯
    *   資料庫 Schema 設計

## 🏗 系統架構

本系統由以下 Docker 服務組成：
*   **frontend**: React + TypeScript + Vite (負責 UI 與 3D 渲染)
*   **backend-core**: FastAPI + Python (負責 API、WebSocket 與邏輯控制)
*   **timeseries-db**: PostgreSQL (負責儲存歷史數據)
*   **plc-sim**: Modbus TCP Simulator (模擬 PLC 硬體行為)

## 🛡 版權聲明

Private Project. All rights reserved.