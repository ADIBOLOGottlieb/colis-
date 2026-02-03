'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Package, Plane, MessageSquare, User, LogOut, PlusCircle, Menu, X } from 'lucide-react'
import { UserRole, ActiveMode, canCreateColis, canCreateTrajet } from '@/types/auth'

export function Navigation() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Determine what actions the user can perform
  const userCanCreateColis = session?.user ? canCreateColis({
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    activeMode: session.user.activeMode
  }) : false

  const userCanCreateTrajet = session?.user ? canCreateTrajet({
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    activeMode: session.user.activeMode
  }) : false

  const canSwitchMode = session?.user?.role === UserRole.LES_DEUX

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/')

  const navLinkClass = (path: string) => `
    flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200
    ${isActive(path)
      ? 'bg-primary-50 text-primary-700 font-medium'
      : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
    }
  `

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary-600 hover:text-primary-700 transition-colors">
            <div className="bg-primary-600 text-white p-1.5 rounded-lg">
              <Package className="w-5 h-5" />
            </div>
            <span className="hidden sm:block">Colis Voyageurs</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {session ? (
              <>
                {/* Browse Links */}
                <Link href="/trajets" className={navLinkClass('/trajets')}>
                  <Plane className="w-4 h-4" />
                  <span>Trajets</span>
                </Link>
                <Link href="/colis" className={navLinkClass('/colis')}>
                  <Package className="w-4 h-4" />
                  <span>Colis</span>
                </Link>

                {/* Create Actions */}
                {userCanCreateTrajet && (
                  <Link
                    href="/trajets/nouveau"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-all duration-200"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span className="hidden lg:block">Proposer</span>
                  </Link>
                )}

                {userCanCreateColis && (
                  <Link
                    href="/colis/nouveau"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all duration-200"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span className="hidden lg:block">Envoyer</span>
                  </Link>
                )}

                {/* Mode Switcher */}
                {canSwitchMode && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full border border-gray-200">
                    <span className="text-xs text-gray-500">Mode:</span>
                    <span className={`text-xs font-semibold ${
                      session.user.activeMode === ActiveMode.EXPEDITEUR
                        ? 'text-blue-600'
                        : 'text-green-600'
                    }`}>
                      {session.user.activeMode === ActiveMode.EXPEDITEUR ? 'Expéditeur' : 'Voyageur'}
                    </span>
                  </div>
                )}

                <Link href="/messages" className={navLinkClass('/messages')}>
                  <MessageSquare className="w-4 h-4" />
                </Link>

                {/* User Profile */}
                <Link
                  href="/profil"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200"
                >
                  <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="hidden lg:flex flex-col items-start">
                    <span className="text-sm font-medium text-gray-900">{session.user.name}</span>
                    <span className="text-xs text-gray-500">
                      {session.user.role === UserRole.EXPEDITEUR && 'Expéditeur'}
                      {session.user.role === UserRole.VOYAGEUR && 'Voyageur'}
                      {session.user.role === UserRole.LES_DEUX && 'Les deux'}
                    </span>
                  </div>
                </Link>

                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200"
                  title="Déconnexion"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/auth/signin"
                  className="px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-all duration-200"
                >
                  Connexion
                </Link>
                <Link href="/auth/register" className="btn-primary">
                  Inscription
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col gap-2">
              {session ? (
                <>
                  <Link href="/trajets" className={navLinkClass('/trajets')} onClick={() => setMobileMenuOpen(false)}>
                    <Plane className="w-5 h-5" />
                    <span>Trajets</span>
                  </Link>
                  <Link href="/colis" className={navLinkClass('/colis')} onClick={() => setMobileMenuOpen(false)}>
                    <Package className="w-5 h-5" />
                    <span>Colis</span>
                  </Link>
                  {userCanCreateTrajet && (
                    <Link href="/trajets/nouveau" className="flex items-center gap-2 px-3 py-2 text-green-700" onClick={() => setMobileMenuOpen(false)}>
                      <PlusCircle className="w-5 h-5" />
                      <span>Proposer trajet</span>
                    </Link>
                  )}
                  {userCanCreateColis && (
                    <Link href="/colis/nouveau" className="flex items-center gap-2 px-3 py-2 text-blue-700" onClick={() => setMobileMenuOpen(false)}>
                      <PlusCircle className="w-5 h-5" />
                      <span>Envoyer colis</span>
                    </Link>
                  )}
                  <Link href="/messages" className={navLinkClass('/messages')} onClick={() => setMobileMenuOpen(false)}>
                    <MessageSquare className="w-5 h-5" />
                    <span>Messages</span>
                  </Link>
                  <Link href="/profil" className={navLinkClass('/profil')} onClick={() => setMobileMenuOpen(false)}>
                    <User className="w-5 h-5" />
                    <span>Profil</span>
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="flex items-center gap-2 px-3 py-2 text-red-600"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Déconnexion</span>
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/signin" className="px-3 py-2 text-gray-700" onClick={() => setMobileMenuOpen(false)}>
                    Connexion
                  </Link>
                  <Link href="/auth/register" className="px-3 py-2 text-primary-600 font-medium" onClick={() => setMobileMenuOpen(false)}>
                    Inscription
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
