# API Endpoint Implementation Plan: Delete a Recipe

## 1. Przegląd punktu końcowego

Ten punkt końcowy umożliwia uwierzytelnionym użytkownikom usunięcie jednego z ich przepisów. Operacja ta permanentnie usuwa przepis oraz wszystkie powiązane z nim dane, w tym składniki, kroki i powiązania z tagami, dzięki kaskadowym regułom usuwania w bazie danych.

## 2. Szczegóły żądania

- **Metoda HTTP**: `DELETE`
- **Struktura URL**: `/api/recipes/{id}`
- **Parametry**:
  - **Wymagane**:
    - `id` (w ścieżce): Unikalny identyfikator (UUID) przepisu do usunięcia.
  - **Opcjonalne**: Brak.
- **Request Body**: Brak.

## 3. Wykorzystywane typy

Dla tego punktu końcowego nie są wymagane żadne dedykowane modele DTO ani Command, ponieważ żądanie i odpowiedź nie zawierają ciała (body).

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu**:
  - **Kod**: `204 No Content`
  - **Body**: Brak.
- **Odpowiedzi błędu**:
  - **Kod**: `400 Bad Request` - Jeśli `id` w URL nie jest prawidłowym UUID.
  - **Kod**: `401 Unauthorized` - Jeśli użytkownik nie jest zalogowany.
  - **Kod**: `403 Forbidden` - Jeśli użytkownik próbuje usunąć przepis, którego nie jest właścicielem.
  - **Kod**: `404 Not Found` - Jeśli przepis o podanym `id` nie istnieje.
  - **Kod**: `500 Internal Server Error` - W przypadku wewnętrznego błędu serwera.

## 5. Przepływ danych

1.  Klient wysyła żądanie `DELETE` na adres `/api/recipes/{id}`.
2.  Middleware Astro (`src/middleware/index.ts`) przechwytuje żądanie i weryfikuje sesję użytkownika, dołączając dane użytkownika do `context.locals`.
3.  Handler `DELETE` w pliku `src/pages/api/recipes/[id].ts` jest wywoływany.
4.  Handler pobiera `id` z `context.params` i waliduje jego format (musi być UUID) przy użyciu schemy Zod.
5.  Handler wywołuje metodę `deleteRecipe(id, user.id)` z serwisu `RecipeService` (`src/lib/services/recipe.service.ts`).
6.  `RecipeService` najpierw wyszukuje przepis w bazie danych po `id`.
7.  Jeśli przepis nie zostanie znaleziony, serwis zgłasza błąd "Not Found".
8.  Jeśli przepis zostanie znaleziony, serwis porównuje `recipe.user_id` z `user.id` przekazanym do metody.
9.  Jeśli ID użytkowników się nie zgadzają, serwis zgłasza błąd "Forbidden".
10. Jeśli wszystko się zgadza, serwis wykonuje polecenie usunięcia przepisu z bazy danych.
11. Baza danych PostgreSQL, dzięki zdefiniowanym kluczom obcym z `ON DELETE CASCADE`, automatycznie usuwa wszystkie powiązane rekordy z tabel `ingredients`, `steps` oraz `recipe_tags`.
12. Po pomyślnym usunięciu, handler API zwraca odpowiedź `204 No Content`. W przypadku błędu, zwracany jest odpowiedni kod statusu HTTP.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Dostęp do endpointu jest chroniony przez middleware, który weryfikuje obecność i ważność tokenu sesji użytkownika. Żądania bez ważnej sesji zostaną odrzucone z kodem `401 Unauthorized`.
- **Autoryzacja**: Logika autoryzacji zostanie zaimplementowana w `RecipeService`. Przed usunięciem przepisu, serwis musi bezwzględnie sprawdzić, czy `user_id` zalogowanego użytkownika jest identyczny z `user_id` zapisanym w rekordzie przepisu.
- **Walidacja danych wejściowych**: Parametr `id` będzie walidowany za pomocą Zod, aby upewnić się, że jest to poprawny format UUID, co zapobiega błędom w zapytaniach do bazy danych i potencjalnym atakom.

## 7. Rozważania dotyczące wydajności

- Operacja usuwania jest wyzwalana przez klucz główny (`id`), co jest bardzo wydajne dzięki indeksowaniu.
- Użycie `ON DELETE CASCADE` przenosi logikę usuwania powiązanych danych na poziom bazy danych, co jest generalnie szybsze niż wykonywanie wielu oddzielnych zapytań `DELETE` z poziomu aplikacji.
- Należy upewnić się, że kolumny `recipes.id` oraz `recipes.user_id` są poprawnie zindeksowane.

## 8. Etapy wdrożenia

1.  **Aktualizacja schemy walidacji**: W pliku `src/lib/schemas/recipe.schema.ts` dodać lub zaktualizować schemę Zod do walidacji parametrów żądania, w szczególności `id` jako UUID.
2.  **Implementacja logiki w serwisie**:
    - W pliku `src/lib/services/recipe.service.ts` utworzyć nową, asynchroniczną metodę `deleteRecipe`.
    - Metoda powinna przyjmować `recipeId: string` i `userId: string` jako argumenty.
    - Wewnątrz metody:
      - Pobrać przepis z bazy danych używając `recipeId`.
      - Jeśli przepis nie istnieje, rzucić błąd (np. `new Error("Recipe not found")`).
      - Sprawdzić, czy `recipe.user_id` jest równe `userId`. Jeśli nie, rzucić błąd (np. `new Error("Forbidden")`).
      - Wykonać operację `delete()` na tabeli `recipes` dla danego `recipeId`.
      - Obsłużyć potencjalne błędy z bazy danych.
3.  **Implementacja handlera API**:
    - W pliku `src/pages/api/recipes/[id].ts` dodać `export` dla metody `DELETE`.
    - Wewnątrz handlera `DELETE(context: APIContext)`:
      - przekazać do service defaultUserId
      - Zwalidować `context.params.id` przy użyciu przygotowanej schemy Zod. W przypadku błędu walidacji, zwrócić `400`.
      - Wywołać `recipeService.deleteRecipe(id, user.id)` w bloku `try...catch`.
      - W bloku `catch` sprawdzać typ błędu rzuconego przez serwis i zwracać odpowiednie kody statusu (`404` dla "Not Found", `403` dla "Forbidden", `500` dla pozostałych).
      - Jeśli operacja w serwisie się powiedzie, zwrócić odpowiedź z kodem `204 No Content`.
