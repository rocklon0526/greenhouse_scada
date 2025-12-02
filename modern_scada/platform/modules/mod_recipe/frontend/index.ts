import { RecipeManager } from './components/RecipeManager';
import { ModuleDefinition } from '../../../core/frontend/src/types/module';

export const RecipeModule: ModuleDefinition = {
    id: 'mod_recipe',
    widgets: {
        'recipe_manager': RecipeManager
    },
    routes: [
        { path: '/recipes', component: RecipeManager }
    ]
};
