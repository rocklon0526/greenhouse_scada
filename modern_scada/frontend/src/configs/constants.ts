export const APP_CONFIG = {
  USE_MOCK: import.meta.env.VITE_USE_MOCK,
  API_URL: import.meta.env.VITE_API_URL || "/api",
  POLLING_INTERVAL: 2000,
  SCENE: {
    CAMERA_ZOOM: 40,
    BG_COLOR: '#020617',
    GRID_COLOR: '#334155'
  }
};