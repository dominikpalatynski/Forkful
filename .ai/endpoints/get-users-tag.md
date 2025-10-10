# API Endpoint Implementation Plan: Get all user's tags

## 1. Przegląd punktu końcowego

Ten punkt końcowy (`GET /api/tags`) jest odpowiedzialny za pobieranie listy wszystkich unikalnych tagów należących do aktualnie uwierzytelnionego użytkownika. Został zaprojektowany w celu obsługi mechanizmów autouzupełniania w interfejsie użytkownika, umożliwiając filtrowanie tagów na podstawie ciągu znaków.

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/tags`
- **Parametry**:
  - **Wymagane**: Brak.
  - **Opcjonalne**:
    - `q` (string): Parametr zapytania (query parameter) używany do filtrowania tagów. Zwrócone zostaną tylko te tagi, których nazwa zaczyna się od podanej wartości (wyszukiwanie bez uwzględniania wielkości liter).
- **Request Body**: Brak.

## 3. Wykorzystywane typy

### DTO (Data Transfer Object)

- **`TagDto`**: Obiekt reprezentujący pojedynczy tag w odpowiedzi API.
  ```typescript
  interface TagDto {
    id: string;
    name: string;
  }
  ```

### Walidacja

- **`GetTagsQuerySchema`**: Schemat `zod` do walidacji parametrów zapytania.

  ```typescript
  import { z } from "zod";

  export const GetTagsQuerySchema = z.object({
    q: z.string().optional(),
  });
  ```

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (`200 OK`)**:
  - **Content-Type**: `application/json`
  - **Body**: Tablica obiektów `TagDto`.
    ```json
    [
      { "id": "uuid-1", "name": "pasta" },
      { "id": "uuid-2", "name": "italian" }
    ]
    ```
- **Odpowiedzi błędów**:
  - **`401 Unauthorized`**: Zwracane, gdy użytkownik nie jest uwierzytelniony.

## 5. Przepływ danych

1.  Żądanie `GET` trafia do handlera API w `src/pages/api/tags/index.ts`.
2.  Middleware Astro weryfikuje sesję użytkownika i udostępnia dane w `context.locals.user`.
3.  Handler API sprawdza, czy `context.locals.user` istnieje. Jeśli nie, zwraca `401 Unauthorized`.
4.  Parametr `q` z URL jest odczytywany i walidowany przy użyciu `GetTagsQuerySchema`.
5.  Handler wywołuje funkcję `getTags` z nowo utworzonego serwisu `src/lib/services/tag.service.ts`.
6.  Serwis `tag.service.ts` buduje zapytanie do bazy danych Supabase:
    - Wybiera kolumny `id` i `name` z tabeli `tags`.
    - Filtruje rekordy, aby pasowały do `user_id` bieżącego użytkownika.
    - Jeśli parametr `q` jest obecny, dodaje warunek `ilike` do zapytania, aby filtrować nazwy tagów.
7.  Baza danych zwraca pasujące rekordy.
8.  Serwis zwraca dane do handlera API.
9.  Handler API formatuje odpowiedź jako JSON i wysyła ją do klienta ze statusem `200 OK`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Dostęp do endpointu jest bezwzględnie warunkowany posiadaniem aktywnej sesji użytkownika. Handler musi odrzucić każde żądanie bez danych uwierzytelniających.
- **Autoryzacja i Izolacja Danych**: Wszystkie zapytania do bazy danych muszą zawierać warunek `WHERE user_id = :current_user_id`, gdzie `current_user_id` pochodzi z zaufanego źródła (sesji), a nie z parametrów żądania. To zapobiega dostępowi do danych innych użytkowników.
- **Walidacja danych wejściowych**: Parametr `q` musi być walidowany, aby upewnić się, że jest to ciąg znaków, co zapobiega potencjalnym błędom.
- **Zapobieganie SQL Injection**: Użycie klienta Supabase i jego metod do budowania zapytań (np. `.eq()`, `.ilike()`) zapewnia parametryzację zapytań, co jest standardową obroną przed atakami SQL Injection.

## 7. Obsługa błędów

- **`401 Unauthorized`**: Brak aktywnej sesji użytkownika.
- **`500 Internal Server Error`**: Wystąpienie błędu podczas komunikacji z bazą danych lub innego nieprzewidzianego wyjątku po stronie serwera. Należy opakować logikę w bloku `try...catch`, aby obsłużyć takie przypadki i zapobiec wyciekowi szczegółów błędu do klienta.

## 8. Rozważania dotyczące wydajności

- **Indeksowanie bazy danych**: Aby zapewnić szybkie wykonywanie zapytań, należy upewnić się, że na kolumnach `user_id` i `name` w tabeli `tags` istnieją indeksy. Indeks złożony na `(user_id, name)` może być korzystny.
- **Paginacja**: Chociaż obecna specyfikacja tego nie wymaga, w przyszłości, jeśli liczba tagów na użytkownika znacząco wzrośnie, należy rozważyć wprowadzenie paginacji w celu ograniczenia rozmiaru odpowiedzi.

## 9. Etapy wdrożenia

1.  **Aktualizacja typów**:
    - W pliku `src/types.ts` zdefiniuj typ `Tag` odpowiadający strukturze w bazie danych oraz `TagDto` dla odpowiedzi API.

2.  **Stworzenie serwisu**:
    - Utwórz nowy plik `src/lib/services/tag.service.ts`.
    - Zaimplementuj w nim funkcję asynchroniczną `getTags(supabase: SupabaseClient, userId: string, query?: string)`.
    - Funkcja ta powinna konstruować i wykonywać zapytanie do Supabase, pobierając tagi dla danego użytkownika i opcjonalnie filtrując je po nazwie.
    - Funkcja powinna zwracać tablicę obiektów `Tag`.

3.  **Stworzenie walidacji**:
    - Utwórz nowy plik `src/lib/schemas/tag.schema.ts`.
    - Zdefiniuj i wyeksportuj w nim `GetTagsQuerySchema` używając `zod`.

4.  **Implementacja punktu końcowego API**:
    - Utwórz plik `src/pages/api/tags/index.ts`.
    - Zaimplementuj handler `GET` dla `APIContext`.
    - przezka defaultUserId
    - Sparsuj parametry zapytania z `Astro.url.searchParams` i zwaliduj je za pomocą `GetTagsQuerySchema.safeParse`.
    - Wywołaj `tagService.getTags`, przekazując klienta Supabase z `context.locals.supabase`, ID użytkownika oraz opcjonalny parametr `q`.
    - Obsłuż potencjalne błędy w bloku `try...catch`, zwracając status `500` w razie problemów.
    - Jeśli operacja się powiedzie, zwróć pobrane dane jako odpowiedź JSON ze statusem `200 OK`.
