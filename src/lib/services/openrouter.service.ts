// OpenRouter Service Implementation
// Following the implementation plan from openrouter-service-implementation-plan.md

import { z } from "zod";

import type {
  ModelParams,
  GenerateOptions,
  OpenRouterServiceConfig,
} from "./openrouter.types";
import {
  OpenRouterConfigurationError,
  OpenRouterAPIError,
  OpenRouterRequestError,
  OpenRouterResponseError,
  OpenRouterValidationError,
} from "./openrouter.types";

// Default values
const DEFAULT_MODEL = "anthropic/claude-3-haiku";
const DEFAULT_PARAMS: Partial<ModelParams> = {
  temperature: 0.7,
  max_tokens: 2048,
};

// Security limits
const MAX_PROMPT_LENGTH = 100000; // Maximum characters for userPrompt and systemPrompt combined
const MAX_USER_PROMPT_LENGTH = 50000; // Maximum characters for userPrompt alone
const MAX_SYSTEM_PROMPT_LENGTH = 50000; // Maximum characters for systemPrompt alone
const MAX_TOKENS_LIMIT = 32768; // Maximum allowed max_tokens
const MIN_TEMPERATURE = 0.0; // Minimum temperature value
const MAX_TEMPERATURE = 2.0; // Maximum temperature value
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute window
const RATE_LIMIT_MAX_REQUESTS = 30; // Maximum requests per minute

// Main OpenRouterService class
export class OpenRouterService {
  private readonly apiKey: string;
  private readonly defaultModel: string;
  private readonly defaultParams: Partial<ModelParams>;
  private readonly baseUrl = "https://openrouter.ai/api/v1/chat/completions";
  private requestTimestamps: number[] = []; // For rate limiting

  constructor(config: OpenRouterServiceConfig) {
    if (!config.apiKey) {
      throw new OpenRouterConfigurationError("OpenRouterService: API key is required.");
    }
    this.apiKey = config.apiKey;
    this.defaultModel = config.defaultModel ?? DEFAULT_MODEL;
    this.defaultParams = { ...DEFAULT_PARAMS, ...config.defaultParams };
  }

  // Security validation methods

  private _validatePrompts(options: GenerateOptions<any>): void {
    const { userPrompt, systemPrompt } = options;

    // Check user prompt length
    if (!userPrompt || userPrompt.length === 0) {
      throw new OpenRouterConfigurationError("userPrompt is required and cannot be empty.");
    }
    if (userPrompt.length > MAX_USER_PROMPT_LENGTH) {
      throw new OpenRouterConfigurationError(
        `userPrompt exceeds maximum length of ${MAX_USER_PROMPT_LENGTH} characters.`
      );
    }

    // Check system prompt length if provided
    if (systemPrompt && systemPrompt.length > MAX_SYSTEM_PROMPT_LENGTH) {
      throw new OpenRouterConfigurationError(
        `systemPrompt exceeds maximum length of ${MAX_SYSTEM_PROMPT_LENGTH} characters.`
      );
    }

    // Check combined prompt length
    const combinedLength = userPrompt.length + (systemPrompt?.length || 0);
    if (combinedLength > MAX_PROMPT_LENGTH) {
      throw new OpenRouterConfigurationError(
        `Combined prompts exceed maximum length of ${MAX_PROMPT_LENGTH} characters.`
      );
    }
  }

  private _validateParams(params?: Partial<ModelParams>): void {
    if (!params) return;

    // Validate temperature
    if (params.temperature !== undefined) {
      if (params.temperature < MIN_TEMPERATURE || params.temperature > MAX_TEMPERATURE) {
        throw new OpenRouterConfigurationError(
          `Temperature must be between ${MIN_TEMPERATURE} and ${MAX_TEMPERATURE}.`
        );
      }
    }

    // Validate max_tokens
    if (params.max_tokens !== undefined) {
      if (params.max_tokens <= 0 || params.max_tokens > MAX_TOKENS_LIMIT) {
        throw new OpenRouterConfigurationError(
          `max_tokens must be between 1 and ${MAX_TOKENS_LIMIT}.`
        );
      }
    }

    // Validate other parameters
    if (params.top_p !== undefined) {
      if (params.top_p < 0 || params.top_p > 1) {
        throw new OpenRouterConfigurationError("top_p must be between 0 and 1.");
      }
    }

    if (params.frequency_penalty !== undefined) {
      if (params.frequency_penalty < -2 || params.frequency_penalty > 2) {
        throw new OpenRouterConfigurationError("frequency_penalty must be between -2 and 2.");
      }
    }

    if (params.presence_penalty !== undefined) {
      if (params.presence_penalty < -2 || params.presence_penalty > 2) {
        throw new OpenRouterConfigurationError("presence_penalty must be between -2 and 2.");
      }
    }
  }

