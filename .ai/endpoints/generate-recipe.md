# API Endpoint Implementation Plan: Generate Recipe from Text

## 1. Przegląd punktu końcowego

Ten punkt końcowy (`/api/recipes/generate`) przyjmuje surowy tekst od użytkownika, przetwarza go za pomocą zewnętrznego modelu AI w celu wygenerowania ustrukturyzowanego przepisu kulinarnego i zwraca go w formacie JSON. Operacja ta nie zapisuje przepisu w bazie danych, ale tworzy wpis analityczny w tabeli `generation` w celu śledzenia wykorzystania funkcji.

## 2. Szczegóły żądania

- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/recipes/generate`
- **Parametry**:
  - **Wymagane**: Brak parametrów URL.
  - **Opcjonalne**: Brak.
- **Request Body**:

  ```json
  {
    "inputText": "Recipe for pancakes: 1 cup flour, 2 eggs, 1 cup milk. Mix all ingredients. Cook on a hot pan."
  }
  ```

  - `inputText`: `string` (min: 20, max: 10,000 znaków) - Tekst do przetworzenia.

## 3. Wykorzystywane typy

- **`GenerateRecipeDto` (Request Body Validation)**

  ```typescript
  // src/lib/schemas/recipe.schema.ts
  import { z } from "zod";

  export const GenerateRecipeDtoSchema = z.object({
    inputText: z
      .string()
      .min(20, { message: "Input text must be at least 20 characters long." })
      .max(10000, { message: "Input text cannot exceed 10,000 characters." }),
  });
  ```

- **`GeneratedRecipeResponse` (Success Response)**

  ```typescript
  // src/types.ts
  import { z } from "zod";

  const IngredientSchema = z.object({
    content: z.string(),
    position: z.number().int(),
  });

  const StepSchema = z.object({
    content: z.string(),
    position: z.number().int(),
  });

  export const GeneratedRecipeResponseSchema = z.object({
    generationId: z.string().uuid(),
    name: z.string(),
    description: z.string().nullable(),
    ingredients: z.array(IngredientSchema),
    steps: z.array(StepSchema),
  });

  export type GeneratedRecipeResponse = z.infer<typeof GeneratedRecipeResponseSchema>;
  ```

## 4. Szczegóły odpowiedzi

- **Success (200 OK)**:
  ```json
  {
    "generationId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "name": "Pancakes",
    "description": null,
    "ingredients": [
      { "content": "1 cup flour", "position": 1 },
      { "content": "2 eggs", "position": 2 },
      { "content": "1 cup milk", "position": 3 }
    ],
    "steps": [
      { "content": "Mix all ingredients.", "position": 1 },
      { "content": "Cook on a hot pan.", "position": 2 }
    ]
  }
  ```
- **Błędy**:
  - `400 Bad Request`: Błąd walidacji `inputText`.
  - `401 Unauthorized`: Użytkownik nie jest uwierzytelniony.
  - `422 Unprocessable Entity`: Przesłany tekst nie został rozpoznany jako przepis.
  - `500 Internal Server Error`: Błąd po stronie serwera lub modelu AI.

## 5. Przepływ danych

1.  Klient wysyła żądanie `POST` z `inputText` do `/api/recipes/generate`.
2.  Middleware weryfikuje sesję użytkownika. Jeśli jest nieprawidłowa, zwraca `401`.
3.  Endpoint API weryfikuje `inputText` za pomocą `GenerateRecipeDtoSchema`. W przypadku błędu zwraca `400`.
4.  Wywoływana jest metoda `recipeService.generateRecipeFromText(inputText, userId)`.
5.  **[MOCK]** Serwis **nie łączy się** z prawdziwym API modelu AI. Zamiast tego, zwraca statyczną, predefiniowaną odpowiedź w formacie zgodnym z oczekiwaniami, symulując pomyślne przetworzenie. Prawdziwa implementacja zostanie dodana w przyszłości.
6.  Serwis odbiera zamockowaną odpowiedź.
    - **Jeśli odpowiedź jest poprawna**:
      a. Odpowiedź jest parsowana i walidowana pod kątem struktury przepisu.
      b. Tworzony jest wpis w tabeli `generation`, zawierający `user_id`, `input_text`, `generated_output` (JSON z AI) i `is_accepted` (domyślnie `false`). ID tego wpisu (`generationId`) jest zapisywane.
      c. Do klienta zwracany jest obiekt przepisu wraz z `generationId` i statusem `200 OK`.
    - **Jeśli AI zwraca informację, że tekst nie jest przepisem**:
      a. Zwracany jest błąd z kodem `422 Unprocessable Entity`.
    - **Jeśli wystąpi błąd komunikacji z AI lub odpowiedź jest nieprawidłowa**:
      a. Błąd jest logowany w tabeli `generation_errors`, zawierając `user_id`, `input_text` i `error_message`.
      b. Do klienta zwracany jest błąd z kodem `500 Internal Server Error`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Dostęp do endpointu musi być chroniony. Middleware w Astro (`src/middleware/index.ts`) musi sprawdzać, czy `context.locals.user` istnieje.
- **Walidacja wejścia**: `Zod` jest używany do walidacji długości i typu `inputText`, co chroni przed nieprawidłowymi danymi.
- **Rate Limiting**: Należy zaimplementować mechanizm ograniczania liczby żądań na poziomie API (np. w Vercel/Cloudflare lub w middleware), aby chronić przed nadużyciem kosztownego API modelu AI.
- **Zarządzanie kluczami API**: Klucz do OpenRouter.ai musi być przechowywany jako zmienna środowiskowa (`OPENROUTER_API_KEY`) i nigdy nie być eksponowany po stronie klienta.

## 7. Obsługa błędów

| Kod statusu | Sytuacja                                                                            | Akcja                                                                                      |
| ----------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `400`       | `inputText` nie przechodzi walidacji Zod (np. jest za krótki/długi).                | Zwróć odpowiedź JSON z komunikatem błędu.                                                  |
| `401`       | Brak aktywnej sesji użytkownika.                                                    | Middleware zwraca standardową odpowiedź `401 Unauthorized`.                                |
| `422`       | Model AI stwierdził, że dane wejściowe nie są przepisem.                            | Zwróć odpowiedź JSON z komunikatem "The provided text could not be processed as a recipe." |
| `500`       | Błąd komunikacji z API modelu AI, błąd parsowania odpowiedzi lub inny błąd serwera. | Zaloguj szczegóły błędu w tabeli `generation_errors`. Zwróć generyczną odpowiedź błędu.    |

## 8. Rozważania dotyczące wydajności

- **Czas odpowiedzi AI**: Interakcja z modelem AI jest operacją blokującą i może trwać kilka sekund. Należy zapewnić, że klient (frontend) odpowiednio obsługuje stan ładowania.
- **Timeout**: Należy ustawić rozsądny timeout dla żądania do API modelu AI (np. 30 sekund), aby uniknąć zbyt długo wiszących żądań.

## 9. Etapy wdrożenia

1.  **Aktualizacja schemy**: Dodać `GenerateRecipeDtoSchema` do pliku `src/lib/schemas/recipe.schema.ts`.
2.  **Aktualizacja typów**: Dodać typ `GeneratedRecipeResponse` i powiązane schematy do `src/types.ts`.
3.  **Implementacja w serwisie (`recipe.service.ts`)**:
    - Stworzyć nową, asynchroniczną metodę `generateRecipeFromText(inputText: string, userId: string): Promise<GeneratedRecipeResponse>`.
    - **[WAŻNE]** Wewnątrz tej metody, logika komunikacji z AI ma być **zamockowana**. Funkcja powinna zwracać statyczny, zakodowany na stałe obiekt `GeneratedRecipeResponse`, aby umożliwić budowę i testowanie API bez rzeczywistego połączenia z AI.
    - Dodać logikę do wstawiania danych do tabeli `generation` przy użyciu Supabase client.
    - Dodać bloki `try...catch` do obsługi błędów i logowania ich w tabeli `generation_errors`.
4.  **Utworzenie pliku endpointu**:
    - Stworzyć plik `src/pages/api/recipes/generate.ts`.
    - Dodać `export const prerender = false;`.
    - Zaimplementować `POST` handler, który:
      - Sprawdza, czy `context.locals.user` istnieje.
      - Pobiera `inputText` z ciała żądania.
      - Waliduje ciało żądania za pomocą `GenerateRecipeDtoSchema.safeParse()`.
      - Wywołuje `recipeService.generateRecipeFromText`.
      - Zwraca odpowiedź JSON (`Astro.Response`) z odpowiednim kodem statusu.
5.  **Zmienne środowiskowe**: Dodać `OPENROUTER_API_KEY` do zmiennych środowiskowych projektu.
6.  **Testowanie**: Przygotować testy jednostkowe dla logiki serwisu (mockując `fetch` i Supabase client) oraz testy integracyjne dla endpointu API.
