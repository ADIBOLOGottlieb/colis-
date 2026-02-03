-- Script SQL pour créer des données de test
-- À exécuter après avoir lancé "npm run prisma:push"

-- Note : Les mots de passe sont "password123" hashés avec bcrypt
-- Hash bcrypt pour "password123" : $2a$10$YourHashHere

-- Utilisateurs de test
-- Les IDs seront générés automatiquement par Prisma (cuid)
-- Vous devrez créer ces utilisateurs via l'interface d'inscription

/*
UTILISATEURS DE TEST RECOMMANDÉS :

1. Expéditeur :
   - Email: alice@test.com
   - Password: password123
   - Name: Alice Dupont
   - Role: EXPEDITEUR

2. Voyageur :
   - Email: bob@test.com
   - Password: password123
   - Name: Bob Martin
   - Role: VOYAGEUR

3. Les deux :
   - Email: charlie@test.com
   - Password: password123
   - Name: Charlie Dubois
   - Role: BOTH
*/

-- ============================================
-- SCÉNARIO DE TEST COMPLET
-- ============================================

/*
ÉTAPES POUR TESTER L'APPLICATION :

1. INSCRIPTION
   - Créer les 3 comptes ci-dessus
   - Vérifier la validation des champs
   - Tester avec un email déjà existant

2. PUBLICATION DE TRAJETS (avec Bob - voyageur)
   - Trajet 1 : Paris → Lyon, 5kg, 3€/kg, Date dans 7 jours
   - Trajet 2 : Lyon → Marseille, 3kg, 4€/kg, Date dans 10 jours
   - Trajet 3 : Paris → Bordeaux, 10kg, 2€/kg, Date dans 5 jours

3. PUBLICATION DE COLIS (avec Alice - expéditeur)
   - Colis 1 : Paris → Lyon, 2kg, "Livres de cuisine"
   - Colis 2 : Paris → Lyon, 1.5kg, "Vêtements d'hiver"
   - Colis 3 : Lyon → Marseille, 0.8kg, "Documents administratifs"

4. MATCHING
   - Se connecter avec Alice
   - Aller dans "Colis"
   - Cliquer sur "Trajets compatibles" pour Colis 1
   - Vérifier que le Trajet 1 de Bob apparaît

5. MESSAGERIE
   - Cliquer sur "Contacter" pour initier une conversation
   - Envoyer un message : "Bonjour, votre trajet m'intéresse !"
   - Se déconnecter

6. RÉCEPTION MESSAGE
   - Se connecter avec Bob
   - Aller dans "Messages"
   - Voir le message d'Alice
   - Répondre : "Bonjour Alice, avec plaisir ! Quel est votre budget ?"

7. NÉGOCIATION
   - Retourner sur Alice
   - Répondre : "Je propose 6€ pour les 2kg, convient-il ?"
   - Bob répond : "Parfait ! Rendez-vous gare de Lyon le jour J ?"
   - Alice : "OK, je vous envoie mon numéro en MP : 06..."

8. TESTS DE SÉCURITÉ
   - Essayer de publier un colis avec description "explosifs" → à vérifier manuellement
   - Essayer d'envoyer un message très long (>1000 caractères)
   - Tester la recherche avec des caractères spéciaux

9. TESTS D'INTERFACE
   - Tester sur mobile (responsive)
   - Vérifier tous les liens de navigation
   - Lire les CGU
   - Tester la déconnexion/reconnexion
*/

-- ============================================
-- REQUÊTES UTILES POUR LE DÉVELOPPEMENT
-- ============================================

-- Voir tous les utilisateurs
-- SELECT id, email, name, role FROM users;

-- Voir tous les trajets avec leurs utilisateurs
-- SELECT t.id, t.villeDepart, t.villeArrivee, t.dateVoyage, u.name 
-- FROM trajets t 
-- JOIN users u ON t.userId = u.id;

-- Voir tous les colis avec leurs utilisateurs
-- SELECT c.id, c.villeEnvoi, c.villeReception, c.poids, u.name 
-- FROM colis c 
-- JOIN users u ON c.userId = u.id;

-- Voir toutes les conversations
-- SELECT 
--   conv.id,
--   c.villeEnvoi, 
--   c.villeReception,
--   t.villeDepart,
--   t.villeArrivee,
--   (SELECT COUNT(*) FROM messages WHERE conversationId = conv.id) as nb_messages
-- FROM conversations conv
-- JOIN colis c ON conv.colisId = c.id
-- JOIN trajets t ON conv.trajetId = t.id;

-- Supprimer toutes les données (ATTENTION !)
-- DELETE FROM messages;
-- DELETE FROM conversations;
-- DELETE FROM colis;
-- DELETE FROM trajets;
-- DELETE FROM users;

-- ============================================
-- MÉTRIQUES À COLLECTER POUR LE PROJET
-- ============================================

/*
Pour votre dossier de présentation, collectez ces statistiques :

1. Temps moyen pour publier un trajet/colis
2. Nombre de clics pour initier une conversation
3. Taux de matching (colis trouvant un trajet compatible)
4. Nombre moyen de messages par conversation
5. Bugs rencontrés et résolus

Exemple de tableau pour le rapport :

| Métrique                          | Valeur |
|-----------------------------------|--------|
| Temps inscription                 | 45s    |
| Temps publication trajet          | 1m20s  |
| Temps publication colis           | 1m10s  |
| Clics pour contacter              | 3      |
| Taux de matching                  | 67%    |
| Messages moyens par conversation  | 4.2    |
*/
