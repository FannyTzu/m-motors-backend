# M-MOTORS - Backend

Backend du projet, construit avec Node.js , Express , Prisma et Docker

Ce README décrit les prérequis, l’installation et les principales commandes pour démarrer le projet en local.

🧰 Prérequis
Assurez-vous d’avoir installé les outils suivants :

- **Node.js** (version recommandée : LTS)
- **Docker**
- **Docker Compose**

📦 Installation

Clonez le dépôt puis installez les dépendances :

```bash
=> npm install

🚀 Lancer le serveur

dev => npm run dev
production => npm start


🐳 Docker

pour lancer le conteneur docker =>    docker-compose up -d --build
pour l'arreter => docker-compose down


🗄️ Prisma

pour créer une nouvelle migration, lancer la commande (donner à nom explicite à la migration)
 =>    npx prisma migrate dev --name init

pour générer le client prisma, lancer la commande (renommer champ, ajout de relation)
 =>    npx prisma generate

pour visualiser les tables, lancer la commande =>    npx prisma studio


📁 Structure du projet

.github/
└── workflows/
    └── ci.yml

prisma/
├── migrations/
└── schema.prisma

src/
├── controllers/
├── middlewares/
├── routes/
├── schemas/
└── index.js

.env


⚙️ Variables d’environnement

DATABASE_URL=
PORT=



⚠️ Avertissement

Cette application est un projet fictif réalisé à des fins d’apprentissage et de démonstration.

Toute ressemblance avec des marques, véhicules, images, entreprises ou services existants est purement fortuite.
Les noms, visuels et données utilisés ne sont pas destinés à représenter des entités réelles ni à un usage commercial.
```
