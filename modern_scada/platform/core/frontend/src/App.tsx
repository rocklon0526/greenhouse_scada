import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/general/LoginPage';
import StatusPage from './pages/admin/StatusPage';
import AlarmPage from './pages/admin/AlarmPage';
import ConfigPage from './pages/admin/ConfigPage';
import AdminPage from './pages/admin/AdminPage';
import LandingPage from './pages/general/LandingPage';
import { AlarmBanner } from './components/AlarmBanner';
import { RecipeModule } from '../../../modules/mod_recipe/frontend';
import WebLayout from './layouts/WebLayout';
import DataBrowserPage from './pages/analysis/DataBrowserPage';

// Dynamic Project Import via Alias (defined in vite.config.ts)
// @ts-ignore
import Project from '@project-entry';

// Module Registry (Manual for now)
const modules: any[] = [/* RecipeModule */];

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

        {/* Dynamic Project Route */}
        <Route path={`/perspective/${Project.id}`} element={<Project.ClientComponent />}>
          <Route index element={<Navigate to="overview" replace />} />

          {/* Default Overview Page */}
          <Route path="overview" element={<Project.OverviewComponent />} />

          {/* Project-specific Routes */}
          {Project.routes.map((route: any) => (
            <Route
              key={route.path}
              path={route.path}
              element={<route.component />}
            />
          ))}

          {/* Module Routes */}
          {modules.flatMap(mod => mod.routes?.map((route: any) => (
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