# FleetFlow - Gestion de Flotte de Transport

Application web de gestion de flotte permettant de suivre les camions, remorques, trajets, chauffeurs et maintenance.

## Structure du Projet

```
fleetflow/
├─ backend/          # API Node.js/Express
│  ├─ src/
│  │  ├─ config/     # Configuration (DB)
│  │  ├─ models/     # Modèles Mongoose
│  │  ├─ controllers/# Contrôleurs
│  │  ├─ routes/     # Routes API
│  │  ├─ middleware/ # Middlewares (auth, error handling)
│  │  └─ tests/      # Tests unitaires
│  ├─ Dockerfile
│  └─ package.json
├─ frontend/         # Application React
│  ├─ src/
│  │  ├─ pages/      # Pages React
│  │  ├─ components/ # Composants réutilisables
│  │  ├─ context/    # Context API (Auth)
│  │  └─ services/   # Services API
│  ├─ Dockerfile
│  └─ package.json
├─ docker-compose.yml
└─ README.md
```

## Installation

### Prérequis
- Node.js 18+
- MongoDB (ou Docker)
- npm ou yarn

### Installation locale

#### Backend
```bash
cd backend
npm install
cp env.example .env
# Éditer .env avec vos configurations
npm start
# ou pour le développement avec watch mode:
npm run dev
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

#### Tests Backend
```bash
cd backend
npm test
```

### Installation avec Docker
```bash
docker-compose up --build
```

L'application sera accessible sur:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- MongoDB: localhost:27017

## Fonctionnalités Implémentées (Step 0 & 1)

### ✅ Step 0 - Structure du Projet
- Structure backend/frontend créée
- Configuration Docker (Dockerfile, docker-compose.yml)
- Configuration des dépendances

### ✅ Step 1 - Système d'Authentification

#### Backend
- ✅ Modèle User (name, email, passwordHash, role)
- ✅ Contrôleur d'authentification (register, login, getProfile)
- ✅ Middleware d'authentification JWT
- ✅ Middleware de gestion d'erreurs
- ✅ Tests unitaires pour l'authentification

#### Frontend
- ✅ AuthContext avec Context API
- ✅ Page de connexion (Login.jsx)
- ✅ Routes protégées selon le rôle
- ✅ Redirection automatique selon le rôle (admin → /admin, chauffeur → /driver)
- ✅ Service API avec intercepteurs Axios

## Technologies Utilisées

### Backend
- Node.js / Express.js
- MongoDB / Mongoose
- JWT pour l'authentification
- Jest + Supertest pour les tests
- bcrypt pour le hachage des mots de passe

### Frontend
- React.js 18
- React Router v6
- Vite (build tool)
- Axios
- Context API pour la gestion d'état globale

## API Endpoints (Step 1)

### Authentification
- `POST /api/auth/register` - Inscription d'un nouvel utilisateur
- `POST /api/auth/login` - Connexion
- `GET /api/auth/profile` - Profil utilisateur (protégé)

### Exemple de requête Login
```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123"
}
```

## Prochaines Étapes

- Step 2: Gestion des camions et remorques
- Step 3: Gestion des trajets
- Step 4: Suivi (kilométrage, carburant, pneus)
- Step 5: Export PDF
- Step 6: Dockerisation complète
- Step 7: Tests et validation
- Step 8: Documentation finale

