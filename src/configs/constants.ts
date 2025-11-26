export const APP_CONFIG = {
  USE_MOCK: import.meta.env.VITE_USE_MOCK === 'true', // 正式對接後端時設為 false
  API_URL: import.meta.env.VITE_API_URL || "http://localhost:8088/system/webdev/ai_env_control/scada_api",
  POLLING_INTERVAL: 2000,
  SCENE: {
    CAMERA_ZOOM: 40,
    BG_COLOR: '#020617',
    GRID_COLOR: '#334155'
  }
};