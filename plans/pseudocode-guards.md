# Pseudocode: Security Guards & Middleware

## File: `src/lib/auth/guards.ts`

```typescript
/**
 * Security Guards and Middleware
 *
 * Implements role-based access control with active mode support.
 * ALL permission checks MUST go through these functions.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import {
  Permission,
  ActiveMode,
  UserRole,
  UserWithRole,
  PermissionDeniedError,
  ActiveModeRequiredError,
  getEffectiveMode,
  hasPermission
} from '@/types/auth';
import { prisma } from '@/lib/prisma';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * API handler function type
 */
type ApiHandler = (
  request: Request,
  context?: { params: Record<string, string> }
) => Promise<NextResponse>;

/**
 * Guard options for permission checks
 */
interface GuardOptions {
  /** Require ownership of the resource */
  requireOwnership?: boolean;

  /** Resource type for ownership check */
  resourceType?: 'colis' | 'trajet' | 'conversation';

  /** Resource ID parameter name in URL */
  resourceIdParam?: string;

  /** Log permission denials for audit */
  auditLog?: boolean;
}

// ============================================================================
// CORE GUARD FUNCTIONS
// ============================================================================

/**
 * Higher-order function that wraps API handlers with permission checks
 *
 * Usage:
 *   export const POST = requirePermission(Permission.CREATE_COLIS)(async (req) => {
 *     // Handler only executes if user has permission
 *   });
 *
 * @param permission - Required permission
 * @param options - Additional guard options
 * @returns Wrapped handler function
 */
export function requirePermission(
  permission: Permission,
  options: GuardOptions = {}
): (handler: ApiHandler) => ApiHandler {
  return (handler) => async (request, context) => {
    try {
      // Step 1: Verify authentication
      const session = await getServerSession(authOptions);

      if (!session?.user) {
        await logSecurityEvent({
          event: 'AUTH_REQUIRED',
          permission,
          result: 'DENIED',
          reason: 'No session'
        });

        return NextResponse.json(
          { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
          { status: 401 }
        );
      }

      // Step 2: Get effective mode (handles LES_DEUX requirement)
      let effectiveMode: ActiveMode;
      try {
        effectiveMode = getEffectiveMode(session.user as UserWithRole);
      } catch (error) {
        if (error instanceof ActiveModeRequiredError) {
          await logSecurityEvent({
            event: 'ACTIVE_MODE_REQUIRED',
            userId: session.user.id,
            permission,
            result: 'DENIED'
          });

          return NextResponse.json(
            {
              error: 'Active mode selection required',
              code: 'ACTIVE_MODE_REQUIRED',
              redirectTo: '/auth/select-mode'
            },
            { status: 403 }
          );
        }
        throw error;
      }

      // Step 3: Check permission
      if (!hasPermission(effectiveMode, permission)) {
        await logSecurityEvent({
          event: 'PERMISSION_DENIED',
          userId: session.user.id,
          effectiveMode,
          requiredPermission: permission,
          result: 'DENIED'
        });

        return NextResponse.json(
          {
            error: 'Forbidden: Insufficient permissions',
            code: 'PERMISSION_DENIED',
            required: permission,
            currentMode: effectiveMode
          },
          { status: 403 }
        );
      }

      // Step 4: Check ownership if required
      if (options.requireOwnership && options.resourceType) {
        const resourceId = context?.params?.[options.resourceIdParam || 'id'];

        if (resourceId) {
          const isOwner = await verifyOwnership(
            session.user.id,
            options.resourceType,
            resourceId
          );

          if (!isOwner) {
            await logSecurityEvent({
              event: 'OWNERSHIP_DENIED',
              userId: session.user.id,
              resourceType: options.resourceType,
              resourceId,
              result: 'DENIED'
            });

            return NextResponse.json(
              { error: 'Forbidden: Not resource owner', code: 'OWNERSHIP_DENIED' },
              { status: 403 }
            );
          }
        }
      }

      // Step 5: Log successful access if audit enabled
      if (options.auditLog) {
        await logSecurityEvent({
          event: 'PERMISSION_GRANTED',
          userId: session.user.id,
          effectiveMode,
          permission,
          result: 'GRANTED'
        });
      }

      // Execute handler with enriched context
      return handler(request, context);

    } catch (error) {
      console.error('Guard error:', error);
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }
  };
}

/**
 * Guard that only requires authentication (no specific permission)
 *
 * Usage:
 *   export const GET = requireAuth()(async (req) => { ... });
 */
export function requireAuth() {
  return (handler: ApiHandler): ApiHandler => async (request, context) => {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    return handler(request, context);
  };
}

/**
 * Guard that requires specific role (ignoring active mode)
 * Use sparingly - prefer requirePermission for most cases
 *
 * Usage:
 *   export const POST = requireRole(UserRole.LES_DEUX)(async (req) => { ... });
 */
export function requireRole(role: UserRole) {
  return (handler: ApiHandler): ApiHandler => async (request, context) => {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    if (session.user.role !== role) {
      return NextResponse.json(
        {
          error: 'Forbidden: Role required',
          code: 'ROLE_REQUIRED',
          required: role,
          current: session.user.role
        },
        { status: 403 }
      );
    }

    return handler(request, context);
  };
}

// ============================================================================
// OWNERSHIP VERIFICATION
// ============================================================================

/**
 * Verify if user owns a specific resource
 */
async function verifyOwnership(
  userId: string,
  resourceType: 'colis' | 'trajet' | 'conversation',
  resourceId: string
): Promise<boolean> {
  switch (resourceType) {
    case 'colis': {
      const colis = await prisma.colis.findUnique({
        where: { id: resourceId },
        select: { userId: true }
      });
      return colis?.userId === userId;
    }

    case 'trajet': {
      const trajet = await prisma.trajet.findUnique({
        where: { id: resourceId },
        select: { userId: true }
      });
      return trajet?.userId === userId;
    }

    case 'conversation': {
      const conversation = await prisma.conversation.findUnique({
        where: { id: resourceId },
        include: {
          colis: { select: { userId: true } },
          trajet: { select: { userId: true } }
        }
      });
      return (
        conversation?.colis.userId === userId ||
        conversation?.trajet.userId === userId
      );
    }

    default:
      return false;
  }
}

// ============================================================================
// SECURITY AUDIT LOGGING
// ============================================================================

interface SecurityEvent {
  event: string;
  userId?: string;
  effectiveMode?: ActiveMode;
  permission?: Permission;
  resourceType?: string;
  resourceId?: string;
  result: 'GRANTED' | 'DENIED';
  reason?: string;
  timestamp?: Date;
  ipAddress?: string;
}

/**
 * Log security events for audit trail
 * In production, this should write to a secure log store
 */
async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  const logEntry = {
    ...event,
    timestamp: new Date(),
    environment: process.env.NODE_ENV
  };

  // In production: send to logging service (Datadog, Splunk, etc.)
  // For now, log to console with structured format
  console.log('[SECURITY_AUDIT]', JSON.stringify(logEntry));

  // Optional: Store in database for admin review
  // await prisma.securityAuditLog.create({ data: logEntry });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Assert that user has permission (throws instead of returning response)
 * Use in service layer or when you need custom error handling
 */
export async function assertPermission(
  permission: Permission
): Promise<{ userId: string; effectiveMode: ActiveMode }> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new PermissionDeniedError(permission, ActiveMode.EXPEDITEUR);
  }

  const effectiveMode = getEffectiveMode(session.user as UserWithRole);

  if (!hasPermission(effectiveMode, permission)) {
    throw new PermissionDeniedError(permission, effectiveMode);
  }

  return {
    userId: session.user.id,
    effectiveMode
  };
}

/**
 * Get current user's effective mode
 * Returns null if not authenticated
 */
export async function getCurrentEffectiveMode(): Promise<ActiveMode | null> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null;
  }

  try {
    return getEffectiveMode(session.user as UserWithRole);
  } catch {
    return null;
  }
}

/**
 * Check if current user can switch modes
 * Only LES_DEUX users can switch
 */
export async function canSwitchMode(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  return session?.user?.role === UserRole.LES_DEUX;
}
```

