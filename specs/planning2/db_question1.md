1. Wystarczy encja Users obsługiwana przez supabase Auth.
2. Kazdy uzytkownik zarządza własnym zbiorem tagów.
3. Będziemy przechowywać pole position typu Integer.
4. Będziemy przechowywać pole JSONB .
5. Proszę o ustawienie ON DELETE CASCADE dla relacji recipes -> ingredients, recipes -> steps oraz recipes -> recipe_tags. Dla relacji auth.users -> recipes.
6. Tak, nazwa tagu powinna być unikalna i niewrażliwa na wielkość liter, aby uniknąć duplikatów takich jak "deser" i "Deser". Można to osiągnąć, tworząc unikalny indeks na LOWER(name).
7. Usuwanie tagów będzie odbywało się na backendzie w momencie usuwania przepisu i recipie_tags będzie wykonywane sprawdzenie czy ten tag nalezty gdzieś indziej.
8. Uzytkownicy mają mieć dostęp do swoich tagó. poniewarz w encji tag będzie pole user_id.

9. unikalność nazwy tagu powinna być egzekwowana na poziomie użytkownika. Rekomenduję stworzenie unikalnego indeksu na kombinacji kolumn (user_id, LOWER(name)) w tabeli tags.
10. Tak, zalecam dodanie kolumny id (typu UUID z gen_random_uuid() jako wartością domyślną) jako klucza głównego do tabel ingredients i steps. Ułatwi to jednoznaczną identyfikację i modyfikację poszczególnych rekordów z poziomu aplikacji (np. edycję konkretnego kroku).
11. Rekomenduję, aby tabela generation była dostępna dla użytkownika tylko do zapisu (INSERT) poprzez backend z użyciem service_role. Dostęp do odczytu (SELECT) powinien być domyślnie zablokowany dla użytkowników, co zapewni, że dane analityczne pozostaną wewnętrzne. Należy dodać kolumnę user_id, aby powiązać rekord z konkretnym użytkownikiem.
12. Tak, jest to bardzo dobra praktyka. Zalecam dodanie kolumny created_at (typu TIMESTAMPTZ) z wartością domyślną now() oraz kolumny updated_at (również TIMESTAMPTZ), której wartość byłaby automatycznie aktualizowana przy każdej zmianie rekordu za pomocą dedykowanej funkcji i triggera.
13. Tak, w celu zapewnienia dobrej wydajności od samego początku, zalecam utworzenie indeksów na wszystkich kolumnach będących kluczami obcymi, tj. recipes(user_id), ingredients(recipe_id), steps(recipe_id) oraz recipe_tags(recipe_id, tag_id).
14. Rekomenduję stworzenie funkcji triggera w PostgreSQL, która będzie uruchamiana po każdej operacji DELETE na tabeli recipe_tags. Funkcja ta sprawdzałaby, czy usunięty tag_id jest jeszcze powiązany z jakimkolwiek innym przepisem tego samego użytkownika. Jeśli nie, tag byłby usuwany z tabeli tags.
15. Encja recipies powinna zawierać dodatkowe pole description typu TEXT lecz niech będzie opcjonalne
