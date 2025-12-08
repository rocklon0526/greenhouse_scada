import time
import random
import struct
import logging
from pyModbusTCP.server import ModbusServer, DataBank

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SimulationWorker:
    def __init__(self, server):
        self.server = server
        # 初始化暫存器 (Registers)
        # 注意：Modbus 暫存器通常是 16-bit整數，這裡我們使用 float，
        # 在寫入時會自動轉換為兩個 16-bit words (Big Endian)
        self.registers = {
            # --- Weather Station ---
            0: 25.0, # temp
            2: 60.0, # hum
            4: 5.0,  # uv
            
            # --- Mixer System ---
            10: 5000.0,  # level (起始給一點水，方便測試)
            12: 6.5,     # ph
            14: 2.0,     # ec
            16: 0.0,     # valve (0=Closed, 1=Open)
            18: 1.0,     # pump (0=Off, 1=On)
            
            # --- Dosing Tanks (1-6) ---
            20: 50.0, 22: 45.0, 24: 80.0, 26: 30.0, 28: 90.0, 30: 10.0,
            
            # --- Racks (Sample R-1A) ---
            40: 6.2, 42: 1.8, 44: 3.0, 46: 0.0,
            
            # --- Control Signals (虛擬指令區) ---
            300: 0.0, # Mixing Command (0=Stop, 1=Start)
            302: 0.0, # Recipe ID
            304: 15000.0, # Target Volume
            306: 0.0, # Mix Status (0=Idle, 1=Done)
            310: 0.0, # Transfer Command (0=Stop, 1=Start)
            312: 0.0, # Target Rack ID
            
            # --- Actuators Feedback (設備狀態回饋) ---
            400: 0.0, # Fan 1 Status
            401: 0.0, # Fan 2 Status
            402: 0.0, # Water Wall 1 Status
            403: 0.0, # Water Wall 2 Status
        }
        
        # Initialize 6 sensors (Addresses 100 ~ 216)
        base_addr = 100
        for i in range(6):
            # Top
            self.registers[base_addr] = 24.0 + i
            self.registers[base_addr+2] = 55.0
            self.registers[base_addr+4] = 400.0
            # Mid
            self.registers[base_addr+6] = 23.5 + i
            self.registers[base_addr+8] = 58.0
            self.registers[base_addr+10] = 450.0
            # Bot
            self.registers[base_addr+12] = 22.0 + i
            self.registers[base_addr+14] = 62.0
            self.registers[base_addr+16] = 500.0
            
            base_addr += 20 # 18 used + 2 gap

    def run(self):
        logger.info("Starting Simulation Loop...")
        # Initialize DataStore with default values
        self.write_to_datastore()
        
        while True:
            time.sleep(1.0) # 更新頻率：1秒一次
            self.read_from_datastore() # 先讀取外部寫入的指令
            self.update_simulation()   # 執行模擬邏輯
            self.write_to_datastore()  # 寫回更新後的狀態

    def read_from_datastore(self):
        """從 Server 讀取最新的控制指令 (例如 API 可能修改了 300 或 400)"""
        # 讀取控制指令區 (300-312) 和 感測器區 (100-216) 以支援 E2E 測試注入
        # 簡單起見，我們遍歷所有 registers
        for addr in list(self.registers.keys()):
            vals = self.server.data_bank.get_holding_registers(addr, 2)
            if vals:
                # 嘗試將 2 words 解碼回 float 更新本地狀態
                try:
                    b = struct.pack('>HH', vals[0], vals[1])
                    f_val = struct.unpack('>f', b)[0]
                    # 更新本地暫存器
                    # 只有當數值有顯著變化時才更新 (例如外部注入)
                    # 忽略微小變化以免與本地模擬衝突太頻繁
                    if abs(self.registers[addr] - f_val) > 0.1:
                        self.registers[addr] = f_val
                        logger.info(f"External update received on {addr}: {f_val}")
                except:
                    pass

    def update_simulation(self):
        # 1. 環境隨機波動 (Random Walk)
        # 氣象
        self.registers[0] += random.uniform(-0.1, 0.1) # temp
        self.registers[2] += random.uniform(-0.2, 0.2) # hum
        
        # 感測器 (Sensor 1~6)
        base_addr = 100
        for i in range(6):
            for offset in range(0, 18, 2):
                # 只有當 PLC 沒有被強制寫入異常值（例如 E2E 測試寫入 35度）時，才加隨機雜訊
                # 這裡簡單處理：直接加微小雜訊，不影響整體趨勢
                self.registers[base_addr + offset] += random.uniform(-0.05, 0.05)
            base_addr += 20
        
        # 2. 混合邏輯 (Mixing Process)
        # 指令 300 = 1.0 (Start)
        if self.registers.get(300, 0.0) == 1.0:
            target_vol = self.registers.get(304, 15000.0)
            logger.info(f"Check: {self.registers[10]} < {target_vol}")
            if self.registers[10] < target_vol and self.registers[10] < 20000: # Target or Max
                self.registers[10] += 500.0 # 快速注水
                self.registers[16] = 1.0    # 閥門開啟顯示
                self.registers[306] = 0.0   # Status: In Progress
                
                # 模擬消耗原料 (Dosing Tanks)
                for i in range(20, 31, 2):
                    if self.registers[i] > 0:
                        self.registers[i] -= 0.5
            else:
                # 達到目標水量，自動停止
                logger.info(f"Stopping Mixing: Level={self.registers[10]} >= Target={target_vol}")
                self.registers[300] = 0.0 
                self.registers[16] = 0.0
                self.registers[306] = 1.0 # Status: Done
        else:
            self.registers[16] = 0.0 # 閥門關閉

        # 3. 輸送邏輯 (Transfer Process)
        # 指令 310 = 1.0 (Start)
        if self.registers.get(310, 0.0) == 1.0:
            target_rack = int(self.registers.get(312, 0.0))
            
            # 檢查是否有水可送
            if self.registers[10] > 100: 
                self.registers[10] -= 200.0 # 攪拌桶扣水
                self.registers[18] = 1.0    # 幫浦開啟顯示
                
                # 增加目標 Rack 的液位
                # 假設 Rack 1 對應 Address 40
                if target_rack == 1: # Rack A
                    if self.registers[40] < 100: # 假設 Max 100
                        self.registers[40] += 1.5 
                        self.registers[46] = 1.0 # Rack Valve Open
            else:
                logger.warning("Mixer is empty! Cannot transfer.")
                self.registers[18] = 0.0
        else:
            self.registers[18] = 0.0 # 幫浦關閉
            self.registers[46] = 0.0 # Rack Valve Closed

        # 4. 自然消耗 (模擬植物吸收/蒸發)
        if self.registers[10] > 0 and self.registers[300] == 0:
            self.registers[10] -= 0.1 # 微量蒸發
            
    def write_to_datastore(self):
        # 將本地的 float 狀態寫回 Modbus Server 記憶體供外部讀取
        for addr, val in self.registers.items():
            try:
                # Pack float to bytes (Big Endian)
                b = struct.pack('>f', val)
                # Unpack to 2 unsigned shorts (Big Endian)
                words = list(struct.unpack('>HH', b))
                
                # Write to Holding Registers (0-based)
                self.server.data_bank.set_holding_registers(addr, words)
            except Exception as e:
                logger.error(f"Error writing addr={addr} val={val}: {e}")

def main():
    # Create Server
    server = ModbusServer(host="0.0.0.0", port=502, no_block=True)
    
    logger.info("Starting Modbus TCP Server on 0.0.0.0:502")
    server.start()
    
    # Start Simulation Worker
    worker = SimulationWorker(server)
    worker.run() # This blocks

if __name__ == "__main__":
    main()