## File: `src/lib/auth/session.ts`

```typescript
/**
 * Session Management for Active Mode
 *
 * Handles mode selection, switching, and session persistence.
 */

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import {
  ActiveMode,
  UserRole,
  ModeSelectionResponse,
  ACTIVE_MODE_SESSION_DURATION
} from '@/types/auth';
import { prisma } from '@/lib/prisma';
import { addHours } from 'date-fns';

// ============================================================================
// MODE SELECTION
// ============================================================================

/**
 * Select active mode for LES_DEUX user
 * Called during login or when switching modes
 *
 * @param userId - User ID
 * @param mode - Selected active mode
 * @returns Mode selection response
 */
export async function selectActiveMode(
  userId: string,
  mode: ActiveMode
): Promise<ModeSelectionResponse> {
  // Verify user is LES_DEUX
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.role !== UserRole.LES_DEUX) {
    throw new Error('Only LES_DEUX users can select active mode');
  }

  // Create active mode session
  const expiresAt = addHours(new Date(), ACTIVE_MODE_SESSION_DURATION);

  await prisma.activeModeSession.create({
    data: {
      userId,
      activeMode: mode,
      expiresAt
    }
  });

  // Clean up expired sessions
  await cleanupExpiredSessions(userId);

  return {
    success: true,
    activeMode: mode,
    expiresAt: expiresAt.toISOString(),
    message: `Mode ${mode} activated successfully`
  };
}

/**
 * Switch active mode for LES_DEUX user
 * Validates current session before allowing switch
 *
 * @param userId - User ID
 * @param newMode - New active mode
 * @returns Mode selection response
 */
export async function switchActiveMode(
  userId: string,
  newMode: ActiveMode
): Promise<ModeSelectionResponse> {
  // Get current session
  const currentSession = await getActiveModeSession(userId);

  if (!currentSession) {
    throw new Error('No active session found');
  }

  if (currentSession.activeMode === newMode) {
    return {
      success: true,
      activeMode: newMode,
      expiresAt: currentSession.expiresAt.toISOString(),
      message: `Already in ${newMode} mode`
    };
  }

  // Invalidate current session
  await prisma.activeModeSession.deleteMany({
    where: { userId }
  });

  // Create new session with new mode
  return selectActiveMode(userId, newMode);
}

/**
 * Get current active mode session for user
 */
export async function getActiveModeSession(userId: string) {
  const session = await prisma.activeModeSession.findFirst({
    where: {
      userId,
      expiresAt: { gt: new Date() }
    },
    orderBy: { createdAt: 'desc' }
  });

  return session;
}

/**
 * Validate and refresh active mode session
 * Called on each request to ensure session is still valid
 *
 * @param userId - User ID
 * @returns Active mode or null if invalid
 */
export async function validateActiveModeSession(
  userId: string
): Promise<ActiveMode | null> {
  const session = await getActiveModeSession(userId);

  if (!session) {
    return null;
  }

  // Extend session if it's close to expiring
  const hoursUntilExpiry =
    (session.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60);

  if (hoursUntilExpiry < 4) {
    await prisma.activeModeSession.update({
      where: { id: session.id },
      data: {
        expiresAt: addHours(new Date(), ACTIVE_MODE_SESSION_DURATION)
      }
    });
  }

  return session.activeMode as ActiveMode;
}

// ============================================================================
// SESSION CLEANUP
// ============================================================================

/**
 * Clean up expired sessions for a user
 */
async function cleanupExpiredSessions(userId: string): Promise<void> {
  await prisma.activeModeSession.deleteMany({
    where: {
      userId,
      expiresAt: { lte: new Date() }
    }
  });
}

/**
 * Clean up all sessions for a user (e.g., on logout)
 */
export async function invalidateAllSessions(userId: string): Promise<void> {
  await prisma.activeModeSession.deleteMany({
    where: { userId }
  });
}
```

