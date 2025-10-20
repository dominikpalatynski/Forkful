# Przewodnik Implementacji Usługi OpenRouter

## 1. Opis Usługi

`OpenRouterService` to klasa TypeScript zaprojektowana do hermetyzacji logiki komunikacji z API OpenRouter. Służy jako centralny punkt dostępu do modeli językowych (LLM), abstrahując złożoność żądań HTTP, obsługi błędów i parsowania odpowiedzi. Usługa umożliwia generowanie odpowiedzi tekstowych oraz ustrukturyzowanych danych w formacie JSON na podstawie zdefiniowanych schematów, co czyni ją kluczowym elementem dla funkcji opartych na AI w aplikacji.

## 2. Opis Konstruktora

Konstruktor inicjalizuje usługę, konfigurując niezbędne parametry do komunikacji z API. Wymaga klucza API i pozwala na ustawienie opcjonalnych, domyślnych wartości dla modelu i parametrów generowania.

```typescript
import { z } from "zod";

// Definicja opcji konfiguracyjnych dla konstruktora
interface OpenRouterServiceConfig {
  apiKey: string;
  defaultModel?: string;
  defaultParams?: Partial<ModelParams>;
}

// Domyślne wartości
const DEFAULT_MODEL = "anthropic/claude-3-haiku";
const DEFAULT_PARAMS = {
  temperature: 0.7,
  max_tokens: 2048,
};

class OpenRouterService {
  private readonly apiKey: string;
  private readonly defaultModel: string;
  private readonly defaultParams: Partial<ModelParams>;
  private readonly baseUrl = "https://openrouter.ai/api/v1";

  constructor(config: OpenRouterServiceConfig) {
    if (!config.apiKey) {
      throw new Error("OpenRouterService: API key is required.");
    }
    this.apiKey = config.apiKey;
    this.defaultModel = config.defaultModel ?? DEFAULT_MODEL;
    this.defaultParams = { ...DEFAULT_PARAMS, ...config.defaultParams };
  }

  // ... reszta implementacji
}
```

## 3. Publiczne Metody i Pola

### `generate<T extends z.ZodTypeAny>(options: GenerateOptions<T>): Promise<z.infer<T> | string>`

Główna metoda publiczna usługi. Generuje odpowiedź od modelu LLM. Może zwrócić prosty tekst lub obiekt JSON zgodny z podanym schematem Zod.

#### Parametry (`GenerateOptions<T>`):

- `systemPrompt` (string, opcjonalny): Instrukcja systemowa, która definiuje rolę i zachowanie modelu.
- `userPrompt` (string, wymagany): Zapytanie użytkownika, na które model ma odpowiedzieć.
- `jsonSchema` (z.ZodTypeAny, opcjonalny): Schemat Zod definiujący oczekiwaną strukturę odpowiedzi JSON. Jeśli zostanie podany, usługa zażąda od modelu odpowiedzi w formacie JSON i zweryfikuje ją.
- `model` (string, opcjonalny): Nazwa modelu do użycia, np. `google/gemini-1.5-flash`. Zastępuje domyślny model.
- `params` (Partial<ModelParams>, opcjonalny): Parametry generowania, takie jak `temperature` czy `top_p`. Zastępują domyślne parametry.

#### Zwraca:

- `Promise<string>`: Jeśli `jsonSchema` nie jest podany.
- `Promise<z.infer<T>>`: Jeśli `jsonSchema` jest podany, zwraca obiekt, którego typ jest wyinferowany ze schematu.

## 4. Prywatne Metody i Pola

### `private async _makeApiRequest(payload: object): Promise<any>`

Wewnętrzna metoda do wysyłania żądań POST do API OpenRouter. Obsługuje dodawanie nagłówków autoryzacyjnych i obsługę podstawowych błędów HTTP.

### `private _buildPayload<T extends z.ZodTypeAny>(options: GenerateOptions<T>): object`

Metoda pomocnicza do budowania obiektu żądania (payload) na podstawie opcji przekazanych do metody `generate`. Tworzy strukturę `messages` i dodaje konfigurację `tools` dla odpowiedzi JSON.

### `private _parseResponse<T extends z.ZodTypeAny>(response: any, schema?: T): z.infer<T> | string`

Metoda do parsowania odpowiedzi z API. Jeśli oczekiwano schematu JSON, ekstrahuje argumenty z `tool_calls`, parsuje je i waliduje za pomocą schematu Zod. W przeciwnym razie zwraca zawartość tekstową.

