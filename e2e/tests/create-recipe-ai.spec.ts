import { test, expect } from "playwright/test";

test.describe("AI Recipe Creation Flow", () => {
  test("should successfully create a recipe using AI generation", async ({ page, baseURL }) => {
    // Step 1: Navigate to recipes page
    await page.goto(`${baseURL}/recipes`, { waitUntil: "networkidle" });

    // Verify we're on the recipes page and authenticated
    await expect(page.getByRole("button", { name: /Nowy przepis/i })).toBeVisible();

    // Step 2: Click "Z AI" button to navigate to AI recipe creation page
    const newAIButton = page.locator('button[data-testid="recipe-new-ai-button"]');
    await newAIButton.waitFor({ state: "visible" });
    await newAIButton.click();

    // Wait for navigation to /recipes/new-ai
    await page.waitForURL(`${baseURL}/recipes/new-ai`, { timeout: 10000 });

    // Wait for React hydration
    await page.waitForTimeout(500);

    // Step 3: Fill in the AI text input with recipe description
    const textInput = page.locator('textarea[data-testid="ai-recipe-input-text"]');
    await textInput.waitFor({ state: "visible" });

    // Create a recipe description (minimum 100 characters required)
    const recipeDescription = `Chcę stworzyć przepis na pyszne spaghetti carbonara.
Składniki powinny zawierać makaron spaghetti, boczek lub pancetta, jajka, parmezan i czarny pieprz.
Sos powinien być kremowy i dobrze pokrywać makaron. To klasyczny włoski przepis.`;

    // Triple-click to select all (handles any placeholder/autocomplete)
    await textInput.click({ clickCount: 3 });

    // Type the description using pressSequentially for proper form state
    await textInput.pressSequentially(recipeDescription, { delay: 30 });

    // Verify the value was entered correctly
    await expect(textInput).toHaveValue(recipeDescription);

    // Step 4: Click "Generuj przepis" button
    const generateButton = page.locator('button[data-testid="ai-recipe-button-generate"]');
    await generateButton.waitFor({ state: "visible" });

    // Wait for button to be enabled (form validation)
    await expect(generateButton).toBeEnabled({ timeout: 5000 });

    // Click generate button
    await generateButton.click();

    // Wait for AI generation to complete and transition to edit phase
    // This could take a while depending on AI response time
    await page.waitForTimeout(2000);

    // Step 5: Verify we're now in the edit phase
    // Look for the edit form header
    await expect(page.getByText("Edytuj wygenerowany przepis")).toBeVisible({ timeout: 30000 });

    // Verify that generated data is present in the form
    // Check that the recipe name input has a value
    const nameInput = page.locator('input[data-testid="recipe-input-name"]');
    await nameInput.waitFor({ state: "visible" });

    // Get the generated recipe name (we'll verify it later on detail page)
    const generatedRecipeName = await nameInput.inputValue();
    expect(generatedRecipeName.length).toBeGreaterThan(0);

    // Verify ingredients section is populated
    const ingredient0Input = page.locator('input[data-testid="recipe-input-ingredient-0"]');
    await ingredient0Input.waitFor({ state: "visible" });
    const firstIngredient = await ingredient0Input.inputValue();
    expect(firstIngredient.length).toBeGreaterThan(0);

    // Verify steps section is populated
    const step0Input = page.locator('textarea[data-testid="recipe-input-step-0"]');
    await step0Input.waitFor({ state: "visible" });
    const firstStep = await step0Input.inputValue();
    expect(firstStep.length).toBeGreaterThan(0);

    // Optional: User can edit the generated content here
    // For this test, we'll submit as-is

    // Step 6: Submit the form
    const submitButton = page.locator('button[data-testid="ai-recipe-button-submit"]');
    await submitButton.waitFor({ state: "visible" });
    await expect(submitButton).toBeEnabled();

    // Click submit button
    await submitButton.click();

    // Step 7: Wait for redirect to recipe detail page (/recipes/{id})
    await page.waitForURL(/\/recipes\/[a-f0-9-]{36}$/, { timeout: 15000 });

    // Verify we're on the recipe detail page
    const currentURL = page.url();
    const recipeIdMatch = currentURL.match(/\/recipes\/([a-f0-9-]{36})$/);
    expect(recipeIdMatch).not.toBeNull();

    // Wait for recipe detail page to fully load
    await page.waitForTimeout(500);

    // Step 8: Verify the recipe content is displayed on detail page
    // Verify the recipe name is displayed (as a heading)
    await expect(page.getByRole("heading", { name: generatedRecipeName })).toBeVisible({
      timeout: 10000,
    });

    // Verify the first ingredient is displayed
    await expect(page.getByText(firstIngredient)).toBeVisible();

    // Verify the first step is displayed
    await expect(page.getByText(firstStep)).toBeVisible();
  });

  test("should require minimum character count before generating", async ({ page, baseURL }) => {
    // Navigate to AI recipe creation page
    await page.goto(`${baseURL}/recipes/new-ai`, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    // Get the text input
    const textInput = page.locator('textarea[data-testid="ai-recipe-input-text"]');
    await textInput.waitFor({ state: "visible" });

    // Get the generate button
    const generateButton = page.locator('button[data-testid="ai-recipe-button-generate"]');
    await generateButton.waitFor({ state: "visible" });

    // Initially, button should be disabled (no text entered)
    await expect(generateButton).toBeDisabled();

    // Enter text that's too short (less than 100 characters)
    const shortText = "Makaron carbonara";
    await textInput.click({ clickCount: 3 });
    await textInput.pressSequentially(shortText, { delay: 30 });

    // Button should still be disabled
    await expect(generateButton).toBeDisabled();

    // Enter text that meets minimum requirement (100+ characters)
    const validText = `Chcę stworzyć przepis na pyszne spaghetti carbonara.
Składniki powinny zawierać makaron spaghetti, boczek lub pancetta, jajka, parmezan i czarny pieprz.`;

    await textInput.click({ clickCount: 3 });
    await textInput.pressSequentially(validText, { delay: 30 });

    // Now button should be enabled
    await expect(generateButton).toBeEnabled({ timeout: 5000 });
  });

  test("should allow editing generated recipe before submission", async ({ page, baseURL }) => {
    // Navigate to recipes page and click AI button
    await page.goto(`${baseURL}/recipes`, { waitUntil: "networkidle" });
    await page.locator('button[data-testid="recipe-new-ai-button"]').click();
    await page.waitForURL(`${baseURL}/recipes/new-ai`, { timeout: 10000 });
    await page.waitForTimeout(500);

    // Fill in AI text and generate
    const textInput = page.locator('textarea[data-testid="ai-recipe-input-text"]');
    const recipeDescription = `Przepis na prostą zupę pomidorową. Potrzebuję pomidorów, cebuli, czosnku,
bulion warzywny, śmietana, bazylia. Zupa powinna być kremowa i aromatyczna. To klasyczny przepis.`;

    await textInput.click({ clickCount: 3 });
    await textInput.pressSequentially(recipeDescription, { delay: 30 });

    const generateButton = page.locator('button[data-testid="ai-recipe-button-generate"]');
    await expect(generateButton).toBeEnabled({ timeout: 5000 });
    await generateButton.click();

    // Wait for edit phase
    await expect(page.getByText("Edytuj wygenerowany przepis")).toBeVisible({ timeout: 30000 });

    // Verify we're in edit mode with generated data
    const nameInput = page.locator('input[data-testid="recipe-input-name"]');
    await nameInput.waitFor({ state: "visible" });

    // Edit the recipe name
    await nameInput.click({ clickCount: 3 });
    await nameInput.pressSequentially("Moja Zupa Pomidorowa", { delay: 30 });
    await expect(nameInput).toHaveValue("Moja Zupa Pomidorowa");

    // Edit the first ingredient
    const ingredient0Input = page.locator('input[data-testid="recipe-input-ingredient-0"]');
    await ingredient0Input.waitFor({ state: "visible" });
    await ingredient0Input.click({ clickCount: 3 });
    await ingredient0Input.pressSequentially("1kg dojrzałych pomidorów", { delay: 30 });
    await expect(ingredient0Input).toHaveValue("1kg dojrzałych pomidorów");

    // Add a tag
    const tagInput = page.locator('input[data-testid="recipe-input-tag"]');
    await tagInput.waitFor({ state: "visible" });
    await tagInput.click({ clickCount: 3 });
    await tagInput.pressSequentially("zupy", { delay: 30 });

    const addTagButton = page.locator('button[data-testid="recipe-button-add-tag"]');
    await expect(addTagButton).toBeEnabled();
    await addTagButton.click();

    // Submit the edited recipe
    const submitButton = page.locator('button[data-testid="ai-recipe-button-submit"]');
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    // Wait for redirect to detail page
    await page.waitForURL(/\/recipes\/[a-f0-9-]{36}$/, { timeout: 15000 });

    // Verify edited content is displayed
    await expect(page.getByRole("heading", { name: "Moja Zupa Pomidorowa" })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("1kg dojrzałych pomidorów")).toBeVisible();
    await expect(page.getByText("zupy")).toBeVisible();
  });

  test("should handle navigation back to recipes page on cancel", async ({ page, baseURL }) => {
    // Navigate to AI recipe creation page
    await page.goto(`${baseURL}/recipes/new-ai`, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    // Verify we're on the AI creation page
    await expect(page.getByText("Stwórz przepis z AI")).toBeVisible();

    // In the input phase, the back button should be visible
    const backButton = page.locator('button[data-testid="ai-recipe-button-back"]');
    await backButton.waitFor({ state: "visible" });

    // Click back (form is not dirty, so should navigate immediately to recipes page)
    await backButton.click();

    // Should navigate back to recipes page
    await page.waitForURL(`${baseURL}/recipes`, { timeout: 10000 });
  });

  test("should handle adding multiple ingredients and steps in edit phase", async ({ page, baseURL }) => {
    // Navigate to AI recipe creation
    await page.goto(`${baseURL}/recipes/new-ai`, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    // Generate a recipe
    const textInput = page.locator('textarea[data-testid="ai-recipe-input-text"]');
    const recipeDescription = `Przepis na klasyczny omlet. Jajka, masło, sól, pieprz, opcjonalnie zioła.
Omlet powinien być puszyisty i delikatny. Przygotowanie zajmuje około 10 minut.`;

    await textInput.click({ clickCount: 3 });
    await textInput.pressSequentially(recipeDescription, { delay: 30 });

    const generateButton = page.locator('button[data-testid="ai-recipe-button-generate"]');
    await expect(generateButton).toBeEnabled({ timeout: 5000 });
    await generateButton.click();

    // Wait for edit phase
    await expect(page.getByText("Edytuj wygenerowany przepis")).toBeVisible({ timeout: 30000 });

    // Count existing ingredients and steps before adding new ones
    const existingIngredientsCount = await page.locator('input[data-testid^="recipe-input-ingredient-"]').count();
    const existingStepsCount = await page.locator('textarea[data-testid^="recipe-input-step-"]').count();

    // Add more ingredients
    const addIngredientButton = page.locator('button[data-testid="recipe-button-add-ingredient"]');
    await addIngredientButton.waitFor({ state: "visible" });

    // Add two more ingredients and fill them
    await addIngredientButton.click();
    const newIngredient1 = page.locator(`input[data-testid="recipe-input-ingredient-${existingIngredientsCount}"]`);
    await newIngredient1.waitFor({ state: "visible" });
    await newIngredient1.fill("Dodatkowy składnik 1");

    await addIngredientButton.click();
    const newIngredient2 = page.locator(`input[data-testid="recipe-input-ingredient-${existingIngredientsCount + 1}"]`);
    await newIngredient2.waitFor({ state: "visible" });
    await newIngredient2.fill("Dodatkowy składnik 2");

    // Verify multiple ingredient inputs exist
    await expect(page.locator('input[data-testid^="recipe-input-ingredient-"]')).toHaveCount(
      existingIngredientsCount + 2
    );

    // Add more steps
    const addStepButton = page.locator('button[data-testid="recipe-button-add-step"]');
    await addStepButton.waitFor({ state: "visible" });

    // Add two more steps and fill them
    await addStepButton.click();
    const newStep1 = page.locator(`textarea[data-testid="recipe-input-step-${existingStepsCount}"]`);
    await newStep1.waitFor({ state: "visible" });
    await newStep1.fill("Dodatkowy krok przygotowania 1");

    await addStepButton.click();
    const newStep2 = page.locator(`textarea[data-testid="recipe-input-step-${existingStepsCount + 1}"]`);
    await newStep2.waitFor({ state: "visible" });
    await newStep2.fill("Dodatkowy krok przygotowania 2");

    // Verify multiple step inputs exist
    await expect(page.locator('textarea[data-testid^="recipe-input-step-"]')).toHaveCount(existingStepsCount + 2);

    // Submit the form
    const submitButton = page.locator('button[data-testid="ai-recipe-button-submit"]');
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    // Should redirect to detail page
    await page.waitForURL(/\/recipes\/[a-f0-9-]{36}$/, { timeout: 15000 });
  });
});
