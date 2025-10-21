import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export interface OpenRouterServiceConfig {
  model: string;
  systemPrompt: string;
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
}

export const GeneratedRecipeSchema = z.object({
  name: z.string().min(1, "Recipe name is required"),
  description: z.string().min(1, "Recipe description is required"),
  ingredients: z
    .array(
      z.object({
        content: z.string().min(1, "Ingredient content cannot be empty"),
        position: z.number().int().positive("Position must be a positive integer"),
      })
    )
    .min(1, "Recipe must have at least one ingredient"),
  steps: z
    .array(
      z.object({
        content: z.string().min(1, "Step content cannot be empty"),
        position: z.number().int().positive("Position must be a positive integer"),
      })
    )
    .min(1, "Recipe must have at least one step"),
});

export const GeneratedRecipeJsonSchema = zodToJsonSchema(GeneratedRecipeSchema, {
  name: "RecipeResponse",
});

export class OpenRouterError extends Error {
  constructor(
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = "OpenRouterError";
  }
}

export class OpenRouterService {
  private readonly baseUrl: string;

  constructor(
    private readonly config: OpenRouterServiceConfig,
    private readonly fetchImpl: typeof fetch = globalThis.fetch?.bind(globalThis) || fetch
  ) {
    if (!config?.apiKey) {
      throw new OpenRouterError("OpenRouterService: apiKey is required");
    }
    if (!config?.model) {
      throw new OpenRouterError("OpenRouterService: model is required");
    }
    if (!config?.systemPrompt) {
      throw new OpenRouterError("OpenRouterService: systemPrompt is required");
    }

    this.baseUrl = (config.baseUrl ?? "https://openrouter.ai/api/v1").replace(/\/$/, "");
  }

  async generate(args: {
    userMessage: string;
  }): Promise<{ raw: unknown; json: z.infer<typeof GeneratedRecipeSchema> }> {
    const payload = this.buildPayload(args.userMessage);
    const responseJson = await this.send(payload);
    return this.validateResponse(responseJson);
  }

  private buildPayload(userMessage: string): Record<string, unknown> {
    const { model, systemPrompt, modelParameters } = this.config;

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
        name: "RecipeResponse",
        schema: GeneratedRecipeJsonSchema,
        strict: true,
      },
    };

    return payload;
  }

  private async send(payload: Record<string, unknown>): Promise<unknown> {
    const { apiKey } = this.config;

    // Create AbortController if available (not available in all Cloudflare Workers environments)
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 30_000) : null;

    try {
      const fetchOptions: RequestInit = {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      };

      // Only add signal if AbortController is available
      if (controller) {
        fetchOptions.signal = controller.signal;
      }

      const res = await this.fetchImpl(`${this.baseUrl}/chat/completions`, fetchOptions);

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        const err = new OpenRouterError(
          `OpenRouterService: HTTP ${res.status} ${res.statusText} - ${body?.slice(0, 500)}`,
          { status: res.status, body }
        );
        throw err;
      }

      return await res.json();
    } catch (e) {
      if ((e as any)?.name === "AbortError") {
        const err = new OpenRouterError("OpenRouterService: request timed out", { code: "ETIMEDOUT" });
        throw err;
      }
      throw e;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  private validateResponse(responseJson: any): { raw: unknown; json: z.infer<typeof GeneratedRecipeSchema> } {
    if (!responseJson || !Array.isArray(responseJson.choices) || !responseJson.choices[0]) {
      throw new OpenRouterError("OpenRouterService: invalid response shape (missing choices)", { responseJson });
    }
    const message = responseJson.choices[0]?.message;
    const content = message?.content;
    if (content == null) {
      throw new OpenRouterError("OpenRouterService: invalid response shape (missing content)", { responseJson });
    }
    // Expect JSON content. Parse and validate.
    let parsed: unknown;
    try {
      parsed = typeof content === "string" ? JSON.parse(content) : content;
    } catch {
      throw new OpenRouterError("OpenRouterService: content is not valid JSON", { content });
    }

    try {
      parsed = GeneratedRecipeSchema.parse(parsed);
    } catch (error) {
      throw new OpenRouterError(
        `OpenRouterService: response does not match schema: ${error instanceof Error ? error.message : "Unknown error"}`,
        {
          parsed,
          schema: GeneratedRecipeSchema,
          validationErrors: error instanceof Error ? [error.message] : ["Unknown validation error"],
        }
      );
    }

    return { raw: responseJson, json: parsed as z.infer<typeof GeneratedRecipeSchema> };
  }
}
