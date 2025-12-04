import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/general/LoginPage';
import GreenhouseClient from '@projects/greenhouse/frontend/GreenhouseClient';
import DashboardPage from '@projects/greenhouse/frontend/pages/operation/DashboardPage';
import LogicPage from '@projects/greenhouse/frontend/pages/operation/LogicPage';
import FormulaPage from '@projects/greenhouse/frontend/pages/operation/FormulaPage';
import DosingConfigPage from '@projects/greenhouse/frontend/pages/operation/DosingConfigPage';
import StatusPage from './pages/admin/StatusPage';
import AlarmPage from './pages/admin/AlarmPage';
import OverviewPage from '@projects/greenhouse/frontend/OverviewPage';
import ConfigPage from './pages/admin/ConfigPage';
import AdminPage from './pages/admin/AdminPage';
import ChemicalsPage from '@projects/greenhouse/frontend/pages/operation/ChemicalsPage';
import LandingPage from './pages/general/LandingPage';
import { AlarmBanner } from './components/AlarmBanner';
import { RecipeModule } from '../../../modules/mod_recipe/frontend';
import WebLayout from './layouts/WebLayout';
import DataBrowserPage from './pages/analysis/DataBrowserPage';

// Module Registry (Manual for now)
const modules = [RecipeModule];

function App() {
  return (
    <Router>
      <AlarmBanner />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/home" element={<LandingPage />} />
        <Route path="/web" element={<WebLayout />}>
          <Route index element={<Navigate to="status" replace />} />
          <Route path="status" element={<StatusPage />} />
          <Route path="alarms" element={<AlarmPage />} />
          <Route path="config" element={<ConfigPage />} />
          <Route path="users" element={<AdminPage />} />
          <Route path="data" element={<DataBrowserPage />} />
        </Route>
        <Route path="/perspective/:projectId" element={<GreenhouseClient />}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<div />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="logic" element={<LogicPage />} />
          <Route path="formula" element={<FormulaPage />} />
          <Route path="dosing-config" element={<DosingConfigPage />} />

          <Route path="chemicals" element={<ChemicalsPage />} />

          {/* Module Routes */}
          {modules.flatMap(mod => mod.routes?.map(route => (
            <Route
              key={route.path}
              path={route.path.replace('/', '')} // Remove leading slash for child routes
              element={<route.component />}
            />
          )))}
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;