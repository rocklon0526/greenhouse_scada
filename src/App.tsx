import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import GreenhouseClient from './GreenhouseClient';
import DashboardPage from './pages/DashboardPage';
import LogicPage from './pages/LogicPage';
import FormulaPage from './pages/FormulaPage';
import DosingConfigPage from './pages/DosingConfigPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GreenhouseClient />}>
          <Route index element={<></>} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="logic" element={<LogicPage />} />
          <Route path="formula" element={<FormulaPage />} />
          <Route path="dosing-config" element={<DosingConfigPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;