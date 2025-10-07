1.
1.1
generation:
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
- output TEXT NOT NULL -- pełny output z AI (JSON lub tekst)
- created_at TIMESTAMPTZ DEFAULT NOW()
generation_error: 
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
- error_message TEXT NOT NULL
- created_at TIMESTAMPTZ DEFAULT NOW()
Dodaj pole generation_id UUID REFERENCES generation(id) w tabeli recipes (nullable), aby powiązać zapisany przepis z sesją generowania AI
2.
2.1
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE
- name VARCHAR(255) NOT NULL -- nazwa składnika
- value VARCHAR(50) -- wartość (np. "2", "1/2", "2-3")
- unit VARCHAR(50) -- jednostka (np. "kg", "sztuki", "łyżki")
- position INTEGER NOT NULL CHECK (position > 0)
- created_at TIMESTAMPTZ DEFAULT NOW()
- UNIQUE(recipe_id, position)
2.2
Tylko name powinno być NOT NULL. value i unit mogą być opcjonalne (np. "sól do smaku" - bez wartości i jednostki, tylko nazwa).

3.
3.1
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE
- description TEXT NOT NULL
- position INTEGER NOT NULL CHECK (position > 0)
- created_at TIMESTAMPTZ DEFAULT NOW()
- UNIQUE(recipe_id, position)

4. 
4.1
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- name VARCHAR(100) NOT NULL -- znormalizowana nazwa (lowercase, trimmed)
- created_at TIMESTAMPTZ DEFAULT NOW()
4.2
trigger w PostgreSQL, który automatycznie normalizuje pole name przed INSERT/UPDATE. To zapewni spójność danych niezależnie od źródła zapisu (aplikacja, migracje, bezpośredni SQL). Funkcja triggera:
CREATE OR REPLACE FUNCTION normalize_tag_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.name = LOWER(TRIM(NEW.name));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

5. 
5.1
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
- name VARCHAR(255) NOT NULL CHECK (LENGTH(TRIM(name)) > 0)
- description TEXT
- generation_id UUID REFERENCES generation(id) ON DELETE SET NULL
- created_at TIMESTAMPTZ DEFAULT NOW()
- updated_at TIMESTAMPTZ DEFAULT NOW()
5.2
Nie powinnismy przechowywac raw input w reipies

6. Kady user ma swoje tagi. Unikankność ma być w ramach tagów konkretnego usera
7.
7.1 updated_at ma być osobno dla kadych tabel stwórz te dedykowane triggery pod to
8. Zróbmy te podstawowe indexy
9. Nie validacja niech zostanie tylko w aplikacji przy urzyciu zoda
10. Kolejność pozycji ma zostać przekalkulowana z poziomu apikacji
pozycje krokow powinny zaczynać się od 1
11. wszystkie tabele powinny zaczynac sie od liczbyh pojedynczej
12. description powino byc null
recipes.generation_id powino byc null
13. pole output niech będzie typu - output JSONB NOT NULL
14. Migracje będą zarządzane przez supabase CLI