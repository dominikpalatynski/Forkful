### OpenRouter Service Implementation Guide (Astro 5 + TypeScript 5)

This guide describes how to design and implement an `OpenRouterService` that interacts with the OpenRouter Chat Completions API to perform LLM-based chats in a robust, testable, and secure manner. It follows the Service Class Guidelines and clean-code practices used in this project.

## 1. Service description

- **Purpose**: Provide a single-responsibility class `OpenRouterService` that wraps OpenRouter's Chat Completions endpoint and exposes a minimal, well-typed API for generating LLM responses.
- **Location**: `src/lib/services/openrouter.service.ts`
- **Consumers**: Server-side code only (e.g., API routes under `src/pages/api/` or other backend services like `generation-recipe.service.ts`). Never call this service from client-side code.
- **Key Capabilities**:
  - Accept a configuration with model, system prompt, JSON Schema response format, model parameters, API key, and base URL.
  - Provide a single public method `generate` that builds the request payload, sends it to OpenRouter, and validates the response.
  - Enforce strong typing and runtime validation to improve reliability and debuggability.

## 2. Constructor description

- **Class**: `OpenRouterService`
- **Config Type**: `OpenRouterServiceConfig`
  - **Fields**: - `model: string` — OpenRouter model identifier (e.g., `openai/gpt-4.1-mini`, `anthropic/claude-3.5-sonnet`, etc.). - `systemPrompt: string` — System instruction injected as the first message. - `jsonSchema: { name: string; schema: Record<string, unknown>; strict?: boolean }` JSON Schema to request structured output (`response_format` with `type: "json_schema"`). - `modelParameters?: {
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  seed?: number;
}` — Optional model tuning parameters. - `apiKey: string` — OpenRouter API key. Must come from server-only environment variable. - `baseUrl?: string` — Base API URL. Default: `https://openrouter.ai/api/v1`.
- **Behavior**:
  - Store the validated config in `readonly` properties.
  - Fail fast in the constructor if critical fields are missing/invalid (e.g., apiKey, model, systemPrompt).

### Example (1): Constructor + config type

```ts
export type OpenRouterServiceConfig = {
  model: string;
  systemPrompt: string;
  jsonSchema: { name: string; schema: Record<string, unknown>; strict?: boolean };
  modelParameters?: {
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
    presence_penalty?: number;
    frequency_penalty?: number;
    seed?: number;
  };
  apiKey: string;
  baseUrl?: string;
};

export class OpenRouterService {
  private readonly baseUrl: string;
  constructor(
    private readonly config: OpenRouterServiceConfig,
    private readonly fetchImpl: typeof fetch = fetch
  ) {
    if (!config?.apiKey) throw new Error("OpenRouterService: apiKey is required");
    if (!config?.model) throw new Error("OpenRouterService: model is required");
    if (!config?.systemPrompt) throw new Error("OpenRouterService: systemPrompt is required");

    this.baseUrl = (config.baseUrl ?? "https://openrouter.ai/api/v1").replace(/\/$/, "");
  }
}
```

## 3. Public methods and fields

- **Public API**: Keep minimal and action-oriented.
  - `generate(args: { userMessage: string }): Promise<{ raw: unknown; json: unknown }>`
    - Accepts a required `userMessage`.
    - Internally calls `buildPayload`, `send`, and `validateResponse`.
    - Returns the raw response and the parsed JSON result.

### Example (2): `generate` public method

```ts
export class OpenRouterService {
  // ... constructor as above

  async generate(args: { userMessage: string }) {
    const payload = this.buildPayload(args.userMessage);
    const responseJson = await this.send(payload);
    return this.validateResponse(responseJson);
  }
}
```

## 4. Private methods and fields

- **`buildPayload(userMessage: string)`**
  - Compose messages with system + user.
  - Include `model`, `response_format` (when `jsonSchema` is provided), and any `modelParameters`.
  - Disable streaming in the service (set `stream: false`) to simplify handling.

