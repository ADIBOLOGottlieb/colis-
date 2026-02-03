import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'
import { Navigation } from '@/components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'colis+ - Plateforme de mise en relation',
  description: 'Plateforme de mise en relation entre expediteurs de colis et voyageurs'
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <Providers>
          <Navigation />
          <main className="min-h-screen">
            {children}
          </main>
          <footer className="bg-gray-800 text-white py-8 mt-20">
            <div className="max-w-7xl mx-auto px-4 text-center">
              <p className="mb-4">(c) 2024 colis+ - Tous droits reserves</p>
              <div className="flex justify-center gap-6 text-sm">
                <a href="/cgu" className="hover:text-primary-400">CGU</a>
                <a href="/mentions-legales" className="hover:text-primary-400">Mentions legales</a>
                <a href="/confidentialite" className="hover:text-primary-400">Confidentialite</a>
              </div>
              <p className="mt-4 text-xs text-gray-400">
                Cette plateforme ne transporte pas les colis.
                Elle met en relation des particuliers qui s'accordent librement.
              </p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  )
}