  private _validateSchema<T extends z.ZodTypeAny>(schema?: T): void {
    if (!schema) return;

    // Test schema with empty object to check if it's valid
    try {
      schema.safeParse({});
    } catch (error) {
      throw new OpenRouterConfigurationError(`Invalid Zod schema provided: ${error}`);
    }
  }

  private _checkRateLimit(): void {
    const now = Date.now();
    // Remove timestamps outside the rate limit window
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS
    );

    // Check if we're within limits
    if (this.requestTimestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
      throw new OpenRouterConfigurationError(
        `Rate limit exceeded. Maximum ${RATE_LIMIT_MAX_REQUESTS} requests per minute allowed.`
      );
    }

    // Add current timestamp
    this.requestTimestamps.push(now);
  }

  // Private helper methods

  private _buildPayload<T extends z.ZodTypeAny>(options: GenerateOptions<T>): object {
    const messages: { role: string; content: string }[] = [];

    if (options.systemPrompt) {
      messages.push({ role: "system", content: options.systemPrompt });
    }
    messages.push({ role: "user", content: options.userPrompt });

    const payload: any = {
      model: options.model ?? this.defaultModel,
      messages,
      ...this.defaultParams,
      ...options.params,
    };

    if (options.jsonSchema) {
      // For structured responses, add instructions to return JSON
      const systemMessage = (options.systemPrompt || "") +
        "\n\nReturn your response as a valid JSON object only, with no additional text or formatting.";
      if (options.systemPrompt) {
        messages[0].content = systemMessage; // Update existing system message
      } else {
        messages.unshift({ role: "system", content: systemMessage }); // Add system message
      }
    }

    return payload;
  }

  private async _makeApiRequest(payload: object): Promise<any> {
    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new OpenRouterAPIError(
          `API error: ${response.statusText}`,
          response.status,
          errorData
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof OpenRouterAPIError) throw error;
      throw new OpenRouterRequestError(`Request failed: ${error}`, error);
    }
  }

  private _parseResponse<T extends z.ZodTypeAny>(
    response: any,
    schema?: T
  ): z.infer<T> | string {
    const choice = response.choices?.[0];
    if (!choice) {
      throw new OpenRouterResponseError("Invalid response structure from API.", response);
    }

    if (schema) {
      const toolCall = choice.message?.tool_calls?.[0];
      if (toolCall && toolCall.type === "function") {
        try {
          const jsonData = JSON.parse(toolCall.function.arguments);
          return schema.parse(jsonData); // Walidacja Zod
        } catch (error) {
          throw new OpenRouterValidationError(`Failed to parse tool_call JSON: ${error}`, error);
        }
      }

      // If no tool_calls, try to parse JSON from content (fallback)
      const content = choice.message?.content?.trim();
      if (content) {
        try {
          // Try to extract JSON from content if it's wrapped in markdown code blocks
          let jsonString = content;
          if (content.includes('```json')) {
            const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
              jsonString = jsonMatch[1];
            }
          }

          const jsonData = JSON.parse(jsonString);
          return schema.parse(jsonData); // Walidacja Zod
        } catch (error) {
          throw new OpenRouterValidationError(`Failed to parse content JSON: ${error}`, error);
        }
      }

      throw new OpenRouterResponseError("No tool_calls or content found in response for structured data.", response);
    }

    return choice.message?.content?.trim() ?? "";
  }

  // Public methods

  public async generate<T extends z.ZodTypeAny>(
    options: GenerateOptions<T>
  ): Promise<z.infer<T> | string> {
    // Security validations
    this._validatePrompts(options);
    this._validateParams(options.params);
    this._validateSchema(options.jsonSchema);
    this._checkRateLimit();

    const payload = this._buildPayload(options);
    const response = await this._makeApiRequest(payload);
    return this._parseResponse(response, options.jsonSchema);
  }
}

// Re-export types and error classes for convenience
export type { ModelParams, GenerateOptions, OpenRouterServiceConfig };
export {
  OpenRouterConfigurationError,
  OpenRouterAPIError,
  OpenRouterRequestError,
  OpenRouterResponseError,
  OpenRouterValidationError,
};
