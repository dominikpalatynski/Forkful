<conversation_summary>
<decisions>
1.  Zarządzanie użytkownikami będzie w całości obsługiwane przez wbudowany system `Supabase Auth`, bez dodatkowej tabeli `profiles` na etapie MVP.
2.  Każdy użytkownik będzie zarządzał własnym, odizolowanym zbiorem tagów. Tagi nie będą globalne.
3.  Kolejność składników i kroków w przepisie będzie zarządzana za pomocą dedykowanej kolumny `position` typu `INTEGER`.
4.  Dane wyjściowe z modelu AI w tabeli analitycznej `generation` będą przechowywane w formacie `JSONB`.
5.  Dla kluczowych relacji zostaną ustawione kaskadowe operacje usuwania (`ON DELETE CASCADE`), w tym dla `recipes -> ingredients`, `recipes -> steps`, `recipes -> recipe_tags` oraz `auth.users -> recipes`.
6.  Nazwy tagów będą unikalne w obrębie jednego użytkownika, bez uwzględniania wielkości liter (case-insensitive).
7.  Logika usuwania osieroconych tagów (nieprzypisanych do żadnego przepisu) będzie zaimplementowana po stronie bazy danych za pomocą triggera.
8.  Tabela `recipes` zostanie rozszerzona o opcjonalne pole `description` typu `TEXT`.
9.  Wszystkie kluczowe tabele będą posiadały kolumny `created_at` i `updated_at` do śledzenia zmian.
10. Tabela analityczna `generation` będzie dostępna do zapisu tylko z poziomu backendu (`service_role`), bez możliwości odczytu dla użytkowników.
</decisions>

<matched_recommendations>
1.  Stworzenie unikalnego, złożonego indeksu na kolumnach `(user_id, LOWER(name))` w tabeli `tags` w celu zapewnienia unikalności tagów per użytkownik.
2.  Dodanie unikalnych identyfikatorów `id` (typu `UUID`) jako kluczy głównych do tabel `ingredients` i `steps` w celu ułatwienia operacji na pojedynczych rekordach.
3.  Zabezpieczenie tabeli `generation` poprzez ograniczenie dostępu (RLS) - zapis tylko przez `service_role` i zablokowanie odczytu dla użytkowników.
4.  Implementacja kolumn `created_at` (z domyślną wartością `now()`) i `updated_at` (z automatycznym triggerem aktualizującym) we wszystkich kluczowych tabelach.
5.  Utworzenie indeksów na wszystkich kolumnach będących kluczami obcymi w celu optymalizacji wydajności zapytań.
6.  Zaimplementowanie funkcji i triggera w PostgreSQL do automatycznego usuwania osieroconych tagów po usunięciu powiązania w tabeli `recipe_tags`.
7.  Dodanie opcjonalnego pola `description` do tabeli `recipes`, co ułatwi przyszły rozwój aplikacji.
8.  Użycie typu `TEXT` dla pól tekstowych, co upraszcza schemat bez negatywnego wpływu na wydajność w PostgreSQL.
</matched_recommendations>

<database_planning_summary>
Na podstawie analizy wymagań produktu (PRD) oraz przeprowadzonych dyskusji, schemat bazy danych PostgreSQL dla MVP aplikacji Forkful zostanie zaprojektowany w oparciu o następujące założenia:

**Kluczowe Encje i Schemat:**

1.  **`users`**: Zarządzanie użytkownikami realizowane przez `auth.users` w Supabase. Każdy użytkownik jest jednoznacznie identyfikowany przez `id` (UUID).

2.  **`recipes`**: Główna tabela przechowująca przepisy.
    *   `id` (PK, UUID)
    *   `user_id` (FK do `auth.users.id`, non-nullable)
    *   `name` (TEXT, non-nullable)
    *   `description` (TEXT, nullable)
    *   `created_at`, `updated_at` (TIMESTAMPTZ)