- **`send(payload)`**
  - Perform the HTTP request to `POST {baseUrl}/chat/completions`.
  - Include mandatory headers: `Authorization: Bearer <apiKey>`, `Content-Type: application/json`.
  - Implement timeout / abort logic and proper non-2xx handling.

- **`validateResponse(responseJson)`**
  - Ensure the shape conforms to OpenAI-compatible schema (presence of `choices`, `choices[0].message.content`).
  - If `jsonSchema` is set: parse content as JSON and validate against schema (recommended: validate with Zod or AJV). Return in `{ json }`.
  - Otherwise, return `{ text }`.

### Example (3): `buildPayload`

```ts
private buildPayload(userMessage: string) {
  const { model, systemPrompt, jsonSchema, modelParameters } = this.config;

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage },
  ];

  const payload: Record<string, unknown> = {
    model,
    messages,
    stream: false,
    ...modelParameters,
  };

  payload.response_format = {
    type: "json_schema",
    json_schema: {
      name: jsonSchema.name,
      schema: jsonSchema.schema,
      strict: jsonSchema.strict ?? true,
    },
  };

  return payload;
}
```

### Example (4): `send`

```ts
private async send(payload: Record<string, unknown>) {
  const { apiKey } = this.config;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

  try {
    const res = await this.fetchImpl(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      const err = new Error(
        `OpenRouterService: HTTP ${res.status} ${res.statusText} - ${body?.slice(0, 500)}`,
      );
      // Optionally attach status for upstream error handlers
      (err as any).status = res.status;
      throw err;
    }

    return await res.json();
  } catch (e) {
    if ((e as any)?.name === "AbortError") {
      const err = new Error("OpenRouterService: request timed out");
      (err as any).code = "ETIMEDOUT";
      throw err;
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }
}
```

### Example (5): `validateResponse`

```ts
private validateResponse(responseJson: any): {
  raw: unknown; json: unknown;
} {
  if (!responseJson || !Array.isArray(responseJson.choices) || !responseJson.choices[0]) {
    throw new Error("OpenRouterService: invalid response shape (missing choices)");
  }

  const message = responseJson.choices[0]?.message;
  const content = message?.content;
  if (content == null) {
    throw new Error("OpenRouterService: invalid response shape (missing content)");
  }

  // Expect JSON content. Parse and validate.
  let parsed: unknown;
  try {
    parsed = typeof content === "string" ? JSON.parse(content) : content;
  } catch {
    throw new Error("OpenRouterService: content is not valid JSON");
  }

  // Option A: Validate with AJV against this.config.jsonSchema.schema
  // Option B (recommended for this codebase): define a Zod schema and parse here.
  // Keep this method technology-agnostic; plug validation strategy in the call site.

  return { raw: responseJson, json: parsed };
}
```

## 5. Error handling

List of potential error scenarios and recommended handling:

1. **Missing configuration (apiKey/model/systemPrompt)**
   - Throw early in the constructor with clear messages.

2. **Network/transport errors**
   - Catch and rethrow with additional context (`OpenRouterService: network error`).
   - Use timeouts/abort to avoid hanging requests and surface `ETIMEDOUT`.

3. **Non-2xx responses (401, 403, 404, 422, 429, 5xx)**
   - Throw with status code and body preview for debugging; attach `status` property.

4. **Invalid JSON body**
   - Throw explicit error (`invalid JSON from provider`).

5. **Invalid response shape (missing choices/content)**
   - Throw explicit error indicating shape mismatch.

6. **Schema violation when `jsonSchema` is requested**
   - Throw validation error with a concise diff of mismatches.

7. **Model incompatibility with `json_schema`**
   - Detect and fallback strategy if needed (e.g., request `json_object` or text + post-parse). Surface a meaningful error if strict compliance is required.

8. **Prompt safety / content filtering**
   - Surface provider errors with enough context but do not log sensitive prompt/user content verbatim in production logs.

