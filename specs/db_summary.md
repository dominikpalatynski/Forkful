# Podsumowanie planowania bazy danych - Forkful MVP

## Decyzje podjęte podczas planowania

### 1. Autentykacja i zarządzanie użytkownikami

- Wykorzystanie wbudowanej tabeli `auth.users` z Supabase
- Brak dodatkowej tabeli profili w MVP
- Brak ról użytkowników w MVP (wszyscy równe uprawnienia)

### 2. Nazewnictwo tabel

- Wszystkie tabele w liczbie pojedynczej (singular): `recipe`, `ingredient`, `step`, `tag`, `recipe_tag`, `generation`, `generation_error`
- Wszystkie klucze główne typu UUID z domyślną wartością `gen_random_uuid()`

### 3. Walidacja danych

- Walidacja długości pól wykonywana na poziomie aplikacji przy użyciu Zod
- Brak CHECK constraints w bazie danych dla długości tekstów (poza `position`)
- Jawne nazwy constraintów dla lepszej czytelności i debugowania

### 4. Typy danych

- Wszystkie ID: `UUID`
- Nazwy: `VARCHAR(255)` dla `recipe.name`, `VARCHAR(100)` dla `tag.name`, `VARCHAR(255)` dla `ingredient.name`
- Opisy: `TEXT` (nullable dla `recipe.description`, NOT NULL dla `step.description`)
- Składniki: `VARCHAR(50)` dla `value` i `unit` (opcjonalne)
- Output AI: `JSONB` bez narzuconej struktury
- Pozycje: `INTEGER NOT NULL CHECK (position > 0)`
- Timestampy: `TIMESTAMPTZ DEFAULT NOW()`

### 5. Zarządzanie timestampami

- Pola `created_at` dla wszystkich głównych tabel
- Pola `updated_at` dla tabel: `recipe`, `ingredient`, `step`, `tag`
- BRAK `created_at` w tabelach łączących (`recipe_tag`)
- Automatyczna aktualizacja `updated_at` przez triggery

### 6. Soft delete

- Nie implementowane w MVP
- Planowane w późniejszych fazach aplikacji

### 7. Kolejność elementów (position)

- Unikalna w ramach przepisu: `UNIQUE(recipe_id, position)`
- Constraint: `CHECK (position > 0)`
- Pozycje zaczynają się od 1
- Przeliczanie kolejności wykonywane na poziomie aplikacji
- Brak domyślnej wartości (wymusza explicit ustawienie)

### 8. System tagów

- **WAŻNE**: Każdy użytkownik ma swoje prywatne tagi
- Normalizacja: lowercase + trim (przez trigger PostgreSQL)
- Unikatowość: `UNIQUE(user_id, name)`
- Sprawdzanie unikalności również na poziomie aplikacji
- Tagi nie są usuwane kaskadowo przy usunięciu przepisu

### 9. Statystyki generowania AI

- Dwie oddzielne tabele: `generation` i `generation_error`
- `generation.output`: JSONB bez narzuconej struktury
- `generation_error.error_message`: TEXT z komunikatem błędu
- Relacja: `recipe.generation_id → generation.id` (nullable, ON DELETE SET NULL)
- BRAK relacji zwrotnej z generation do recipe

### 10. Kaskadowe usuwanie

- `auth.users → recipe`: ON DELETE CASCADE
- `recipe → ingredient`: ON DELETE CASCADE
- `recipe → step`: ON DELETE CASCADE
- `recipe → recipe_tag`: ON DELETE CASCADE
- `tag → recipe_tag`: ON DELETE CASCADE
- `generation → recipe`: ON DELETE SET NULL

### 11. Indeksowanie

- Podstawowe indeksy na foreign keys dla wydajności JOIN
- Index na `recipe.created_at DESC` dla sortowania chronologicznego
- Lista: `recipe(user_id)`, `ingredient(recipe_id)`, `step(recipe_id)`, `recipe_tag(recipe_id, tag_id)`, `tag(user_id)`, `generation(user_id)`, `generation_error(user_id)`, `recipe(created_at DESC)`

### 12. Full-text search

- Nie implementowane w MVP
- Proste wyszukiwanie ILIKE wystarczy na początek

### 13. RODO i compliance

- Nie priorytet w MVP
- Do rozważenia w późniejszych fazach

### 14. Zarządzanie migracjami

- Supabase CLI do zarządzania migracjami
- Versjonowanie w Git

---

## Dopasowane rekomendacje

### 1. Struktura tabel

#### ✅ ZAAKCEPTOWANE:

