# API Endpoint Implementation Plan: Create a new recipe

## 1. Przegląd punktu końcowego

Ten punkt końcowy (`POST /api/recipes`) umożliwia uwierzytelnionym użytkownikom tworzenie nowych przepisów. Jest to operacja transakcyjna, która zapisuje w bazie danych główny rekord przepisu, listę jego składników, kroki przygotowania oraz zarządza powiązaniami z tagami. W przypadku powodzenia, zwraca pełne dane nowo utworzonego przepisu.

## 2. Szczegóły żądania

- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/recipes`
- **Parametry**:
  - **Wymagane**: Brak parametrów w URL.
  - **Opcjonalne**: Brak parametrów w URL.
- **Request Body**: Ciało żądania musi być w formacie `application/json` i zawierać następujące pola:
  - `name` (string, wymagane): Nazwa przepisu.
  - `description` (string, opcjonalne): Krótki opis przepisu.
  - `generationId` (string, opcjonalne): UUID powiązane z sesją generowania AI.
  - `ingredients` (array, opcjonalne): Lista obiektów składników. Każdy obiekt musi zawierać:
    - `content` (string, wymagane): Tekst składnika.
    - `position` (integer, wymagane): Kolejność na liście.
  - `steps` (array, opcjonalne): Lista obiektów kroków. Każdy obiekt musi zawierać:
    - `content` (string, wymagane): Opis kroku.
    - `position` (integer, wymagane): Kolejność na liście.
  - `tags` (array, opcjonalne): Lista stringów zawierających nazwy tagów.

## 3. Wykorzystywane typy

- **Request Command Model**: `CreateRecipeCommand` z `src/types.ts`.
- **Response Data Transfer Object (DTO)**: `RecipeDetailDto` z `src/types.ts`.

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu**:
  - **Kod stanu**: `201 Created`
  - **Ciało odpowiedzi**: Obiekt JSON reprezentujący nowo utworzony przepis, zgodny z typem `RecipeDetailDto`.
    ```json
    {
      "id": "uuid-goes-here",
      "name": "Spaghetti Carbonara",
      "description": "A classic Italian pasta dish.",
      "ingredients": [
        { "id": "uuid", "content": "200g spaghetti", "position": 1 },
        { "id": "uuid", "content": "100g pancetta", "position": 2 }
      ],
      "steps": [
        { "id": "uuid", "content": "Boil the pasta.", "position": 1 },
        { "id": "uuid", "content": "Fry the pancetta.", "position": 2 }
      ],
      "tags": ["pasta", "italian", "quick"]
    }
    ```
- **Odpowiedzi błędów**:
  - `400 Bad Request`: Błąd walidacji danych wejściowych.
  - `401 Unauthorized`: Użytkownik nie jest zalogowany.
  - `500 Internal Server Error`: Wewnętrzny błąd serwera, np. błąd transakcji bazy danych.

## 5. Przepływ danych

1.  Endpoint Astro (`src/pages/api/recipes/index.ts`) odbiera żądanie `POST`.
2.  Middleware lub kod w handlerze endpointa weryfikuje sesję użytkownika na podstawie `Astro.locals.user`. Jeśli użytkownik nie jest zalogowany, zwraca błąd `401`.
3.  Ciało żądania jest walidowane przy użyciu schemy `zod` opartej na `CreateRecipeCommand`. W przypadku błędu walidacji zwracany jest błąd `400`.
4.  Wywoływana jest metoda `createRecipe` z `RecipeService`, przekazując zwalidowane dane oraz `user_id` zalogowanego użytkownika.
5.  `RecipeService` rozpoczyna transakcję w bazie danych Supabase.
6.  **W ramach transakcji**:
    a. Do tabeli `recipes` wstawiany jest nowy rekord z danymi przepisu i `user_id`.
    b. Pobierane jest `id` nowo utworzonego przepisu.
    c. Rekordy składników z `ingredients` są wstawiane do tabeli `ingredients`, każdy z `recipe_id`.
    d. Rekordy kroków z `steps` są wstawiane do tabeli `steps`, każdy z `recipe_id`.
    e. Dla każdej nazwy taga z tablicy `tags`:
    i. System sprawdza, czy tag o tej nazwie już istnieje dla danego `user_id`.
    ii. Jeśli tag nie istnieje, jest tworzony w tabeli `tags` z `user_id`.
    iii. `tag_id` (istniejącego lub nowo utworzonego) jest pobierane.
    iv. Tworzone jest powiązanie w tabeli `recipe_tags` między `recipe_id` a `tag_id`.
    f. Jeśli w żądaniu podano `generationId`, w tabeli `generation` aktualizowany jest odpowiedni rekord, ustawiając pole `is_accepted` na `true`.
7.  Jeśli wszystkie operacje w ramach transakcji zakończą się sukcesem, transakcja jest zatwierdzana (commit). W przeciwnym razie jest wycofywana (rollback).
8.  Po pomyślnym zatwierdzeniu transakcji, `RecipeService` odpytuje bazę danych, aby pobrać pełne dane nowo utworzonego przepisu (wraz ze składnikami, krokami i tagami).
9.  Serwis zwraca obiekt DTO (`RecipeDetailDto`) do handlera endpointa.
10. Handler endpointa zwraca odpowiedź `201 Created` z DTO przepisu w ciele.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Endpoint musi być chroniony i dostępny wyłącznie dla zalogowanych użytkowników. Należy rygorystycznie sprawdzać obecność i ważność sesji użytkownika (`Astro.locals.user`).
- **Autoryzacja**: Wszystkie operacje zapisu (`recipes`, `ingredients`, `steps`, `tags`) muszą być powiązane z `user_id` aktualnie zalogowanego użytkownika, aby zapobiec modyfikacji danych innych użytkowników.
- **Walidacja danych**: Wszystkie dane wejściowe muszą być walidowane za pomocą `zod`, aby zapobiec atakom typu Mass Assignment oraz zapewnić integralność danych.
- **Zarządzanie zależnościami**: Użycie Supabase Client SDK zapewnia ochronę przed atakami SQL Injection.

## 7. Rozważania dotyczące wydajności

- **Transakcje bazodanowe**: Wszystkie operacje zapisu (przepis, składniki, kroki, tagi) muszą być wykonane w ramach jednej transakcji atomowej. Zapewnia to spójność danych i jest bardziej wydajne niż wykonywanie wielu oddzielnych zapytań.
- **Operacje na tagach**: Logika obsługi tagów powinna być zoptymalizowana. Zamiast pojedynczych zapytań dla każdego taga, należy użyć jednego zapytania `SELECT`, aby sprawdzić, które tagi już istnieją, a następnie jednego zapytania `INSERT` dla nowych tagów.

## 8. Etapy wdrożenia

1.  **Stworzenie schemy walidacji**: W nowym pliku `src/lib/schemas/recipe.schema.ts` zdefiniować schemę `zod` o nazwie `CreateRecipeSchema` do walidacji ciała żądania `POST /api/recipes`.
2.  **Stworzenie serwisu**: Utworzyć plik `src/lib/services/recipe.service.ts`.
3.  **Implementacja metody `createRecipe`**: W `RecipeService` zaimplementować publiczną metodę asynchroniczną `createRecipe(data: CreateRecipeCommand, userId: string)`.
    - Wewnątrz metody użyć `supabase.rpc()` do wywołania funkcji PostgreSQL, która obsłuży całą logikę transakcyjną, lub użyć `supabase.transact()` jeśli dostępne w bibliotece klienckiej, albo ręcznie zarządzać transakcją.
    - Logika transakcyjna powinna obejmować kroki opisane w sekcji "Przepływ danych".
    - Metoda powinna zwracać obiekt `RecipeDetailDto` lub `null` w przypadku błędu.
4.  **Stworzenie pliku endpointa**: Utworzyć plik `src/pages/api/recipes/index.ts`.
5.  **Implementacja handlera `POST`**:
    - Zdefiniować `export const prerender = false;`.
    - W funkcji `POST({ request, locals })` pobrać sesję użytkownika z `locals`. Zwrócić `401`, jeśli brak użytkownika.
    - Pobrać ciało żądania i zwalidować je przy użyciu `CreateRecipeSchema`. Zwrócić `400` w przypadku błędu.
    - Wywołać `recipeService.createRecipe()` z poprawnymi danymi.
    - Obsłużyć wynik: jeśli `null`, zwrócić `500`. Jeśli obiekt przepisu, zwrócić `201` z tym obiektem.
    - Dodać blok `try...catch` do obsługi nieoczekiwanych błędów i zwracania `500`.
