'use client'

import { ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { UserRole, ActiveMode, Permission, hasPermission, getEffectiveMode, UserWithRole } from '@/types/auth'

interface RoleGuardProps {
  children: ReactNode
  fallback?: ReactNode
  requirePermission?: Permission
  requireRole?: UserRole
  requireActiveMode?: ActiveMode
}

/**
 * RoleGuard Component
 *
 * Conditionally renders children based on user's role and permissions.
 * Use this to protect UI elements from users who don't have permission.
 *
 * Examples:
 *   <RoleGuard requirePermission={Permission.CREATE_COLIS}>
 *     <CreateColisButton />
 *   </RoleGuard>
 *
 *   <RoleGuard requireRole={UserRole.LES_DEUX}>
 *     <ModeSwitcher />
 *   </RoleGuard>
 */
export function RoleGuard({
  children,
  fallback = null,
  requirePermission,
  requireRole,
  requireActiveMode
}: RoleGuardProps) {
  const { data: session, status } = useSession()

  // Loading state
  if (status === 'loading') {
    return null
  }

  // Not authenticated
  if (!session?.user) {
    return fallback
  }

  const user = session.user

  // Check required role
  if (requireRole && user.role !== requireRole) {
    return fallback
  }

  // Check required active mode
  if (requireActiveMode) {
    const effectiveMode = user.activeMode ||
      (user.role === UserRole.EXPEDITEUR ? ActiveMode.EXPEDITEUR :
       user.role === UserRole.VOYAGEUR ? ActiveMode.VOYAGEUR : undefined)

    if (effectiveMode !== requireActiveMode) {
      return fallback
    }
  }

  // Check required permission
  if (requirePermission) {
    try {
      const userWithRole: UserWithRole = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        activeMode: user.activeMode
      }

      const effectiveMode = getEffectiveMode(userWithRole)

      if (!hasPermission(effectiveMode, requirePermission)) {
        return fallback
      }
    } catch {
      // If we can't determine effective mode (e.g., LES_DEUX without active mode)
      return fallback
    }
  }

  return children
}

interface CanCreateColisProps {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Guard that only shows children if user can create colis
 */
export function CanCreateColis({ children, fallback = null }: CanCreateColisProps) {
  const { data: session } = useSession()

  if (!session?.user) return fallback

  const canCreate =
    session.user.role === UserRole.EXPEDITEUR ||
    (session.user.role === UserRole.LES_DEUX && session.user.activeMode === ActiveMode.EXPEDITEUR)

  return canCreate ? children : fallback
}

interface CanCreateTrajetProps {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Guard that only shows children if user can create trajet
 */
export function CanCreateTrajet({ children, fallback = null }: CanCreateTrajetProps) {
  const { data: session } = useSession()

  if (!session?.user) return fallback

  const canCreate =
    session.user.role === UserRole.VOYAGEUR ||
    (session.user.role === UserRole.LES_DEUX && session.user.activeMode === ActiveMode.VOYAGEUR)

  return canCreate ? children : fallback
}

interface CanSwitchModeProps {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Guard that only shows children if user can switch modes (LES_DEUX only)
 */
export function CanSwitchMode({ children, fallback = null }: CanSwitchModeProps) {
  const { data: session } = useSession()

  if (!session?.user) return fallback

  return session.user.role === UserRole.LES_DEUX ? children : fallback
}

interface IsAuthenticatedProps {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Guard that only shows children if user is authenticated
 */
export function IsAuthenticated({ children, fallback = null }: IsAuthenticatedProps) {
  const { data: session, status } = useSession()

  if (status === 'loading') return null

  return session?.user ? children : fallback
}

interface IsRoleProps {
  role: UserRole
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Guard that only shows children if user has specific role
 */
export function IsRole({ role, children, fallback = null }: IsRoleProps) {
  const { data: session } = useSession()

  if (!session?.user) return fallback

  return session.user.role === role ? children : fallback
}
