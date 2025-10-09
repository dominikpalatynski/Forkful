# API Endpoint Implementation Plan: Get a Single Recipe

## 1. Przegląd punktu końcowego
Celem tego punktu końcowego jest pobranie pojedynczego, szczegółowego zasobu przepisu na podstawie jego unikalnego identyfikatora (ID). Odpowiedź będzie zawierać podstawowe dane przepisu oraz powiązane z nim listy składników, kroków przygotowania i tagów. Dostęp do przepisu jest ograniczony do uwierzytelnionego użytkownika, który jest jego właścicielem.

## 2. Szczegóły żądania
-   **Metoda HTTP**: `GET`
-   **Struktura URL**: `/api/recipes/{id}`
-   **Parametry**:
    -   **Wymagane**:
        -   `id` (parametr ścieżki): Unikalny identyfikator (UUID) przepisu do pobrania.
    -   **Opcjonalne**: Brak.
-   **Request Body**: Brak.

## 3. Wykorzystywane typy
Do implementacji tego punktu końcowego zostaną wykorzystane następujące typy DTO (Data Transfer Objects) zdefiniowane w `src/types.ts`:
-   `RecipeDetailDto`: Główny obiekt odpowiedzi, zawierający wszystkie szczegóły przepisu.
-   `RecipeIngredientDto`: Obiekt reprezentujący pojedynczy składnik w ramach przepisu.
-   `RecipeStepDto`: Obiekt reprezentujący pojedynczy krok przygotowania w ramach przepisu.

## 4. Szczegóły odpowiedzi
-   **Pomyślna odpowiedź (`200 OK`)**:
    -   **Content-Type**: `application/json`
    -   **Body**: Obiekt JSON zgodny z typem `RecipeDetailDto`.
        ```json
        {
          "id": "uuid-goes-here",
          "name": "Spaghetti Carbonara",
          "description": "A classic Italian pasta dish.",
          "ingredients": [
            { "id": "uuid", "content": "200g spaghetti", "position": 1 }
          ],
          "steps": [
            { "id": "uuid", "content": "Boil the pasta.", "position": 1 }
          ],
          "tags": ["pasta", "italian", "quick"]
        }
        ```
-   **Odpowiedzi błędów**:
    -   `400 Bad Request`: Gdy parametr `id` w URL nie jest prawidłowym UUID.
    -   `401 Unauthorized`: Gdy użytkownik nie jest uwierzytelniony.
    -   `403 Forbidden`: Gdy uwierzytelniony użytkownik nie jest właścicielem przepisu.
    -   `404 Not Found`: Gdy przepis o podanym `id` nie istnieje.
    -   `500 Internal Server Error`: W przypadku nieoczekiwanego błędu serwera.

## 5. Przepływ danych
1.  Klient wysyła żądanie `GET` na adres `/api/recipes/{id}`.
3.  Handler Astro w `src/pages/api/recipes/[id].ts` odbiera żądanie.
4.  Handler waliduje parametr `id` ze ścieżki URL przy użyciu Zod, sprawdzając, czy jest to prawidłowy UUID. W przypadku błędu walidacji zwraca `400 Bad Request`.
5.  Handler wywołuje funkcję `getRecipeById(recipeId, userId)` z serwisu `src/lib/services/recipe.service.ts`, przekazując `id` przepisu oraz `id` defaultUser na czas developmentu
6.  Funkcja serwisowa wykonuje pojedyncze zapytanie do bazy danych Supabase w celu pobrania przepisu wraz z powiązanymi składnikami, krokami i tagami.
7.  Zapytanie SQL sprawdza, czy przepis o danym `id` istnieje. Jeśli nie, funkcja serwisowa zgłasza błąd `NotFound`.
8.  Po pobraniu danych, funkcja serwisowa weryfikuje, czy `user_id` pobranego przepisu zgadza się z `userId` przekazanym do funkcji. Jeśli nie, zgłasza błąd `Forbidden`.
9.  Jeśli dane są poprawne, serwis transformuje wynik zapytania do struktury `RecipeDetailDto`, sortując składniki i kroki według pola `position` i spłaszczając listę tagów.
10. Handler Astro otrzymuje DTO z serwisu i zwraca odpowiedź `200 OK` z obiektem JSON w ciele.
11. W przypadku błędów zgłoszonych przez serwis, handler łapie je i zwraca odpowiedni kod statusu HTTP (`403`, `404`, `500`).

