# colis+ - Plateforme MVP

## ðŸŽ¯ Description

Plateforme de mise en relation entre **expÃ©diteurs de colis** et **voyageurs** disposant d'espace libre dans leurs bagages. MVP fonctionnel dÃ©veloppÃ© en Next.js avec MySQL.

---

## âœ¨ FonctionnalitÃ©s

### MVP v1.0
- âœ… **Authentification** : Inscription/Connexion par email + mot de passe
- âœ… **Gestion des trajets** : Publication et recherche de trajets
- âœ… **Gestion des colis** : Publication et recherche de colis
- âœ… **Matching intelligent** : Affichage automatique des trajets compatibles
- âœ… **Messagerie intÃ©grÃ©e** : Conversations horodatÃ©es entre utilisateurs
- âœ… **CGU et mentions lÃ©gales** : Clauses de responsabilitÃ© claires

### ðŸš« Hors MVP (v2.0+)
- Paiement intÃ©grÃ© (Stripe)
- SystÃ¨me de notation
- VÃ©rification d'identitÃ© (KYC)
- Assurance pour colis de valeur
- Notifications push
- Application mobile

---

## ðŸ› ï¸ Stack Technique

- **Framework** : Next.js 14 (App Router)
- **Langage** : TypeScript
- **Base de donnÃ©es** : MySQL
- **ORM** : Prisma
- **Authentification** : NextAuth.js
- **Styling** : Tailwind CSS
- **UI Components** : Lucide React (icÃ´nes)

---

## ðŸ“‹ PrÃ©requis

