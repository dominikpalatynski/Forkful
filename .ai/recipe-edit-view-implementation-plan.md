# Plan implementacji widoku Edycji Przepisu

## 1. Przegląd

Widok edycji przepisu umożliwia zalogowanym użytkownikom aktualizację istniejących przepisów. Użytkownik może modyfikować nazwę, opis, składniki, kroki przygotowania oraz tagi. Widok oferuje pełne zarządzanie listami składników i kroków, w tym dodawanie, edycję i usuwanie elementów. System zapewnia walidację w czasie rzeczywistym, powiadomienia o sukcesie/błędzie oraz zabezpieczenia na poziomie API (użytkownik może edytować tylko własne przepisy).

## 2. Routing widoku

**Ścieżka**: `/recipes/[id]/edit`

**Implementacja**: Astro dynamic route w pliku `src/pages/recipes/[id]/edit.astro`

**Punkt wejścia**: Przycisk "Edytuj" w widoku szczegółowym przepisu (`/recipes/[id]`)

**Przekierowania**:

- Po zapisaniu: `/recipes/[id]` (widok szczegółowy)
- Po anulowaniu: `/recipes/[id]` (widok szczegółowy)
- Po błędzie 403/404: `/recipes` (lista przepisów)

## 3. Struktura komponentów

```
RecipeEditPage (Astro)
└── RecipeEditFormContainer (React - client:load)
    └── RecipeEditForm (React)
        ├── RecipeBasicInfoSection (React)
        │   ├── Label + Input (nazwa)
        │   └── Label + Textarea (opis)
        ├── EditableIngredientsList (React)
        │   ├── SectionHeader
        │   └── EditableListItem[] (React)
        │       ├── Input (treść składnika)
        │       └── Button (usuń)
        ├── EditableStepsList (React)
        │   ├── SectionHeader
        │   └── EditableListItem[] (React)
        │       ├── Textarea (treść kroku)
        │       └── Button (usuń)
        ├── TagInput (React)
        │   ├── Combobox (z autocomplete)
        │   └── TagPill[] (wybrane tagi)
        └── FormActionButtons (React)
            ├── Button (Anuluj - variant: outline)
            └── Button (Zapisz - variant: default)
```

**Lokalizacja plików komponentów**:

- `src/pages/recipes/[id]/edit.astro` - strona Astro
- `src/components/recipes/form/RecipeEditFormContainer.tsx` - kontener z React Query
- `src/components/recipes/form/RecipeEditForm.tsx` - główny formularz
- `src/components/recipes/form/RecipeBasicInfoSection.tsx` - sekcja nazwy i opisu
- `src/components/recipes/form/EditableIngredientsList.tsx` - lista składników
- `src/components/recipes/form/EditableStepsList.tsx` - lista kroków
- `src/components/recipes/form/EditableListItem.tsx` - pojedynczy element listy
- `src/components/recipes/form/TagInput.tsx` - input tagów
- `src/components/recipes/form/TagPill.tsx` - pojedynczy tag pill
- `src/components/recipes/form/FormActionButtons.tsx` - przyciski akcji

## 4. Szczegóły komponentów

### RecipeEditPage (Astro)

- **Opis**: Główny komponent strony, renderuje layout i mountuje komponent React z React Query client provider.
- **Główne elementy**:
  - Layout wrapper
  - RecipeEditFormContainer (React component z client:load)
- **Obsługiwane interakcje**: Brak (server-side rendering)
- **Obsługiwana walidacja**: Brak (delegowane do React)
- **Typy**: Brak (przekazuje tylko recipeId jako string)
- **Propsy**: Brak (przekazuje ID z params do React component)

### RecipeEditFormContainer (React)

**Lokalizacja**: `src/components/recipes/form/RecipeEditFormContainer.tsx`

- **Opis**: Kontener React, który używa `useRecipeDetail` do pobrania danych przepisu i obsługuje stany ładowania/błędów. Po pobraniu danych renderuje `RecipeEditForm`.
- **Główne elementy**:
  - Loading spinner (podczas ładowania)
  - Error message (w przypadku błędu)
  - RecipeEditForm (gdy dane załadowane)
- **Obsługiwane interakcje**: Obsługa błędów ładowania (redirect/toast)
- **Obsługiwana walidacja**: Brak
- **Typy**: RecipeEditFormContainerProps
- **Propsy**:
  ```typescript
  interface RecipeEditFormContainerProps {
    recipeId: string;
  }
  ```