3.  **`ingredients`**: Składniki przypisane do konkretnego przepisu.
    *   `id` (PK, UUID)
    *   `recipe_id` (FK do `recipes.id`, non-nullable, ON DELETE CASCADE)
    *   `content` (TEXT, non-nullable)
    *   `position` (INTEGER, non-nullable)

4.  **`steps`**: Kroki przygotowania przepisu.
    *   `id` (PK, UUID)
    *   `recipe_id` (FK do `recipes.id`, non-nullable, ON DELETE CASCADE)
    *   `content` (TEXT, non-nullable)
    *   `position` (INTEGER, non-nullable)

5.  **`tags`**: Tagi tworzone przez użytkowników.
    *   `id` (PK, UUID)
    *   `user_id` (FK do `auth.users.id`, non-nullable)
    *   `name` (TEXT, non-nullable)
    *   `created_at`, `updated_at` (TIMESTAMPTZ)
    *   **Ograniczenie**: Unikalny indeks na `(user_id, LOWER(name))`.

6.  **`recipe_tags`**: Tabela łącząca dla relacji wiele-do-wielu między przepisami a tagami.
    *   `recipe_id` (PK, FK do `recipes.id`, ON DELETE CASCADE)
    *   `tag_id` (PK, FK do `tags.id`, ON DELETE CASCADE)

7.  **`generation`**: Tabela analityczna do śledzenia jakości generacji AI.
    *   `id` (PK, UUID)
    *   `user_id` (FK do `auth.users.id`)
    *   `input_text` (TEXT, non-nullable)
    *   `generated_output` (JSONB, non-nullable)
    *   `is_accepted` (BOOLEAN, default `false`)
    *   `created_at` (TIMESTAMPTZ)

8.  **`generation`**: Tabela analityczna do śledzenia błędów generacji przez AI.
    *   `id` (PK, UUID)
    *   `user_id` (FK do `auth.users.id`)
    *   `input_text` (TEXT, non-nullable)
    *   `error_message` (TEXT, non-nullable)
    *   `created_at` (TIMESTAMPTZ)

**Relacje i Integralność Danych:**

*   Użytkownik może mieć wiele przepisów i wiele tagów.
*   Przepis może mieć wiele składników, wiele kroków i wiele tagów.
*   Usuwanie użytkownika spowoduje kaskadowe usunięcie wszystkich jego przepisów i powiązanych danych.
*   Usuwanie przepisu spowoduje kaskadowe usunięcie jego składników, kroków oraz powiązań z tagami.
*   Specjalny trigger bazodanowy będzie dbał o usuwanie tagów, które po usunięciu ostatniego powiązania z przepisem stałyby się osierocone.

**Bezpieczeństwo i Skalowalność:**

*   **Row-Level Security (RLS)**: Wszystkie tabele (`recipes`, `ingredients`, `steps`, `tags`, `recipe_tags`) będą miały włączone RLS. Polityki bezpieczeństwa zapewnią, że użytkownicy mogą wykonywać operacje (SELECT, INSERT, UPDATE, DELETE) wyłącznie na własnych danych, w oparciu o `auth.uid()`.
*   **Dostęp do Tabeli `generation`**: Dostęp do tej tabeli będzie ściśle ograniczony. Użytkownicy nie będą mieli do niej dostępu `SELECT`. Operacje `INSERT` będą wykonywane wyłącznie po stronie serwera z użyciem klucza `service_role`.
*   **Indeksowanie**: W celu zapewnienia optymalnej wydajności, zostaną utworzone indeksy na wszystkich kolumnach pełniących rolę kluczy obcych.

</database_planning_summary>

<unresolved_issues>
Na obecnym etapie planowania schematu bazy danych dla MVP wszystkie kluczowe kwestie zostały omówione i rozwiązane. Nie zidentyfikowano żadnych nierozwiązanych problemów, które wymagałyby dalszych wyjaśnień przed rozpoczęciem implementacji.
</unresolved_issues>
</conversation_summary>
