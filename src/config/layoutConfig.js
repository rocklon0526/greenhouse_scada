// src/config/layoutConfig.js

export const WAREHOUSE_LAYOUT = {
  // 場地尺寸
  dimensions: { width: 60, depth: 60 },

  // 1. 基礎設施位置 (依照圖片方位)
  infrastructure: {
    waterWall: { position: [0, 5, -28], size: [50, 4, 1], color: "#ef4444" }, // 紅色 (上)
    fans: { position: [0, 5, 28], size: [50, 4, 1], color: "#3b82f6" },       // 藍色 (下)
    acUnit: { position: [28, 2, 0], size: [4, 4, 50], color: "#eab308" },     // 黃色主機 (右)
    weatherStation: { position: [-25, 0, 35], color: "#a855f7" }              // 紫色 (左下外)
  },

  // 2. 走道感測器點位 (橘色點)
  // 假設有 5 條走道，每條走道 3 個點位
  sensorPoints: [],

  // 3. 風管 (黃色線) - 橫跨畫面
  ducts: [] 
};

// 自動生成規則化的點位
const AISLES = 3; // 走道數量
const SENSORS_PER_AISLE = 3;
const SPACING_X = 8; // 走道間距
const SPACING_Z = 15; // 感測器前後間距

for (let i = 0; i < AISLES; i++) {
  const x = (i - (AISLES - 1) / 2) * SPACING_X;
  
  // 生成風管 (與走道平行或垂直，看圖應是橫向跨越架子，這裡假設跟著走道上方走)
  WAREHOUSE_LAYOUT.ducts.push({
    position: [x, 8, 0], // 高度 8
    size: [0.5, 0.5, 50] // 長管
  });

  // 生成感測器點
  for (let j = 0; j < SENSORS_PER_AISLE; j++) {
    const z = (j - (SENSORS_PER_AISLE - 1) / 2) * SPACING_Z;
    WAREHOUSE_LAYOUT.sensorPoints.push({
      id: `Aisle-${i+1}-Point-${j+1}`,
      position: [x, 4, z], // 懸吊在半空中
      aisle: i + 1
    });
  }
}

// 4. 架子 (Racks) - 放在走道之間
WAREHOUSE_LAYOUT.racks = [];
for (let i = 0; i < AISLES + 1; i++) { // 架子比走道多一排或是穿插
   // 簡化：在走道兩側生成架子
   const x = (i - AISLES / 2) * SPACING_X - (SPACING_X/2); 
   if(i > 0) { // 避免最左邊溢出，簡單排一下
      WAREHOUSE_LAYOUT.racks.push({
        id: `R-${i}`,
        position: [x + 4, 0, 0], // 稍微偏移
        levels: 5,
        width: 2,
        length: 40,
        height: 6
      });
   }
}