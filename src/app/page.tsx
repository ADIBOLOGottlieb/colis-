import Link from 'next/link'
import { Package, Plane, MessageSquare, Shield } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Envoyez et transportez des colis en toute simplicité
          </h1>
          <p className="text-xl mb-8 text-primary-100">
            Mettez en relation expéditeurs et voyageurs pour un transport collaboratif
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth/register" className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
              Commencer maintenant
            </Link>
            <Link href="#comment-ca-marche" className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition">
              Comment ça marche ?
            </Link>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section id="comment-ca-marche" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Comment ça marche ?</h2>
          
          <div className="grid md:grid-cols-2 gap-12">
            {/* Pour les expéditeurs */}
            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <Package className="w-8 h-8 text-primary-600" />
                <h3 className="text-2xl font-bold">Pour les expéditeurs</h3>
              </div>
              <ol className="space-y-4 text-gray-700">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                  <span>Créez une annonce avec la ville d'envoi, de réception et le poids</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                  <span>Parcourez les trajets compatibles</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                  <span>Contactez le voyageur via la messagerie</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                  <span>Convenez des modalités de remise</span>
                </li>
              </ol>
            </div>

            {/* Pour les voyageurs */}
            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <Plane className="w-8 h-8 text-primary-600" />
                <h3 className="text-2xl font-bold">Pour les voyageurs</h3>
              </div>
              <ol className="space-y-4 text-gray-700">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                  <span>Publiez votre trajet avec les kilos disponibles</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                  <span>Consultez les colis compatibles avec votre itinéraire</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                  <span>Échangez avec l'expéditeur</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                  <span>Convenez du prix et des détails</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Pourquoi nous choisir ?</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card text-center">
              <MessageSquare className="w-12 h-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Messagerie intégrée</h3>
              <p className="text-gray-600">
                Échangez en toute sécurité directement sur la plateforme
              </p>
            </div>

            <div className="card text-center">
              <Shield className="w-12 h-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Sécurisé</h3>
              <p className="text-gray-600">
                Objets dangereux interdits, conversations horodatées
              </p>
            </div>

            <div className="card text-center">
              <Package className="w-12 h-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Simple</h3>
              <p className="text-gray-600">
                Interface intuitive, matching automatique
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Avertissement légal */}
      <section className="py-12 bg-yellow-50 border-y border-yellow-200">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Shield className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Information importante</h3>
          <p className="text-gray-700">
            Cette plateforme est un service de mise en relation uniquement. 
            Nous ne transportons pas les colis et ne sommes pas responsables des accords conclus entre utilisateurs. 
            Les objets dangereux, illégaux ou interdits par la réglementation IATA sont strictement prohibés.
          </p>
        </div>
      </section>
    </div>
  )
}
