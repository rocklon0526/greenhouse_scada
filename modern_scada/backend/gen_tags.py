base_addr = 100
yaml_str = ''
for i in range(1, 7):
    sid = f'sensor_{i}'
    for level in ['top', 'mid', 'bot']:
        for metric, unit in [('temp', '\\xB0C'), ('hum', '%'), ('co2', 'ppm')]:
            addr = base_addr
            yaml_str += f'- address: {addr}\n  connection_name: Main PLC\n  name: {sid}_{level}_{metric}\n  type: float\n  unit: "{unit}"\n'
            base_addr += 2
    base_addr += 2 # Gap between sensors
print(yaml_str)
