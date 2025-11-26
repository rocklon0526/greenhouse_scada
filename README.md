# 🌿 Greenhouse OS - Web SCADA System

![License](httpsjp://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-zn.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Vite](https://img.shields.io/badge/Vite-5-purple)
![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-qc.svg)

**Greenhouse OS** is a modern, web-based SCADA (Supervisory Control and Data Acquisition) system designed for intelligent greenhouse management. It combines real-time data monitoring, interactive 3D visualization, and automated device control into a seamless user interface.

> Built with React, Three.js (Fiber), and TypeScript.

## ✨ Key Features

* **🖥️ Interactive 3D Visualization**:
    * Full 3D representation of the greenhouse layout using `React Three Fiber`.
    * Visual status indicators for Vertical Racks, Sensor Groups (Top/Mid/Bot), and Infrastructure.
    * Interactive elements: Click on sensors or devices to view details.

* **QC Real-time Monitoring**:
    * Visualizes Temperature, Humidity, and CO2 levels across different vertical levels (Z-axis).
    * Integrated **Weather Station** panel for outdoor conditions (UV, Temp, Humidity).
    * Historical data trending charts on the dashboard.

* **QC Device Control**:
    * **Manual/Auto Modes**: Toggle system-wide automation.
    * **Equipment Control**: Manage Water Walls, Exhaust Fans, and AC Units.
    * Configurable parameters (ejp. Fan Speed, Water Level, Target Temperature).

* **⚙️ Automation Logic Builder**:
    * **No-Code Rule Engine**: Create custom logic rules (e.g., "IF Indoor Temp > 28°C THEN Turn ON Fans").
    * Support for AND/OR logic conditions.
    * Priority-based execution.

* **🎨 Responsive & Modern UI**:
    * Dark mode aesthetic utilizing Tailwind CSS.
    * Glassmorphism design elements.
    * Fully responsive layout for desktop and tablet monitoring.

## 🛠️ Tech Stack

* **Core**: React 18, TypeScript, Vite
* **Styling**: Tailwind CSS, Lucide React (Icons)
* **State Management**: Zustand
* **3D Graphics**: @react-three/fiber, @react-three/drei, Three.js
* **Routing**: React Router DOM

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites

* Node.js (v16 or higher)
* npm or yarn

### Installation

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/rocklon0526/greenhouse_scada.git](https://github.com/rocklon0526/greenhouse_scada.git)
    cd greenhouse_scada
    ```

2.  **Install dependencies**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Configure Environment**
    Create a `.env` file in the root directory (optional if using defaults):
    ```env
    VITE_API_URL=http://localhost:8088/system/webdev/ai_env_control/scada_api
    VITE_USE_MOCK=true
    ```
    *Set `VITE_USE_MOCK=true` to run without a backend server.*

4.  **Run Development Server**
    ```bash
    npm run dev
    ```
    Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

## ws Project Structure

```text
src/
├── components/
│   ├── 3d/            # Three.js components (VerticalRack, Fan3D, etc.)
│   ├── devices/       # Device control modals
│   ├── logic/         # Rule builder components
│   └── ui/            # Reusable UI cards/buttons
├── configs/
│   ├── constants.ts   # App-wide constants
│   └── layoutConfig.ts # Warehouse layout & 3D coordinates definition
├── mocks/             # Mock data generators for demo mode
├── pages/
│   ├── OverviewPage.tsx  # Main 3D Scene
│   ├── DashboardPage.tsx # 2D Data & Charts
│   └── LogicPage.tsx     # Automation Logic Builder
├── services/          # API integration
├── stores/            # Global state (Zustand)
└── types/             # TypeScript interfaces
```

SCADA 系統架構與控制流程圖

本文檔包含兩張圖表，旨在說明智慧溫室 SCADA 系統的整體架構以及「高溫自動排風」的控制邏輯流程。

1. 系統架構圖 (System Architecture)

此圖表展示了系統中各個層級（使用者層、伺服器層、設備層）之間的連接關係與通訊協定。
```mermaid
graph TD
    subgraph User_Layer [使用者層]
        direction TB
        Browser[網頁瀏覽器]
        ThreeJS[3D 視覺化]
        Dashboard[儀表板]
        
        Browser --> ThreeJS
        Browser --> Dashboard
    end

    subgraph Server_Layer [伺服器層]
        direction TB
        Backend[後端服務]
        DB[資料庫]
        
        Backend <-->|讀寫歷史數據| DB
    end

    subgraph Field_Layer [現場設備層]
        direction TB
        PLC[PLC 控制器]
        Sensor[溫度感測器]
        Fan[排風扇]
        
        PLC -->|電氣訊號| Sensor
        PLC -->|電氣訊號| Fan
    end

    %% 連接關係
    Browser <-->|HTTP REST API / WebSocket| Backend
    Backend <-->|Modbus TCP| PLC

    %% 樣式設定
    classDef userFill fill:#e1f5fe,stroke:#01579b,stroke-width:2px;
    classDef serverFill fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px;
    classDef fieldFill fill:#fff3e0,stroke:#ef6c00,stroke-width:2px;

    class Browser,ThreeJS,Dashboard userFill;
    class Backend,DB serverFill;
    class PLC,Sensor,Fan fieldFill;
```

2. 高溫自動排風控制時序圖 (High Temp Auto-Ventilation Sequence)

此時序圖詳細描述了當溫室溫度超過設定值（例如 28°C）時，系統如何自動偵測並觸發排風扇的動作流程。

```mermaid
sequenceDiagram
    autonumber
    participant Frontend as 前端 (React UI)
    participant Backend as 後端 (Logic Engine)
    participant DB as 資料庫
    participant PLC as PLC (Modbus Slave)
    participant Devices as 現場設備 (Sensor/Fan)

    Note over Backend, PLC: 1. 定期輪詢 (Polling Loop)
    
    loop 每 1 秒
        Backend->>PLC: Read Holding Register (40001) [取得溫度]
        PLC-->>Backend: Return Value: 285 (代表 28.5°C)
        
        Backend->>Backend: 檢查邏輯規則: IF Temp > 28.0
        
        rect rgb(255, 240, 240)
            Note over Backend: 觸發高溫邏輯
            Backend->>PLC: Write Coil (00001) = ON [啟動風扇]
            PLC->>Devices: 通電繼電器
            Devices-->>PLC: 風扇開始運轉
        end
        
        Backend->>DB: Insert Log {time: now, temp: 28.5, fan: ON}
    end

    Note over Frontend, Backend: 2. 前端更新 (UI Update)

    loop 每 2 秒
        Frontend->>Backend: GET /api/status
        Backend-->>Frontend: JSON { temp: 28.5, devices: { fan-1: "ON" } }
        
        Frontend->>Frontend: 更新 3D 模型 (風扇旋轉動畫)
        Frontend->>Frontend: 更新 Dashboard (顯示警告紅燈)
    end
```