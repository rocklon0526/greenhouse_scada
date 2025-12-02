import { create } from 'zustand';
import { TagMap, RuntimeValue } from '../types/scada';

interface ScadaState {
    isConnected: boolean;
    tags: TagMap; // Stores all real-time data

    // Actions
    connect: (url: string) => void;
    disconnect: () => void;
    updateTag: (tagId: string, data: RuntimeValue) => void;
    activeAlarms: Record<string, any>; // Store active alarms
    acknowledgeAlarm: (ruleId: string) => Promise<void>;
    sendCommand: (deviceId: string, tagId: string, value: any) => Promise<void>;
}

export const useScadaStore = create<ScadaState>((set, get) => {
    let socket: WebSocket | null = null;
    let reconnectTimer: any = null;

    return {
        isConnected: false,
        tags: {},
        activeAlarms: {},

        updateTag: (tagId, data) =>
            set((state) => ({
                tags: { ...state.tags, [tagId]: data }
            })),

        connect: (url: string) => {
            if (socket) return; // Avoid duplicate connections

            console.log(`🔌 Connecting to SCADA: ${url}`);
            socket = new WebSocket(url);

            socket.onopen = () => {
                console.log('✅ SCADA Connected');
                set({ isConnected: true });
                if (reconnectTimer) clearTimeout(reconnectTimer);

                // Fetch initial active alarms
                fetch('http://localhost:8000/api/alarms/active')
                    .then(res => res.json())
                    .then(alarms => {
                        const alarmMap: Record<string, any> = {};
                        alarms.forEach((a: any) => alarmMap[a.rule_id] = a);
                        set({ activeAlarms: alarmMap });
                    })
                    .catch(console.error);
            };

            socket.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);

                    // Handle Alarm Updates (if broadcasted via same WS)
                    // Note: LogicEngine publishes to "updates:device:..." which we receive here.
                    // But alarm updates might come from "updates:alarms" channel if we subscribed to it.
                    // Currently `redis_subscriber` subscribes to "updates:*", so we SHOULD receive alarm updates too.

                    if (message.type === 'alarm_ack') {
                        set((state) => ({
                            activeAlarms: {
                                ...state.activeAlarms,
                                [message.rule_id]: message.data
                            }
                        }));
                    }
                    // TODO: Handle alarm_start / alarm_end if backend publishes them in this format
                    // Currently LogicEngine publishes to Redis, but does it publish explicit alarm events to WS?
                    // LogicEngine.check_alarms updates Redis Hash.
                    // We need LogicEngine to also publish a message to "updates:alarms" or similar.

                    // Construct unique tag ID: "equipment_id:param_id"
                    if (message.equipment_id && message.param_id) {
                        const tagId = `${message.equipment_id}:${message.param_id}`;
                        set((state) => ({
                            tags: { ...state.tags, [tagId]: message }
                        }));
                    }

                } catch (err) {
                    console.error('❌ Parse Error:', err);
                }
            };

            socket.onclose = () => {
                console.log('⚠️ SCADA Disconnected, retrying in 3s...');
                set({ isConnected: false });
                socket = null;
                // Auto-reconnect
                reconnectTimer = setTimeout(() => get().connect(url), 3000);
            };
        },

        disconnect: () => {
            if (socket) socket.close();
            socket = null;
        },

        sendCommand: async (deviceId: string, tagId: string, value: any) => {
            try {
                const response = await fetch('http://localhost:8000/api/control/write', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ device_id: deviceId, tag_id: tagId, value }),
                });

                if (!response.ok) throw new Error('Control failed');

                console.log(`✅ Command Sent: ${tagId} = ${value}`);
            } catch (error) {
                console.error('❌ Control Error:', error);
                alert('Control failed! Please check connection.');
            }
        },

        acknowledgeAlarm: async (ruleId: string) => {
            try {
                await fetch('http://localhost:8000/api/alarms/acknowledge', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ rule_id: ruleId }),
                });
                // Optimistic update
                set((state) => {
                    const alarm = state.activeAlarms[ruleId];
                    if (alarm) {
                        return {
                            activeAlarms: {
                                ...state.activeAlarms,
                                [ruleId]: { ...alarm, status: 'ACTIVE_ACKED' }
                            }
                        };
                    }
                    return state;
                });
            } catch (error) {
                console.error('Failed to acknowledge alarm:', error);
            }
        }
    };
});
