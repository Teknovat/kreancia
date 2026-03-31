# Application de Gestion de Crédits Client - Plan d'Implémentation

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Créer une application web multi-tenant de gestion de crédits client pour commerçants avec authentification, dashboard, et système de paiements avec ventilation automatique/manuelle.

**Architecture:** Application Next.js 15 full-stack avec App Router, authentification NextAuth.js v5, ORM Prisma sur PostgreSQL, design system distinctif avec animations et micro-interactions.

**Tech Stack:** Next.js 15, TypeScript, Prisma ORM, PostgreSQL, NextAuth.js v5, Tailwind CSS, Recharts, Framer Motion

---

## CHOIX TECHNIQUES DÉTAILLÉS

### Stack Principal
- **Framework:** Next.js 15 avec App Router
  - Server Actions pour les mutations
  - Middleware pour multi-tenant et protection des routes
  - API Routes pour intégrations externes si nécessaire
- **Base de données:** PostgreSQL avec Prisma ORM
  - Row Level Security (RLS) pour isolation multi-tenant
  - Types Decimal pour montants financiers précis
  - Transactions atomiques pour opérations critiques
- **Authentification:** NextAuth.js v5 avec Credentials provider
  - Sessions JWT
  - Protection middleware des routes
- **UI/UX:** Design system custom avec Tailwind CSS
  - Aesthetic direction: **Fintech élégant moderne** avec typographie distinctive
  - Animations avec Framer Motion pour micro-interactions
  - Charts avec Recharts pour le dashboard

### Structure du Projet
```
kreancia/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx (dashboard)
│   │   │   ├── clients/
│   │   │   ├── credits/
│   │   │   └── paiements/
│   │   ├── api/auth/[...nextauth]/route.ts
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/ (composants base)
│   │   ├── forms/ (formulaires spécialisés)
│   │   └── charts/ (graphiques dashboard)
│   ├── lib/
│   │   ├── auth.ts (NextAuth config)
│   │   ├── db.ts (Prisma client)
│   │   ├── validations.ts (Zod schemas)
│   │   └── utils.ts
│   ├── actions/ (Server Actions)
│   └── types/ (TypeScript types)
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
└── docs/
    └── plans/
```

## MODÈLE DE DONNÉES

### Schema Prisma Complet

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Tables principales
model Merchant {
  id         String   @id @default(cuid())
  email      String   @unique
  password   String
  name       String
  currency   String   // TND, EUR, USD, etc.
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  // Relations
  clients    Client[]
  credits    Credit[]
  payments   Payment[]

  @@map("merchants")
}

model Client {
  id          String   @id @default(cuid())
  firstName   String
  lastName    String
  phone       String
  merchantId  String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  merchant    Merchant @relation(fields: [merchantId], references: [id], onDelete: Cascade)
  credits     Credit[]
  payments    Payment[]

  @@map("clients")
  @@index([merchantId])
}

model Credit {
  id          String      @id @default(cuid())
  label       String
  totalAmount Decimal     @db.Decimal(10,2)
  remainingAmount Decimal @db.Decimal(10,2)
  dueDate     DateTime?
  status      CreditStatus
  clientId    String
  merchantId  String
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  // Relations
  client      Client      @relation(fields: [clientId], references: [id], onDelete: Cascade)
  merchant    Merchant    @relation(fields: [merchantId], references: [id], onDelete: Cascade)
  allocations PaymentAllocation[]

  @@map("credits")
  @@index([merchantId, status])
  @@index([clientId])
}

model Payment {
  id          String      @id @default(cuid())
  amount      Decimal     @db.Decimal(10,2)
  paymentDate DateTime
  notes       String?
  clientId    String
  merchantId  String
  createdAt   DateTime    @default(now())

  // Relations
  client      Client      @relation(fields: [clientId], references: [id], onDelete: Cascade)
  merchant    Merchant    @relation(fields: [merchantId], references: [id], onDelete: Cascade)
  allocations PaymentAllocation[]

  @@map("payments")
  @@index([merchantId])
  @@index([clientId])
}

// Table de jointure pour la ventilation des paiements
model PaymentAllocation {
  id        String  @id @default(cuid())
  amount    Decimal @db.Decimal(10,2)
  paymentId String
  creditId  String

  // Relations
  payment   Payment @relation(fields: [paymentId], references: [id], onDelete: Cascade)
  credit    Credit  @relation(fields: [creditId], references: [id], onDelete: Cascade)

  @@map("payment_allocations")
  @@index([paymentId])
  @@index([creditId])
}