### RecipeEditForm (React)

**Lokalizacja**: `src/components/recipes/form/RecipeEditForm.tsx`

- **Opis**: Główny kontener formularza edycji. Używa hooka `useForm` (`react-hook-form` z `zodResolver`) do zarządzania stanem formularza, walidacją i submisją. Koordynuje wszystkie podkomponenty i obsługuje logikę zapisu/anulowania.
- **Główne elementy**:
  - Komponent `<Form>` z `shadcn/ui`
  - `<form>` element z `form.handleSubmit(onSubmit)`
  - RecipeBasicInfoSection
  - EditableIngredientsList
  - EditableStepsList
  - TagInput
  - FormActionButtons
- **Obsługiwane interakcje**:
  - `onSubmit`: Walidacja i zapis przepisu (obsługiwane przez `react-hook-form` i `useMutation`)
- **Obsługiwana walidacja**: Walidacja jest w pełni zarządzana przez `zodResolver` na podstawie `UpdateRecipeSchema`. Błędy są dostępne w `form.formState.errors`.
- **Typy**: RecipeEditFormProps
- **Propsy**:
  ```typescript
  interface RecipeEditFormProps {
    initialData: RecipeDetailDto;
    recipeId: string;
  }
  ```

### RecipeBasicInfoSection (React)

**Lokalizacja**: `src/components/recipes/form/RecipeBasicInfoSection.tsx`

- **Opis**: Sekcja formularza odpowiedzialna za edycję podstawowych informacji. Używa komponentów `FormField` do integracji z `react-hook-form`.
- **Główne elementy**:
  - `FormField` dla nazwy (zawierający Label, Input, FormMessage)
  - `FormField` dla opisu (zawierający Label, Textarea, FormMessage)
- **Obsługiwana walidacja**: Automatyczna przez `react-hook-form` i `zodResolver`.
- **Typy**: RecipeBasicInfoSectionProps
- **Propsy**:

  ```typescript
  import { Control } from "react-hook-form";
  import { UpdateRecipeCommand } from "@/lib/schemas/recipe.schema";

  interface RecipeBasicInfoSectionProps {
    control: Control<UpdateRecipeCommand>;
  }
  ```

### EditableIngredientsList (React)

**Lokalizacja**: `src/components/recipes/form/EditableIngredientsList.tsx`

- **Opis**: Komponent zarządzający listą składników. Używa hooka `useFieldArray` z `react-hook-form` do dodawania, edycji i usuwania składników.
- **Główne elementy**:
  - SectionHeader z tytułem "Składniki" i przyciskiem "Dodaj składnik"
  - Pętla po `fields` z `useFieldArray` renderująca `FormField` dla każdego składnika.
  - Przycisk "Usuń" przy każdym składniku.
- **Obsługiwana walidacja**: Automatyczna przez `react-hook-form` dla każdego pola w liście.
- **Typy**: EditableIngredientsListProps
- **Propsy**:

  ```typescript
  import { Control } from "react-hook-form";
  import { UpdateRecipeCommand } from "@/lib/schemas/recipe.schema";

  interface EditableIngredientsListProps {
    control: Control<UpdateRecipeCommand>;
  }
  ```

### EditableStepsList (React)

**Lokalizacja**: `src/components/recipes/form/EditableStepsList.tsx`

- **Opis**: Komponent zarządzający listą kroków przygotowania. Funkcjonalność analogiczna do `EditableIngredientsList`, używa `useFieldArray`.
- **Typy**: EditableStepsListProps
- **Propsy**:

  ```typescript
  import { Control } from "react-hook-form";
  import { UpdateRecipeCommand } from "@/lib/schemas/recipe.schema";

  interface EditableStepsListProps {
    control: Control<UpdateRecipeCommand>;
  }
  ```

### TagInput (React)

**Lokalizacja**: `src/components/recipes/form/TagInput.tsx`

- **Opis**: Komponent do zarządzania tagami, zintegrowany z `react-hook-form` przez `FormField`.
- **Główne elementy**:
  - `FormField` dla pola `tags`
  - Combobox z autocomplete
  - Lista `TagPill` dla wybranych tagów
