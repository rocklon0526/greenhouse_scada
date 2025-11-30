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
        self.registers = {
            # Weather
            0: 25.0, # temp
            2: 60.0, # hum
            4: 5.0,  # uv
            
            # Mixer
            10: 15000.0, # level
            12: 6.5,     # ph
            14: 2.0,     # ec
            16: 0.0,     # valve (bool)
            18: 1.0,     # pump (bool)
            
            # Dosing
            20: 50.0, 22: 45.0, 24: 80.0, 26: 30.0, 28: 90.0, 30: 10.0,
            
            # Racks (Sample R-1A)
            40: 6.2, 42: 1.8, 44: 3.0, 46: 0.0,
            
            # Sensors (6 sensors * 3 levels * 3 metrics * 2 bytes/register = 18 registers per sensor)
            # Sensor 1: 100-116
            # Sensor 2: 120-136
            # ...
            # Sensor 6: 200-216
        }
        
        # Initialize 6 sensors
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

        # Process Control (Moved to 300 to avoid conflict with Sensor 6)
        self.registers.update({
            300: 0.0, # Mixing Command (0=Stop, 1=Start)
            301: 0.0, # Recipe ID
            310: 0.0, # Transfer Command (0=Stop, 1=Start)
            311: 0.0, # Target Rack ID
        })

    def run(self):
        logger.info("Starting Simulation Loop...")
        while True:
            time.sleep(2)
            self.update_simulation()
            self.write_to_datastore()

    def update_simulation(self):
        # Random walk for values
        self.registers[0] += random.uniform(-0.5, 0.5) # weather temp
        
        # Update all sensors
        base_addr = 100
        for i in range(6):
            for offset in range(0, 18, 2):
                self.registers[base_addr + offset] += random.uniform(-0.1, 0.1)
            base_addr += 20
        
        # Mixing Logic
        if self.registers.get(300, 0.0) == 1.0:
            self.registers[10] += 500.0 # Increase mixer level
            for i in range(20, 31, 2):
                self.registers[i] -= 1.0
        else:
            self.registers[10] -= random.uniform(0, 10)    # mixer level drain

        if self.registers[10] < 0: self.registers[10] = 0
        if self.registers[10] > 20000: self.registers[10] = 20000
        
        # Transfer Logic
        if self.registers.get(310, 0.0) == 1.0:
            self.registers[10] -= 500.0 # Drain mixer
            rack_id = int(self.registers.get(311, 0.0))
            if rack_id == 1:
                self.registers[40] += 0.1 # Increase Rack A level

        # Randomly toggle valve
        if random.random() > 0.95:
            self.registers[16] = 1.0 if self.registers[16] == 0.0 else 0.0
            
    def write_to_datastore(self):
        # pyModbusTCP uses a global DataBank or server instance
        # We need to convert floats to 2 words (16-bit integers)
        
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
