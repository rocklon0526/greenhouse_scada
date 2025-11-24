// 系統全域設定
export const APP_CONFIG = {
  // 開發模式開關 (true = 使用假數據, false = 連接 Ignition)
  USE_MOCK: true,
  
  // Ignition WebDev API 地址
  API_URL: "http://localhost:8088/system/webdev/GreenhouseProject/scada_api",
  
  // 數據更新頻率 (毫秒)
  POLLING_INTERVAL: 2000,
  
  // 3D 場景設定
  SCENE: {
    CAMERA_ZOOM: 40,
    BG_COLOR: '#020617',
    GRID_COLOR: '#334155'
  }
};