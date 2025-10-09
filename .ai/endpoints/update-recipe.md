# API Endpoint Implementation Plan: Update Recipe

## 1. Przegląd punktu końcowego
Ten punkt końcowy umożliwia pełną aktualizację istniejącego przepisu. Przyjmuje metodę `PUT` na adresie URL `/api/recipes/{id}`. Operacja polega na zastąpieniu danych przepisu, w tym jego składników, kroków i tagów, nowymi danymi dostarczonymi w ciele żądania. Logika biznesowa po stronie serwera jest odpowiedzialna za obsługę tworzenia, aktualizowania i usuwania powiązanych zasobów w sposób transakcyjny.

## 2. Szczegóły żądania
-   **Metoda HTTP**: `PUT`
-   **Struktura URL**: `/api/recipes/{id}`
-   **Parametry**:
    -   **Wymagane**:
        -   `id` (parametr ścieżki): `uuid` unikalny identyfikator przepisu.
    -   **Opcjonalne**: Brak.
-   **Request Body**: Obiekt JSON reprezentujący pełną, zaktualizowaną wersję przepisu. Struktura musi być zgodna z typem `UpdateRecipeCommand`.

    ```json
    {
      "name": "string",
      "description": "string",
      "ingredients": [
        { "id": "uuid (optional)", "content": "string", "position": "integer" }
      ],
      "steps": [
        { "id": "uuid (optional)", "content": "string", "position": "integer" }
      ],
      "tags": ["string"]
    }
    ```

## 3. Wykorzystywane typy
-   **Command Model (Request)**: `UpdateRecipeCommand` z `src/types.ts`.
-   **DTO (Response)**: `RecipeDetailDto` z `src/types.ts`.

## 4. Szczegóły odpowiedzi
-   **Odpowiedź sukcesu (Success Response)**:
    -   **Kod**: `200 OK`
    -   **Treść**: Zaktualizowany obiekt przepisu, zgodny z DTO `RecipeDetailDto`, zawierający zaktualizowane dane i nowo wygenerowane ID dla dodanych składników i kroków.
-   **Odpowiedzi błędu (Error Responses)**:
    -   **Kod**: `400 Bad Request` - Błąd walidacji danych wejściowych.
    -   **Kod**: `401 Unauthorized` - Użytkownik nie jest uwierzytelniony.
    -   **Kod**: `403 Forbidden` - Użytkownik nie ma uprawnień do modyfikacji tego zasobu.
    -   **Kod**: `404 Not Found` - Przepis o podanym ID nie został znaleziony.
    -   **Kod**: `500 Internal Server Error` - Wewnętrzny błąd serwera, np. błąd transakcji bazy danych.

## 5. Przepływ danych
1.  Żądanie `PUT` trafia do endpointu Astro `src/pages/api/recipes/[id].ts`.
2.  Middleware Astro weryfikuje, czy użytkownik jest zalogowany i dołącza jego sesję do `context.locals`. Jeśli nie, zwraca `401`.
3.  Endpoint wyodrębnia `id` przepisu z parametrów URL oraz dane z ciała żądania.
4.  Dane wejściowe są walidowane przy użyciu dedykowanego schematu Zod dla `UpdateRecipeCommand`. W przypadku błędu zwracany jest status `400`.
5.  Wywoływana jest funkcja `updateRecipe` z serwisu `recipe.service.ts`, przekazując `id` przepisu, dane z ciała żądania oraz `user_id` z sesji.
6.  **Wewnątrz `recipe.service.ts` (w ramach jednej transakcji bazy danych):**
    a. Sprawdzenie, czy przepis o podanym `id` i `user_id` istnieje. Jeśli nie, rzucany jest błąd (przechwytywany przez endpoint jako `404` lub `403`).
    b. Aktualizacja głównych pól (`name`, `description`) w tabeli `recipes`.
    c. **Obsługa składników**:
        i. Pobranie ID wszystkich składników z żądania, które posiadają `id`.
        ii. Usunięcie z bazy wszystkich składników powiązanych z przepisem, których `id` nie znajduje się na liście z poprzedniego kroku.
        iii. Wykonanie operacji `upsert` na składnikach z żądania. Nowe składniki (bez `id`) zostaną wstawione, a istniejące (z `id`) zaktualizowane.
    d. **Obsługa kroków**: Logika analogiczna do obsługi składników.
    e. **Obsługa tagów**:
        i. Dla każdego taga z tablicy `tags`, znalezienie go w tabeli `tags` lub utworzenie, jeśli nie istnieje dla danego użytkownika.
        ii. Usunięcie wszystkich powiązań przepisu z tagami w tabeli `recipe_tags`.
        iii. Utworzenie nowych powiązań w `recipe_tags` na podstawie zaktualizowanej listy tagów.
    f. Jeśli którykolwiek krok w transakcji się nie powiedzie, cała transakcja jest wycofywana.
7.  Po pomyślnym zatwierdzeniu transakcji, serwis pobiera zaktualizowany przepis wraz z powiązaniami i mapuje go na `RecipeDetailDto`.
8.  Endpoint Astro otrzymuje `RecipeDetailDto` i zwraca je klientowi z kodem `200 OK`.



## 8. Etapy wdrożenia
1.  **Schemat walidacji**: W pliku `src/lib/schemas/recipe.schema.ts` dodać nowy schemat Zod `updateRecipeSchema`, który będzie walidował ciało żądania zgodnie ze specyfikacją typu `UpdateRecipeCommand`.
2.  **Logika serwisowa**: W pliku `src/lib/services/recipe.service.ts` zaimplementować nową, asynchroniczną funkcję `updateRecipe(id: string, data: UpdateRecipeCommand, userId: string): Promise<RecipeDetailDto>`. Ta funkcja musi:
    -   Implementować pełną logikę opisaną w sekcji "Przepływ danych".
    -   Wykorzystywać mechanism taki jak w funkcji createRecipe i zrobić rollback zmian które zostaly wdrozone
    -   Obsługiwać przypadki błędów (np. nieznaleziony przepis) poprzez rzucanie wyjątków.
3.  **Implementacja endpointu API**: Utworzyć plik `src/pages/api/recipes/[id].ts`.
4.  W nowym pliku zaimplementować handler `PUT`: `export const PUT: APIRoute = async ({ params, request, context }) => { ... }`.
5.  **Wewnątrz handlera `PUT`**:
    b. Wyodrębnić `id` z `params` i zweryfikować, czy jest to poprawny UUID.
    c. Odczytać i sparsować ciało żądania.
    d. Użyć `updateRecipeSchema.safeParse` do walidacji danych. W przypadku błędu zwrócić odpowiedź `400` ze szczegółami.
    e. Wywołać `recipeService.updateRecipe` z poprawnymi parametrami (`id`, zwalidowane dane, `user.id`).
    f. Zaimplementować blok `try...catch` do obsługi błędów rzuconych z serwisu i mapować je na odpowiednie kody statusu (`403`, `404`, `500`).
    g. W przypadku sukcesu, zwrócić otrzymane DTO z kodem `200 OK`.