## File: `src/components/RoleGuard.tsx`

```typescript
/**
 * React Component: RoleGuard
 *
 * Client-side permission checking for UI elements.
 * NOTE: This is for UI convenience only - ALWAYS validate on server!
 */

'use client';

import { useSession } from 'next-auth/react';
import {
  Permission,
  ActiveMode,
  UserRole,
  hasPermission,
  getEffectiveMode
} from '@/types/auth';

interface RoleGuardProps {
  /** Required permission to render children */
  permission?: Permission;

  /** Required role (rarely used) */
  role?: UserRole;

  /** Content to render if authorized */
  children: React.ReactNode;

  /** Content to render if unauthorized (default: null) */
  fallback?: React.ReactNode;

  /** Render children even if unauthorized, but disabled */
  showDisabled?: boolean;
}

/**
 * Guard component that conditionally renders based on permissions
 *
 * Usage:
 *   <RoleGuard permission={Permission.CREATE_COLIS}>
 *     <Button>Publier un colis</Button>
 *   </RoleGuard>
 */
export function RoleGuard({
  permission,
  role,
  children,
  fallback = null,
  showDisabled = false
}: RoleGuardProps) {
  const { data: session, status } = useSession();

  // Loading state
  if (status === 'loading') {
    return null;
  }

  // Not authenticated
  if (!session?.user) {
    return <>{fallback}</>;
  }

  // Check role requirement
  if (role && session.user.role !== role) {
    return <>{fallback}</>;
  }

  // Check permission requirement
  if (permission) {
    try {
      const effectiveMode = getEffectiveMode(session.user);
      const hasAccess = hasPermission(effectiveMode, permission);

      if (!hasAccess) {
        if (showDisabled) {
          return (
            <div className="opacity-50 pointer-events-none">
              {children}
            </div>
          );
        }
        return <>{fallback}</>;
      }
    } catch {
      // LES_DEUX without active mode
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}

/**
 * Hook to check permissions in components
 *
 * Usage:
 *   const canCreateColis = usePermission(Permission.CREATE_COLIS);
 */
export function usePermission(permission: Permission): boolean {
  const { data: session } = useSession();

  if (!session?.user) return false;

  try {
    const effectiveMode = getEffectiveMode(session.user);
    return hasPermission(effectiveMode, permission);
  } catch {
    return false;
  }
}

/**
 * Hook to get effective mode
 *
 * Usage:
 *   const effectiveMode = useEffectiveMode();
 */
export function useEffectiveMode(): ActiveMode | null {
  const { data: session } = useSession();

  if (!session?.user) return null;

  try {
    return getEffectiveMode(session.user);
  } catch {
    return null;
  }
}

/**
 * Hook to check if user can switch modes
 */
export function useCanSwitchMode(): boolean {
  const { data: session } = useSession();
  return session?.user?.role === UserRole.LES_DEUX;
}
```