For consistency, you may introduce a small error helper:

```ts
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = "OpenRouterError";
  }
}
```

## 6. Security considerations

- **Server-only usage**: Keep this service server-side. Do not import or instantiate it in client bundles.
- **Secrets**: Read the API key from a server-only env var (e.g., `OPENROUTER_API_KEY`). Do not use `PUBLIC_`-prefixed env names.
- **Environment typing**: Add to `src/env.d.ts` so TypeScript knows the var exists.
- **Logging**: Never log the API key. Redact prompts/PII or log only hashes in production.
- **Rate limiting**: Consider applying IP/user-based rate limiting on the API route that uses this service.
- **Validation**: Prefer strict schema validation and reject malformed responses to avoid downstream failures.

## 7. Step-by-step implementation plan

1. **Environment and configuration**
   - Add `OPENROUTER_API_KEY` to your server environment. Do not expose to the client.
   - In `src/env.d.ts`, declare the variable for type safety.

2. **Zod → JSON Schema (zod-to-json-schema)**
   - Install: `npm install zod zod-to-json-schema`
   - Define your Zod schema (e.g., a recipe shape) and convert to JSON Schema:

```ts
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export const RecipeZodSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  ingredients: z.array(z.object({ content: z.string().min(1), position: z.number().int().positive() })).min(1),
  steps: z.array(z.object({ content: z.string().min(1), position: z.number().int().positive() })).min(1),
});

export const RecipeJsonSchema = zodToJsonSchema(RecipeZodSchema, {
  name: "RecipeResponse",
  $refStrategy: "none",
});
```

- Because `$refStrategy: "none"` produces a flat schema with no `$defs`/`definitions`, pass `RecipeJsonSchema` directly as `jsonSchema.schema`.

3. **Create the service** (`src/lib/services/openrouter.service.ts`)
   - Define `OpenRouterServiceConfig`.
   - Implement the constructor with early validation and default `baseUrl`.
   - Implement private methods: `buildPayload`, `send`, `validateResponse`.
   - Implement public method: `generate`.

4. **Wire it into an API route** (server only)
   - Example: `src/pages/api/ai-generate.ts` calls `OpenRouterService.generate({ userMessage })` and returns `{ text }` or `{ json }`.
   - Read the API key from `import.meta.env.OPENROUTER_API_KEY` on the server.

5. **Model parameters**
   - When constructing the service, pass model and parameters:

```ts
const openrouter = new OpenRouterService({
  apiKey: import.meta.env.OPENROUTER_API_KEY!,
  model: "openai/gpt-4.1-mini",
  systemPrompt: "You are a helpful assistant.",
  jsonSchema: {
    name: "RecipeResponse",
    schema: {
      /* JSON Schema object here */
    },
    strict: true,
  },
  modelParameters: { temperature: 0.3, max_tokens: 800 },
});
```

6. **Generate a response**

```ts
const result = await openrouter.generate({ userMessage: "Generate a simple recipe as JSON." });
if (result.json) {
  // handle structured output
} else if (result.text) {
  // handle text output
}
```

7. **Error and observability**
   - Wrap calls in try/catch at the API boundary, map known failures to 4xx/5xx responses, and log sanitized diagnostics.

### How to configure prompts, response format, model, and parameters

- **System message**: Set via `systemPrompt` in the constructor. It is placed as the first message with role `system`.
- **User message**: Passed into `generate({ userMessage })`; appended after the system message as role `user`.
- **Response format (JSON Schema)**: Provide (required) `jsonSchema` in the config to request `type: "json_schema"` with a named schema and `strict: true` by default.
- **Model name**: Supply `model` in the config (e.g., `openai/gpt-4.1-mini`).
- **Model parameters**: Pass `modelParameters` in the config (e.g., `temperature`, `top_p`, `max_tokens`). They are spread into the request payload.

### Example usage within `src/lib/services/generation-recipe.service.ts`

