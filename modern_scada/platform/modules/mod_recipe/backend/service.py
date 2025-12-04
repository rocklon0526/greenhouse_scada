import json
import logging
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from services.redis_service import RedisService

logger = logging.getLogger(__name__)

class RecipeStep(BaseModel):
    id: str
    description: str
    actions: Dict[str, str]  # e.g., {"fan_01": "ON", "pump_01": "OFF"}
    duration_seconds: int

class Recipe(BaseModel):
    id: str
    name: str
    version: int = 1
    steps: List[RecipeStep]

class RecipeService:
    def __init__(self):
        # In a real app, this would load from DB or file
        self.recipes: Dict[str, Recipe] = {
            "lettuce_growth": Recipe(
                id="lettuce_growth",
                name="Lettuce Growth Cycle",
                version=1,
                steps=[
                    RecipeStep(id="step1", description="Initial Watering", actions={"pump_01": "ON"}, duration_seconds=10),
                    RecipeStep(id="step2", description="Ventilation", actions={"pump_01": "OFF", "fan_01": "ON"}, duration_seconds=20),
                    RecipeStep(id="step3", description="Rest", actions={"fan_01": "OFF"}, duration_seconds=5)
                ]
            )
        }

    async def get_all_recipes(self) -> List[Recipe]:
        return list(self.recipes.values())

    async def get_recipe(self, recipe_id: str) -> Optional[Recipe]:
        return self.recipes.get(recipe_id)

    async def create_recipe(self, recipe: Recipe) -> Recipe:
        # Simple versioning logic: if exists, increment version
        if recipe.id in self.recipes:
            existing = self.recipes[recipe.id]
            recipe.version = existing.version + 1
        self.recipes[recipe.id] = recipe
        return recipe

    async def delete_recipe(self, recipe_id: str):
        if recipe_id in self.recipes:
            del self.recipes[recipe_id]

    async def compare_recipes(self, id1: str, id2: str) -> Dict[str, Any]:
        r1 = self.recipes.get(id1)
        r2 = self.recipes.get(id2)
        
        if not r1 or not r2:
            raise ValueError("One or both recipes not found")
            
        diff = {
            "id_diff": r1.id != r2.id,
            "name_diff": r1.name != r2.name,
            "version_diff": {"r1": r1.version, "r2": r2.version},
            "steps_diff": []
        }
        
        # Simple step comparison by index
        max_steps = max(len(r1.steps), len(r2.steps))
        for i in range(max_steps):
            s1 = r1.steps[i] if i < len(r1.steps) else None
            s2 = r2.steps[i] if i < len(r2.steps) else None
            
            if s1 and s2:
                if s1.dict() != s2.dict():
                    diff["steps_diff"].append({
                        "index": i,
                        "r1": s1.dict(),
                        "r2": s2.dict(),
                        "status": "modified"
                    })
            elif s1:
                diff["steps_diff"].append({"index": i, "r1": s1.dict(), "r2": None, "status": "deleted_in_r2"})
            elif s2:
                diff["steps_diff"].append({"index": i, "r1": None, "r2": s2.dict(), "status": "added_in_r2"})
                
        return diff

    async def execute_recipe(self, recipe_id: str):
        recipe = self.recipes.get(recipe_id)
        if not recipe:
            raise ValueError(f"Recipe {recipe_id} not found")
        
        logger.info(f"Starting execution of recipe: {recipe.name} (v{recipe.version})")
        
        # This is a simplified execution. In a real system, this would be a background task.
        for step in recipe.steps:
            logger.info(f"Executing step: {step.description}")
            for device_id, command in step.actions.items():
                await RedisService.publish_command(device_id, command)
            
            # Note: We are NOT waiting for duration here to avoid blocking the API.
            # A real implementation would use a background worker (Celery/Arq) to handle timing.
            
        logger.info(f"Recipe execution commands sent for: {recipe.name}")
        return {"status": "started", "message": f"Recipe {recipe.name} execution started"}
