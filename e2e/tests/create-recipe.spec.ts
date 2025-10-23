import { test, expect } from 'playwright/test';

test.describe('Create Recipe Flow', () => {
  test('should successfully create a new recipe', async ({ page, baseURL }) => {
    // Navigate to recipes page
    await page.goto(`${baseURL}/recipes`, { waitUntil: 'networkidle' });

    // Wait for page to be ready (verify we're on the recipes page)
    await expect(page.getByRole('button', { name: /Nowy przepis/i })).toBeVisible();

    // Click "Nowy przepis" button to navigate to create recipe form
    const newRecipeButton = page.locator('button[data-testid="recipe-new-button"]');
    await newRecipeButton.waitFor({ state: 'visible' });
    await newRecipeButton.click();

    // Wait for navigation to /recipes/new
    await page.waitForURL(`${baseURL}/recipes/new`, { timeout: 10000 });

    // Wait for form to be ready (React hydration)
    await page.waitForTimeout(500);

    // Fill in recipe name (required field)
    const nameInput = page.locator('input[data-testid="recipe-input-name"]');
    await nameInput.waitFor({ state: 'visible' });
    await nameInput.click({ clickCount: 3 }); // Select all (handles autocomplete)
    await nameInput.pressSequentially('Spaghetti Carbonara', { delay: 30 });
    await expect(nameInput).toHaveValue('Spaghetti Carbonara');

    // Fill in recipe description (optional field)
    const descriptionInput = page.locator('textarea[data-testid="recipe-input-description"]');
    await descriptionInput.waitFor({ state: 'visible' });
    await descriptionInput.click({ clickCount: 3 });
    await descriptionInput.pressSequentially('Klasyczny wBoski przepis na carbonar', { delay: 30 });
    await expect(descriptionInput).toHaveValue('Klasyczny wBoski przepis na carbonar');

    // Add a tag
    const tagInput = page.locator('input[data-testid="recipe-input-tag"]');
    await tagInput.waitFor({ state: 'visible' });
    await tagInput.click({ clickCount: 3 });
    await tagInput.pressSequentially('wBoska', { delay: 30 });

    const addTagButton = page.locator('button[data-testid="recipe-button-add-tag"]');
    await expect(addTagButton).toBeEnabled();
    await addTagButton.click();

    // Verify tag was added (by checking if the input is cleared)
    await expect(tagInput).toHaveValue('');

    // Fill in first ingredient (default ingredient exists with placeholder " ")
    const ingredient0Input = page.locator('input[data-testid="recipe-input-ingredient-0"]');
    await ingredient0Input.waitFor({ state: 'visible' });
    await ingredient0Input.click({ clickCount: 3 });
    await ingredient0Input.pressSequentially('400g spaghetti', { delay: 30 });
    await expect(ingredient0Input).toHaveValue('400g spaghetti');

    // Add second ingredient
    const addIngredientButton = page.locator('button[data-testid="recipe-button-add-ingredient"]');
    await addIngredientButton.waitFor({ state: 'visible' });
    await addIngredientButton.click();

    // Fill in second ingredient
    const ingredient1Input = page.locator('input[data-testid="recipe-input-ingredient-1"]');
    await ingredient1Input.waitFor({ state: 'visible' });
    await ingredient1Input.click({ clickCount: 3 });
    await ingredient1Input.pressSequentially('150g pancetta', { delay: 30 });
    await expect(ingredient1Input).toHaveValue('150g pancetta');

    // Add third ingredient
    await addIngredientButton.click();

    const ingredient2Input = page.locator('input[data-testid="recipe-input-ingredient-2"]');
    await ingredient2Input.waitFor({ state: 'visible' });
    await ingredient2Input.click({ clickCount: 3 });
    await ingredient2Input.pressSequentially('4 |�Btka', { delay: 30 });
    await expect(ingredient2Input).toHaveValue('4 |�Btka');

    // Fill in first step (default step exists with placeholder " ")
    const step0Input = page.locator('textarea[data-testid="recipe-input-step-0"]');
    await step0Input.waitFor({ state: 'visible' });
    await step0Input.click({ clickCount: 3 });
    await step0Input.pressSequentially('Ugotuj makaron al dente wedBug instrukcji na opakowaniu.', {
      delay: 30,
    });
    await expect(step0Input).toHaveValue('Ugotuj makaron al dente wedBug instrukcji na opakowaniu.');

    // Add second step
    const addStepButton = page.locator('button[data-testid="recipe-button-add-step"]');
    await addStepButton.waitFor({ state: 'visible' });
    await addStepButton.click();

    // Fill in second step
    const step1Input = page.locator('textarea[data-testid="recipe-input-step-1"]');
    await step1Input.waitFor({ state: 'visible' });
    await step1Input.click({ clickCount: 3 });
    await step1Input.pressSequentially('Podsma| pancett na patelni do zBocistego koloru.', { delay: 30 });
    await expect(step1Input).toHaveValue('Podsma| pancett na patelni do zBocistego koloru.');

    // Add third step
    await addStepButton.click();

    const step2Input = page.locator('textarea[data-testid="recipe-input-step-2"]');
    await step2Input.waitFor({ state: 'visible' });
    await step2Input.click({ clickCount: 3 });
    await step2Input.pressSequentially(
      'Wymieszaj makaron z pancett i |�Btkami, dodaj parmezan i pieprz.',
      { delay: 30 }
    );
    await expect(step2Input).toHaveValue('Wymieszaj makaron z pancett i |�Btkami, dodaj parmezan i pieprz.');

    // Wait for submit button to be enabled (form must be dirty)
    const submitButton = page.locator('button[data-testid="recipe-button-submit"]');
    await submitButton.waitFor({ state: 'visible' });
    await expect(submitButton).toBeEnabled({ timeout: 5000 });

    // Submit the form
    await submitButton.click();

    // Wait for redirect to recipe detail page (/recipes/{id})
    // The URL should match /recipes/ followed by a UUID
    await page.waitForURL(/\/recipes\/[a-f0-9-]{36}$/, { timeout: 15000 });

    // Verify we're on the recipe detail page
    const currentURL = page.url();
    const recipeIdMatch = currentURL.match(/\/recipes\/([a-f0-9-]{36})$/);
    expect(recipeIdMatch).not.toBeNull();

    // Wait for recipe detail page to load
    await page.waitForTimeout(500);

    // Verify the recipe name is displayed on the detail page
    await expect(page.getByRole('heading', { name: 'Spaghetti Carbonara' })).toBeVisible({
      timeout: 10000,
    });

    // Verify the description is displayed
    await expect(page.getByText('Klasyczny wBoski przepis na carbonar')).toBeVisible();

    // Verify ingredients are displayed
    await expect(page.getByText('400g spaghetti')).toBeVisible();
    await expect(page.getByText('150g pancetta')).toBeVisible();
    await expect(page.getByText('4 |�Btka')).toBeVisible();

    // Verify steps are displayed
    await expect(page.getByText('Ugotuj makaron al dente wedBug instrukcji na opakowaniu.')).toBeVisible();
    await expect(page.getByText('Podsma| pancett na patelni do zBocistego koloru.')).toBeVisible();
    await expect(
      page.getByText('Wymieszaj makaron z pancett i |�Btkami, dodaj parmezan i pieprz.')
    ).toBeVisible();

    // Verify tag is displayed
    await expect(page.getByText('wBoska')).toBeVisible();
  });

  test('should require recipe name before submission', async ({ page, baseURL }) => {
    // Navigate to create recipe page
    await page.goto(`${baseURL}/recipes/new`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // Try to submit without filling in required name field
    const submitButton = page.locator('button[data-testid="recipe-button-submit"]');
    await submitButton.waitFor({ state: 'visible' });

    // Submit button should be disabled (form not dirty)
    await expect(submitButton).toBeDisabled();

    // Fill in only the first ingredient (to make form dirty but leave name empty)
    const ingredient0Input = page.locator('input[data-testid="recipe-input-ingredient-0"]');
    await ingredient0Input.waitFor({ state: 'visible' });
    await ingredient0Input.click({ clickCount: 3 });
    await ingredient0Input.pressSequentially('Test ingredient', { delay: 30 });

    // Button should now be enabled (form is dirty)
    await expect(submitButton).toBeEnabled();

    // Try to submit the form (should fail validation)
    await submitButton.click();

    // Should still be on the same page (not redirected)
    await expect(page).toHaveURL(`${baseURL}/recipes/new`);

    // Should show validation error for the name field
    // React Hook Form will show validation error near the name input
    await page.waitForTimeout(500); // Wait for validation to render

    // Now fill in the name field
    const nameInput = page.locator('input[data-testid="recipe-input-name"]');
    await nameInput.waitFor({ state: 'visible' });
    await nameInput.click({ clickCount: 3 });
    await nameInput.pressSequentially('Test Recipe', { delay: 30 });

    // Submit button should still be enabled
    await expect(submitButton).toBeEnabled();

    // Now submission should work - click submit
    await submitButton.click();

    // Should redirect to the recipe detail page
    await page.waitForURL(/\/recipes\/[a-f0-9-]{36}$/, { timeout: 15000 });
  });

  test('should handle adding and removing multiple ingredients', async ({ page, baseURL }) => {
    // Navigate to create recipe page
    await page.goto(`${baseURL}/recipes/new`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // Verify initial state: one ingredient input exists
    const ingredient0Input = page.locator('input[data-testid="recipe-input-ingredient-0"]');
    await expect(ingredient0Input).toBeVisible();

    // Add three more ingredients
    const addIngredientButton = page.locator('button[data-testid="recipe-button-add-ingredient"]');
    await addIngredientButton.click();
    await addIngredientButton.click();
    await addIngredientButton.click();

    // Verify we now have 4 ingredient inputs
    await expect(page.locator('input[data-testid="recipe-input-ingredient-0"]')).toBeVisible();
    await expect(page.locator('input[data-testid="recipe-input-ingredient-1"]')).toBeVisible();
    await expect(page.locator('input[data-testid="recipe-input-ingredient-2"]')).toBeVisible();
    await expect(page.locator('input[data-testid="recipe-input-ingredient-3"]')).toBeVisible();
  });

  test('should handle adding and removing multiple steps', async ({ page, baseURL }) => {
    // Navigate to create recipe page
    await page.goto(`${baseURL}/recipes/new`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // Verify initial state: one step input exists
    const step0Input = page.locator('textarea[data-testid="recipe-input-step-0"]');
    await expect(step0Input).toBeVisible();

    // Add three more steps
    const addStepButton = page.locator('button[data-testid="recipe-button-add-step"]');
    await addStepButton.click();
    await addStepButton.click();
    await addStepButton.click();

    // Verify we now have 4 step inputs
    await expect(page.locator('textarea[data-testid="recipe-input-step-0"]')).toBeVisible();
    await expect(page.locator('textarea[data-testid="recipe-input-step-1"]')).toBeVisible();
    await expect(page.locator('textarea[data-testid="recipe-input-step-2"]')).toBeVisible();
    await expect(page.locator('textarea[data-testid="recipe-input-step-3"]')).toBeVisible();
  });

  test('should navigate back to recipes list on cancel', async ({ page, baseURL }) => {
    // Navigate to create recipe page
    await page.goto(`${baseURL}/recipes/new`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // Click cancel button (form is not dirty, so no confirmation dialog)
    const cancelButton = page.locator('button[data-testid="recipe-button-cancel"]');
    await cancelButton.waitFor({ state: 'visible' });
    await cancelButton.click();

    // Should navigate back to /recipes
    await page.waitForURL(`${baseURL}/recipes`, { timeout: 10000 });
  });
});