## 5. Obsługa Błędów

Usługa będzie rzucać niestandardowe, typowane błędy, aby ułatwić ich obsługę w wyższych warstwach aplikacji.

- **`OpenRouterConfigurationError`**: Rzucany, gdy brakuje klucza API podczas inicjalizacji.
- **`OpenRouterAPIError`**: Rzucany w przypadku błędów zwróconych przez API OpenRouter (np. status 4xx, 5xx). Zawiera oryginalny status i komunikat błędu z API.
- **`OpenRouterRequestError`**: Rzucany w przypadku problemów z siecią lub niemożności wysłania żądania.
- **`OpenRouterResponseError`**: Rzucany, gdy odpowiedź API jest niekompletna lub ma nieprawidłowy format.
- **`OpenRouterValidationError`**: Rzucany, gdy odpowiedź JSON od modelu nie przejdzie walidacji względem podanego schematu Zod.

## 6. Kwestie Bezpieczeństwa

1.  **Zarządzanie Kluczem API**: Klucz API **nigdy** nie powinien być hardkodowany w kodzie. Musi być przechowywany w zmiennych środowiskowych (np. w pliku `.env` dodanym do `.gitignore`) i ładowany po stronie serwera.
2.  **Walidacja Danych Wejściowych**: Należy walidować dane wejściowe przekazywane do `userPrompt`, aby zapobiec atakom typu prompt injection, zwłaszcza jeśli pochodzą one bezpośrednio od użytkownika.
3.  **Ograniczenia Zasobów**: Należy kontrolować parametr `max_tokens`, aby zapobiegać generowaniu nadmiernie długich (i kosztownych) odpowiedzi. Warto również ustawić limity finansowe w panelu OpenRouter.
4.  **Ekspozycja Błędów**: Należy unikać zwracania surowych komunikatów błędów z API do klienta. Zamiast tego należy je logować po stronie serwera i zwracać ogólne, przyjazne dla użytkownika komunikaty.

## 7. Plan Wdrożenia Krok po Kroku

### Krok 1: Konfiguracja Zmiennych Środowiskowych

1.  Dodaj swój klucz API OpenRouter do pliku `.env` w głównym katalogu projektu:
    ```
    OPENROUTER_API_KEY="sk-or-v1-..."
    ```
2.  Upewnij się, że plik `.env` jest uwzględniony w `.gitignore`.

### Krok 2: Utworzenie Pliku Usługi

1.  W katalogu `src/lib/services/` utwórz nowy plik o nazwie `openrouter.service.ts`.
2.  Zainstaluj bibliotekę `zod-to-json-schema`, która będzie potrzebna do konwersji schematów Zod na JSON Schema.
    ```bash
    npm install zod-to-json-schema
    ```

### Krok 3: Zdefiniowanie Typów i Interfejsów

W pliku `openrouter.service.ts` zdefiniuj niezbędne typy i interfejsy.

```typescript
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

// Typy dla parametrów modelu
export type ModelParams = {
  temperature: number;
  top_p: number;
  max_tokens: number;
  frequency_penalty: number;
  presence_penalty: number;
};

// Interfejs opcji dla metody `generate`
export interface GenerateOptions<T extends z.ZodTypeAny> {
  systemPrompt?: string;
  userPrompt: string;
  jsonSchema?: T;
  model?: string;
  params?: Partial<ModelParams>;
}

// Interfejs konfiguracji dla konstruktora
export interface OpenRouterServiceConfig {
  apiKey: string;
  defaultModel?: string;
  defaultParams?: Partial<ModelParams>;
}
```

### Krok 4: Implementacja Szkieletu Klasy i Konstruktora

Zaimplementuj podstawową strukturę klasy `OpenRouterService` wraz z konstruktorem.

