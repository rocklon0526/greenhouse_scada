import { useEffect, useRef } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { APP_CONFIG } from '../configs/constants';
import { LayoutConfig } from '../configs/layoutConfig';

export const useWebSocket = (layoutConfig: LayoutConfig) => {
    const wsRef = useRef<WebSocket | null>(null);
    // 新增：用來追蹤組件是否已經卸載或依賴已改變
    const isCleanedUp = useRef(false);

    const updateFromWebSocket = useAppStore((state: any) => state.updateFromWebSocket);

    useEffect(() => {
        if (APP_CONFIG.USE_MOCK) return;

        // 重置清理標記
        isCleanedUp.current = false;

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const wsUrl = `${protocol}//${host}/ws`;

        console.log(`Connecting to WebSocket: ${wsUrl}`);

        const connect = () => {
            // 如果已經清理過，就不要再建立新連線 (防止幽靈連線)
            if (isCleanedUp.current) return;

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
                console.log('WebSocket Disconnected');
                // 修正：只有在「非主動清理」的情況下才重連
                if (!isCleanedUp.current) {
                    console.log('Retrying in 3s...');
                    setTimeout(connect, 3000);
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket Error:', error);
                ws.close();
            };
        };

        connect();

        return () => {
            // 標記為已清理，阻止任何 pending 的重連或新連線
            isCleanedUp.current = true;
            if (wsRef.current) {
                // 關閉時移除 onclose 處理器，避免觸發重連邏輯 (雙重保險)
                wsRef.current.onclose = null;
                wsRef.current.close();
            }
        };
    }, [layoutConfig, updateFromWebSocket]);
};