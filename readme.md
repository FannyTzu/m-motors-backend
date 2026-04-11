# M-Motors — Backend

API REST pour la gestion de véhicules, commandes et dossiers clients. Construite avec Node.js, Express 5, Prisma et PostgreSQL. Pensée pour être déployée sur Render avec une base de données distante (déplyé sur Néon).

---

## Stack technique

| Couche            | Outil                                                                          |
| ----------------- | ------------------------------------------------------------------------------ |
| Runtime           | Node.js (LTS) + TypeScript                                                     |
| Framework HTTP    | Express 5                                                                      |
| ORM               | Prisma 7 avec adaptateur `@prisma/adapter-pg` (connexion poolée via `pg`)      |
| Base de données   | PostgreSQL 15 (Docker en local, Supabase/Render en production)                 |
| Stockage fichiers | Supabase Storage (deux buckets : documents privés, photos véhicules publiques) |
| Validation        | Zod                                                                            |
| Authentification  | JWT (access token 15 min) + refresh token (7 jours, stocké hashé en BDD)       |
| Hachage           | bcrypt (12 rounds)                                                             |
| Monitoring        | Sentry (`@sentry/node`)                                                        |
| Documentation API | Swagger UI (`/api-docs`)                                                       |
| Tests             | Jest + ts-jest + Supertest                                                     |
| Dev server        | `tsx watch`                                                                    |

---

## Contraintes techniques

- Le projet tourne en **ESM natif** (`"type": "module"` dans `package.json`). Jest est configuré avec `extensionsToTreatAsEsm: [".ts"]` et `ts-jest` en mode ESM pour contourner la friction habituelle entre Jest et les modules ES.
- Prisma utilise l'adaptateur `PrismaPg` (driver adapters) plutôt que le driver intégré, ce qui permet de partager un pool de connexions `pg` entre l'app et les tests. La variable `DATABASE_URL` doit être une URL PostgreSQL standard.
- Le build de production compile TypeScript (`tsc`) et génère le client Prisma (`prisma generate`) dans la même commande. Le point d'entrée de production charge `instrument.js` en premier via `--import` pour garantir que Sentry est initialisé avant tout autre module.
- En environnement de test, Prisma et les services sont mockés — aucune vraie base de données n'est nécessaire pour faire tourner la suite de tests.

---

## Prérequis

- **Node.js** LTS
- **Docker** + **Docker Compose** (pour la base de données locale)

---

## Lancer le projet en local

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configurer les variables d'environnement

Vigilance sur les variables d'environnement, tout doit rester dans les .env, pas de push de secret !

Créez un fichier `.env` à la racine avec les valeurs suivantes :

````env
# Base de données (Docker local)
DATABASE_URL=

# JWT
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=

# Supabase
SUPABASE_URL=
SUPABASE_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Optionnel — noms des buckets
SUPABASE_BUCKET_DOCUMENTS="m-motors-documents-folder"
SUPABASE_BUCKET_VEHICLES="m-motors-vehicle-pix"

# Sentry (uniquement utilisé si NODE_ENV=production)
SENTRY_DSN=

# Serveur
PORT=
NODE_ENV=

# CORS
FRONTEND_URL=

Rapprochez vous de votre lead dev pour obtenir les secrets.

### 3. Démarrer la base de données

```bash
docker-compose up -d
````

Cela lance un conteneur PostgreSQL 15 sur le port **15432**.

### 4. Appliquer les migrations et générer le client Prisma

```bash
npx prisma migrate dev
npx prisma generate
```

### 5. Créer le compte admin et les options de base (impossible de créer côté front)

```bash
npm run create-admin
npm run seed-options
```

### 6. Lancer le serveur de développement

```bash
npm run dev
```

Le serveur démarre sur `http://localhost:3000`.
La documentation Swagger est disponible sur `http://localhost:3000/api-docs`.

---

## Commandes utiles

```bash
# Développement
npm run dev

# Build production
npm run build

# Démarrer en production (après build)
npm start

# Prisma
npx prisma migrate dev --name nom-de-la-migration   # nouvelle migration
npx prisma generate                                 # régénérer le client
npx prisma studio                                   # visualiser les données
```

---

## Docker

```bash
# Démarrer le conteneur PostgreSQL
docker-compose up -d

# L'arrêter
docker-compose down
```

---

## Sécurité

Plusieurs mécanismes sont en place pour sécuriser l'API :

**Authentification par double token**

- L'access token (JWT, 15 min) est signé avec `JWT_ACCESS_SECRET` et transmis dans le header `Authorization` ou via cookie.
- Le refresh token est un UUID généré côté serveur, hashé avec bcrypt avant stockage en base. Seul le hash est persisté — le token brut n'est jamais stocké.

