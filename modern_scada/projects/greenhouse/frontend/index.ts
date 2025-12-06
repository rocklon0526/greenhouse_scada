import { ProjectDefinition } from '@core/types/ProjectDefinition';

// Import Project Components
import GreenhouseClient from './GreenhouseClient';
import OverviewPage from './OverviewPage';
import DashboardPage from './pages/operation/DashboardPage';
import LogicPage from './pages/operation/LogicPage';
import FormulaPage from './pages/operation/FormulaPage';
import DosingConfigPage from './pages/operation/DosingConfigPage';
import ChemicalsPage from './pages/operation/ChemicalsPage';

const GreenhouseProject: ProjectDefinition = {
    id: 'greenhouse',
    name: 'Greenhouse SCADA',
    ClientComponent: GreenhouseClient,
    OverviewComponent: OverviewPage,
    routes: [
        { path: 'dashboard', component: DashboardPage },
        { path: 'logic', component: LogicPage },
        { path: 'formula', component: FormulaPage },
        { path: 'dosing-config', component: DosingConfigPage },
        { path: 'chemicals', component: ChemicalsPage }
    ]
};

export default GreenhouseProject;