- Node.js 18+ ([tÃ©lÃ©charger](https://nodejs.org/))
- MySQL 8+ ([tÃ©lÃ©charger](https://dev.mysql.com/downloads/))
- npm ou yarn

---

## ðŸš€ Installation

### 1. Cloner le projet

```bash
cd colis-voyageurs
npm install
```

### 2. Configuration de la base de donnÃ©es MySQL

#### Option A : Installation locale

**Installer MySQL** :
```bash
# Sur macOS (avec Homebrew)
brew install mysql
brew services start mysql

# Sur Ubuntu/Debian
sudo apt-get install mysql-server
sudo systemctl start mysql

# Sur Windows : tÃ©lÃ©charger depuis mysql.com
```

**CrÃ©er la base de donnÃ©es** :
```bash
mysql -u root -p
```

Puis dans le shell MySQL :
```sql
CREATE DATABASE colis_voyageurs;
CREATE USER 'colis_user'@'localhost' IDENTIFIED BY 'votre_mot_de_passe';
GRANT ALL PRIVILEGES ON colis_voyageurs.* TO 'colis_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### Option B : MySQL gratuit en ligne (pour tests)

- **FreeSQLDatabase** : https://www.freesqldatabase.com/
- **db4free** : https://www.db4free.net/
- **PlanetScale** (free tier) : https://planetscale.com/

### 3. Configurer les variables d'environnement

Copier le fichier `.env.example` :
```bash
cp .env.example .env
```

Ã‰diter le fichier `.env` :
```env
# Base de donnÃ©es MySQL
DATABASE_URL="mysql://colis_user:votre_mot_de_passe@localhost:3306/colis_voyageurs"

# NextAuth (gÃ©nÃ©rer une clÃ© alÃ©atoire)
NEXTAUTH_SECRET="votre-secret-super-securise-changez-moi"
NEXTAUTH_URL="http://localhost:3000"

NODE_ENV="development"
```

**GÃ©nÃ©rer un secret sÃ©curisÃ©** :
```bash
openssl rand -base64 32
```

### 4. Initialiser la base de donnÃ©es avec Prisma

```bash
# GÃ©nÃ©rer le client Prisma
npm run prisma:generate

# CrÃ©er les tables dans MySQL
npm run prisma:push

# (Optionnel) Ouvrir Prisma Studio pour voir les donnÃ©es
npm run prisma:studio
```

### 5. Lancer l'application

```bash
npm run dev
```

L'application sera accessible sur **http://localhost:3000**

---

## ðŸ“ Structure du projet

```
colis-voyageurs/
â”œâ”€â”€ prisma/
â”‚   â””â”€â”€ schema.prisma          # SchÃ©ma de base de donnÃ©es
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ app/
â”‚   â”‚   â”œâ”€â”€ api/               # Routes API Next.js
â”‚   â”‚   â”‚   â”œâ”€â”€ auth/          # Authentification
â”‚   â”‚   â”‚   â”œâ”€â”€ trajets/       # CRUD trajets
â”‚   â”‚   â”‚   â”œâ”€â”€ colis/         # CRUD colis
â”‚   â”‚   â”‚   â”œâ”€â”€ conversations/ # Gestion conversations
â”‚   â”‚   â”‚   â””â”€â”€ messages/      # Envoi de messages
â”‚   â”‚   â”œâ”€â”€ auth/              # Pages auth (login/register)
â”‚   â”‚   â”œâ”€â”€ trajets/           # Page trajets
â”‚   â”‚   â”œâ”€â”€ colis/             # Page colis
â”‚   â”‚   â”œâ”€â”€ messages/          # Page messagerie
â”‚   â”‚   â”œâ”€â”€ cgu/               # CGU
â”‚   â”‚   â”œâ”€â”€ layout.tsx         # Layout principal
â”‚   â”‚   â””â”€â”€ page.tsx           # Page d'accueil
â”‚   â”œâ”€â”€ components/            # Composants rÃ©utilisables
â”‚   â”‚   â”œâ”€â”€ Navigation.tsx
â”‚   â”‚   â””â”€â”€ Providers.tsx
â”‚   â”œâ”€â”€ lib/                   # Utilitaires
â”‚   â”‚   â”œâ”€â”€ prisma.ts         # Client Prisma
â”‚   â”‚   â””â”€â”€ auth.ts           # Config NextAuth
â”‚   â””â”€â”€ types/                # Types TypeScript
â”œâ”€â”€ .env.example              # Exemple de variables d'env
â”œâ”€â”€ package.json
â””â”€â”€ README.md
```

---

## ðŸ—„ï¸ SchÃ©ma de base de donnÃ©es

### Tables principales

1. **users** : Utilisateurs (expÃ©diteurs/voyageurs)
2. **trajets** : Trajets publiÃ©s par les voyageurs
3. **colis** : Colis publiÃ©s par les expÃ©diteurs
4. **conversations** : Discussions colis â†” trajet
5. **messages** : Messages dans les conversations

### Relations
- Un utilisateur peut avoir plusieurs trajets et colis
- Une conversation relie 1 colis et 1 trajet
- Une conversation contient plusieurs messages

---

## ðŸ” SÃ©curitÃ©

### Mesures implÃ©mentÃ©es
- âœ… Mots de passe hashÃ©s avec bcrypt
- âœ… Sessions JWT avec NextAuth
- âœ… Validation des donnÃ©es avec Zod
- âœ… Protection CSRF intÃ©grÃ©e Ã  Next.js
- âœ… Clauses lÃ©gales dans les CGU

### Ã€ amÃ©liorer (v2)
- Limite de taux (rate limiting)
- Validation des emails
- 2FA (authentification Ã  deux facteurs)

---

## ðŸ“Š Utilisation

### Workflow utilisateur

#### Pour un expÃ©diteur :
1. CrÃ©er un compte (rÃ´le "ExpÃ©diteur" ou "Les deux")
2. Publier un colis avec : ville envoi/rÃ©ception, poids, description
3. Consulter les trajets compatibles automatiquement affichÃ©s
4. Contacter un voyageur via la messagerie
5. Convenir des modalitÃ©s (prix, lieu de remise)

#### Pour un voyageur :
1. CrÃ©er un compte (rÃ´le "Voyageur" ou "Les deux")
2. Publier un trajet avec : villes, date, kilos dispo, prix/kg
3. Recevoir des demandes d'expÃ©diteurs
4. Ã‰changer via la messagerie
5. Accepter ou refuser selon le colis

---

## ðŸ§ª Tests utilisateurs

### Plan de test MVP

**ScÃ©nario 1 : Inscription**
- CrÃ©er un compte expÃ©diteur
- CrÃ©er un compte voyageur
- VÃ©rifier la validation des champs

**ScÃ©nario 2 : Publier un trajet**
- Publier un trajet Paris â†’ Lyon
- VÃ©rifier l'affichage dans la liste

**ScÃ©nario 3 : Publier un colis**
- Publier un colis Paris â†’ Lyon
- VÃ©rifier le matching avec les trajets

**ScÃ©nario 4 : Messagerie**
- Initier une conversation
- Envoyer des messages
- VÃ©rifier l'horodatage

**CritÃ¨res de succÃ¨s** :
- Temps < 2 min pour publier un trajet/colis
- Matching pertinent (villes correspondantes)
- Messagerie fluide sans bug

---

## ðŸš€ DÃ©ploiement

### Option 1 : Vercel (recommandÃ© pour Next.js)

1. CrÃ©er un compte sur [Vercel](https://vercel.com)
2. Connecter votre repo GitHub
3. Configurer les variables d'env dans Vercel
4. DÃ©ployer automatiquement

**Base de donnÃ©es** : Utiliser PlanetScale (free tier compatible Vercel)

### Option 2 : Railway

1. CrÃ©er un compte sur [Railway](https://railway.app)
2. CrÃ©er un projet MySQL
3. DÃ©ployer l'app Next.js
4. Lier la base de donnÃ©es

### Option 3 : HÃ©bergement classique

- Backend : DigitalOcean, AWS EC2, Heroku
- Base de donnÃ©es : AWS RDS, DigitalOcean Managed Databases

---

## ðŸ—ºï¸ Roadmap

### Version 2.0 (3-6 mois)
- [ ] SystÃ¨me de notation (1-5 Ã©toiles)
- [ ] IntÃ©gration paiement sÃ©curisÃ© (Stripe)
- [ ] VÃ©rification d'identitÃ© (upload piÃ¨ce)
- [ ] Notifications email
- [ ] Dashboard analytics

### Version 3.0 (6-12 mois)
- [ ] Application mobile (React Native)
- [ ] Partenariat assurance
- [ ] GÃ©olocalisation temps rÃ©el
- [ ] Programme de fidÃ©litÃ©
- [ ] API publique

---

## ðŸ› Debug

### ProblÃ¨mes courants

**Erreur de connexion MySQL** :
```bash
# VÃ©rifier que MySQL tourne
mysql -u root -p

# VÃ©rifier l'URL de connexion dans .env
```

**Erreur Prisma** :
```bash
# RegÃ©nÃ©rer le client
npm run prisma:generate

# RÃ©initialiser la DB
npx prisma db push --force-reset
```

**Erreur NextAuth** :
```bash
# VÃ©rifier que NEXTAUTH_SECRET est dÃ©fini dans .env
# VÃ©rifier que NEXTAUTH_URL correspond Ã  votre domaine
```

---

## ðŸ“ Licence

Ce projet est un MVP Ã©ducatif. Libre d'utilisation pour apprentissage.

---

## ðŸ‘¥ Support

Pour toute question :
- Email : contact@colis-voyageurs.fr
- Issues GitHub : [github.com/votre-repo/issues]

---

## âš ï¸ Disclaimer lÃ©gal

Cette plateforme est un service de **mise en relation uniquement**. Nous ne transportons pas les colis et dÃ©clinons toute responsabilitÃ© concernant les accords conclus entre utilisateurs.

**Objets interdits** : Armes, explosifs, drogues, matiÃ¨res dangereuses selon rÃ¨glement IATA.

---

**Bon dÃ©veloppement ! ðŸš€**


