import React, { useState, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Instance, Instances } from '@react-three/drei';
import { Group, MathUtils } from 'three';
import { useAppStore } from '../../stores/useAppStore';
import { Power, Droplets } from 'lucide-react';

interface WaterWallProps {
    id?: string;
    values?: any;
    args?: [number, number, number]; // [厚度(X), 高度(Y), 寬度(Z)]
}

export const WaterWall3D: React.FC<WaterWallProps> = ({ id, values, args = [2, 8, 15] }) => {
    // @ts-ignore
    const { controlDevice } = useAppStore();
    const [hovered, setHovered] = useState(false);
    const dripsRef = useRef<Group>(null);

    const deviceData = values && id ? values[id] : null;
    const isRunning = deviceData?.status === 'ON';

    const [thickness, height, width] = args;

    const toggleStatus = (e: any) => {
        e.stopPropagation();
        if (!id) return;
        const newStatus = isRunning ? 'OFF' : 'ON';
        controlDevice(id, { status: newStatus });
    };

    // --- 水滴動畫邏輯 ---
    // 預先產生水滴的隨機初始位置
    const dripPositions = useMemo(() => {
        const count = 30; // 水滴數量
        const posArr = [];
        for (let i = 0; i < count; i++) {
            posArr.push({
                x: (Math.random() - 0.5) * (thickness + 0.1), // 稍微超出厚度一點
                y: MathUtils.randFloat(-height / 2, height / 2), // 隨機高度
                z: MathUtils.randFloat(-width / 2 + 0.5, width / 2 - 0.5), // 分布在寬度上
                speed: MathUtils.randFloat(3, 8) // 隨機落下速度
            });
        }
        return posArr;
    }, [thickness, height, width]);

    useFrame((state, delta) => {
        if (isRunning && dripsRef.current) {
            dripsRef.current.children.forEach((drip, i) => {
                const data = dripPositions[i];
                drip.position.y -= delta * data.speed;
                // 如果掉到底部，重置到頂部
                if (drip.position.y < -height / 2) {
                    drip.position.y = height / 2;
                }
            });
        }
    });
    // -------------------

    return (
        <group
            onPointerOver={(e: any) => { e.stopPropagation(); setHovered(true); }}
            onPointerOut={(e: any) => { e.stopPropagation(); setHovered(false); }}
        >
            {/* === 1. 隱形觸發區 (Hitbox) === */}
            {/* 比本體稍微大一點的透明方塊，方便滑鼠選取 */}
            <mesh>
                <boxGeometry args={[thickness + 1, height + 1, width + 1]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>

            {/* === 2. 金屬外框 (Frame) === */}
            {/* 稍微比濕簾大一點點 */}
            <mesh>
                <boxGeometry args={[thickness + 0.2, height + 0.2, width + 0.2]} />
                {/* 銀灰色金屬質感 */}
                <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* === 3. 濕簾本體 (Pad) === */}
            <mesh>
                {/* 稍微比外框小一點 */}
                <boxGeometry args={[thickness, height, width]} />
                <meshStandardMaterial
                    // 顏色切換：運作時是深濕潤藍色，關閉時是乾燥灰褐色
                    color={isRunning ? "#1e3a8a" : "#78716c"}
                    // 粗糙度切換：運作時比較光滑反光(0.3)，關閉時像紙一樣粗糙(0.9)
                    roughness={isRunning ? 0.3 : 0.9}
                    // 金屬感切換：運作時稍微有點水光的金屬感
                    metalness={isRunning ? 0.4 : 0.1}
                    // 稍微加一點凹凸感模擬波浪紋路 (雖然沒有貼圖，但能增加一點細節)
                    bumpScale={0.1}
                />
            </mesh>

            {/* === 4. 動態水滴 (Water Drips) === */}
            {isRunning && (
                <group ref={dripsRef}>
                    {dripPositions.map((pos, i) => (
                        // 使用細長的水藍色方塊模擬水流
                        <mesh key={i} position={[pos.x, pos.y, pos.z]}>
                            {/* 細長條狀幾何 */}
                            <boxGeometry args={[0.05, 0.4, 0.05]} />
                            <meshBasicMaterial color="#bfdbfe" transparent opacity={0.7} />
                        </mesh>
                    ))}
                </group>
            )}

            {/* === 5. 互動 UI (按鈕) === */}
            <Html position={[0, height / 2 + 1.5, 0]} center style={{ pointerEvents: 'none' }} zIndexRange={[100, 0]}>
                <div
                    className={`flex flex-col items-center gap-1 transition-all duration-200 ${hovered ? 'scale-110 opacity-100' : 'scale-100 opacity-90'}`}
                    style={{ pointerEvents: 'auto' }}
                >
                    <button
                        onClick={toggleStatus}
                        className={`w-8 h-8 rounded-full flex items-center justify-center border shadow-lg backdrop-blur-sm transition-all active:scale-95
              ${isRunning
                                ? 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-500/30'
                                : 'bg-slate-900 text-slate-500 border-slate-600 hover:bg-slate-800 hover:text-slate-300'}`}
                    >
                        {isRunning ? <Droplets size={16} className="animate-bounce" fill="currentColor" /> : <Power size={16} />}
                    </button>

                    {/* {hovered && id && (
            <div className="px-2 py-0.5 bg-slate-900/90 text-white text-[10px] rounded border border-slate-700 whitespace-nowrap">
              {id}
            </div>
          )} */}
                </div>
            </Html>
        </group>
    );
};