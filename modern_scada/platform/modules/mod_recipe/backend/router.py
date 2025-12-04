from fastapi import APIRouter, HTTPException
from .service import RecipeService, Recipe

router = APIRouter()
service = RecipeService()

@router.get("/recipes", response_model=list[Recipe])
async def list_recipes():
    return await service.get_all_recipes()

@router.post("/recipes", response_model=Recipe)
async def create_recipe(recipe: Recipe):
    return await service.create_recipe(recipe)

@router.delete("/recipes/{recipe_id}")
async def delete_recipe(recipe_id: str):
    await service.delete_recipe(recipe_id)
    return {"status": "deleted"}

@router.post("/recipes/{recipe_id}/execute")
async def execute_recipe(recipe_id: str):
    try:
        result = await service.execute_recipe(recipe_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/recipes/compare")
async def compare_recipes(id1: str, id2: str):
    try:
        return await service.compare_recipes(id1, id2)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
