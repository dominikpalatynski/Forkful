import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OpenRouterService, OpenRouterError, type OpenRouterServiceConfig } from './openrouter.service';

describe('OpenRouterService', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let validConfig: OpenRouterServiceConfig;

  beforeEach(() => {
    vi.resetAllMocks();
    mockFetch = vi.fn();

    validConfig = {
      apiKey: 'test-api-key',
      model: 'test-model',
      systemPrompt: 'You are a test assistant',
      jsonSchema: {
        name: 'test-schema',
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
          required: ['name'],
        },
      },
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Constructor', () => {
    it('should initialize successfully with all required config', () => {
      const service = new OpenRouterService(validConfig, mockFetch);
      expect(service).toBeInstanceOf(OpenRouterService);
    });

    it('should throw error when apiKey is missing', () => {
      const configWithoutApiKey = { ...validConfig, apiKey: '' };
      expect(() => new OpenRouterService(configWithoutApiKey, mockFetch)).toThrow(
        new OpenRouterError('OpenRouterService: apiKey is required')
      );
    });

    it('should throw error when model is missing', () => {
      const configWithoutModel = { ...validConfig, model: '' };
      expect(() => new OpenRouterService(configWithoutModel, mockFetch)).toThrow(
        new OpenRouterError('OpenRouterService: model is required')
      );
    });

    it('should throw error when systemPrompt is missing', () => {
      const configWithoutSystemPrompt = { ...validConfig, systemPrompt: '' };
      expect(() => new OpenRouterService(configWithoutSystemPrompt, mockFetch)).toThrow(
        new OpenRouterError('OpenRouterService: systemPrompt is required')
      );
    });

    it('should use custom baseUrl when provided', async () => {
      const customConfig = { ...validConfig, baseUrl: 'https://custom-api.example.com/v1/' };
      const service = new OpenRouterService(customConfig, mockFetch);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify({ name: 'Test' }) } }],
        }),
      });

      await service.generate({ userMessage: 'test' });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://custom-api.example.com/v1/chat/completions',
        expect.any(Object)
      );
    });

    it('should accept custom fetchImpl dependency', async () => {
      const customFetch = vi.fn();
      const service = new OpenRouterService(validConfig, customFetch);

      customFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify({ name: 'Test' }) } }],
        }),
      });

      await service.generate({ userMessage: 'test' });

      expect(customFetch).toHaveBeenCalled();
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Request Building (buildPayload)', () => {
    it('should create correctly formatted request payload', async () => {
      const service = new OpenRouterService(validConfig, mockFetch);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify({ name: 'Test' }) } }],
        }),
      });

      await service.generate({ userMessage: 'Make pasta' });

      const callArgs = mockFetch.mock.calls[0];
      const [, options] = callArgs;
      const payload = JSON.parse(options.body);

      expect(payload.model).toBe('test-model');
      expect(payload.messages).toEqual([
        { role: 'system', content: 'You are a test assistant' },
        { role: 'user', content: 'Make pasta' },
      ]);
      expect(payload.stream).toBe(false);
      expect(payload.response_format).toEqual({
        type: 'json_schema',
        json_schema: {
          name: 'test-schema',
          schema: validConfig.jsonSchema.schema,
          strict: true,
        },
      });
    });

    it('should include custom model parameters in payload', async () => {
      const configWithParams = {
        ...validConfig,
        modelParameters: {
          temperature: 0.7,
          max_tokens: 1000,
          top_p: 0.9,
        },
      };
      const service = new OpenRouterService(configWithParams, mockFetch);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify({ name: 'Test' }) } }],
        }),
      });

      await service.generate({ userMessage: 'test' });

      const callArgs = mockFetch.mock.calls[0];
      const [, options] = callArgs;
      const payload = JSON.parse(options.body);

      expect(payload.temperature).toBe(0.7);
      expect(payload.max_tokens).toBe(1000);
      expect(payload.top_p).toBe(0.9);
    });

    it('should respect custom strict mode setting', async () => {
      const configWithStrictFalse = {
        ...validConfig,
        jsonSchema: {
          ...validConfig.jsonSchema,
          strict: false,
        },
      };
      const service = new OpenRouterService(configWithStrictFalse, mockFetch);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify({ name: 'Test' }) } }],
        }),
      });

      await service.generate({ userMessage: 'test' });

      const callArgs = mockFetch.mock.calls[0];
      const [, options] = callArgs;
      const payload = JSON.parse(options.body);

      expect(payload.response_format.json_schema.strict).toBe(false);
    });

    it('should default strict mode to true', async () => {
      const service = new OpenRouterService(validConfig, mockFetch);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify({ name: 'Test' }) } }],
        }),
      });

      await service.generate({ userMessage: 'test' });

      const callArgs = mockFetch.mock.calls[0];
      const [, options] = callArgs;
      const payload = JSON.parse(options.body);

      expect(payload.response_format.json_schema.strict).toBe(true);
    });
  });

  describe('HTTP Communication (send)', () => {
    it('should call the correct endpoint with POST method', async () => {
      const service = new OpenRouterService(validConfig, mockFetch);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify({ name: 'Test' }) } }],
        }),
      });

      await service.generate({ userMessage: 'test' });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should include proper Authorization header', async () => {
      const configWithKey = { ...validConfig, apiKey: 'test-key-123' };
      const service = new OpenRouterService(configWithKey, mockFetch);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify({ name: 'Test' }) } }],
        }),
      });

      await service.generate({ userMessage: 'test' });

      const callArgs = mockFetch.mock.calls[0];
      const [, options] = callArgs;

      expect(options.headers.Authorization).toBe('Bearer test-key-123');
    });

    it('should include Content-Type header', async () => {
      const service = new OpenRouterService(validConfig, mockFetch);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify({ name: 'Test' }) } }],
        }),
      });

      await service.generate({ userMessage: 'test' });

      const callArgs = mockFetch.mock.calls[0];
      const [, options] = callArgs;

      expect(options.headers['Content-Type']).toBe('application/json');
    });

    it('should send payload as JSON string in body', async () => {
      const service = new OpenRouterService(validConfig, mockFetch);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify({ name: 'Test' }) } }],
        }),
      });

      await service.generate({ userMessage: 'test' });

      const callArgs = mockFetch.mock.calls[0];
      const [, options] = callArgs;

      expect(typeof options.body).toBe('string');
      const parsed = JSON.parse(options.body);
      expect(parsed).toHaveProperty('model');
      expect(parsed).toHaveProperty('messages');
    });

    it('should include AbortSignal with 30-second timeout', async () => {
      const service = new OpenRouterService(validConfig, mockFetch);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify({ name: 'Test' }) } }],
        }),
      });

      await service.generate({ userMessage: 'test' });

      const callArgs = mockFetch.mock.calls[0];
      const [, options] = callArgs;

      expect(options.signal).toBeDefined();
      expect(options.signal).toBeInstanceOf(AbortSignal);
    });

    it('should clear timeout after successful response', async () => {
      vi.useFakeTimers();
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      const service = new OpenRouterService(validConfig, mockFetch);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify({ name: 'Test' }) } }],
        }),
      });

      await service.generate({ userMessage: 'test' });

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });

  describe('HTTP Error Handling', () => {
    it('should throw error for 401 response', async () => {
      const service = new OpenRouterService(validConfig, mockFetch);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Invalid API key',
      });

      await expect(service.generate({ userMessage: 'test' })).rejects.toThrow(/HTTP 401 Unauthorized/);
    });

    it('should throw error for 403 response', async () => {
      const service = new OpenRouterService(validConfig, mockFetch);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        text: async () => 'Access denied',
      });

      await expect(service.generate({ userMessage: 'test' })).rejects.toThrow(/HTTP 403 Forbidden/);
    });

    it('should throw error for 500 response', async () => {
      const service = new OpenRouterService(validConfig, mockFetch);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => '',
      });

      await expect(service.generate({ userMessage: 'test' })).rejects.toThrow(/HTTP 500 Internal Server Error/);
    });

    it('should convert AbortError to timeout OpenRouterError', async () => {
      const service = new OpenRouterService(validConfig, mockFetch);

      mockFetch.mockImplementationOnce(() => {
        const error = new DOMException('Aborted', 'AbortError');
        return Promise.reject(error);
      });

      await expect(service.generate({ userMessage: 'test' })).rejects.toThrow(/request timed out/);
    });

    it('should handle text() rejection gracefully', async () => {
      const service = new OpenRouterService(validConfig, mockFetch);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.reject(new Error('Failed to read body')),
      });

      await expect(service.generate({ userMessage: 'test' })).rejects.toThrow(/HTTP 500/);
    });

    it('should re-throw non-AbortError exceptions', async () => {
      const service = new OpenRouterService(validConfig, mockFetch);

      mockFetch.mockImplementationOnce(() => {
        return Promise.reject(new Error('Network unavailable'));
      });

      await expect(service.generate({ userMessage: 'test' })).rejects.toThrow('Network unavailable');
    });
  });

  describe('Response Validation (validateResponse)', () => {
    it('should process valid API response successfully', async () => {
      const service = new OpenRouterService(validConfig, mockFetch);

      const apiResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({ name: 'Test Recipe' }),
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => apiResponse,
      });

      const result = await service.generate({ userMessage: 'test' });

      expect(result.raw).toEqual(apiResponse);
      expect(result.json).toEqual({ name: 'Test Recipe' });
    });

    it('should throw error when choices is missing', async () => {
      const service = new OpenRouterService(validConfig, mockFetch);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await expect(service.generate({ userMessage: 'test' })).rejects.toThrow(/invalid response shape \(missing choices\)/);
    });

    it('should throw error when choices array is empty', async () => {
      const service = new OpenRouterService(validConfig, mockFetch);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [] }),
      });

      await expect(service.generate({ userMessage: 'test' })).rejects.toThrow(/invalid response shape \(missing choices\)/);
    });

    it('should throw error when message is missing', async () => {
      const service = new OpenRouterService(validConfig, mockFetch);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{}],
        }),
      });

      await expect(service.generate({ userMessage: 'test' })).rejects.toThrow(/invalid response shape \(missing content\)/);
    });

    it('should throw error when content is missing', async () => {
      const service = new OpenRouterService(validConfig, mockFetch);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: {} }],
        }),
      });

      await expect(service.generate({ userMessage: 'test' })).rejects.toThrow(/invalid response shape \(missing content\)/);
    });

    it('should throw error when content is null', async () => {
      const service = new OpenRouterService(validConfig, mockFetch);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: null } }],
        }),
      });

      await expect(service.generate({ userMessage: 'test' })).rejects.toThrow(/invalid response shape \(missing content\)/);
    });

    it('should throw error when content is undefined', async () => {
      const service = new OpenRouterService(validConfig, mockFetch);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: undefined } }],
        }),
      });

      await expect(service.generate({ userMessage: 'test' })).rejects.toThrow(/invalid response shape \(missing content\)/);
    });
  });

  describe('JSON Parsing', () => {
    it('should parse string content as JSON', async () => {
      const service = new OpenRouterService(validConfig, mockFetch);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '{"name": "Pasta"}' } }],
        }),
      });

      const result = await service.generate({ userMessage: 'test' });

      expect(result.json).toEqual({ name: 'Pasta' });
    });

    it('should handle non-string content (already parsed)', async () => {
      const service = new OpenRouterService(validConfig, mockFetch);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: { name: 'Pasta' } } }],
        }),
      });

      const result = await service.generate({ userMessage: 'test' });

      expect(result.json).toEqual({ name: 'Pasta' });
    });

    it('should throw error for malformed JSON', async () => {
      const service = new OpenRouterService(validConfig, mockFetch);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '{invalid json}' } }],
        }),
      });

      await expect(service.generate({ userMessage: 'test' })).rejects.toThrow(/content is not valid JSON/);
    });

    it('should throw error for empty JSON string', async () => {
      const service = new OpenRouterService(validConfig, mockFetch);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '' } }],
        }),
      });

      await expect(service.generate({ userMessage: 'test' })).rejects.toThrow(/content is not valid JSON/);
    });
  });

  describe('Schema Validation', () => {
    it('should accept response matching schema', async () => {
      const configWithSchema = {
        ...validConfig,
        jsonSchema: {
          name: 'test-schema',
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
            required: ['name'],
          },
        },
      };
      const service = new OpenRouterService(configWithSchema, mockFetch);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify({ name: 'Pasta' }) } }],
        }),
      });

      const result = await service.generate({ userMessage: 'test' });

      expect(result.json).toEqual({ name: 'Pasta' });
    });

    it('should reject response missing required schema field', async () => {
      const configWithSchema = {
        ...validConfig,
        jsonSchema: {
          name: 'test-schema',
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
            },
            required: ['name', 'description'],
          },
        },
      };
      const service = new OpenRouterService(configWithSchema, mockFetch);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify({ name: 'Pasta' }) } }],
        }),
      });

      await expect(service.generate({ userMessage: 'test' })).rejects.toThrow(/response does not match schema/);
    });

    it('should reject response with incorrect field type', async () => {
      const configWithSchema = {
        ...validConfig,
        jsonSchema: {
          name: 'test-schema',
          schema: {
            type: 'object',
            properties: {
              temperature: { type: 'number' },
            },
            required: ['temperature'],
          },
        },
      };
      const service = new OpenRouterService(configWithSchema, mockFetch);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify({ temperature: 'high' }) } }],
        }),
      });

      await expect(service.generate({ userMessage: 'test' })).rejects.toThrow(/response does not match schema/);
    });

    it('should include all validation errors in context', async () => {
      const configWithSchema = {
        ...validConfig,
        jsonSchema: {
          name: 'test-schema',
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              calories: { type: 'number' },
            },
            required: ['name', 'description', 'calories'],
          },
        },
      };
      const service = new OpenRouterService(configWithSchema, mockFetch);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify({ name: 'Pasta' }) } }],
        }),
      });

      try {
        await service.generate({ userMessage: 'test' });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(OpenRouterError);
        expect((error as OpenRouterError).context).toHaveProperty('validationErrors');
      }
    });
  });

  describe('Integration (generate)', () => {
    it('should successfully complete full request-response cycle', async () => {
      const service = new OpenRouterService(validConfig, mockFetch);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify({ name: 'Test' }) } }],
        }),
      });

      const result = await service.generate({ userMessage: 'test message' });

      expect(result.raw).toBeDefined();
      expect(result.json).toEqual({ name: 'Test' });
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should propagate HTTP errors from send()', async () => {
      const service = new OpenRouterService(validConfig, mockFetch);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Invalid API key',
      });

      await expect(service.generate({ userMessage: 'test' })).rejects.toThrow(OpenRouterError);
    });

    it('should propagate validation errors from validateResponse()', async () => {
      const service = new OpenRouterService(validConfig, mockFetch);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'invalid json {]' } }],
        }),
      });

      await expect(service.generate({ userMessage: 'test' })).rejects.toThrow(OpenRouterError);
    });
  });
});
