# ComptaPME - Logiciel de Comptabilité SaaS

ComptaPME est une solution de comptabilité moderne et intuitive conçue spécifiquement pour les Petites et Moyennes Entreprises (PME) en Afrique (zone OHADA). Elle simplifie la facturation, la gestion des dépenses, la paie, et la fiscalité.

## 🚀 Fonctionnalités Principales

* **Tableau de Bord** : Vue d'ensemble de la santé financière.
* **Ventes & Facturation** : Devis, Factures, Clients, Suivi des paiements.
* **Achats & Dépenses** : Factures fournisseurs, gestion des échéances.
* **Banque** : Import de relevés, rapprochement bancaire intelligent.
* **Paie** : Gestion des employés, bulletins de paie, déclarations CNSS (Bénin).
* **Fiscalité & Rapports** : Déclarations TVA, Bilan, Compte de Résultat conformes SYSCOHADA.
* **Sécurité** : RBAC (Rôles), Audit Logs, Authentification 2FA.

## 🛠️ Stack Technique

* **Frontend** : Next.js 14 (App Router), React, Tailwind CSS, Shadcn UI.
* **Backend** : Next.js API Routes.
* **Base de Données** : PostgreSQL, ORM Prisma.
* **Authentification** : NextAuth.js (email/password).
* **Tests** : Playwright (E2E).
* **Déploiement** : Compatible Vercel/Railway.

## 📦 Installation & Configuration

### Prérequis

* Node.js 18+
* PostgreSQL (local ou cloud)

### Étapes

1. **Cloner le dépôt**

    ```bash
    git clone https://github.com/votre-user/compta-app.git
    cd compta-app
    ```

2. **Installer les dépendances**

    ```bash
    npm install
    ```

3. **Configurer l'environnement**
    Copiez le fichier `.env.example` vers `.env` (si non existant, créez-le) :

    ```env
    DATABASE_URL="postgresql://user:password@localhost:5432/compto_app?schema=public"
    NEXTAUTH_SECRET="votre_secret_super_securise"
    NEXTAUTH_URL="http://localhost:3000"
    ```

4. **Initialiser la Base de Données**

    ```bash
    npx prisma migrate dev --name init
    # Ou pour synchroniser sans migration
    npx prisma db push
    ```

    *Note : Un script `prisma/seed.ts` est disponible pour injecter des données de test si nécessaire.*

5. **Lancer le serveur de développement**

    ```bash
    npm run dev
    ```

    L'application sera accessible sur `http://localhost:3000`.

## 🧪 Tests

Pour lancer les tests de bout en bout (E2E) avec Playwright :

```bash
npx playwright test
```

## 📂 Structure du Projet

* `src/app` : Routes et Pages (App Router).
* `src/components` : Composants Réutilisables (shadcn/ui, tableaux, etc.).
* `src/lib` : Utilitaires, Configuration Prisma, Auth.
* `prisma` : Schéma de base de données et migrations.
* `tests` : Tests E2E Playwright.

## 🤝 Contribution

1. Créer une branche pour votre fonctionnalité (`git checkout -b feature/ma-feature`).
2. Commiter vos changements (`git commit -m 'Ajout de ma feature'`).
3. Pousser la branche (`git push origin feature/ma-feature`).
4. Ouvrir une Pull Request.

## 📄 Licence

Ce projet est sous licence MIT.
