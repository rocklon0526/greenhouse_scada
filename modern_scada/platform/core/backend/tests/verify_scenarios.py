import requests
import time
import struct
import sys
import pymodbus
from pymodbus.client import ModbusTcpClient

# --- 設定區 ---
API_URL = "http://localhost:8000/api"
PLC_HOST = "localhost"
PLC_PORT = 5020  # Docker 對外 mapping 的 port
USERNAME = "admin"
PASSWORD = "admin123"

# --- 輔助函式 ---
def get_token():
    try:
        res = requests.post(f"{API_URL}/token", data={"username": USERNAME, "password": PASSWORD})
        if res.status_code == 200:
            return res.json()["access_token"]
        print(f"❌ 登入失敗: {res.text}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ 無法連線到 API: {e}")
        sys.exit(1)

def float_to_registers(value):
    b = struct.pack('>f', value)
    return list(struct.unpack('>HH', b))

# --- 測試情境 ---

def test_scenario_1_climate(client):
    print("\n🌡️  [情境 1] 環境控制測試：高溫觸發風扇")
    
    # 1. 寫入高溫 (35.0度) 到 Sensor 1 (Reg 100)
    print("   -> 模擬寫入: Sensor 1 = 35.0°C")
    
    # [修正] pymodbus 3.10+ 使用 device_id=1
    try:
        client.write_registers(address=100, values=float_to_registers(35.0), device_id=1)
    except Exception as e:
        print(f"   ❌ 寫入失敗: {e}")
        return
    
    # 2. 等待後端輪詢 (Polling) 與邏輯判斷
    print("   -> 等待系統反應 (3秒)...")
    time.sleep(3)
    
    # 3. 驗證 Fan 1 狀態 (Reg 400)
    # [修正] count 必須是關鍵字參數，且使用 device_id
    try:
        rr = client.read_holding_registers(address=400, count=2, device_id=1)
    except Exception as e:
        print(f"   ❌ 讀取失敗: {e}")
        return

    if not rr or rr.isError():
        print("   ❌ 讀取 PLC 失敗")
        return

    try:
        b = struct.pack('>HH', rr.registers[0], rr.registers[1])
        val = struct.unpack('>f', b)[0]
        # 判斷是否開啟 (大於 0.5 即視為 1.0)
        is_on = val > 0.5
    except:
        is_on = False

    if is_on:
        print(f"   ✅ PASS: 風扇已開啟 (Reg 400 = {val:.1f})")
    else:
        print(f"   ❌ FAIL: 風扇未開啟 (Reg 400 = {val:.1f})")

    # 復原環境
    try:
        client.write_registers(address=100, values=float_to_registers(25.0), device_id=1)
    except Exception as e:
        print(f"   ⚠️ 復原環境失敗: {e}")


def test_scenario_2_mixing(token):
    print("\n⚗️  [情境 2] 配方調配測試：啟動攪拌")
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. 呼叫 API 啟動
    print("   -> API: 啟動配方混合 (Recipe ID: 1)")
    res = requests.post(f"{API_URL}/process/mix", json={"recipeId": 1}, headers=headers)
    if res.status_code != 200:
        print(f"   ❌ API 呼叫失敗: {res.text}")
        return

    # 2. 等待模擬器注水
    print("   -> 等待注水 (4秒)...")
    time.sleep(4)
    
    # 3. 檢查狀態
    try:
        res = requests.get(f"{API_URL}/status", headers=headers)
        data = res.json()
        mixer = data.get('mixer', {})
        
        # 這裡的判斷標準：如果有開啟閥門或者液位有變化
        level = mixer.get('level', 0)
        valve = mixer.get('valveOpen', False)
        
        print(f"   -> 當前液位: {level:.1f}, 閥門: {valve}")
        
        # 只要閥門開了，或是液位大於初始值 (simulator 初始設 5000)
        if valve or level > 5000: 
            print("   ✅ PASS: 攪拌程序執行中")
        else:
            print("   ❌ FAIL: 狀態未更新")
    except Exception as e:
        print(f"   ❌ 狀態檢查失敗: {e}")


def test_scenario_3_transfer(token):
    print("\n🚀 [情境 3] 養液輸送測試：傳送至 Rack A")
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. 取得初始 Rack 液位
    try:
        res = requests.get(f"{API_URL}/status", headers=headers)
        init_level = res.json()['rackTanks']['RackA']['level']
        print(f"   -> 初始 Rack A 液位: {init_level}")
    except:
        print("   ⚠️ 無法取得初始液位，假設為 0")
        init_level = 0

    # 2. 啟動輸送
    print("   -> API: 啟動輸送到 Rack A")
    res = requests.post(f"{API_URL}/process/transfer", json={"targetRackId": "RackA"}, headers=headers)
    
    # 3. 等待模擬
    time.sleep(4)
    
    # 4. 驗證
    try:
        res = requests.get(f"{API_URL}/status", headers=headers)
        new_level = res.json()['rackTanks']['RackA']['level']
        print(f"   -> 目前 Rack A 液位: {new_level}")
        
        if new_level > init_level:
            print("   ✅ PASS: Rack A 液位已增加")
        else:
            print("   ❌ FAIL: Rack A 液位未增加")
    except Exception as e:
        print(f"   ❌ 驗證失敗: {e}")

if __name__ == "__main__":
    print(f"🔍 Pymodbus Version: {pymodbus.__version__}")
    print("=== 開始 E2E 完整驗證 ===")
    
    # 連接 PLC
    plc = ModbusTcpClient(PLC_HOST, port=PLC_PORT)
    if not plc.connect():
        print("❌ 無法連線到 PLC Simulator (localhost:5020)")
        print("   請確認: docker-compose up -d 是否已執行")
        sys.exit(1)
        
    # 取得 API Token
    token = get_token()
    print("✅ API 登入成功")

    # 執行測試
    try:
        test_scenario_1_climate(plc)
        test_scenario_2_mixing(token)
        test_scenario_3_transfer(token)
    finally:
        plc.close()
        print("\n=== 測試結束 ===")