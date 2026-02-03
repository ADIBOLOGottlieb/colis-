# TypeScript Types: Authentication & Authorization

## File: `src/types/auth.ts`

```typescript
/**
 * Authentication and Authorization Types
 *
 * This module defines all types related to RBAC (Role-Based Access Control)
 * and the active mode system for LES_DEUX users.
 */

// ============================================================================
// CORE ENUMS
// ============================================================================

/**
 * User's permanent role stored in database
 * - EXPEDITEUR: Can only send packages
 * - VOYAGEUR: Can only offer trips
 * - LES_DEUX: Can do both, but must choose active mode per session
 */
export enum UserRole {
  EXPEDITEUR = 'EXPEDITEUR',
  VOYAGEUR = 'VOYAGEUR',
  LES_DEUX = 'LES_DEUX'
}

/**
 * Active mode determines current permissions
 * LES_DEUX users MUST have an active mode set during login
 */
export enum ActiveMode {
  EXPEDITEUR = 'EXPEDITEUR',
  VOYAGEUR = 'VOYAGEUR'
}

/**
 * Permission actions that can be performed in the system
 */
export enum Permission {
  // Package (Colis) permissions
  CREATE_COLIS = 'CREATE_COLIS',
  EDIT_OWN_COLIS = 'EDIT_OWN_COLIS',
  DELETE_OWN_COLIS = 'DELETE_OWN_COLIS',
  VIEW_COLIS = 'VIEW_COLIS',

  // Trip (Trajet) permissions
  CREATE_TRAJET = 'CREATE_TRAJET',
  EDIT_OWN_TRAJET = 'EDIT_OWN_TRAJET',
  DELETE_OWN_TRAJET = 'DELETE_OWN_TRAJET',
  VIEW_TRAJETS = 'VIEW_TRAJETS',

  // Messaging permissions
  CONTACT_VOYAGEUR = 'CONTACT_VOYAGEUR',
  CONTACT_EXPEDITEUR = 'CONTACT_EXPEDITEUR',
  VIEW_CONVERSATIONS = 'VIEW_CONVERSATIONS',
  SEND_MESSAGE = 'SEND_MESSAGE',

  // Matching permissions
  VIEW_MATCHES = 'VIEW_MATCHES',
  INITIATE_MATCH = 'INITIATE_MATCH'
}

// ============================================================================
// USER & SESSION TYPES
// ============================================================================

/**
 * Base user interface with role information
 */
export interface UserWithRole {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  activeMode?: ActiveMode;  // Required for LES_DEUX users
  modeSelectedAt?: number;  // Timestamp when mode was selected
}

/**
 * Extended session user with computed permission flags
 */
export interface SessionUser extends UserWithRole {
  // Computed permission flags for convenience
  canCreateColis: boolean;
  canCreateTrajet: boolean;
  canSwitchMode: boolean;  // Only true for LES_DEUX users
  effectiveRole: ActiveMode;  // The role used for permission checks
}

/**
 * Active mode session stored in database
 * Tracks mode selection for audit and session management
 */
export interface ActiveModeSession {
  id: string;
  userId: string;
  activeMode: ActiveMode;
  createdAt: Date;
  expiresAt: Date;
}

// ============================================================================
// PERMISSION MATRIX
// ============================================================================

/**
 * Permission matrix defining what each active mode can do
 * CRITICAL: This is the single source of truth for permissions
 */
export const PERMISSION_MATRIX: Record<ActiveMode, Permission[]> = {
  [ActiveMode.EXPEDITEUR]: [
    Permission.CREATE_COLIS,
    Permission.EDIT_OWN_COLIS,
    Permission.DELETE_OWN_COLIS,
    Permission.VIEW_COLIS,
    Permission.VIEW_TRAJETS,
    Permission.CONTACT_VOYAGEUR,
    Permission.VIEW_CONVERSATIONS,
    Permission.SEND_MESSAGE,
    Permission.VIEW_MATCHES,
    Permission.INITIATE_MATCH
  ],

  [ActiveMode.VOYAGEUR]: [
    Permission.CREATE_TRAJET,
    Permission.EDIT_OWN_TRAJET,
    Permission.DELETE_OWN_TRAJET,
    Permission.VIEW_TRAJETS,
    Permission.VIEW_COLIS,
    Permission.CONTACT_EXPEDITEUR,
    Permission.VIEW_CONVERSATIONS,
    Permission.SEND_MESSAGE,
    Permission.VIEW_MATCHES,
    Permission.INITIATE_MATCH
  ]
};

/**
 * Get permissions for a specific active mode
 */
export function getPermissionsForMode(mode: ActiveMode): Permission[] {
  return PERMISSION_MATRIX[mode];
}

/**
 * Check if an active mode has a specific permission
 */
export function hasPermission(mode: ActiveMode, permission: Permission): boolean {
  return PERMISSION_MATRIX[mode].includes(permission);
}

/**
 * Get the effective active mode from user data
 * Throws error if LES_DEUX user has no active mode set
 */
export function getEffectiveMode(user: UserWithRole): ActiveMode {
  if (user.role === UserRole.EXPEDITEUR) {
    return ActiveMode.EXPEDITEUR;
  }

  if (user.role === UserRole.VOYAGEUR) {
    return ActiveMode.VOYAGEUR;
  }

  if (user.role === UserRole.LES_DEUX) {
    if (!user.activeMode) {
      throw new ActiveModeRequiredError();
    }
    return user.activeMode;
  }

  throw new Error(`Invalid user role: ${user.role}`);
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class ActiveModeRequiredError extends Error {
  constructor() {
    super('Active mode selection required for LES_DEUX users');
    this.name = 'ActiveModeRequiredError';
  }
}

export class PermissionDeniedError extends Error {
  permission: Permission;
  effectiveMode: ActiveMode;

  constructor(permission: Permission, effectiveMode: ActiveMode) {
    super(`Permission denied: ${permission} required for ${effectiveMode} mode`);
    this.name = 'PermissionDeniedError';
    this.permission = permission;
    this.effectiveMode = effectiveMode;
  }
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const ACTIVE_MODE_SESSION_DURATION = 24; // hours
export const ACTIVE_MODE_COOKIE = 'cv_active_mode';
```
