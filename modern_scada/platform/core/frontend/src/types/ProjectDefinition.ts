import React from 'react';

export interface ProjectRoute {
    path: string;
    component: React.ComponentType<any>;
    index?: boolean; // If true, this is the default child route
}

export interface ProjectDefinition {
    id: string;
    name: string;

    /**
     * The main layout/wrapper component for the project.
     * Usually contains the header, navigation, and Outlet.
     */
    ClientComponent: React.ComponentType<any>;

    /**
     * The default overview component (e.g., 3D Scene).
     */
    OverviewComponent: React.ComponentType<any>;

    /**
     * List of additional operation pages/routes provided by the project.
     * e.g., Dashboard, Logic, Formula, etc.
     */
    routes: ProjectRoute[];
}
