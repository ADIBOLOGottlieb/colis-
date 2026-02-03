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
          permission,
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
export function requireAuth(): (handler: ApiHandler) => ApiHandler {
  return (handler) => async (request, context) => {
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
        conversation?.colis?.userId === userId ||
        conversation?.trajet?.userId === userId
      );
    }

    default:
      return false;
  }
}

// ============================================================================
// SECURITY AUDIT LOGGING
// ============================================================================

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
