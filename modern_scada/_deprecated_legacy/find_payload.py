import pymodbus
print(f"Pymodbus version: {pymodbus.__version__}")
try:
    from pymodbus.payload import BinaryPayloadDecoder
    print("Found in pymodbus.payload")
except ImportError:
    print("Not found in pymodbus.payload")
    import inspect
    # Try to find it in top level or submodules
    print(dir(pymodbus))
