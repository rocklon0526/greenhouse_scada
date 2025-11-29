import asyncio
import logging
import random
from pymodbus.server import StartAsyncTcpServer
from pymodbus.datastore import ModbusSequentialDataBlock, ModbusSlaveContext, ModbusServerContext
from pymodbus.payload import BinaryPayloadBuilder
from pymodbus.constants import Endian

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SimulationWorker:
    def __init__(self, context):
        self.context = context
        self.slave_id = 1
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
            
            # Sensors (Sample Aisle 1 P 1)
            100: 24.0, 102: 55.0, 104: 400.0, # top
            106: 23.5, 108: 58.0, 110: 450.0, # mid
            112: 22.0, 114: 62.0, 116: 500.0, # bot
        }

    async def run(self):
        logger.info("Starting Simulation Loop...")
        while True:
            await asyncio.sleep(2)
            self.update_simulation()
            self.write_to_datastore()

    def update_simulation(self):
        # Random walk for values
        self.registers[0] += random.uniform(-0.5, 0.5) # weather temp
        self.registers[10] -= random.uniform(0, 10)    # mixer level drain
        if self.registers[10] < 0: self.registers[10] = 20000
        
        # Randomly toggle valve
        if random.random() > 0.95:
            self.registers[16] = 1.0 if self.registers[16] == 0.0 else 0.0

    def write_to_datastore(self):
        builder = BinaryPayloadBuilder(byteorder=Endian.BIG, wordorder=Endian.BIG)
        
        # We need to write to specific addresses. 
        # The datastore is a continuous block. We'll update it sparsely.
        # Efficient way: iterate sorted keys and write chunks?
        # For simulation, just writing one by one or small blocks is fine.
        
        register = self.context[self.slave_id]
        
        for addr, val in self.registers.items():
            builder = BinaryPayloadBuilder(byteorder=Endian.BIG, wordorder=Endian.BIG)
            builder.add_32bit_float(val)
            payload = builder.build()
            register.setValues(3, addr, payload)

async def main():
    # Create Data Store (0-1000 registers)
    store = ModbusSlaveContext(
        hr=ModbusSequentialDataBlock(0, [0]*1000),
        ir=ModbusSequentialDataBlock(0, [0]*1000)
    )
    context = ModbusServerContext(slaves=store, single=True)

    # Start Simulation Worker
    worker = SimulationWorker(context)
    asyncio.create_task(worker.run())

    # Start Server
    logger.info("Starting Modbus TCP Server on 0.0.0.0:502")
    await StartAsyncTcpServer(context, address=("0.0.0.0", 502))

if __name__ == "__main__":
    asyncio.run(main())
