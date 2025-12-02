import struct

def decode_float(registers):
    """
    Decode a 32-bit float from 2 Modbus registers (Big Endian).
    """
    if not registers or len(registers) < 2:
        return 0.0
    # Pack as 2 unsigned shorts (Big Endian)
    b = struct.pack('>HH', registers[0], registers[1])
    # Unpack as float (Big Endian)
    return struct.unpack('>f', b)[0]
