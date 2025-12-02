import importlib.util
import os
import sys
import logging
from typing import List, Callable, Dict, Any

logger = logging.getLogger(__name__)

class LogicLoader:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(LogicLoader, cls).__new__(cls)
            cls._instance.hooks: List[Callable[[Dict[str, Any]], None]] = []
        return cls._instance

    def load_scripts(self, logic_dir: str):
        """
        Dynamically loads Python scripts from the specified directory.
        Looks for a 'process_tags' function in each script.
        """
        if not os.path.exists(logic_dir):
            logger.warning(f"Logic directory not found: {logic_dir}")
            return

        logger.info(f"Loading logic scripts from: {logic_dir}")
        self.hooks = [] # Reset hooks

        for filename in os.listdir(logic_dir):
            if filename.endswith(".py") and not filename.startswith("__"):
                try:
                    module_name = filename[:-3]
                    file_path = os.path.join(logic_dir, filename)
                    
                    spec = importlib.util.spec_from_file_location(module_name, file_path)
                    if spec and spec.loader:
                        module = importlib.util.module_from_spec(spec)
                        spec.loader.exec_module(module)
                        
                        # Check for 'process_tags' function
                        if hasattr(module, "process_tags"):
                            self.hooks.append(module.process_tags)
                            logger.info(f"✅ Loaded Logic Hook: {module_name}")
                        else:
                            logger.debug(f"Skipped {filename}: No 'process_tags' function found.")
                except Exception as e:
                    logger.error(f"❌ Failed to load script {filename}: {e}")

    def execute_hooks(self, tags: Dict[str, Any]):
        """
        Executes all loaded hooks against the provided tags.
        """
        for hook in self.hooks:
            try:
                hook(tags)
            except Exception as e:
                logger.error(f"❌ Logic Hook Error: {e}")
