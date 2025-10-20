# Onboarding: Serwis OpenRouter (`openrouter.service.ts`)

Witaj w projekcie! Ten dokument pomoże Ci zrozumieć, jak działa `OpenRouterService`, który jest kluczowym elementem do komunikacji z modelami językowymi poprzez API OpenRouter.

## 1. Cel i rola serwisu

`OpenRouterService` to klasa w TypeScript, która abstahuje i upraszcza interakcję z API OpenRouter.ai. Jej głównym zadaniem jest wysyłanie promptów do różnych modeli AI (np. Claude 3 Haiku) i otrzymywanie odpowiedzi, zarówno w formie prostego tekstu, jak i ustrukturyzowanych danych JSON.

Serwis został zaprojektowany z myślą o bezpieczeństwie, walidacji i łatwości użycia.

## 2. Kluczowe funkcjonalności

### Główne komponenty

- **`OpenRouterService`**: Główna klasa, którą będziesz instancjonować i używać do wysyłania zapytań.
- **`generate<T>(options: GenerateOptions<T>)`**: Centralna, publiczna metoda serwisu. Przyjmuje prompt użytkownika i opcjonalne parametry, a następnie zwraca odpowiedź od modelu. Może zwrócić `string` lub obiekt zgodny ze schematem Zod, jeśli zostanie dostarczony.
- **Typy i błędy**: Serwis eksportuje własne typy (`ModelParams`, `GenerateOptions`) oraz klasy błędów (`OpenRouterAPIError`, `OpenRouterValidationError` itd.), co ułatwia typowanie i obsługę wyjątków.

### Bezpieczeństwo i walidacja

Przed wysłaniem jakiegokolwiek zapytania do API, serwis wykonuje szereg walidacji po stronie klienta:

1.  **Długość promptów**: Sprawdza, czy `userPrompt` i `systemPrompt` nie przekraczają zdefiniowanych limitów (`MAX_USER_PROMPT_LENGTH`, `MAX_SYSTEM_PROMPT_LENGTH`).
2.  **Parametry modelu**: Waliduje parametry takie jak `temperature` czy `max_tokens`, aby upewnić się, że mieszczą się w bezpiecznych i dozwolonych zakresach.
3.  **Rate Limiting**: Prosty mechanizm ograniczający liczbę zapytań do 30 na minutę, aby uniknąć nadużyć i przekroczenia limitów API.
4.  **Walidacja schematu Zod**: Jeśli jako parametr zostanie przekazany schemat `jsonSchema`, serwis sprawdza jego poprawność przed użyciem.

## 3. Jak używać serwisu?

### Inicjalizacja

Aby skorzystać z serwisu, musisz najpierw utworzyć jego instancję, przekazując obiekt konfiguracyjny z kluczem API.

```typescript
import { OpenRouterService } from "./openrouter.service";

const openRouterService = new OpenRouterService({
  apiKey: process.env.OPENROUTER_API_KEY, // Klucz API musi być dostarczony
  defaultModel: "anthropic/claude-3-haiku", // Opcjonalnie, model domyślny
});
```

### Podstawowe użycie (odpowiedź tekstowa)

Aby uzyskać prostą odpowiedź tekstową, wywołaj metodę `generate` z `userPrompt`.

```typescript
const userPrompt = "Opowiedz mi krótki żart o programowaniu.";

try {
  const response = await openRouterService.generate({ userPrompt });
  console.log(response); // Wyświetli odpowiedź modelu jako string
} catch (error) {
  console.error("Wystąpił błąd:", error);
}
```

### Użycie zaawansowane (ustrukturyzowana odpowiedź JSON)

Jedną z najmocniejszych stron serwisu jest możliwość otrzymywania odpowiedzi w formacie JSON, zwalidowanej według schematu Zod.

1.  **Zdefiniuj schemat Zod**:

```typescript
import { z } from "zod";

const jokeSchema = z.object({
  setup: z.string().describe("Początek żartu"),
  punchline: z.string().describe("Puenta żartu"),
});
```

2.  **Wywołaj `generate` z `jsonSchema`**:

```typescript
const userPrompt = "Opowiedz mi żart o programowaniu w formacie JSON.";

try {
  const joke = await openRouterService.generate({
    userPrompt,
    jsonSchema: jokeSchema,
  });

  // `joke` jest teraz w pełni typowanym obiektem!
  console.log("Setup:", joke.setup);
  console.log("Punchline:", joke.punchline);
} catch (error) {
  // Błędy mogą być specyficzne, np. OpenRouterValidationError
  console.error("Wystąpił błąd:", error);
}
```

Serwis automatycznie doda do `systemPrompt` instrukcję, aby model zwrócił odpowiedź w formacie JSON, a następnie sparsuje i zwaliduje tę odpowiedź.

## 4. Architektura wewnętrzna i przepływ danych

1.  **Wywołanie `generate()`**: Programista wywołuje publiczną metodę.
2.  **Walidacja**: Uruchamiane są prywatne metody `_validatePrompts()`, `_validateParams()`, `_checkRateLimit()` etc.
3.  **Budowanie payloadu (`_buildPayload()`)**: Na podstawie opcji tworzony jest obiekt zapytania do API OpenRouter. Jeśli używany jest `jsonSchema`, do promptu systemowego dodawana jest specjalna instrukcja.
4.  **Zapytanie do API (`_makeApiRequest()`)**: Metoda `fetch` wysyła zapytanie `POST` na adres `https://openrouter.ai/api/v1/chat/completions`. Obsługuje podstawowe błędy HTTP.
5.  **Parsowanie odpowiedzi (`_parseResponse()`)**:
    - Jeśli użyto `jsonSchema`, serwis szuka odpowiedzi w polu `tool_calls` (preferowane) lub próbuje wyodrębnić JSON z pola `content`. Następnie parsuje JSON i waliduje go przy użyciu schematu Zod.
    - W przeciwnym razie, zwraca zawartość pola `content` jako tekst.
6.  **Zwrot wyniku**: Wynik (tekst lub obiekt) jest zwracany do kodu, który wywołał metodę `generate`.

## 5. Obsługa błędów

Serwis definiuje kilka własnych klas błędów, dziedziczących po `Error`, aby ułatwić debugowanie:

- `OpenRouterConfigurationError`: Błąd konfiguracji (np. brak klucza API, nieprawidłowe parametry).
- `OpenRouterAPIError`: Błąd zwrócony przez API OpenRouter (np. status 4xx, 5xx).
- `OpenRouterRequestError`: Błąd na poziomie sieci (np. problem z `fetch`).
- `OpenRouterResponseError`: Odpowiedź z API ma nieoczekiwaną strukturę.
- `OpenRouterValidationError`: Nie udało się sparsować lub zwalidować odpowiedzi JSON.

Zaleca się używanie bloku `try...catch` i sprawdzanie typu błędu za pomocą `instanceof`, aby odpowiednio reagować na różne sytuacje.
