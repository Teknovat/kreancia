# Kreancia - Gestion de Crédits Client

Application web de gestion de crédits client pour commerçants.

## Démarrage Rapide

### 1. Lancer la base de données

```bash
# Démarrer PostgreSQL en arrière-plan
docker compose up -d

# Vérifier que PostgreSQL fonctionne
docker compose ps
```

### 2. Variables d'environnement

Copier le fichier d'environnement :
```bash
cp .env.local .env
```

### 3. Installation et développement

```bash
# Installer les dépendances
npm install

# Générer le client Prisma
npm run db:generate

# Appliquer les migrations Prisma
npm run db:migrate

# Peupler la base avec des données de démonstration
npm run db:seed

# Lancer l'application en développement
npm run dev
```

## Commandes utiles

```bash
# Arrêter la base de données
docker compose down

# Supprimer les volumes (ATTENTION: perte de données)
docker compose down -v

# Voir les logs de PostgreSQL
docker compose logs postgres -f

# Accès direct à PostgreSQL
docker exec -it kreancia_postgres psql -U postgres -d kreancia_dev
```

## Stack Technique

- **Framework:** Next.js 15 + TypeScript
- **Base de données:** PostgreSQL 16
- **ORM:** Prisma
- **Authentification:** NextAuth.js v5
- **UI:** Tailwind CSS + Framer Motion