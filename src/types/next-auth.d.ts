import 'next-auth'
import { UserRole, ActiveMode } from '@/types/auth'

declare module 'next-auth' {
  interface User {
    id: string
    role: UserRole
    activeMode?: ActiveMode
    canCreateColis: boolean
    canCreateTrajet: boolean
    canSwitchMode: boolean
    effectiveRole: ActiveMode
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: UserRole
      activeMode?: ActiveMode
      canCreateColis: boolean
      canCreateTrajet: boolean
      canSwitchMode: boolean
      effectiveRole: ActiveMode
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
    activeMode?: ActiveMode
    canCreateColis: boolean
    canCreateTrajet: boolean
    canSwitchMode: boolean
    effectiveRole: ActiveMode
  }
}
