import { ActiveMode, UserRole } from '../../types/auth'

export type NavItem = {
  label: string
  href: string
}

export function generateNavbar(session: {
  user?: { role: UserRole; activeMode?: ActiveMode }
}): NavItem[] {
  const role = session.user?.role
  const activeMode = session.user?.activeMode

  if (!role) return []

  if (role === UserRole.LES_DEUX && !activeMode) {
    return [
      { label: 'Profil', href: '/profil' }
    ]
  }

  if (activeMode === ActiveMode.EXPEDITEUR || role === UserRole.EXPEDITEUR) {
    return [
      { label: 'Trajets disponibles', href: '/trajets' },
      { label: 'Créer un colis', href: '/colis/nouveau' },
      { label: 'Messages', href: '/messages' },
      { label: 'Comparateur de vols', href: '/flights' },
      { label: 'Profil', href: '/profil' }
    ]
  }

  if (activeMode === ActiveMode.VOYAGEUR || role === UserRole.VOYAGEUR) {
    return [
      { label: 'Colis disponibles', href: '/colis' },
      { label: 'Créer un trajet', href: '/trajets/nouveau' },
      { label: 'Messages', href: '/messages' },
      { label: 'Comparateur de vols', href: '/flights' },
      { label: 'Profil', href: '/profil' }
    ]
  }

  return [
    { label: 'Profil', href: '/profil' }
  ]
}
