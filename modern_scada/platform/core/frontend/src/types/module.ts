import React from 'react';

export interface ModuleDefinition {
    id: string;
    widgets?: Record<string, React.ComponentType<any>>;
    routes?: Array<{ path: string; component: React.ComponentType<any> }>;
    // onRegister?: () => void; // Reserved for future initialization hooks
}
