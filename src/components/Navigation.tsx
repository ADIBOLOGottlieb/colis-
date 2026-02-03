'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Package, Menu, X, LogOut } from 'lucide-react'
import { UserRole } from '@/types/auth'
import { generateNavbar } from '@/modules/auth/navigation'

export function Navigation() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const canSwitchMode = session?.user?.role === UserRole.LES_DEUX
  const navItems = session ? generateNavbar(session) : []

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
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary-600 hover:text-primary-700 transition-colors">
            <div className="bg-primary-600 text-white p-1.5 rounded-lg">
              <Package className="w-5 h-5" />
            </div>
            <span className="hidden sm:block">colis+</span>
          </Link>

          <div className="hidden md:flex items-center gap-2">
            {session ? (
              <>
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href} className={navLinkClass(item.href)}>
                    <span>{item.label}</span>
                  </Link>
                ))}

                {canSwitchMode && (
                  <Link href="/select-mode" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-200">
                    <span className="text-xs font-semibold">Changer de mode</span>
                  </Link>
                )}

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

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col gap-2">
              {session ? (
                <>
                  {navItems.map((item) => (
                    <Link key={item.href} href={item.href} className={navLinkClass(item.href)} onClick={() => setMobileMenuOpen(false)}>
                      <span>{item.label}</span>
                    </Link>
                  ))}
                  {canSwitchMode && (
                    <Link href="/select-mode" className="flex items-center gap-2 px-3 py-2 text-gray-700" onClick={() => setMobileMenuOpen(false)}>
                      <span>Changer de mode</span>
                    </Link>
                  )}
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
