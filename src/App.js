import React from 'react';
// 引入我們寫好的 SCADA 主程式
import GreenhouseClient from './GreenhouseClient.jsx'; 

function App() {
  return (
    // 讓 App 直接顯示我們的 SCADA 介面
    <GreenhouseClient />
  );
}

export default App;