## 6. Względy bezpieczeństwa
-   **Uwierzytelnianie**: Każde żądanie musi być uwierzytelnione. Logika ta będzie zarządzana centralnie przez middleware Astro, który weryfikuje token sesji Supabase.
-   **Autoryzacja**: Kluczowym elementem bezpieczeństwa jest weryfikacja własności zasobu. Zapytanie do bazy danych musi bezwzględnie filtrować wyniki nie tylko po `id` przepisu, ale również po `user_id` aktualnie zalogowanego użytkownika. Zapobiega to podatności IDOR (Insecure Direct Object Reference).
-   **Walidacja danych wejściowych**: Parametr `id` musi być walidowany jako UUID, aby uniknąć błędów zapytań i potencjalnych wektorów ataku.

## 7. Rozważania dotyczące wydajności
-   **Zapytania do bazy danych**: Aby uniknąć problemu N+1, wszystkie powiązane dane (składniki, kroki, tagi) powinny być pobrane w jednym, zoptymalizowanym zapytaniu SQL z wykorzystaniem `JOIN` lub zagnieżdżonych selekcji oferowanych przez Supabase.
-   **Indeksowanie**: Należy upewnić się, że kolumny używane w klauzulach `WHERE` i `JOIN` (`recipes.id`, `recipes.user_id`, `ingredients.recipe_id`, `steps.recipe_id`, `recipe_tags.recipe_id`, `recipe_tags.tag_id`) są odpowiednio zindeksowane w bazie danych PostgreSQL.

## 8. Etapy wdrożenia
1.  **Utworzenie pliku endpointu**: Stwórz nowy plik `src/pages/api/recipes/[id].ts`.
2.  **Implementacja handlera `GET`**: W pliku `[id].ts` zdefiniuj i wyeksportuj asynchroniczną funkcję `GET({ context, params })` zgodną z API Astro. Dodaj `export const prerender = false;`.
3.  **Dodanie logiki do serwisu**: W pliku `src/lib/services/recipe.service.ts` utwórz nową funkcję asynchroniczną `getRecipeById(supabase: SupabaseClient, recipeId: string, userId: string): Promise<RecipeDetailDto>`.
4.  **Zbudowanie zapytania Supabase**: W `getRecipeById` zaimplementuj zapytanie do bazy danych, które pobierze przepis (`recipes`) i jego powiązane encje: `ingredients`, `steps` oraz `tags` (poprzez `recipe_tags`). Użyj zagnieżdżonych zapytań Supabase, aby pobrać wszystko w jednym wywołaniu.
    ```typescript
    // Przykład struktury zapytania
    const { data, error } = await supabase
      .from('recipes')
      .select(`
        id,
        name,
        description,
        user_id,
        ingredients (id, content, position),
        steps (id, content, position),
        recipe_tags ( tags ( name ) )
      `)
      .eq('id', recipeId)
      .single();
    ```
5.  **Implementacja logiki autoryzacji i błędów w serwisie**:
    -   Po wykonaniu zapytania, sprawdź czy `data` jest `null`. Jeśli tak, rzuć niestandardowy błąd `NotFoundError`.
    -   Sprawdź, czy `data.user_id` jest równe `userId`. Jeśli nie, rzuć `ForbiddenError`.
6.  **Transformacja danych w serwisie**: Przekształć surowe dane z Supabase do formatu `RecipeDetailDto`. Pamiętaj o:
    -   Posortowaniu `ingredients` i `steps` po polu `position`.
    -   Spłaszczeniu struktury tagów z `[{ tags: { name: 'tag' } }]` do `['tag']`.
    -   Utwórz Scheme w recipe.schema.ts gdzie stworzyć obiekt zeby go odpowiednio zvalidowac
7.  **Integracja serwisu z handlerem**: W `[id].ts`:
    -   Pobierz `id` z `params` i `user` z `context.locals`.
    -   Zwaliduj `id` jako UUID za pomocą Zod.
    -   Wywołaj `recipeService.getRecipeById` w bloku `try...catch`.
    -   W przypadku sukcesu, zwróć odpowiedź JSON z kodem `200`.
    -   W bloku `catch`, obsłuż błędy `NotFoundError`, `ForbiddenError` i inne, zwracając odpowiednie kody statusu (`404`, `403`, `500`).
