import { Shield } from 'lucide-react'

export default function CGUPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-8 h-8 text-primary-600" />
          <h1 className="text-3xl font-bold">Conditions Générales d'Utilisation</h1>
        </div>

        <p className="text-sm text-gray-500 mb-8">Dernière mise à jour : Janvier 2024</p>

        <div className="prose prose-sm max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-bold mb-3">1. Objet de la plateforme</h2>
            <p className="text-gray-700">
              La plateforme "Colis Voyageurs" est un service de mise en relation entre des expéditeurs 
              de colis et des voyageurs disposant d'espace libre dans leurs bagages. La plateforme ne 
              transporte pas elle-même les colis et n'est qu'un intermédiaire.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">2. Responsabilités</h2>
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-3">
              <p className="font-semibold text-yellow-800 mb-2">⚠️ CLAUSE ESSENTIELLE</p>
              <p className="text-gray-700">
                La plateforme ne transporte pas les colis. Elle se contente de mettre en relation 
                des particuliers qui concluent librement des accords de transport entre eux. 
                La plateforme décline toute responsabilité concernant :
              </p>
            </div>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>La perte, le vol ou la détérioration des colis</li>
              <li>Le non-respect des accords entre utilisateurs</li>
              <li>Les litiges financiers entre utilisateurs</li>
              <li>Les dommages causés par le contenu des colis</li>
              <li>Le non-respect des délais de livraison</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">3. Objets strictement interdits</h2>
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <p className="font-semibold text-red-800 mb-2">🚫 INTERDICTION FORMELLE</p>
              <p className="text-gray-700 mb-3">
                Conformément à la réglementation IATA et aux lois en vigueur, il est 
                strictement interdit de transporter :
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li>Armes et munitions</li>
                <li>Explosifs et matières inflammables</li>
                <li>Drogues et substances illicites</li>
                <li>Matières toxiques ou dangereuses</li>
                <li>Articles contrefaits</li>
                <li>Denrées périssables sans emballage adapté</li>
                <li>Animaux vivants (sauf autorisation spéciale)</li>
                <li>Tout objet dont la détention ou le transport est interdit par la loi</li>
              </ul>
            </div>
            <p className="text-gray-700 mt-3">
              Tout utilisateur contrevenant à cette règle s'expose à des poursuites judiciaires 
              et à la suppression immédiate de son compte.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">4. Obligations des expéditeurs</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Décrire fidèlement le contenu du colis</li>
              <li>Garantir que le colis ne contient aucun objet interdit</li>
              <li>Emballer correctement le colis</li>
              <li>Respecter les accords conclus avec le voyageur</li>
              <li>Ne pas demander le transport d'objets dangereux ou illégaux</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">5. Obligations des voyageurs</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Vérifier le contenu du colis avant acceptation</li>
              <li>Refuser tout colis suspect ou non conforme</li>
              <li>Transporter le colis avec soin raisonnable</li>
              <li>Respecter les délais convenus</li>
              <li>Ne pas ouvrir ou modifier le colis</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">6. Messagerie et données</h2>
            <p className="text-gray-700">
              Les conversations sur la plateforme sont horodatées et conservées pour une durée 
              de 90 jours après la fin du trajet. Ces données peuvent être utilisées comme preuve 
              en cas de litige. Les utilisateurs s'engagent à :
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mt-2">
              <li>Communiquer de manière respectueuse</li>
              <li>Ne pas partager d'informations sensibles (bancaires, etc.)</li>
              <li>Signaler tout comportement suspect</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">7. Sanctions</h2>
            <p className="text-gray-700">
              La plateforme se réserve le droit de suspendre ou supprimer sans préavis tout compte 
              en cas de :
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mt-2">
              <li>Tentative de transport d'objets interdits</li>
              <li>Comportement frauduleux ou abusif</li>
              <li>Non-respect des présentes CGU</li>
              <li>Signalements répétés par d'autres utilisateurs</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">8. Propriété intellectuelle</h2>
            <p className="text-gray-700">
              Tous les éléments de la plateforme (logo, design, code) sont protégés par le 
              droit d'auteur. Toute reproduction non autorisée est interdite.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">9. Modification des CGU</h2>
            <p className="text-gray-700">
              La plateforme se réserve le droit de modifier les présentes CGU à tout moment. 
              Les utilisateurs seront informés par email des modifications importantes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">10. Droit applicable</h2>
            <p className="text-gray-700">
              Les présentes CGU sont soumises au droit français. Tout litige relève de la 
              compétence exclusive des tribunaux français.
            </p>
          </section>

          <div className="bg-primary-50 border border-primary-200 p-4 rounded-lg mt-8">
            <p className="font-semibold text-primary-800 mb-2">📧 Contact</p>
            <p className="text-gray-700">
              Pour toute question concernant les CGU : contact@colis-voyageurs.fr
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