```typescript
// (importy i typy z kroku 3)

const DEFAULT_MODEL = "anthropic/claude-3-haiku";
const DEFAULT_PARAMS: Partial<ModelParams> = {
  temperature: 0.7,
  max_tokens: 2048,
};

// Definicje klas błędów (przykładowa)
export class OpenRouterAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: any
  ) {
    super(message);
    this.name = "OpenRouterAPIError";
  }
}
// TODO: Dodać pozostałe klasy błędów

export class OpenRouterService {
  private readonly apiKey: string;
  private readonly defaultModel: string;
  private readonly defaultParams: Partial<ModelParams>;
  private readonly baseUrl = "https://openrouter.ai/api/v1/chat/completions";

  constructor(config: OpenRouterServiceConfig) {
    if (!config.apiKey) {
      // TODO: Użyć dedykowanej klasy błędu
      throw new Error("OpenRouterService: API key is required.");
    }
    this.apiKey = config.apiKey;
    this.defaultModel = config.defaultModel ?? DEFAULT_MODEL;
    this.defaultParams = { ...DEFAULT_PARAMS, ...config.defaultParams };
  }

  // ... metody
}
```

### Krok 5: Implementacja Metod Prywatnych

Dodaj metody pomocnicze do budowania payloadu, wysyłania żądania i parsowania odpowiedzi.

```typescript
// Wewnątrz klasy OpenRouterService

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
    const functionName = options.jsonSchema.description || "get_structured_data";
    payload.tools = [
      {
        type: "function",
        function: {
          name: functionName,
          description: `Extract structured data based on the user's prompt.`,
          parameters: zodToJsonSchema(options.jsonSchema),
        },
      },
    ];
    payload.tool_choice = { type: "function", function: { name: functionName } };
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
    // TODO: Użyć dedykowanej klasy błędu
    throw new Error(`Request failed: ${error}`);
  }
}

private _parseResponse<T extends z.ZodTypeAny>(
  response: any,
  schema?: T
): z.infer<T> | string {
  const choice = response.choices?.[0];
  if (!choice) {
    // TODO: Użyć dedykowanej klasy błędu
    throw new Error("Invalid response structure from API.");
  }

  if (schema) {
    const toolCall = choice.message?.tool_calls?.[0];
    if (!toolCall || toolCall.type !== "function") {
       // TODO: Użyć dedykowanej klasy błędu
      throw new Error("Structured data (tool_calls) not found in response.");
    }
    try {
      const jsonData = JSON.parse(toolCall.function.arguments);
      return schema.parse(jsonData); // Walidacja Zod
    } catch (error) {
       // TODO: Użyć dedykowanej klasy błędu i dołączyć szczegóły walidacji
      throw new Error(`Failed to parse or validate JSON response: ${error}`);
    }
  }

  return choice.message?.content?.trim() ?? "";
}
```

### Krok 6: Implementacja Metody Publicznej `generate`

Połącz wszystko w głównej metodzie publicznej.

```typescript
// Wewnątrz klasy OpenRouterService

public async generate<T extends z.ZodTypeAny>(
  options: GenerateOptions<T>
): Promise<z.infer<T> | string> {
  const payload = this._buildPayload(options);
  const response = await this._makeApiRequest(payload);
  return this._parseResponse(response, options.jsonSchema);
}
```

### Krok 7: Wykorzystanie Usługi

Utwórz instancję usługi w odpowiednim miejscu po stronie serwera (np. w endpointach API Astro w `src/pages/api/`).

```typescript
// Przykład użycia w pliku src/pages/api/recipes/generate.ts

import { OpenRouterService } from "@/lib/services/openrouter.service";
import { z } from "zod";

// Inicjalizacja usługi
const openrouterService = new OpenRouterService({
  apiKey: import.meta.env.OPENROUTER_API_KEY,
});

// Przykład 1: Generowanie tekstu
async function generateRecipeTitle(topic: string): Promise<string> {
  const result = await openrouterService.generate({
    systemPrompt: "You are a creative chef.",
    userPrompt: `Give me one catchy title for a recipe about: ${topic}`,
    model: "anthropic/claude-3-sonnet",
  });
  return result as string;
}

// Przykład 2: Generowanie ustrukturyzowanego JSON
const recipeSchema = z.object({
  title: z.string().describe("The title of the recipe"),
  ingredients: z.array(z.string()).describe("List of ingredients"),
  prep_time_minutes: z.number().describe("Preparation time in minutes"),
});

async function generateRecipeObject(topic: string) {
  const result = await openrouterService.generate({
    systemPrompt: "You are a helpful recipe assistant that always provides structured data.",
    userPrompt: `Generate a simple recipe about: ${topic}`,
    jsonSchema: recipeSchema,
  });
  return result; // Typ będzie automatycznie wyinferowany jako { title, ingredients, prep_time_minutes }
}
```