- UUID jako typ dla wszystkich kluczy głównych
- Timestampy (created_at, updated_at) dla głównych encji
- Normalizacja tagów przez trigger PostgreSQL
- Jawne nazwy constraintów
- Kaskadowe usuwanie dla powiązanych rekordów

#### ❌ ODRZUCONE:

- Dodatkowa tabela `profiles` dla rozszerzonych danych użytkownika
- CHECK constraints dla długości tekstów w bazie
- Soft delete w MVP
- Full-text search w MVP
- Przechowywanie raw input w tabeli recipe
- created_at w tabelach łączących

### 2. Bezpieczeństwo

#### ✅ ZAAKCEPTOWANE:

- Row Level Security (RLS) dla wszystkich tabel
- Użytkownik widzi tylko własne dane (WHERE user_id = auth.uid())
- Prywatne tagi dla każdego użytkownika
- Weryfikacja dostępu przez JOIN w politykach RLS

#### ⏸️ ODŁOŻONE:

- Role użytkowników (admin, user)
- Audit log dostępu do danych
- Szczegółowa implementacja RODO

### 3. Wydajność

#### ✅ ZAAKCEPTOWANE:

- Podstawowe indeksy na foreign keys
- Index na created_at dla sortowania
- JSONB zamiast TEXT dla output AI

#### ❌ ODRZUCONE:

- Partycjonowanie tabel
- Zaawansowane indeksy (GiST, GIN)

### 4. Triggery i automatyzacja

#### ✅ ZAAKCEPTOWANE:

- Trigger normalizacji nazw tagów (lowercase, trim)
- Trigger aktualizacji updated_at dla każdej tabeli osobno
- Trigger aktualizacji recipe.updated_at przy zmianach w ingredient/step

---

## Szczegółowe podsumowanie planowania bazy danych

### Architektura bazy danych

Schemat bazy danych dla MVP aplikacji Forkful składa się z 7 głównych tabel:

1. **generation** - przechowuje udane generacje AI
2. **generation_error** - przechowuje błędy generacji AI
3. **recipe** - główna tabela przepisów
4. **ingredient** - składniki przepisów
5. **step** - kroki przepisów
6. **tag** - tagi użytkowników (PRYWATNE)
7. **recipe_tag** - tabela łącząca przepisy z tagami

### Kluczowe encje i ich relacje

#### 1. generation

