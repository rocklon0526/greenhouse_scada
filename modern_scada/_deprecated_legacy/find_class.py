import pymodbus
import pkgutil
import importlib

def find_class(package, class_name):
    for importer, modname, ispkg in pkgutil.walk_packages(package.__path__, package.__name__ + "."):
        try:
            module = importlib.import_module(modname)
            if hasattr(module, class_name):
                print(f"Found {class_name} in {modname}")
                return
        except Exception:
            pass

find_class(pymodbus, "BinaryPayloadDecoder")
