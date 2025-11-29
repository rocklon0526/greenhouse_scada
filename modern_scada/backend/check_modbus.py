from pymodbus.client import AsyncModbusTcpClient
import inspect

print(f"Signature: {inspect.signature(AsyncModbusTcpClient.read_holding_registers)}")