- **Typy**: TagInputProps
- **Propsy**:

  ```typescript
  import { Control } from "react-hook-form";
  import { UpdateRecipeCommand } from "@/lib/schemas/recipe.schema";

  interface TagInputProps {
    control: Control<UpdateRecipeCommand>;
    suggestions: string[];
  }
  ```

### TagPill (React)

**Lokalizacja**: `src/components/recipes/form/TagPill.tsx`

- **Opis**: Komponent reprezentujący pojedynczy wybrany tag z przyciskiem do usunięcia.
- **Typy**: TagPillProps
- **Propsy**:
  ```typescript
  interface TagPillProps {
    name: string;
    onRemove: (name: string) => void;
  }
  ```

### FormActionButtons (React)

**Lokalizacja**: `src/components/recipes/form/FormActionButtons.tsx`

- **Opis**: Sekcja z przyciskami akcji. Przycisk "Zapisz" jest typu `submit`.
- **Główne elementy**:
  - Button "Anuluj"
  - Button "Zapisz" (`type="submit"`)
- **Typy**: FormActionButtonsProps
- **Propsy**:
  ```typescript
  interface FormActionButtonsProps {
    onCancel: () => void;
    isSubmitting: boolean;
    isDirty: boolean;
  }
  ```

## 5. Typy

### Istniejące typy

```typescript
// src/types.ts - DTOs
interface RecipeDetailDto {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
  ingredients: RecipeIngredientDto[];
  steps: RecipeStepDto[];
  tags: string[]; // array of tag names
}

interface RecipeIngredientDto {
  id: string;
  recipeId: string;
  content: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

interface RecipeStepDto {
  id: string;
  recipeId: string;
  content: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

// src/lib/schemas/recipe.schema.ts - Zod Schema i typ dla formularza
const UpdateRecipeSchema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana").max(200),
  description: z.string().max(1000).nullable().optional(),
  ingredients: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        content: z.string().min(1, "Składnik nie może być pusty").max(500),
        position: z.number().int(),
      })
    )
    .min(1, "Dodaj przynajmniej jeden składnik"),
  steps: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        content: z.string().min(1, "Krok nie może być pusty").max(2000),
        position: z.number().int(),
      })
    )
    .min(1, "Dodaj przynajmniej jeden krok"),
  tags: z.array(z.string().max(50)),
});

type UpdateRecipeCommand = z.infer<typeof UpdateRecipeSchema>;
```

### Nowe/zaktualizowane typy (Propsy)

```typescript
// Component Props
interface RecipeEditFormContainerProps {
  recipeId: string;
}

interface RecipeEditFormProps {
  initialData: RecipeDetailDto;
  recipeId: string;
}

interface RecipeBasicInfoSectionProps {
  control: Control<UpdateRecipeCommand>;
}

interface EditableIngredientsListProps {
  control: Control<UpdateRecipeCommand>;
}

interface EditableStepsListProps {
  control: Control<UpdateRecipeCommand>;
}

interface TagInputProps {
  control: Control<UpdateRecipeCommand>;
  suggestions: string[];
}

interface TagPillProps {
  name: string;
  onRemove: (name: string) => void;
}

interface FormActionButtonsProps {
  onCancel: () => void;
  isSubmitting: boolean;
  isDirty: boolean;
}
```

## 6. Zarządzanie stanem

Stan formularza będzie zarządzany przy użyciu biblioteki `react-hook-form` za pośrednictwem custom hooka `useForm` z `src/hooks/use-form.ts`, który integruje `react-hook-form` z `zodResolver` do walidacji.

### React Query Integration

- **Pobieranie danych (GET)**: `useRecipeDetail(recipeId)` - bez zmian.
- **Aktualizacja danych (PUT)**: `useUpdateRecipe(recipeId)` - bez zmian, ale będzie wywoływany z `form.handleSubmit`.

### Custom Hook: useUpdateRecipe

- Implementacja pozostaje **bez zmian**.

### Integracja z React Hook Form w `RecipeEditForm`

Główna logika formularza znajdzie się w komponencie `RecipeEditForm.tsx`.

