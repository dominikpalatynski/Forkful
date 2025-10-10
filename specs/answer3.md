1.

- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
- name VARCHAR(100) NOT NULL -- znormalizowana nazwa (lowercase, trimmed)
- created_at TIMESTAMPTZ DEFAULT NOW()
- UNIQUE(user_id, name) -- unikatowość w ramach użytkownika

Sprawdzenie unikalnosci będzie robione z poziomu aplikacjii 2.
-- SELECT: użytkownik widzi tylko swoje tagi
CREATE POLICY "Users can view own tags" ON tag
FOR SELECT USING (user_id = auth.uid());

-- INSERT: użytkownik może tworzyć swoje tagi
CREATE POLICY "Users can create own tags" ON tag
FOR INSERT WITH CHECK (user_id = auth.uid());

-- UPDATE: użytkownik może edytować swoje tagi
CREATE POLICY "Users can update own tags" ON tag
FOR UPDATE USING (user_id = auth.uid());

-- DELETE: użytkownik może usuwać swoje tagi
CREATE POLICY "Users can delete own tags" ON tag
FOR DELETE USING (user_id = auth.uid());

3.  CREATE POLICY "Users can manage own recipe tags" ON recipe_tag
    FOR ALL USING (
    EXISTS (
    SELECT 1 FROM recipe WHERE recipe.id = recipe_tag.recipe_id
    AND recipe.user_id = auth.uid()
    )
    AND EXISTS (
    SELECT 1 FROM tag WHERE tag.id = recipe_tag.tag_id
    AND tag.user_id = auth.uid()
    )
    );

4.  Dla wszystkich tabel, które mają pole updated_at. Należy utworzyć:
    Uniwersalną funkcję: update_updated_at_column()
    Triggery dla każdej tabeli osobno:
    recipe → update_recipe_updated_at
    ingredient → update_ingredient_updated_at
    step → update_step_updated_at
    tag → update_tag_updated_at
    recipe_tag → update_recipe_tag_updated_at

tabele z polami updated_at : recipe ingredient step tag

5. alecam dodatkowe triggery, które po INSERT/UPDATE/DELETE na ingredient lub step zaktualizują recipe.updated_at:
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
EXECUTE FUNCTION update_recipe_timestamp(); 6. CREATE INDEX idx_recipe_user_id ON recipe(user_id);
CREATE INDEX idx_ingredient_recipe_id ON ingredient(recipe_id);
CREATE INDEX idx_step_recipe_id ON step(recipe_id);
CREATE INDEX idx_recipe_tag_recipe_id ON recipe_tag(recipe_id);
CREATE INDEX idx_recipe_tag_tag_id ON recipe_tag(tag_id);
CREATE INDEX idx_tag_user_id ON tag(user_id);
CREATE INDEX idx_generation_user_id ON generation(user_id);
CREATE INDEX idx_generation_error_user_id ON generation_error(user_id);

-- Dla sortowania (opcjonalnie)
CREATE INDEX idx_recipe_created_at ON recipe(created_at DESC); 7. Tylko recipe.generation_id → generation.id. Relacja zwrotna nie jest potrzebna

8. ON DELETE SET NULL

9. Jawne nazwy ułatwiają debugowanie i są bardziej czytelne:
   CONSTRAINT pk_recipe PRIMARY KEY (id)
   CONSTRAINT fk_recipe_user FOREIGN KEY (user_id) REFERENCES auth.users(id)
   CONSTRAINT chk_recipe_name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
   CONSTRAINT uq_ingredient_position UNIQUE (recipe_id, position)

10. Position powinno być zawsze ustawiane explicite przez aplikację. Brak wartości domyślnej wymusi, że aplikacja zawsze poda position, co zapobiegnie błędom.

11. ta struktura json nie powinna miec narzuconej struktury

12. CREATE POLICY "Users can view own generations" ON generation
    FOR SELECT USING (user_id = auth.uid());
    CREATE POLICY "Users can create own generations" ON generation
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- generation_error
CREATE POLICY "Users can view own generation errors" ON generation_error
FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own generation errors" ON generation_error
FOR INSERT WITH CHECK (user_id = auth.uid());

13. nie dodawqj created at w tabelch łączących

14.
15. generation (bez foreign keys)
16. generation_error (bez foreign keys)
17. recipe (z FK do auth.users i generation)
18. tag (z FK do auth.users)
19. ingredient (z FK do recipe)
20. step (z FK do recipe)
21. recipe_tag (z FK do recipe i tag)
22. Funkcje (normalize_tag_name, update_updated_at_column, update_recipe_timestamp)
23. Triggery
24. Indeksy
25. Polityki RLS