Below is a concrete example showing how to use Zod → JSON Schema and invoke `OpenRouterService` inside the existing `GenerationRecipeService` to generate a recipe JSON that matches your domain schema.

```ts
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { OpenRouterService } from "./openrouter.service"; // implement per this guide

// Reuse (or import) the same Zod schema used elsewhere
const GeneratedRecipeSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  ingredients: z.array(z.object({ content: z.string().min(1), position: z.number().int().positive() })).min(1),
  steps: z.array(z.object({ content: z.string().min(1), position: z.number().int().positive() })).min(1),
});

// Convert to JSON Schema for OpenRouter response_format
const GeneratedRecipeJsonSchema = zodToJsonSchema(GeneratedRecipeSchema, {
  name: "RecipeResponse",
  $refStrategy: "none",
});

// Build service instance (server-side only)
const openrouter = new OpenRouterService({
  apiKey: import.meta.env.OPENROUTER_API_KEY!,
  model: "openai/gpt-4.1-mini",
  systemPrompt: "You are an assistant that outputs strictly valid JSON for recipes.",
  jsonSchema: {
    name: "RecipeResponse",
    schema: GeneratedRecipeJsonSchema,
    strict: true,
  },
  modelParameters: { temperature: 0.2, max_tokens: 900 },
});

// Inside GenerationRecipeService.generateRecipeFromText
async function generateRecipeFromText(inputText: string, userId: string) {
  // 1) Ask the model for a structured JSON recipe
  const result = await openrouter.generate({
    userMessage: `Create a recipe from the following input. Return ONLY valid JSON, matching the schema: \n\n${inputText}`,
  });

  // 2) Validate the returned JSON against the Zod schema
  const parsed = GeneratedRecipeSchema.parse(result.json);

  // 3) Persist generation record and return typed data (delegate to your existing DB code)
  return parsed;
}
```

### Key components (with purpose, challenges, solutions)

1. **Config object (`OpenRouterServiceConfig`)**
   - Functionality: Centralize all parameters to construct requests consistently.
   - Challenges:
     1. Ensuring required fields exist; 2) Balancing flexibility vs. safety; 3) Keeping secrets safe.
   - Solutions:
     1. Validate in constructor; 2) Strong types + defaults; 3) Read from server env only.

2. **Payload builder (`buildPayload`)**
   - Functionality: Produce a valid Chat Completions payload with model, messages, response format, and tuning parameters.
   - Challenges:
     1. Schema support varies by model; 2) Token limits; 3) Prompt injection risk.
   - Solutions:
     1. Require `jsonSchema` and fail fast; 2) Allow `max_tokens` and fail gracefully; 3) Enforce a strict system prompt and sanitize inputs at callers.

3. **HTTP sender (`send`)**
   - Functionality: Perform the authenticated POST request with robust timeout and error surfacing.
   - Challenges:
     1. Timeouts/hangs; 2) Non-2xx responses; 3) Transient provider errors.
   - Solutions:
     1. `AbortController` + timeout; 2) Include status/body preview in errors; 3) Allow retries at caller if needed.

4. **Response validator (`validateResponse`)**
   - Functionality: Normalize outputs and validate structured content when requested.
   - Challenges:
     1. Non-JSON content when schema requested; 2) Partial/empty choices; 3) Model hallucinations.
   - Solutions:
     1. Strict JSON parse + schema validation; 2) Shape checks; 3) Keep system prompt defensive and validate downstream.

5. **Public generator (`generate`)**
   - Functionality: Orchestrate build → send → validate; return normalized result.
   - Challenges:
     1. Propagating helpful errors; 2) Keeping method small and readable.
   - Solutions:
     1. Throw contextualized errors and handle at API boundary; 2) Delegate to private helpers.

---

This plan aligns with the project structure and clean code rules, and provides clear examples to implement, test, and operate the `OpenRouterService` securely and reliably.
