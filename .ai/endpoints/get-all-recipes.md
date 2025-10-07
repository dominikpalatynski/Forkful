# API Endpoint Implementation Plan: Get all user's recipes

## 1. Przegląd punktu końcowego
Ten punkt końcowy umożliwia pobranie paginowanej, sortowalnej i filtrowalnej listy przepisów należących do uwierzytelnionego użytkownika. Zapewnia elastyczność w przeglądaniu danych poprzez parametry zapytania.

## 2. Szczegóły żądania
- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/recipes`
- **Parametry**:
  - **Wymagane**: Brak.
  - **Opcjonalne**:
    - `page` (integer, domyślnie: 1): Numer strony do paginacji.
    - `pageSize` (integer, domyślnie: 10): Liczba elementów na stronie.
    - `sortBy` (string, dozwolone wartości: "name", "created_at"): Pole do sortowania.
    - `order` (string, dozwolone wartości: "asc", "desc", domyślnie: "desc"): Kierunek sortowania.
    - `tag` (string): Nazwa tagu do filtrowania przepisów.
- **Request Body**: Brak.

## 3. Wykorzystywane typy
- `PaginatedRecipesDto`: Główny typ odpowiedzi, zawierający tablicę przepisów i metadane paginacji.
- `RecipeListItemDto`: Typ reprezentujący pojedynczy przepis na liście, zawierający podstawowe informacje oraz listę powiązanych tagów.

Obydwa typy są zdefiniowane w `src/types.ts`.

## 4. Szczegóły odpowiedzi
- **Odpowiedź sukcesu (200 OK)**:
  ```json
  {
    "data": [
      {
        "id": "uuid-1",
        "name": "Recipe 1",
        "description": "...",
        "tags": ["tag1", "tag2"]
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalItems": 1,
      "totalPages": 1
    }
  }
  ```
- **Odpowiedzi błędów**:
  - `400 Bad Request`: Nieprawidłowe parametry zapytania.
  - `401 Unauthorized`: Użytkownik nie jest zalogowany.
  - `500 Internal Server Error`: Wewnętrzny błąd serwera.

## 5. Przepływ danych
1.  Żądanie `GET` trafia do endpointu `/api/recipes`.
2.  Middleware Astro weryfikuje sesję użytkownika. W przypadku braku sesji zwraca `401 Unauthorized`.
3.  Handler endpointu `GET` w `src/pages/api/recipes/index.ts` parsuje parametry zapytania z `Astro.url.searchParams`.
4.  Schemat walidacji Zod weryfikuje poprawność i typy parametrów, ustawiając wartości domyślne. W przypadku błędu zwraca `400 Bad Request`.
5.  Handler wywołuje funkcję serwisową (np. `getRecipesForUser`) z `src/lib/services/recipe.service.ts`, przekazując default UserId zamiast tego z locals.supabase.auth()
6.  Funkcja serwisowa buduje zapytanie do Supabase:
    -   Pobiera przepisy (`recipes`) z warunkiem `WHERE user_id = :userId`.
    -   Jeśli podano parametr `tag`, dodaje złączenie (JOIN) z `recipe_tags` i `tags` oraz warunek `WHERE tags.name = :tagName`.
    -   Dołącza listę tagów dla każdego przepisu.
    -   Używa `.order(sortBy, { ascending: order === 'asc' })` do sortowania.
    -   Używa `.range(from, to)` do paginacji.
    -   W osobnym zapytaniu zlicza całkowitą liczbę pasujących rekordów (`COUNT`) dla metadanych paginacji.
7.  Serwis mapuje wyniki z bazy danych na strukturę `PaginatedRecipesDto`.
8.  Hr

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Endpoint musi być chroniony przez middleware, które zapewnia, że tylko zalogowani użytkownicy mogą z niego korzystać.
- **Autoryzacja**: Kluczowe jest, aby wszystkie zapytania do bazy danych zawierały warunek `WHERE user_id = :userId`, gdzie `userId` jest pobierane z zaufanego źródła (sesji serwerowej, `context.locals.user.id`), aby zapobiec dostępowi do danych innych użytkowników.
- **Walidacja wejścia**: Wszystkie parametry zapytania muszą być rygorystycznie walidowane za pomocą Zod, aby uniknąć błędów i potencjalnych ataków. Szczególnie parametr `sortBy` musi być sprawdzany względem listy dozwolonych wartości, aby zapobiec sortowaniu po nieprzewidzianych kolumnach.

## 7. Rozważania dotyczące wydajności
- **Indeksowanie bazy danych**: Należy upewnić się, że kolumny `recipes.user_id` oraz `tags.name` są zaindeksowane, aby przyspieszyć operacje filtrowania. Klucze obce w tabeli `recipe_tags` również powinny być zaindeksowane.
- **Paginacja**: Implementacja paginacji jest kluczowa dla wydajności. Maksymalna wartość `pageSize` powinna być ograniczona (np. do 100), aby zapobiec żądaniom o zbyt dużą ilość danych.

## 8. Etapy wdrożenia
1.  **Definicja schematu walidacji**:
    -   W pliku `src/lib/schemas/recipe.schema.ts` dodać nowy eksportowany schemat Zod `getRecipesSchema` do walidacji parametrów `page`, `pageSize`, `sortBy`, `order`, `tag`.
2.  **Implementacja logiki serwisowej**:
    -   W pliku `src/lib/services/recipe.service.ts` stworzyć nową asynchroniczną funkcję `getRecipesForUser`.
    -   Funkcja powinna przyjmować jako argumenty klienta Supabase, ID użytkownika oraz obiekt z opcjami paginacji, sortowania i filtrowania.
    -   Zaimplementować logikę budowania i wykonywania zapytań do bazy Supabase.
    -   Zaimplementować logikę zliczania rekordów.
    -   Zmapować wyniki na `PaginatedRecipesDto` i zwrócić je.
3.  **Aktualizacja handlera API**:
    -   W pliku `src/pages/api/recipes/index.ts` zmodyfikować handler `GET`.
    -   Pobrać `user` i `supabase` z `context.locals`.
    -   Użyć `getRecipesSchema` do walidacji `Astro.url.searchParams`.
    -   Obsłużyć błędy walidacji, zwracając status `400`.
    -   Wywołać nową funkcję z serwisu `recipe.service.ts`.
    -   Zwrócić pomyślną odpowiedź (`200 OK`) lub obsłużyć błędy serwera (`500 Internal Server Error`) w bloku `try...catch`.
4.  **Weryfikacja typów**:
    -   Upewnić się, że typy `PaginatedRecipesDto` i `RecipeListItemDto` w `src/types.ts` są zgodne z wymaganiami endpointu i danymi zwracanymi przez serwis.
