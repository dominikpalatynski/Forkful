1. Wykorzystajmy tylko tabelę wbudowaną auth.user
   2.Niech opis będzie typu TEXT, validacja długosći będzie się odbywać na poziomie aplikacji przy uzyciu zoda,
   Stwórz teze takie pola created_at TIMESTAMPTZ DEFAULT NOW() - data utworzenia
   updated_at TIMESTAMPTZ DEFAULT NOW() - data ostatniej modyfikacji
   user_id UUID REFERENCES auth.users(id) - właściciel przepisu
   Soft deletem zajmiemy się w póxniejszesz fazie aplikacji
2. Zastosuj we wszystkich polach składników Varchar oraz dodaje nowe pole tpu integer
   zięki któremy będziemy mogli ustawiać kolejność składników
3. pole position powinno być unikalne w ramach jednego przepisu, dodaj zabezpieczenie ze wartosc musi byc wieksza od zera CHECK (position > 0), zastosuj pole typi TEXT w opisie kroku z ewenetualną walidacją na poziomie aplikacji
4. Konwersję na małe litery przed zapisem, Trimowanie białych znaków. Wprowadzenie tabeli łączącej pomiędzy recipie a tags: recipe_tags z polami:
   recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE
   tag_id UUID REFERENCES tags(id) ON DELETE CASCADE
   created_at TIMESTAMPTZ DEFAULT NOW()
   Primary key: (recipe_id, tag_id)
5. Statystyki powinny być przechowywany w dwóch tabelach generation lub generation_error z polem user_id i w przypadku generation_error niech to będzie error message a w przypadko generation output z generowania.
6. Użytkownik może SELECT/INSERT/UPDATE/DELETE tylko własne przepisy (WHERE user_id = auth.uid())`
   ingredients: Użytkownik może operować na składnikach tylko własnych przepisów (przez JOIN z recipes)
   steps: Analogicznie jak ingredients
   tags: Użytkownik widzi tylko własne zdarzenia (WHERE user_id = auth.uid())
   ai_generation_events: Użytkownik widzi tylko własne zdarzenia (WHERE user_id = auth.uid())

- W Mvp nie będzie funkcjonalności ról uzytkowników

8. Na ten moment nie potrzeba tworzyć indexów w MVP
9. - ogranic długość nazwy przez VARCHAR(255) NOT NULL
   - wszystkie id niech są typu UUID
10. Na ten moment nie interesuje nas ten tamt
11. - recipes → ingredients: ON DELETE CASCADE (usunięcie przepisu usuwa składniki)
      recipes → steps: ON DELETE CASCADE (usunięcie przepisu usuwa kroki)
      recipes → recipe_tags: ON DELETE CASCADE (usunięcie przepisu usuwa powiązania)
      tags → recipe_tags: ON DELETE CASCADE (usunięcie tagu usuwa powiązania)
      auth.users → recipes: ON DELETE CASCADE (usunięcie użytkownika usuwa przepisy)
    - Nie usuwamy tagów przy usunięciu przepisu, tagi to jest opcjonalna część prepisu,
12. Na ten moment nie interesuje nas polityka rodo
13. - Stwórz trigger tylko do tych czynności: rigger updated_at dla automatycznej aktualizacji timestamp przy UPDATE
    - Nie będziemy uzywac funkcjonalnosci full-text search, w mvp jest nam to nie potrzebne
14. Pola w przpisie na ten moment są wystraczające, nie chcemy ich wzbogadzać o dodatkowe pola