enum CreditStatus {
  OPEN     // OUVERT
  PAID     // PAYÉ
  OVERDUE  // EN RETARD
}
```

### Règles de Sécurité Multi-Tenant

**Row Level Security (RLS) PostgreSQL:**
- Toutes les requêtes filtrent automatiquement par `merchantId`
- Les sessions NextAuth incluent le `merchantId` du user connecté
- Middleware Next.js injecte le `merchantId` dans toutes les requêtes

## PHASES DE DÉVELOPPEMENT

### Phase 1: Infrastructure & Authentification (Semaine 1)

**Task 1: Configuration du projet**
- Initialisation Next.js 15 avec TypeScript
- Configuration Tailwind CSS avec design tokens
- Setup Prisma avec PostgreSQL
- Configuration des variables d'environnement

**Task 2: Authentification NextAuth.js**
- Configuration NextAuth.js v5 avec Credentials provider
- Page de login avec design distinctif
- Middleware de protection des routes
- Gestion des sessions JWT

**Task 3: Modèle de données et migrations**
- Création du schema Prisma complet
- Migrations initiales
- Seed script pour données de test
- Tests du modèle de données

### Phase 2: Architecture Multi-Tenant & Sécurité (Semaine 1-2)

**Task 4: Row Level Security**
- Configuration RLS PostgreSQL
- Wrapper Prisma pour injection automatique du merchantId
- Tests d'isolation des données

**Task 5: Création des comptes commerçants**
- Script CLI pour création de comptes
- Hash des mots de passe avec bcrypt
- Validation email unique

### Phase 3: Composants UI de Base (Semaine 2)

**Task 6: Design System Foundation**
- Design tokens Tailwind personnalisés
- Typographie distinctive (fonts non-generiques)
- Palette de couleurs fintech élégante
- Composants UI de base (Button, Input, Card, etc.)

**Task 7: Layout et Navigation**
- Layout principal avec sidebar
- Navigation responsive
- Header avec user menu
- Design cohérent et moderne

### Phase 4: Gestion des Clients (Semaine 2-3)

**Task 8: Page Liste des Clients**
- Interface listing avec recherche
- Affichage solde total par client
- Actions CRUD avec validations
- Server Actions pour mutations

**Task 9: Fiche Client Détaillée**
- Page client avec onglets (infos, crédits, paiements)
- Formulaires d'édition
- Validation côté client et serveur
- Règles métier (suppression conditionnelle)

### Phase 5: Gestion des Crédits (Semaine 3)

**Task 10: CRUD Crédits**
- Interface de création/édition de crédits
- Calcul automatique des statuts (OPEN/PAID/OVERDUE)
- Validations métier (modification/suppression conditionnelle)
- Server Actions avec gestion d'erreurs

**Task 11: Page Liste Crédits Globale**
- Listing filtrable par statut
- Tri par date/montant
- Pagination et recherche
- Détail crédit avec historique

### Phase 6: Système de Paiements (Semaine 4)

**Task 12: Paiements Mode FIFO**
- Algorithme d'allocation automatique FIFO
- Validation montants et contraintes
- Transactions atomiques Prisma
- Tests complets du mode automatique

**Task 13: Paiements Mode Manuel**
- Interface de sélection des crédits
- Ventilation manuelle avec validation temps réel
- Calcul automatique des restes
- UX intuitive pour la répartition

**Task 14: Annulation de Paiements**
- Fonction d'annulation atomique
- Restauration des états précédents
- Recalcul des statuts de crédits
- Confirmations utilisateur

### Phase 7: Dashboard & Analytics (Semaine 4-5)

**Task 15: KPIs et Métriques**
- Cartes de statistiques temps réel
- Calculs des créances en cours
- Server Actions pour données du dashboard
- Mise à jour en temps réel

**Task 16: Tableaux Top Clients/Crédits**
- Top 10 crédits les plus anciens
- Top 5 clients débiteurs
- Code couleur selon ancienneté
- Interface responsive

**Task 17: Graphiques Dashboard**
- Chart Crédits vs Paiements (Recharts)
- Données des 6 derniers mois
- Animations et interactions
- Design cohérent avec le système

### Phase 8: Optimisations & Tests (Semaine 5)

**Task 18: Performance & Optimisations**
- Optimisation des requêtes Prisma
- Mise en cache des données fréquentes
- Lazy loading des composants
- Tests de performance

**Task 19: Tests & Validation**
- Tests unitaires des fonctions critiques
- Tests d'intégration des workflows
- Tests de sécurité multi-tenant
- Validation des contraintes métier

**Task 20: Animations & Micro-interactions**
- Animations page load avec Framer Motion
- Micro-interactions sur les actions
- Transitions entre états
- Polish final de l'expérience utilisateur

## DESIGN PRINCIPLES & AESTHETIC DIRECTION

**Concept:** **Fintech Élégant Moderne**
- Inspiration: Applications bancaires premium (Revolut Business, Qonto)
- Typographie: Font display distinctive + font body raffinée (PAS Inter/Roboto)
- Couleurs: Palette sophistiquée avec accents stratégiques
- Layouts: Asymétrie contrôlée, espaces généreux, hiérarchie claire
- Animations: Transitions fluides, micro-interactions délibérées

**Différenciation:**
- Dashboard avec data visualization immersive
- Workflow de paiements intuitif avec feedback visuel temps réel
- Esthétique qui inspire confiance et professionnalisme
- Expérience mobile-first réellement optimisée

## CONTRAINTES TECHNIQUES CRITIQUES

1. **Transactions Atomiques:** Utiliser `prisma.$transaction()` pour toutes les opérations multi-tables
2. **Types Decimal:** Jamais de Number/Float pour les montants financiers
3. **Multi-Tenant Strict:** Chaque requête DOIT inclure le merchantId
4. **Validation Double:** Client (UX) + Server (sécurité) avec Zod schemas
5. **Performance:** Optimisation des requêtes avec `include` et `select` Prisma ciblés

## ÉTAPES DE VALIDATION

- **Phase 1-2:** Architecture et sécurité validées
- **Phase 3-4:** UI/UX et gestion clients validées
- **Phase 5-6:** Logique métier crédits/paiements validée
- **Phase 7-8:** Dashboard et performance validés

---

**Estimation totale:** 5 semaines de développement avec points de validation réguliers.