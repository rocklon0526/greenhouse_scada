import { useEffect, useRef } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { APP_CONFIG } from '../configs/constants';
import { LayoutConfig } from '../configs/layoutConfig';

export const useWebSocket = (layoutConfig: LayoutConfig) => {
    const wsRef = useRef<WebSocket | null>(null);
    const updateFromWebSocket = useAppStore((state: any) => state.updateFromWebSocket);
    const connectionStatus = useAppStore((state: any) => state.connectionStatus);

    useEffect(() => {
        if (APP_CONFIG.USE_MOCK) return;

        // Use relative path for WS to go through Nginx
        // If VITE_API_URL is http://localhost/api, then WS should be ws://localhost/ws
        // But since we are proxying, we can just use relative path if on same origin, or construct it.
        // Assuming Nginx proxies /ws to backend /ws

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host; // localhost:80 (Nginx)
        const wsUrl = `${protocol}//${host}/ws`;

        console.log(`Connecting to WebSocket: ${wsUrl}`);

        const connect = () => {
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('WebSocket Connected');
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    if (message.type === 'update') {
                        updateFromWebSocket(message.data, layoutConfig);
                    }
                } catch (e) {
                    console.error('Error parsing WebSocket message:', e);
                }
            };

            ws.onclose = () => {
                console.log('WebSocket Disconnected. Retrying in 3s...');
                setTimeout(connect, 3000);
            };

            ws.onerror = (error) => {
                console.error('WebSocket Error:', error);
                ws.close();
            };
        };

        connect();

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [layoutConfig, updateFromWebSocket]);
};
