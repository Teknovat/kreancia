# Kreancia - Configuration et Setup

## 📋 Vue d'ensemble

Ce document décrit la configuration complète de l'application Kreancia, une solution de gestion de crédits client pour commerçants.

## 🏗️ Architecture

### Stack Technique
- **Framework**: Next.js 15 avec App Router
- **Language**: TypeScript
- **Base de données**: PostgreSQL 16
- **ORM**: Prisma
- **Styling**: Tailwind CSS avec design tokens custom
- **UI**: Composants custom avec Headless UI
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Authentification**: NextAuth.js v5 (à implémenter)

### Structure du Projet
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   └── health/        # Health check endpoint
│   ├── globals.css        # Styles globaux avec Tailwind
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Page d'accueil
├── components/            # Composants React
│   └── ui/               # Composants UI de base
│       └── button.tsx    # Composant bouton
├── lib/                  # Utilitaires et configurations
│   ├── prisma.ts         # Client Prisma
│   ├── utils.ts          # Fonctions utilitaires
│   └── env.ts            # Validation des variables d'environnement
└── types/               # Définitions TypeScript
    └── index.ts         # Types principaux

prisma/
├── schema.prisma        # Schéma de base de données
└── seed.ts             # Données de démonstration
```

## 🔧 Configuration

### Variables d'Environnement
Le fichier `.env.local` contient toutes les variables nécessaires :

```env
# Base de données
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kreancia_dev?schema=public"

# PostgreSQL (Docker)
POSTGRES_DB=kreancia_dev
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_PORT=5432

# NextAuth (pour l'authentification future)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-change-in-production

# Environnement
NODE_ENV=development
```

### Design System
Le projet utilise un design system custom avec Tailwind CSS :

#### Couleurs
- **Primary**: Gradient bleu-violet sophistiqué (#5b7cff)
- **Secondary**: Vert financier pour succès/profits (#10b956)
- **Accent**: Orange financier pour attention/warnings (#f97316)
- **Danger**: Rouge pour pertes/alertes critiques (#ef4444)
- **Grays**: Palettes modernes et propres

#### Typographie
- **Sans**: Inter (principal)
- **Display**: Poppins (titres)
- **Mono**: JetBrains Mono (nombres financiers)

#### Composants
- Système de composants modulaire avec `class-variance-authority`
- Animations et transitions fluides
- Support du mode sombre
- Responsive design first

## 🗄️ Base de Données

### Modèles Prisma
1. **User**: Utilisateurs/commerçants avec support multi-tenant
2. **Client**: Clients du commerçant
3. **Credit**: Crédits accordés aux clients
4. **Payment**: Paiements reçus

### Caractéristiques
- Multi-tenant par design (champ `tenantId`)
- Soft delete avec timestamps
- Index optimisés pour les requêtes fréquentes
- Support des transactions ACID

## 🚀 Commandes Disponibles

```bash
# Développement
npm run dev              # Lancer l'application en développement
npm run build           # Build de production
npm run start           # Lancer la version production
npm run lint            # Linter le code
npm run type-check      # Vérifier les types TypeScript

# Base de données
npm run db:generate     # Générer le client Prisma
npm run db:push         # Pousser le schéma vers la DB
npm run db:migrate      # Créer et appliquer une migration
npm run db:studio       # Ouvrir Prisma Studio
npm run db:seed         # Peupler avec des données de test
```

## 📊 Données de Démonstration

Le seed contient :
- 1 commerçant de démonstration
- 3 clients avec différents profils
- 4 crédits avec différents statuts
- 2 paiements pour test des fonctionnalités

**Identifiants de test** :
- Email : `demo@kreancia.com`
- Mot de passe : `demo123456`

## 🔒 Sécurité

### Mesures Implémentées
- Validation stricte des variables d'environnement
- Headers de sécurité (CSP, X-Frame-Options, etc.)
- Hash des mots de passe avec bcryptjs
- Validation des données avec Zod

### Multi-Tenant
- Isolation complète par `tenantId`
- Row Level Security prête à être implémentée
- Middleware de sécurité pour les API routes

## 🎨 Design & UX

### Principes
- **Fintech Aesthetic**: Design professionnel et moderne
- **Data Visualization**: Graphiques et métriques clairs
- **Responsive Design**: Mobile-first approach
- **Accessibility**: Support ARIA et navigation clavier

### Animations
- Transitions fluides avec Framer Motion
- Loading states et micro-interactions
- Feedback visuel immédiat

## 📈 Performance

### Optimisations
- App Router de Next.js 15 pour le SSR
- Composants optimisés avec React 19
- Images optimisées avec Next/Image
- Code splitting automatique

## 🧪 Testing (À Implémenter)
- Tests unitaires avec Jest
- Tests d'intégration avec Playwright
- Tests de base de données avec Prisma Test Client

## 📱 Fonctionnalités Principales (Roadmap)

1. **Authentification** (NextAuth.js v5)
2. **Gestion Clients** (CRUD complet)
3. **Gestion Crédits** (Statuts automatiques)
4. **Système de Paiements** (Allocation FIFO)
5. **Dashboard Analytics** (Métriques temps réel)
6. **Multi-tenant** (Isolation complète)

## 🔗 Endpoints Disponibles

- `GET /api/health` - Health check de l'application et DB

## 🚦 Statuts des Tâches

✅ **Complété** :
- Configuration Next.js 15 + TypeScript
- Prisma avec PostgreSQL
- Tailwind CSS avec design tokens custom
- Composants UI de base
- Structure de projet multi-tenant

⏳ **En cours** :
- Tests de l'installation

🔄 **À venir** :
- NextAuth.js v5
- API routes CRUD
- Interface utilisateur complète
- Dashboard analytics

---

*Ce document sera mis à jour au fur et à mesure de l'avancement du projet.*