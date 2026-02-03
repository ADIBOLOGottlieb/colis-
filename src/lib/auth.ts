import { NextAuthOptions, User, Session } from 'next-auth'
import { JWT } from 'next-auth/jwt'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { UserRole, ActiveMode, buildSessionUser, UserWithRole } from '@/types/auth'

// Extend NextAuth types
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

// Type for credentials
interface Credentials {
  email: string
  password: string
  activeMode?: ActiveMode
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
        activeMode: { label: "Active Mode", type: "text" }
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email et mot de passe requis')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user) {
          throw new Error('Identifiants invalides')
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          throw new Error('Identifiants invalides')
        }

        // Validate LES_DEUX users have selected an active mode
        let activeMode: ActiveMode | undefined
        const userRole = user.role as UserRole
        if (userRole === UserRole.LES_DEUX) {
          const selectedMode = credentials.activeMode as ActiveMode | undefined
          if (!selectedMode || !Object.values(ActiveMode).includes(selectedMode)) {
            throw new Error('MODE_SELECTION_REQUIRED')
          }
          activeMode = selectedMode
        }
        // EXPEDITEUR and VOYAGEUR don't need active mode selection

        // Build user with computed permission flags
        const userWithRole: UserWithRole = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: userRole,
          activeMode
        }
        const sessionUser = buildSessionUser(userWithRole)

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: userRole,
          activeMode,
          canCreateColis: sessionUser.canCreateColis,
          canCreateTrajet: sessionUser.canCreateTrajet,
          canSwitchMode: sessionUser.canSwitchMode,
          effectiveRole: sessionUser.effectiveRole
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }): Promise<JWT> {
      if (user) {
        // User just signed in
        token.id = user.id
        token.role = user.role
        token.activeMode = user.activeMode
        token.canCreateColis = user.canCreateColis
        token.canCreateTrajet = user.canCreateTrajet
        token.canSwitchMode = user.canSwitchMode
        token.effectiveRole = user.effectiveRole
      }
      return token
    },
    async session({ session, token }): Promise<Session> {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.activeMode = token.activeMode
        session.user.canCreateColis = token.canCreateColis
        session.user.canCreateTrajet = token.canCreateTrajet
        session.user.canSwitchMode = token.canSwitchMode
        session.user.effectiveRole = token.effectiveRole
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      // Log successful sign-in for LES_DEUX users with mode selection
      if (user.role === UserRole.LES_DEUX && user.activeMode) {
        console.log(`[AUTH] LES_DEUX user ${user.id} signed in with mode: ${user.activeMode}`)
      }
    },
  },
}
