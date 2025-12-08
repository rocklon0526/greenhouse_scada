import importlib.util
import os
import sys
import logging
from typing import List, Callable, Dict, Any

logger = logging.getLogger(__name__)

# [新增] Context 包裝類別，讓腳本可以呼叫 get_tag_value
class LogicContext:
    def __init__(self, tags: Dict[str, Any]):
        self.tags = tags
    
    def get_tag_value(self, tag_name: str, default=None):
        return self.tags.get(tag_name, default)

    def get(self, key, default=None):
        return self.tags.get(key, default)
    
    def __getitem__(self, key):
        return self.tags[key]

class LogicLoader:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(LogicLoader, cls).__new__(cls)
            cls._instance.hooks: List[Callable[[Any], None]] = []
        return cls._instance

    def load_scripts(self, logic_dir: str):
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
                        
                        if hasattr(module, "run"):
                            self.hooks.append(module.run)
                            logger.info(f"✅ Loaded Logic Hook: {module_name}")
                        elif hasattr(module, "process_tags"): # 兼容舊版命名
                            self.hooks.append(module.process_tags)
                            logger.info(f"✅ Loaded Logic Hook (legacy): {module_name}")
                        else:
                            logger.debug(f"Skipped {filename}: No 'run' or 'process_tags' function found.")
                except Exception as e:
                    logger.error(f"❌ Failed to load script {filename}: {e}")

    def execute_hooks(self, tags: Dict[str, Any]):
        # [修正] 將 dict 包裝成 Context 物件再傳給腳本
        context = LogicContext(tags)
        
        for hook in self.hooks:
            try:
                hook(context)
            except Exception as e:
                logger.error(f"❌ Logic Hook Error: {e}")