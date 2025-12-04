import { useAppStore } from '@core/stores/useAppStore';

export type PermissionAction = 'UNLOCK_RECIPE' | 'START_MACHINE' | 'STOP_MACHINE' | 'EDIT_SETTINGS';

const PERMISSION_MATRIX: Record<string, PermissionAction[]> = {
    'admin': ['UNLOCK_RECIPE', 'START_MACHINE', 'STOP_MACHINE', 'EDIT_SETTINGS'],
    'operator': ['START_MACHINE', 'STOP_MACHINE'],
    'viewer': []
};

export const usePermission = (action: PermissionAction): boolean => {
    // Assuming useAppStore has a user object with a role
    // If not, we might need to mock it or fetch it from a user store
    const user = useAppStore((state: any) => state.user);

    if (!user || !user.role) {
        return false;
    }

    const allowedActions = PERMISSION_MATRIX[user.role] || [];
    return allowedActions.includes(action);
};