**Politique de mots de passe**

- Validation Zod à l'inscription : 8 caractères minimum, au moins une majuscule, un chiffre et un caractère spécial.

**Contrôle d'accès basé sur les rôles**

- `authMiddleware` vérifie et décode le JWT sur chaque route protégée.
- `roleMiddleware(...roles)` vérifie que le rôle de l'utilisateur fait partie des rôles autorisés pour la ressource.

**CORS strict en production**

- En développement, toutes les origines `localhost` sont acceptées.
- En production, seules les origines listées dans `FRONTEND_URL` (variable d'environnement) sont autorisées.

**Validation des entrées**

- Toutes les routes exposées passent par un middleware `validateSchema` (Zod) avant d'atteindre le controller. Les données non conformes sont rejetées en `400` avant tout traitement.

**Séparation des buckets Supabase**

- Les photos de véhicules sont dans un bucket **public**.
- Les documents clients (justificatifs, contrats) sont dans un bucket **privé**, accessible uniquement via le service role côté serveur.

---

## Alerting et monitoring

Sentry est intégré comme solution de tracking d'erreurs. Il est **uniquement activé en production** (`NODE_ENV=production`)

**Ce qui est mis en place :**

- `src/instrument.ts` initialise Sentry en tout premier, avant le chargement de l'app, grâce à `--import` dans la commande `npm start`.
- Le middleware `authMiddleware` appelle `Sentry.setUser()` à chaque requête authentifiée pour associer les événements à un utilisateur.
- `captureError()` (dans `src/utils/sentry.ts`) permet de capturer une erreur avec des tags métier (`feature`, `operation`, `severity`) et des données contextuelles supplémentaires.
- `addBreadcrumb()` permet de tracer les étapes importantes avant une erreur.
- `catchAsync()` est un wrapper pour les handlers async : il attrape toutes les exceptions non gérées, les envoie à Sentry avec le chemin et la méthode HTTP, puis appelle `next(error)`.
- Les routes `/health` et `/status` envoient automatiquement un événement Sentry si la base de données est injoignable.

**Niveaux de log :**

- `info` — actions nominales (connexion, création)
- `warning` — erreurs attendues (404, validation échouée)
- `error` — erreurs graves (base de données injoignable, erreur métier)

---

## Les tests

Les tests tournent avec **Jest + ts-jest** en mode ESM. Aucune base de données réelle n'est requise.

**Organisation :**

- Les fichiers de test sont colocalisés avec le code source (`auth.service.test.ts` à côté de `auth.service.ts`, etc.).
- Deux niveaux de tests coexistent :
  - **Tests unitaires de services** : Prisma est mocké entièrement (`jest.fn()`). On teste la logique métier (hachage, génération de token, gestion des erreurs) de manière isolée.
  - **Tests d'intégration de controllers** : le service est mocké (`jest.mock`), et on lance de vraies requêtes HTTP contre l'app Express via **Supertest**. On vérifie les status codes, les cookies et les corps de réponse.

**Configuration :**

- `jest.globalSetup.cjs` injecte les variables d'environnement de test avant tout import (important pour les modules qui lisent `process.env` au chargement).
- `jest.setup.cjs` mock `console.error` pour garder la sortie lisible, et complète les variables d'env au cas où.
- La couverture est collectée sur `src/**/*.ts`, en excluant `index.ts` et `instrument.ts` (pas de logique testable).

```bash
# Lancer tous les tests
npm test

# Mode watch
npm run test:watch

# Avec rapport de couverture
npm run test:coverage
```

---

## Déploiement

Les variables d'environnement sont à renseigner directement dans le dashboard Render.

---

## Structure du projet

src/
├── controllers/ # Gestion des requêtes HTTP, un dossier par domaine
├── services/ # Logique métier, un dossier par domaine
├── routes/ # Déclaration des routes Express
├── middlewares/ # auth, validation de schéma
├── schemas/ # Schémas de validation Zod
├── utils/ # sentry.ts, supabase.ts
└── index.ts # Point d'entrée

prisma/
├── schema.prisma # Modèles de données
├── migrations/ # Historique des migrations SQL
├── seedAdmin.ts # Création du compte admin
└── seedOptions.ts # Options de base pour les commandes

---

⚠️ Avertissement

Cette application est un projet fictif réalisé à des fins d’apprentissage et de démonstration.

Toute ressemblance avec des marques, véhicules, images, entreprises ou services existants est purement fortuite.
Les noms, visuels et données utilisés ne sont pas destinés à représenter des entités réelles ni à un usage commercial.
