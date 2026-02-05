import { test, expect } from '@playwright/test';

test('Landing page should load and navigate to login', async ({ page }) => {
    await page.goto('/');
    // Check for the main heading on the landing page
    await expect(page.locator('h1')).toContainText('La comptabilité simplifiée');

    // Find and click the "Connexion" button/link
    await page.getByRole('link', { name: 'Connexion' }).first().click();

    // Verify we are on login page
    await expect(page).toHaveURL(/.*login/);
    await expect(page.getByText('Bienvenue sur ComptaPME')).toBeVisible();
});

test('Login page should display form fields', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Mot de passe')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible();
});
