You are tasked with creating a comprehensive end-to-end test file using Playwright testing framework. You will be provided with reference materials about the existing application implementation and authentication setup, along with specific test scenario requirements.

Here is the implementation summary showing existing patterns and conventions:

<implementation_summary>
{{IMPLEMENTATION_SUMMARY}}
</implementation_summary>

Here is the authentication setup reference:

<auth_setup>
{{AUTH_SETUP}}
</auth_setup>

Here are the specific test scenario steps you need to implement:

<test_scenario_steps>
{{TEST_SCENARIO_STEPS}}
</test_scenario_steps>

Your task is to create a complete e2e test file that implements the test scenario steps provided above. The test file should follow these requirements:

**Core Requirements:**

- Do NOT create any authentication setup - use the existing auth setup referenced above
- Follow the patterns and conventions shown in the implementation summary
- Use proper Playwright testing practices
- Include appropriate assertions and waits for reliable test execution
- Handle dynamic routing appropriately
- Test both form validation and successful submission flows where applicable

**Test Structure Requirements:**

- Include all necessary imports at the top of the file
- Create a test suite using `test.describe()`
- Implement individual test cases using `test()`
- Use clear, descriptive test names that explain what is being tested
- Include proper page object interactions following existing patterns
- Add meaningful assertions that verify expected behavior
- Include proper test cleanup if needed

**Code Quality Requirements:**

- Follow the existing code patterns for page navigation, form handling, and element interaction
- Use appropriate selectors and locators based on the implementation patterns
- Include proper error handling and timeout configurations
- Structure the code with clear comments explaining complex test steps

Before writing the test file, work through your analysis in <planning> tags inside your thinking block:

1. **Extract Key Patterns**: Quote specific code patterns, selectors, and conventions from the implementation summary that you will need to follow. It's OK for this section to be quite long.

2. **Map Test Steps to Actions**: For each test scenario step, write out the specific Playwright actions, selectors, and assertions you'll need to implement.

3. **Identify Components**: List the specific pages, forms, UI elements, and routes mentioned in the test_scenario_steps that will be involved in your test.

4. **Plan Test Structure**: Outline the exact test file structure including imports, test suite name, individual test cases, and their organization.

5. **Note Authentication Details**: Quote the relevant authentication setup details that you'll need to integrate with.

After your planning, provide the complete test file content. Format your output as a complete TypeScript file that is ready to use, including:

- All necessary imports
- Proper test suite structure
- Complete implementation of all test scenario steps
- Appropriate assertions and error handling
- Clear code organization and comments

Example test file structure:

```typescript
import { test, expect } from "@playwright/test";
// Additional imports as needed

test.describe("Test Suite Name", () => {
  test("descriptive test name", async ({ page }) => {
    // Test implementation
    // Navigation, interactions, assertions
  });

  // Additional test cases as needed
});
```

Your final output should consist only of the complete TypeScript test file and should not duplicate or rehash any of the planning work you did in the thinking block.
