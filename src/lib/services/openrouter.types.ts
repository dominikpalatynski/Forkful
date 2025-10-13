// OpenRouter Service Types
// Following the implementation plan from openrouter-service-implementation-plan.md

import { z } from "zod";

// Types for model parameters
export type ModelParams = {
  temperature: number;
  top_p: number;
  max_tokens: number;
  frequency_penalty: number;
  presence_penalty: number;
};

// Interface for generate method options
export interface GenerateOptions<T extends z.ZodTypeAny> {
  systemPrompt?: string;
  userPrompt: string;
  jsonSchema?: T;
  model?: string;
  params?: Partial<ModelParams>;
}

// Interface for service configuration
export interface OpenRouterServiceConfig {
  apiKey: string;
  defaultModel?: string;
  defaultParams?: Partial<ModelParams>;
}

// Custom error classes for proper error handling
export class OpenRouterConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenRouterConfigurationError";
  }
}

export class OpenRouterAPIError extends Error {
  constructor(message: string, public status: number, public details?: any) {
    super(message);
    this.name = "OpenRouterAPIError";
  }
}

export class OpenRouterRequestError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = "OpenRouterRequestError";
  }
}

export class OpenRouterResponseError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = "OpenRouterResponseError";
  }
}

export class OpenRouterValidationError extends Error {
  constructor(message: string, public validationErrors?: any) {
    super(message);
    this.name = "OpenRouterValidationError";
  }
}