1.  **Inicjalizacja formularza**:
    - Użycie hooka `useForm` z `UpdateRecipeSchema` do walidacji.
    - `defaultValues` zostaną zmapowane z `initialData` (`RecipeDetailDto`).

    ```typescript
    // w RecipeEditForm.tsx
    import { useForm } from "@/hooks/use-form";
    import { UpdateRecipeSchema, UpdateRecipeCommand } from "@/lib/schemas/recipe.schema";

    // ...
    const form = useForm({
      schema: UpdateRecipeSchema,
      defaultValues: {
        name: initialData.name,
        description: initialData.description || "",
        ingredients: initialData.ingredients.map((ing) => ({
          id: ing.id,
          content: ing.content,
          position: ing.position,
        })),
        steps: initialData.steps.map((step) => ({ id: step.id, content: step.content, position: step.position })),
        tags: initialData.tags,
      },
    });
    ```

2.  **Zarządzanie dynamicznymi listami (składniki i kroki)**:
    - Użycie hooka `useFieldArray` z `react-hook-form` do zarządzania listami.

    ```typescript
    // w RecipeEditForm.tsx
    import { useFieldArray } from "react-hook-form";

    const {
      fields: ingredientFields,
      append: appendIngredient,
      remove: removeIngredient,
    } = useFieldArray({
      control: form.control,
      name: "ingredients",
    });

    const {
      fields: stepFields,
      append: appendStep,
      remove: removeStep,
    } = useFieldArray({
      control: form.control,
      name: "steps",
    });
    ```

3.  **Obsługa submisji**:
    - Formularz będzie owinięty w komponent `<Form>` z `shadcn/ui`.
    - Użycie `form.handleSubmit` do owinięcia funkcji `onSubmit`, co zapewni, że `onSubmit` zostanie wywołany tylko z poprawnie zwalidowanymi danymi.

    ```typescript
    // w RecipeEditForm.tsx
    const updateMutation = useUpdateRecipe(recipeId);

    const onSubmit = (data: UpdateRecipeCommand) => {
      // Przeliczenie pozycji przed wysłaniem
      const payload = {
          ...data,
          ingredients: data.ingredients.map((ing, i) => ({...ing, position: i + 1})),
          steps: data.steps.map((step, i) => ({...step, position: i + 1})),
      }
      updateMutation.mutate(payload, {
        onError: (error) => { /* ... obsługa błędów ... */ }
      });
    };

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* ... pola formularza ... */}
        </form>
      </Form>
    );
    ```

4.  **Śledzenie zmian i stanu**:
    - `hasChanges` zostanie zastąpione przez `form.formState.isDirty`. Ta flaga automatycznie śledzi, czy użytkownik zmodyfikował którekolwiek z pól.
    - `isSubmitting` będzie pochodzić z `updateMutation.isPending` oraz `form.formState.isSubmitting`.
    - Błędy walidacji będą dostępne w `form.formState.errors` i automatycznie wyświetlane przez komponenty `<FormMessage>`.

## 7. Integracja API

- Bez większych zmian, `useUpdateRecipe` będzie wywoływane w `onSubmit` z `form.handleSubmit`.

## 8. Interakcje użytkownika

### 1-2. Edycja nazwy i opisu

- **Trigger**: Użytkownik wpisuje tekst w polu.
- **Akcja**: Obsługiwane automatycznie przez `react-hook-form` (`{...field}`).
- **Efekt**: Stan formularza zaktualizowany, `isDirty` = `true`.

### 3. Dodanie składnika

- **Trigger**: Kliknięcie "Dodaj składnik".
- **Akcja**: `appendIngredient({ content: '', position: 0 })`. Pozycja zostanie przeliczona przy submisji.
- **Efekt**: Nowe, puste pole na końcu listy.

### 4. Edycja składnika

- **Trigger**: Użytkownik wpisuje w polu składnika.
- **Akcja**: Obsługiwane automatycznie przez `react-hook-form`.

### 5. Usunięcie składnika

- **Trigger**: Kliknięcie ikony kosza.
- **Akcja**: `removeIngredient(index)`.
- **Efekt**: Składnik usunięty z listy.

### 6-8. Zarządzanie krokami

- **Analogicznie do składników (3-5)** używając `appendStep` i `removeStep`.

### 9-10. Zarządzanie tagami

- Logika pozostaje podobna, ale będzie zintegrowana z `FormField` i `setValue` z `react-hook-form`.

### 11. Zapisanie zmian

