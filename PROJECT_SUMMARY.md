# Récapitulatif du Projet ComptaPME (MVP)

Ce document liste les fichiers et modules clés créés durant le développement de l'application.

## 1. Configuration & Documentation

- `README.md` : Documentation technique.
- `GUIDE_UTILISATEUR.md` : Manuel d'utilisation.
- `prisma/schema.prisma` : Schéma de base de données complet (Multi-tenant, Auth, Comptabilité).
- `playwright.config.ts` : Configuration des tests E2E.
- `.gemini/plans/implementation_plan.md` : Suivi du plan d'implémentation.

## 2. API Backend (`src/app/api/`)

### Authentification & Sécurité

- `auth/[...nextauth]/route.ts` : Gestion NextAuth.
- `auth/2fa/generate/route.ts` : Génération secret 2FA.
- `auth/2fa/confirm/route.ts` : Confirmation 2FA.
- `auth/2fa/disable/route.ts` : Désactivation 2FA.
- `logs/route.ts` : Récupération des logs d'audit.
- `notifications/route.ts` : Gestion des notifications.

### Modules Métier

- `bank/import/route.ts` : Import CSV/OFX et matching bancaire.
- `bank/rules/route.ts` : Règles de rapprochement automatique.
- `invoices/[id]/route.ts` : CRUD Factures + Audit.
- `payroll/run/route.ts` : Moteur de calcul de paie.
- `payroll/payslips/route.ts` : Génération PDF Bulletins de paie.
- `reports/balance-sheet/route.ts` : Bilan Financier.
- `reports/income-statement/route.ts` : Compte de Résultat.
- `tva/declarations/route.ts` : Calcul et déclaration TVA.

## 3. Interface Utilisateur (`src/app/`)

### Publique

- `page.tsx` : Landing page marketing.
- `login/page.tsx` : Page de connexion.
- `register/page.tsx` : Page d'inscription.

### Dashboard (`src/app/dashboard/`)

- `page.tsx` : Vue d'ensemble (KPIs).
- `banque/regles/page.tsx` : Configuration règles bancaires.
- `banque/import/page.tsx` : Upload relevés.
- `paie/run/page.tsx` : Wizard de lancement de paie.
- `fiscalite/declarations/page.tsx` : Formulaire TVA.
- `parametres/logs/page.tsx` : Visualisation Audit Logs.
- `parametres/securite/page.tsx` : Gestion 2FA et mot de passe.

## 4. Composants Clés (`src/components/`)

- `dashboard/header.tsx` : En-tête avec Notifications et Recherche.
- `dashboard/sidebar.tsx` : Navigation latérale RBAC (Rôles).
- `ui/*.tsx` : Composants atomiques (Shadcn UI).

## 5. Logique Partagée (`src/lib/`)

- `audit.ts` : Utilitaire de logging centralisé.
- `auth.config.ts` : Configuration NextAuth.
- `prisma.ts` : Client DB singleton.
- `utils.ts` : Fonctions helpers (formatage devise, dates).

---
**Statut Final** : 100% des objectifs MVP atteints.