```sql
CREATE TABLE generation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  output JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Relacje**: Jeden do wielu z `recipe` (recipe.generation_id)

#### 2. generation_error

```sql
CREATE TABLE generation_error (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  error_message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Relacje**: Brak

#### 3. recipe

```sql
CREATE TABLE recipe (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  generation_id UUID REFERENCES generation(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Relacje**:

- Jeden do wielu z `ingredient`
- Jeden do wielu z `step`
- Wiele do wielu z `tag` (przez `recipe_tag`)
- Wiele do jeden z `generation` (opcjonalne)

#### 4. ingredient

```sql
CREATE TABLE ingredient (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipe(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  value VARCHAR(50),
  unit VARCHAR(50),
  position INTEGER NOT NULL CHECK (position > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_ingredient_position UNIQUE (recipe_id, position)
);
```

**Relacje**: Wiele do jeden z `recipe`

#### 5. step

```sql
CREATE TABLE step (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipe(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  position INTEGER NOT NULL CHECK (position > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_step_position UNIQUE (recipe_id, position)
);
```

**Relacje**: Wiele do jeden z `recipe`

#### 6. tag

```sql
CREATE TABLE tag (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_tag_user_name UNIQUE (user_id, name)
);
```

**Relacje**:

- Wiele do wielu z `recipe` (przez `recipe_tag`)
- Wiele do jeden z `auth.users`

**UWAGA**: Tagi są PRYWATNE dla każdego użytkownika!

#### 7. recipe_tag

```sql
CREATE TABLE recipe_tag (
  recipe_id UUID NOT NULL REFERENCES recipe(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tag(id) ON DELETE CASCADE,
  PRIMARY KEY (recipe_id, tag_id)
);
```

**Relacje**: Tabela łącząca między `recipe` i `tag`

### Funkcje i triggery

#### 1. Normalizacja nazw tagów

```sql
CREATE OR REPLACE FUNCTION normalize_tag_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.name = LOWER(TRIM(NEW.name));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER normalize_tag_before_insert_update
BEFORE INSERT OR UPDATE ON tag
FOR EACH ROW
EXECUTE FUNCTION normalize_tag_name();
```

#### 2. Automatyczna aktualizacja updated_at

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggery dla każdej tabeli:
CREATE TRIGGER update_recipe_updated_at
BEFORE UPDATE ON recipe
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ingredient_updated_at
BEFORE UPDATE ON ingredient
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_step_updated_at
BEFORE UPDATE ON step
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tag_updated_at
BEFORE UPDATE ON tag
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

#### 3. Kaskadowa aktualizacja recipe.updated_at

```sql
CREATE OR REPLACE FUNCTION update_recipe_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE recipe
  SET updated_at = NOW()
  WHERE id = COALESCE(NEW.recipe_id, OLD.recipe_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_recipe_on_ingredient_change
AFTER INSERT OR UPDATE OR DELETE ON ingredient
FOR EACH ROW
EXECUTE FUNCTION update_recipe_timestamp();

CREATE TRIGGER update_recipe_on_step_change
AFTER INSERT OR UPDATE OR DELETE ON step
FOR EACH ROW
EXECUTE FUNCTION update_recipe_timestamp();
```

### Indeksy

```sql
-- Foreign keys (wydajność JOIN)
CREATE INDEX idx_recipe_user_id ON recipe(user_id);
CREATE INDEX idx_ingredient_recipe_id ON ingredient(recipe_id);
CREATE INDEX idx_step_recipe_id ON step(recipe_id);
CREATE INDEX idx_recipe_tag_recipe_id ON recipe_tag(recipe_id);
CREATE INDEX idx_recipe_tag_tag_id ON recipe_tag(tag_id);
CREATE INDEX idx_tag_user_id ON tag(user_id);
CREATE INDEX idx_generation_user_id ON generation(user_id);
CREATE INDEX idx_generation_error_user_id ON generation_error(user_id);

-- Sortowanie
CREATE INDEX idx_recipe_created_at ON recipe(created_at DESC);
```

### Row Level Security (RLS)

Wszystkie tabele mają włączony RLS:

```sql
-- Enable RLS dla wszystkich tabel
ALTER TABLE recipe ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient ENABLE ROW LEVEL SECURITY;
ALTER TABLE step ENABLE ROW LEVEL SECURITY;
ALTER TABLE tag ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_tag ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_error ENABLE ROW LEVEL SECURITY;
```

#### Polityki RLS dla recipe

```sql
CREATE POLICY "Users can view own recipes" ON recipe
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own recipes" ON recipe
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own recipes" ON recipe
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own recipes" ON recipe
  FOR DELETE USING (user_id = auth.uid());
```

#### Polityki RLS dla ingredient

```sql
CREATE POLICY "Users can manage own recipe ingredients" ON ingredient
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM recipe
      WHERE recipe.id = ingredient.recipe_id
      AND recipe.user_id = auth.uid()
    )
  );
```

#### Polityki RLS dla step

```sql
CREATE POLICY "Users can manage own recipe steps" ON step
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM recipe
      WHERE recipe.id = step.recipe_id
      AND recipe.user_id = auth.uid()
    )
  );
```

#### Polityki RLS dla tag

```sql
CREATE POLICY "Users can view own tags" ON tag
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own tags" ON tag
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own tags" ON tag
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own tags" ON tag
  FOR DELETE USING (user_id = auth.uid());
```

#### Polityki RLS dla recipe_tag

```sql
CREATE POLICY "Users can manage own recipe tags" ON recipe_tag
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM recipe
      WHERE recipe.id = recipe_tag.recipe_id
      AND recipe.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM tag
      WHERE tag.id = recipe_tag.tag_id
      AND tag.user_id = auth.uid()
    )
  );
```

#### Polityki RLS dla generation

```sql
CREATE POLICY "Users can view own generations" ON generation
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own generations" ON generation
  FOR INSERT WITH CHECK (user_id = auth.uid());
```

#### Polityki RLS dla generation_error

```sql
CREATE POLICY "Users can view own generation errors" ON generation_error
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own generation errors" ON generation_error
  FOR INSERT WITH CHECK (user_id = auth.uid());
```

### Sekwencja tworzenia obiektów w migracji

1. Tabele bez foreign keys: `generation`, `generation_error`
2. Tabele główne: `recipe` (z FK do auth.users i generation)
3. Tabela tagów: `tag` (z FK do auth.users)
4. Tabele zależne: `ingredient`, `step` (z FK do recipe)
5. Tabela łącząca: `recipe_tag` (z FK do recipe i tag)
6. Funkcje: `normalize_tag_name()`, `update_updated_at_column()`, `update_recipe_timestamp()`
7. Triggery: normalizacja tagów, aktualizacja updated_at, kaskadowa aktualizacja recipe
8. Indeksy: wszystkie wymienione powyżej
9. RLS: włączenie i utworzenie polityk dla wszystkich tabel