- **Trigger**: Kliknięcie przycisku "Zapisz" (`type="submit"`).
- **Akcja**: `form.handleSubmit(onSubmit)` jest wywoływane.
- **Przepływ**: `react-hook-form` uruchamia walidację. Jeśli jest poprawna, wywołuje `onSubmit` z danymi. `onSubmit` wywołuje `updateMutation.mutate`.

### 12. Anulowanie edycji

- **Trigger**: Kliknięcie przycisku "Anuluj".
- **Akcja**: `onCancel()`.
- **Przepływ**: Sprawdzenie `form.formState.isDirty`. Jeśli `true`, pokazanie dialogu.

## 9. Warunki i walidacja

Walidacja jest w całości obsługiwana przez `react-hook-form` i `zodResolver` na podstawie `UpdateRecipeSchema`.

- **Wykrywanie**: Na `onChange`, `onBlur` lub `onSubmit` (konfigurowalne).
- **Komunikaty**: Błędy z `form.formState.errors` są przekazywane do komponentów `<FormMessage>`, które je wyświetlają.
- **Blokada zapisu**: `form.handleSubmit` nie wywoła `onSubmit` jeśli formularz jest niepoprawny.

## 10. Obsługa błędów

- Bez zmian. Błędy z API (400, 403, 404, 500) będą obsługiwane w `onError` callbacku mutacji.

## 11. Kroki implementacji

### Krok 1: Przygotowanie typów i schematów

1.  Upewnij się, że `UpdateRecipeSchema` i `UpdateRecipeCommand` są zdefiniowane w `src/lib/schemas/recipe.schema.ts` i odzwierciedlają logikę walidacji.
2.  Zaktualizuj interfejsy Propsów w `src/components/recipes/types.ts` zgodnie z sekcją 5.

### Krok 2: Implementacja `useUpdateRecipe`

1.  Bez zmian, upewnij się, że hook istnieje i działa poprawnie.

### Krok 3: Implementacja komponentów formularza

1.  **RecipeBasicInfoSection**: Zaimplementuj używając dwóch komponentów `FormField` dla pól `name` i `description`. Przekaż `control` z propsów.
2.  **EditableIngredientsList**: Użyj `useFieldArray` z `name: "ingredients"`. W pętli po `fields` renderuj `FormField` dla `ingredients.${index}.content`. Dodaj przycisk wywołujący `remove(index)`. Przycisk "Dodaj" powinien wywoływać `append({ content: '', position: 0 })`.
3.  **EditableStepsList**: Analogicznie do składników, dla `name: "steps"`.
4.  **TagInput**: Owiń logikę w `FormField` dla pola `tags`. Użyj `field.onChange` i `field.value` do synchronizacji stanu.
5.  **TagPill**: Bez zmian.
6.  **FormActionButtons**: Przycisk "Zapisz" musi mieć `type="submit"`. Jego stan `disabled` powinien zależeć od `isSubmitting`. Przekaż `isDirty` do logiki anulowania.

### Krok 4: Implementacja głównego komponentu formularza (`RecipeEditForm`)

1.  Użyj hooka `useForm` z `UpdateRecipeSchema` i `defaultValues` zmapowanymi z `initialData`.
2.  Użyj `useFieldArray` dla składników i kroków.
3.  Złóż wszystkie sekcje formularza, przekazując `form.control`.
4.  Owiń wszystko w `<Form {...form}>` i `<form onSubmit={form.handleSubmit(onSubmit)}>`.
5.  Zaimplementuj funkcję `onSubmit`, która przeliczy pozycje i wywoła `updateMutation.mutate`.
6.  Dodaj `AlertDialog` dla potwierdzenia anulowania, który będzie sprawdzany na podstawie `form.formState.isDirty`.

### Krok 5: Implementacja kontenera i strony Astro

1.  **RecipeEditFormContainer**: Bez zmian, logika pobierania danych pozostaje ta sama.
2.  **Strona Astro**: Bez zmian.

### Krok 6: Testowanie i debugowanie

1.  Przetestuj wszystkie interakcje, w tym dodawanie/usuwanie elementów z list.
2.  Sprawdź, czy walidacja Zod działa dla wszystkich pól i reguł.
3.  Sprawdź, czy stan `isDirty` poprawnie się aktualizuje.
4.  Sprawdź, czy dialog anulowania pojawia się tylko przy `isDirty: true`.
