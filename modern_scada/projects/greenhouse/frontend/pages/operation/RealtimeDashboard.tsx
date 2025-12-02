import React, { useEffect, useState } from 'react';
import { useScadaStore } from '@core/hooks/useScadaStore';
import { EquipmentRenderer } from '@core/components/EquipmentRenderer';
import { SiteLayout } from '@core/types/config';

// Type declarations for JSX elements
declare module 'react' {
    namespace JSX {
        interface IntrinsicElements {
            [elemName: string]: any;
        }
    }
}

const RealtimeDashboard: React.FC = () => {
    const { connect, isConnected } = useScadaStore();
    const [layout, setLayout] = useState<SiteLayout | null>(null);

    // 1. Connect to WebSocket
    useEffect(() => {
        connect('ws://localhost:8000/ws/realtime');
    }, [connect]);

    // 2. Fetch Layout Configuration
    useEffect(() => {
        fetch('http://localhost:8000/api/config/layout')
            .then(res => res.json())
            .then(data => setLayout(data))
            .catch(err => console.error("Failed to load layout:", err));
    }, []);

    if (!layout) return <div className="text-white p-10">Loading Layout...</div>;

    return (
        <div className="min-h-screen bg-slate-950 p-6 md:p-10">
            <header className="mb-8 flex justify-between items-center border-b border-slate-800 pb-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-100">{layout.site_name}</h1>
                    <p className="text-slate-500 text-sm mt-1">Dynamic Configuration Mode</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${isConnected ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                    {isConnected ? 'ONLINE' : 'OFFLINE'}
                </span>
            </header>

            {/* Render Zones */}
            <div className="space-y-10">
                {layout.zones.map((zone: any) => (
                    <section key={zone.id}>
                        <h2 className="text-xl font-semibold text-slate-300 mb-4 border-l-4 border-blue-500 pl-3">
                            {zone.name}
                        </h2>

                        <div className="flex flex-wrap gap-6">
                            {zone.equipments.map((equip: any) => (
                                <EquipmentRenderer key={equip.id} config={equip} />
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
};

export default RealtimeDashboard;
