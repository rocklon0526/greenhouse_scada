export type Quality = 'Good' | 'Bad' | 'Uncertain';

export interface RuntimeValue {
    value: number | string | boolean;
    timestamp: number;
    quality: Quality;
}

// Key: "fan_01:speed_pv" -> Value: { value: 1200, timestamp: ... }
export type TagMap = Record<string, RuntimeValue>;

export interface ScadaEvent {
    type: 'UPDATE' | 'ALARM';
    payload: any;
}
