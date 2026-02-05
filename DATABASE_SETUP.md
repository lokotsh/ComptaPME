# 🛠️ Configuration de la Base de Données

Pour que l'application fonctionne, vous devez avoir une base de données PostgreSQL active. Voici trois options :

## Option 1 : Installation Locale (Recommandé pour Windows)

1. **Télécharger PostgreSQL** :
    * Allez sur : [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
    * Téléchargez et lancez l'installateur.
2. **Installation** :
    * Gardez les options par défaut.
    * **Important** : Définissez un mot de passe dont vous vous souviendrez (ex: `admin123`).
    * Le port par défaut est `5432`.
3. **Mettre à jour le projet** :
    * Ouvrez le fichier `.env` dans ce dossier.
    * Remplacez la ligne `DATABASE_URL` par :

        ```env
        DATABASE_URL="postgresql://postgres:admin123@localhost:5432/compta_app?schema=public"
        ```

        *(Remplacez `admin123` par votre mot de passe).*

4. **Initialiser la base** :
    Ouvrez un terminal dans le dossier du projet et lancez :

    ```bash
    npx prisma migrate dev --name init
    ```

---

## Option 2 : Docker (Si installé)

Si vous avez Docker Desktop, lancez simplement cette commande dans un terminal :

```bash
docker run --name compta-db -e POSTGRES_PASSWORD=admin123 -e POSTGRES_DB=compta_app -p 5432:5432 -d postgres
```

Ensuite, mettez à jour votre `.env` comme dans l'Option 1.

---

## Option 3 : Base de données Cloud (Gratuit)

Si vous ne voulez rien installer :

1. Créez un compte sur [Neon.tech](https://neon.tech) ou [Railway.app](https://railway.app).
2. Créez un nouveau projet.
3. Copiez l'URL de connexion fournie (ex: `postgres://...`).
4. Collez-la dans votre fichier `.env` à la place de l'ancienne `DATABASE_URL`.
5. Lancez `npx prisma db push` pour envoyer le schéma.
