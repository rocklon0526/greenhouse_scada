import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import GreenhouseClient from './GreenhouseClient';
import DashboardPage from './pages/DashboardPage';
import LogicPage from './pages/LogicPage';
import FormulaPage from './pages/FormulaPage';
import DosingConfigPage from './pages/DosingConfigPage';
import WebLayout from './layouts/WebLayout';
import StatusPage from './pages/StatusPage';
import ConfigPage from './pages/ConfigPage';
import TestPage from './pages/TestPage';

import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './pages/LandingPage';

import EmbeddedPage from './pages/EmbeddedPage';
import DataBrowserPage from './pages/DataBrowserPage';
import UserManagementPage from './pages/UserManagementPage';

// ... imports

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/test" element={<TestPage />} />
        <Route path="/" element={<Navigate to="/home" replace />} />

        {/* Temporary debug routing */}
        <Route element={<ProtectedRoute />}>
          <Route path="/web" element={<WebLayout />}>
            <Route index element={<Navigate to="status" replace />} />
            <Route path="status" element={<StatusPage />} />
            <Route path="config" element={<ConfigPage />} />
            <Route path="data" element={<DataBrowserPage />} />
            <Route path="users" element={<UserManagementPage />} />
            <Route path="pgadmin" element={<EmbeddedPage title="pgAdmin 4" url="http://localhost:5050" description="Database Management" />} />
            <Route path="portainer" element={<EmbeddedPage title="Portainer" url="http://localhost:9000" description="Container Management" />} />
          </Route>

          <Route path="/home" element={<LandingPage />} />
          <Route path="/perspective/:projectId" element={<GreenhouseClient />}>
            <Route index element={<></>} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="logic" element={<LogicPage />} />
            <Route path="formula" element={<FormulaPage />} />
            <Route path="dosing-config" element={<DosingConfigPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;