# Logique metier et fonctionnalites - colis+

Date: 2026-02-03

## 1. Vision et objectifs
colis+ est une plateforme de mise en relation entre:
- Expediteurs: personnes qui souhaitent envoyer un colis
- Voyageurs: personnes qui disposent de kilos disponibles dans leurs bagages

L application ne transporte pas les colis. Elle met en relation des particuliers.

## 2. Roles et modes
### Roles permanents
- EXPEDITEUR
- VOYAGEUR
- LES_DEUX

### Mode actif
- Pour LES_DEUX, un mode actif est obligatoire a la connexion.
- Les permissions effectives sont strictement celles du mode actif.
- Aucun cumul de permissions entre les roles.

## 3. Permissions et acces
### EXPEDITEUR (mode EXPEDITEUR)
Peut:
- Creer un colis
- Consulter la liste des trajets
- Voir le detail d un trajet
- Contacter un voyageur

Ne peut pas:
- Creer, modifier, supprimer un trajet

### VOYAGEUR (mode VOYAGEUR)
Peut:
- Creer un trajet
- Consulter la liste des colis
- Voir le detail d un colis
- Contacter un expediteur

Ne peut pas:
- Creer un colis

### LES_DEUX
- Doit selectionner son mode actif a la connexion.
- Les permissions actives ne dependenet que du mode selectionne.

## 4. Matching colis-trajets
### Principes
Le score de compatibilite est compris entre 0 et 100.
Les criteres principaux representent au minimum 70% du score.
Un match avec meme date, depart et destination ne peut pas etre a 0 et doit etre >= 70.

### Criteres principaux (pondere fort)
- Ville depart identique
- Ville arrivee identique
- Date identique ou compatible

### Criteres secondaires (pondere moyen / faible)
- Poids disponible vs poids colis
- Flexibilite temporelle
- Delai acceptable

### Garantie metier
Si date + depart + arrivee sont identiques alors le score final est garanti >= 70.

## 5. Messaging
- Une conversation relie un colis et un trajet.
- Seuls les proprietaires du colis ou du trajet peuvent creer/consulter la conversation.
- Les messages sont reserves aux participants.

## 6. Authentification
- NextAuth with Credentials.
- LES_DEUX doit fournir un mode actif au login.

## 7. Vols (Comparateur)
- La fonctionnalite est en attente d integration API.
- Aucune logique backend ni appel API actifs.
- La page /flights affiche un message "bientot disponible".

## 8. Publicite (Ads)
### Objectifs
- Afficher des ads pertinentes et non intrusives.
- Categories: airline, gaming, travel, fintech, transport, insurance, other.

### Modele
- AdCampaign: metadonnees, budget, CPC, dates, priorite, etats
- AdImpression, AdClick: tracking

### Selection intelligente
- Campagnes actives uniquement
- Budget restant
- Priorite
- Rotation
- Pertinence selon contexte utilisateur

### Tracking
- Impression via IntersectionObserver
- Click tracking avec throttling anti fraude

### Emplacements
- Resultats trajets
- Resultats colis
- Profil
- Creation trajet
- Creation colis

## 9. Pages principales
- /trajets: liste et recherche de trajets
- /trajets/nouveau: creation trajet (voyageur uniquement)
- /colis: liste et matching
- /colis/nouveau: creation colis (expediteur uniquement)
- /profil: profil utilisateur
- /messages: messagerie
- /flights: page "bientot disponible"
- /ads: liste campagnes
- /ads/new: creation campagne

## 10. API principales
- /api/trajets: CRUD partiel (creation + liste)
- /api/colis: CRUD partiel (creation + liste)
- /api/conversations: creation + liste
- /api/messages: envoi
- /api/matching/colis, /api/matching/colis/batch, /api/matching/trajet
- /api/ads/serve, /api/ads/impression, /api/ads/click, /api/ads/campaigns

## 11. Scalabilite
- Services server-only
- Caching en memoire pour tokens et resultats externes
- Extension possible: providers ads externes, targeting geo, enchere

## 12. Bonnes pratiques
- Validation d entree (zod)
- Auth obligatoire sur les routes sensibles
- Separation des couches: services, modules, api routes
- Strict typing

