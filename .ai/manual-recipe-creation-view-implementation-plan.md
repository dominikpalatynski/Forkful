# Plan implementacji widoku Tworzenia Przepisu Ręcznie

## 1. Przegląd

Widok Tworzenia Przepisu Ręcznie umożliwia użytkownikowi ręczne dodanie nowego przepisu poprzez wypełnienie formularza z pustymi polami. Jest to alternatywna metoda tworzenia przepisu w stosunku do automatycznego generowania przez AI. Widok ten pozwala użytkownikowi na pełną kontrolę nad procesem tworzenia przepisu od podstaw, z możliwością dodawania i zarządzania nazwą, opisem, składnikami, krokami przygotowania oraz tagami.

## 2. Routing widoku

- **Ścieżka**: `/recipes/new`
- **Plik strony**: `src/pages/recipes/new.astro`
- **Typ renderowania**: Server-side rendering (SSR) z `export const prerender = false`

## 3. Struktura komponentów

```
new.astro
└── ManualRecipeForm (React)
    ├── Form (shadcn/ui wrapper)
    │   └── form (HTML element)
    │       ├── CreateRecipeBasicInfoSection (NOWY komponent)
    │       │   ├── FormField (name)
    │       │   │   └── Input
    │       │   └── FormField (description)
    │       │       └── Textarea
    │       ├── CreateRecipeTagInput (NOWY komponent)
    │       │   ├── Input (nowy tag)
    │       │   ├── Button (dodaj tag)
    │       │   ├── Suggestions dropdown
    │       │   └── TagPill[] (używamy istniejącego)
    │       ├── Separator
    │       ├── CreateRecipeIngredientsList (NOWY komponent)
    │       │   ├── EditableSectionHeader (używamy istniejącego)
    │       │   ├── FormField[] (każdy składnik)
    │       │   │   └── Input
    │       │   └── Button (dodaj składnik)
    │       ├── Separator
    │       ├── CreateRecipeStepsList (NOWY komponent)
    │       │   ├── EditableSectionHeader (używamy istniejącego)
    │       │   ├── FormField[] (każdy krok)
    │       │   │   └── Textarea
    │       │   └── Button (dodaj krok)
    │       └── FormActionButtons (modyfikujemy istniejący)
    │           ├── Button (Anuluj)
    │           └── Button (Zapisz przepis - type="submit")
    └── CancelRecipeEditDialog (używamy istniejącego)
        └── AlertDialog (potwierdzenie anulowania)
```

## 4. Szczegóły komponentów

### ManualRecipeForm

**Opis komponentu**: Główny komponent formularza do ręcznego tworzenia przepisu. Zarządza stanem formularza, koordynuje wszystkie sekcje formularza oraz obsługuje wysyłanie danych do API. W przeciwieństwie do `RecipeEditForm`, ten komponent:
- Nie wymaga początkowych danych (pustry formularz)
- Używa `CreateRecipeSchema` zamiast `UpdateRecipeSchema`
- Wykorzystuje `useCreateRecipe` hook zamiast `useUpdateRecipe`
- Implementuje auto-save do localStorage
- Obsługuje przywracanie draftu z localStorage

**Główne elementy HTML i komponenty dzieci**:
- `<Form>` - wrapper shadcn/ui dla react-hook-form (istniejący)
- `<form>` - natywny element HTML z `onSubmit`
- `<CreateRecipeBasicInfoSection>` - sekcja z nazwą i opisem (**NOWY komponent**)
- `<CreateRecipeTagInput>` - komponent do zarządzania tagami (**NOWY komponent**)
- `<Separator>` - wizualne oddzielenie sekcji (istniejący, 2x)
- `<CreateRecipeIngredientsList>` - dynamiczna lista składników (**NOWY komponent**)
- `<CreateRecipeStepsList>` - dynamiczna lista kroków (**NOWY komponent**)
- `<FormActionButtons>` - przyciski akcji (Anuluj, Zapisz) (istniejący z modyfikacją)
- `<CancelRecipeEditDialog>` - dialog potwierdzenia anulowania (istniejący)

**Obsługiwane zdarzenia**:
- `onSubmit` - wysłanie formularza (tworzenie przepisu)
- `handleCancel` - kliknięcie przycisku Anuluj
- `handleCancelConfirm` - potwierdzenie anulowania w dialogu
- Auto-save do localStorage przy każdej zmianie formularza (debounced)

**Warunki walidacji**:
Walidacja odbywa się zgodnie z `CreateRecipeSchema`:
- **name** (string):
  - Minimum 1 znak (required): "Recipe name is required"
  - Maximum 255 znaków: "Recipe name is too long"
- **description** (string, optional):
  - Brak wymagań minimalnych
- **ingredients** (array):
  - Domyślnie pusta tablica `[]`
  - Każdy element musi spełniać `RecipeIngredientCommandSchema`:
    - `content` (string): minimum 1 znak - "Ingredient content cannot be empty"
    - `position` (number): liczba całkowita dodatnia - "Position must be a positive integer"
- **steps** (array):
  - Domyślnie pusta tablica `[]`
  - Każdy element musi spełniać `RecipeStepCommandSchema`:
    - `content` (string): minimum 1 znak - "Step content cannot be empty"
    - `position` (number): liczba całkowita dodatnia - "Position must be a positive integer"
- **tags** (array):
  - Domyślnie pusta tablica `[]`
  - Każdy tag (string): minimum 1 znak - "Tag name cannot be empty"
- **generationId** (string, optional):
  - Jeśli podany: musi być UUID - "Invalid generation ID format"
  - Dla manualnego tworzenia: `undefined`

**Typy**:
- Props: `ManualRecipeFormProps` (pusty interfejs lub brak propsów)
- Form data: `CreateRecipeCommand` (z `@/types`)
- Schema: `CreateRecipeSchema` (z `@/lib/schemas/recipe.schema`)
- Hook: `useCreateRecipe` (zwraca `RecipeDetailDto`)

**Propsy**:
Komponent nie przyjmuje żadnych propsów - tworzy nowy przepis z pustymi wartościami początkowymi.

```typescript
export interface ManualRecipeFormProps {
  // Brak propsów - puste
}
```

### CreateRecipeBasicInfoSection

**Opis**: **NOWY komponent** - istniejący `RecipeBasicInfoSection` NIE może być użyty, ponieważ wymaga typów `UpdateRecipeCommand`. Należy stworzyć nowy komponent `CreateRecipeBasicInfoSection` z typami `CreateRecipeCommand`.

**Dlaczego nowy komponent?**: Istniejący komponent przyjmuje `Control<UpdateRecipeCommand>`, natomiast komponent dla tworzenia przepisu wymaga `Control<CreateRecipeCommand>`. TypeScript nie pozwoli na użycie niewłaściwego typu.

**Lokalizacja**: `src/components/recipes/form/CreateRecipeBasicInfoSection.tsx`

**Implementacja**: Skopiować implementację z `RecipeBasicInfoSection.tsx` i zmienić tylko typ propsa `control` na `Control<CreateRecipeCommand>`.

### CreateRecipeIngredientsList

**Opis**: **NOWY komponent** - istniejący `EditableIngredientsList` NIE może być użyty, ponieważ wymaga typów `UpdateRecipeCommand`. Należy stworzyć nowy komponent `CreateRecipeIngredientsList` z typami `CreateRecipeCommand`.

**Dlaczego nowy komponent?**: Istniejący komponent przyjmuje `Control<UpdateRecipeCommand>`, natomiast komponent dla tworzenia przepisu wymaga `Control<CreateRecipeCommand>`. TypeScript nie pozwoli na użycie niewłaściwego typu.

**Lokalizacja**: `src/components/recipes/form/CreateRecipeIngredientsList.tsx`

**Implementacja**: Skopiować implementację z `EditableIngredientsList.tsx` i zmienić tylko typ propsa `control` na `Control<CreateRecipeCommand>`.

### CreateRecipeStepsList

**Opis**: **NOWY komponent** - istniejący `EditableStepsList` NIE może być użyty, ponieważ wymaga typów `UpdateRecipeCommand`. Należy stworzyć nowy komponent `CreateRecipeStepsList` z typami `CreateRecipeCommand`.

**Dlaczego nowy komponent?**: Istniejący komponent przyjmuje `Control<UpdateRecipeCommand>`, natomiast komponent dla tworzenia przepisu wymaga `Control<CreateRecipeCommand>`. TypeScript nie pozwoli na użycie niewłaściwego typu.

**Lokalizacja**: `src/components/recipes/form/CreateRecipeStepsList.tsx`

**Implementacja**: Skopiować implementację z `EditableStepsList.tsx` i zmienić tylko typ propsa `control` na `Control<CreateRecipeCommand>`.

### CreateRecipeTagInput

**Opis**: **NOWY komponent** - istniejący `TagInput` NIE może być użyty, ponieważ wymaga typów `UpdateRecipeCommand`. Należy stworzyć nowy komponent `CreateRecipeTagInput` z typami `CreateRecipeCommand`.

**Dlaczego nowy komponent?**: Istniejący komponent przyjmuje `Control<UpdateRecipeCommand>`, natomiast komponent dla tworzenia przepisu wymaga `Control<CreateRecipeCommand>`. TypeScript nie pozwoli na użycie niewłaściwego typu.

**Lokalizacja**: `src/components/recipes/form/CreateRecipeTagInput.tsx`

**Implementacja**: Skopiować implementację z `TagInput.tsx` i zmienić tylko typ propsa `control` na `Control<CreateRecipeCommand>`. Komponent `TagPill` może być użyty ponownie bez zmian.

### FormActionButtons

**Opis**: **Komponent istniejący - wymaga modyfikacji**. Komponent nie zależy bezpośrednio od typów command, ale wymaga dodania opcjonalnego propa `submitButtonText` aby umożliwić zmianę tekstu "Zapisz zmiany" na "Zapisz przepis".

**Wymagana modyfikacja**:
1. Dodać opcjonalny props `submitButtonText?: string` do interfejsu `FormActionButtonsProps` w `src/components/recipes/types.ts`
2. W komponencie użyć `submitButtonText || "Zapisz zmiany"` jako tekst przycisku submit

## 5. Typy

### Nowe typy do dodania w `src/components/recipes/types.ts`

```typescript
/**
 * Props dla komponentu ManualRecipeForm
 * Komponent nie wymaga żadnych propsów - tworzy nowy przepis z pustymi wartościami
 */
export interface ManualRecipeFormProps {
  // Pusty interfejs - komponent nie przyjmuje propsów
}

/**
 * Props dla komponentu CreateRecipeBasicInfoSection
 * Używa CreateRecipeCommand zamiast UpdateRecipeCommand
 */
export interface CreateRecipeBasicInfoSectionProps {
  control: import("react-hook-form").Control<import("@/types").CreateRecipeCommand>;
}

/**
 * Props dla komponentu CreateRecipeIngredientsList
 * Używa CreateRecipeCommand zamiast UpdateRecipeCommand
 */
export interface CreateRecipeIngredientsListProps {
  control: import("react-hook-form").Control<import("@/types").CreateRecipeCommand>;
}

/**
 * Props dla komponentu CreateRecipeStepsList
 * Używa CreateRecipeCommand zamiast UpdateRecipeCommand
 */
export interface CreateRecipeStepsListProps {
  control: import("react-hook-form").Control<import("@/types").CreateRecipeCommand>;
}

/**
 * Props dla komponentu CreateRecipeTagInput
 * Używa CreateRecipeCommand zamiast UpdateRecipeCommand
 */
export interface CreateRecipeTagInputProps {
  control: import("react-hook-form").Control<import("@/types").CreateRecipeCommand>;
}
```

### Modyfikacja istniejących typów w `src/components/recipes/types.ts`

```typescript
// Zmodyfikować istniejący interfejs FormActionButtonsProps
export interface FormActionButtonsProps {
  onCancel: () => void;
  isSubmitting: boolean;
  isDirty: boolean;
  submitButtonText?: string; // NOWY props - opcjonalny
}
```

### Typy już istniejące (wykorzystywane ponownie)

Z pliku `@/types`:
- `CreateRecipeCommand` - typ dla danych formularza tworzenia przepisu
- `RecipeIngredientCommand` - typ dla składnika w komendzie tworzenia
- `RecipeStepCommand` - typ dla kroku w komendzie tworzenia
- `RecipeDetailDto` - typ zwracany przez API po utworzeniu przepisu

Z pliku `@/lib/schemas/recipe.schema`:
- `CreateRecipeSchema` - schema walidacji Zod dla tworzenia przepisu
- `RecipeIngredientCommandSchema` - schema dla składnika
- `RecipeStepCommandSchema` - schema dla kroku

### Struktura `CreateRecipeCommand`

```typescript
interface CreateRecipeCommand {
  name: string;                           // Nazwa przepisu (required, 1-255 znaków)
  description?: string;                   // Opis (optional)
  generationId?: string;                  // ID generacji AI (optional, UUID)
  ingredients?: RecipeIngredientCommand[]; // Lista składników (optional, default: [])
  steps?: RecipeStepCommand[];            // Lista kroków (optional, default: [])
  tags?: string[];                        // Lista tagów (optional, default: [])
}

interface RecipeIngredientCommand {
  content: string;   // Treść składnika (required, min 1 znak)
  position: number;  // Pozycja na liście (required, dodatnia liczba całkowita)
}

interface RecipeStepCommand {
  content: string;   // Treść kroku (required, min 1 znak)
  position: number;  // Pozycja na liście (required, dodatnia liczba całkowita)
}
```

### LocalStorage Draft Type

```typescript
interface RecipeDraft {
  name: string;
  description: string;
  ingredients: Array<{ content: string; position: number }>;
  steps: Array<{ content: string; position: number }>;
  tags: string[];
  timestamp: number; // Kiedy draft został zapisany
}
```

## 6. Zarządzanie stanem

### Stan formularza (react-hook-form)

Formularz wykorzystuje custom hook `useForm` z `@/hooks/use-form.ts`, który integruje react-hook-form z zodResolver:

```typescript
const form = useForm({
  schema: CreateRecipeSchema,
  defaultValues: {
    name: "",
    description: "",
    ingredients: [{ content: " ", position: 1 }],
    steps: [{ content: " ", position: 1 }],
    tags: [],
  },
});
```

**Wartości początkowe**:
- `name`: pusty string
- `description`: pusty string
- `ingredients`: tablica z jednym pustym składnikiem (aby UI nie był całkowicie pusty)
- `steps`: tablica z jednym pustym krokiem (aby UI nie był całkowicie pusty)
- `tags`: pusta tablica

### Stan lokalny komponentu

```typescript
const [showCancelDialog, setShowCancelDialog] = useState(false); // Dialog potwierdzenia anulowania
```

### Auto-save do localStorage

Implementacja auto-save z użyciem `useDebouncedCallback` hook z `form.watch()`:

```typescript
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";

// Klucz localStorage
const DRAFT_KEY = "forkful_recipe_draft";

// Stwórz debounced funkcję zapisującą draft (1 sekunda opóźnienia)
const saveDraft = useDebouncedCallback((formData: CreateRecipeCommand) => {
  const draft: RecipeDraft = {
    name: formData.name || "",
    description: formData.description || "",
    ingredients: formData.ingredients || [],
    steps: formData.steps || [],
    tags: formData.tags || [],
    timestamp: Date.now(),
  };

  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}, 1000);

// Obserwuj zmiany w formularzu i zapisuj draft
useEffect(() => {
  const subscription = form.watch(saveDraft);

  return () => subscription.unsubscribe();
}, [form.watch, saveDraft]);
```

### Przywracanie draftu z localStorage

```typescript
// W useEffect przy montowaniu komponentu
useEffect(() => {
  const savedDraft = localStorage.getItem(DRAFT_KEY);

  if (savedDraft) {
    try {
      const draft: RecipeDraft = JSON.parse(savedDraft);

      // Pokaż dialog z pytaniem czy przywrócić draft
      // lub automatycznie przywróć:
      form.reset(draft);
    } catch (error) {
      console.error("Failed to restore draft:", error);
      localStorage.removeItem(DRAFT_KEY);
    }
  }
}, []);
```

### Czyszczenie localStorage

localStorage jest czyszczony w następujących sytuacjach:
1. Po pomyślnym zapisaniu przepisu (w `onSuccess` hooka `useCreateRecipe`)
2. Po potwierdzeniu anulowania (w `handleCancelConfirm`)
3. Gdy draft jest starszy niż 24 godziny (opcjonalnie)

## 7. Integracja API

### Endpoint

- **Metoda**: `POST`
- **URL**: `/api/recipes`
- **Implementacja**: `src/pages/api/recipes/index.ts` (już istnieje)

### Request

**Headers**:
```
Content-Type: application/json
```

**Body** (typ: `CreateRecipeCommand`):
```json
{
  "name": "Spaghetti Carbonara",
  "description": "Klasyczne włoskie danie z makaronem.",
  "ingredients": [
    { "content": "200g spaghetti", "position": 1 },
    { "content": "100g pancetta", "position": 2 },
    { "content": "2 duże jajka", "position": 3 }
  ],
  "steps": [
    { "content": "Ugotuj makaron.", "position": 1 },
    { "content": "Podsmaż pancettę.", "position": 2 }
  ],
  "tags": ["pasta", "włoskie", "szybkie"]
}
```

**Uwaga**: Pole `generationId` jest opcjonalne i dla manualnego tworzenia będzie `undefined`.

### Response

**Success (201 Created)** - typ: `RecipeDetailDto`:
```json
{
  "id": "uuid-nowego-przepisu",
  "name": "Spaghetti Carbonara",
  "description": "Klasyczne włoskie danie z makaronem.",
  "createdAt": "2025-10-11T10:30:00Z",
  "ingredients": [
    { "id": "uuid", "content": "200g spaghetti", "position": 1 },
    { "id": "uuid", "content": "100g pancetta", "position": 2 },
    { "id": "uuid", "content": "2 duże jajka", "position": 3 }
  ],
  "steps": [
    { "id": "uuid", "content": "Ugotuj makaron.", "position": 1 },
    { "id": "uuid", "content": "Podsmaż pancettę.", "position": 2 }
  ],
  "tags": ["pasta", "włoskie", "szybkie"]
}
```

**Error (400 Bad Request)**:
```json
{
  "error": "Validation failed",
  "details": [
    {
      "path": ["name"],
      "message": "Recipe name is required"
    }
  ]
}
```

**Error (401 Unauthorized)**:
```json
{
  "error": "Unauthorized"
}
```

### Custom Hook: `useCreateRecipe`

**Lokalizacja**: `src/components/recipes/hooks/useCreateRecipe.ts`

**Odpowiedzialności**:
1. Wykonanie POST request do `/api/recipes`
2. Obsługa błędów HTTP (400, 401, 500)
3. Wyświetlenie toast notifications (success/error)
4. Inwalidacja query cache dla listy przepisów
5. Przekierowanie do widoku szczegółowego nowo utworzonego przepisu
6. Wyczyszczenie localStorage po sukcesie

**Implementacja** (wzorowana na `useUpdateRecipe`):

```typescript
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CreateRecipeCommand, RecipeDetailDto } from "@/types";
import { queryClient } from "@/store/query";

const DRAFT_KEY = "forkful_recipe_draft";

async function createRecipe(data: CreateRecipeCommand): Promise<RecipeDetailDto> {
  const response = await fetch("/api/recipes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Musisz być zalogowany, aby utworzyć przepis");
    }
    if (response.status === 400) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Walidacja nie powiodła się");
    }
    throw new Error("Nie udało się utworzyć przepisu");
  }

  return response.json();
}

export function useCreateRecipe() {
  const mutation = useMutation({
    mutationFn: createRecipe,
    onSuccess: (createdRecipe: RecipeDetailDto) => {
      // Inwaliduj cache listy przepisów
      queryClient.invalidateQueries({
        queryKey: ["recipes"],
      });

      // Inwaliduj cache tagów (mogły zostać dodane nowe)
      queryClient.invalidateQueries({
        queryKey: ["tags"],
      });

      // Wyczyść draft z localStorage
      localStorage.removeItem(DRAFT_KEY);

      // Pokaż toast i przekieruj
      toast.success("Przepis został pomyślnie utworzony!", {
        duration: 1500,
        onAutoClose: () => {
          window.location.href = `/recipes/${createdRecipe.id}`;
        },
      });
    },
    onError: (error: Error) => {
      toast.error(`Błąd podczas tworzenia przepisu: ${error.message}`);
    },
  }, queryClient);

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error as Error | null,
    isSuccess: mutation.isSuccess,
    reset: mutation.reset,
  } as const;
}
```

## 8. Interakcje użytkownika

### 8.1. Wypełnianie formularza

**Akcja**: Użytkownik wpisuje tekst w pola formularza (nazwa, opis, składniki, kroki, tagi)

**Efekt**:
- Wartość pola jest aktualizowana w stanie formularza (react-hook-form)
- Po 1 sekundzie od ostatniej zmiany, stan formularza jest zapisywany do localStorage
- Walidacja w czasie rzeczywistym: jeśli pole ma błąd, wyświetlany jest komunikat pod polem
- Przycisk "Zapisz" jest aktywny tylko gdy `isDirty === true` (formularz został zmodyfikowany)

### 8.2. Dodawanie składnika

**Akcja**: Użytkownik klika przycisk "Dodaj składnik"

**Efekt**:
- Do tablicy `ingredients` w formularzu dodawany jest nowy element `{ content: " ", position: N+1 }`
- Nowe pole input pojawia się na liście składników
- Fokus może być ustawiony na nowym polu (opcjonalnie)

### 8.3. Usuwanie składnika

**Akcja**: Użytkownik klika ikonę kosza przy składniku

**Efekt**:
- Element jest usuwany z tablicy `ingredients` w formularzu
- Pole input znika z listy
- Przycisk usuwania jest wyłączony, gdy lista ma tylko jeden element

### 8.4. Dodawanie kroku

**Akcja**: Użytkownik klika przycisk "Dodaj krok"

**Efekt**:
- Do tablicy `steps` w formularzu dodawany jest nowy element `{ content: " ", position: N+1 }`
- Nowe pole textarea pojawia się na liście kroków
- Fokus może być ustawiony na nowym polu (opcjonalnie)

### 8.5. Usuwanie kroku

**Akcja**: Użytkownik klika ikonę kosza przy kroku

**Efekt**:
- Element jest usuwany z tablicy `steps` w formularzu
- Pole textarea znika z listy
- Przycisk usuwania jest wyłączony, gdy lista ma tylko jeden element

### 8.6. Dodawanie tagu

**Akcja**: Użytkownik wpisuje nazwę tagu i klika "Dodaj" lub naciska Enter

**Efekt**:
- Tag jest dodawany do tablicy `tags` w formularzu (jeśli jeszcze nie istnieje)
- Tag pojawia się jako "pigułka" (pill) pod polem input
- Pole input jest czyszczone
- Podczas wpisywania, jeśli tag pasuje do istniejących tagów, wyświetlana jest lista sugestii

### 8.7. Usuwanie tagu

**Akcja**: Użytkownik klika ikonę "x" na pigułce tagu

**Efekt**:
- Tag jest usuwany z tablicy `tags` w formularzu
- Pigułka znika z widoku

### 8.8. Zapisywanie przepisu

**Akcja**: Użytkownik klika przycisk "Zapisz przepis"

**Efekt**:
1. Formularz jest walidowany (react-hook-form + Zod)
2. Jeśli walidacja przejdzie:
   - Pozycje składników i kroków są przeliczane (index + 1)
   - Dane są wysyłane do API przez `useCreateRecipe`
   - Przycisk pokazuje "Zapisywanie..." i jest wyłączony
   - Po sukcesie:
     - localStorage jest czyszczony
     - Wyświetlany jest toast "Przepis został pomyślnie utworzony!"
     - Po 1,5 sekundy użytkownik jest przekierowywany do `/recipes/{id}`
3. Jeśli walidacja nie przejdzie:
   - Wyświetlane są komunikaty błędów pod polami
   - Formularz nie jest wysyłany

### 8.9. Anulowanie tworzenia przepisu

**Akcja**: Użytkownik klika przycisk "Anuluj"

**Efekt**:
1. Jeśli formularz nie został zmodyfikowany (`isDirty === false`):
   - Użytkownik jest natychmiast przekierowywany do strony głównej `/recipes`
2. Jeśli formularz został zmodyfikowany (`isDirty === true`):
   - Wyświetlany jest dialog potwierdzenia z pytaniem "Czy na pewno chcesz anulować? Niezapisane zmiany zostaną utracone."
   - Użytkownik może:
     - Kliknąć "Anuluj" (w dialogu) → dialog się zamyka, użytkownik wraca do formularza
     - Kliknąć "Potwierdź" → localStorage jest czyszczony, użytkownik jest przekierowywany do `/recipes`

### 8.10. Przywracanie draftu

**Akcja**: Użytkownik otwiera stronę `/recipes/new`, a w localStorage znajduje się zapisany draft

**Efekt**:
- Draft jest automatycznie ładowany do formularza (wartości pól są wypełniane)
- Opcjonalnie: wyświetlany jest toast informujący "Przywrócono niezapisany przepis"
- Użytkownik może kontynuować edycję lub usunąć draft klikając "Anuluj"

## 9. Warunki i walidacja

### 9.1. Walidacja po stronie klienta (Zod + react-hook-form)

Wszystkie pola formularza są walidowane zgodnie z `CreateRecipeSchema`:

#### Nazwa przepisu (`name`)
- **Komponent**: `RecipeBasicInfoSection`
- **Warunek**: Pole jest wymagane, minimum 1 znak, maksimum 255 znaków
- **Komunikat błędu**:
  - Puste pole: "Recipe name is required"
  - Zbyt długa nazwa: "Recipe name is too long"
- **Wpływ na UI**: Komunikat błędu wyświetlany pod polem input, border pola zmienia kolor na czerwony

#### Opis (`description`)
- **Komponent**: `RecipeBasicInfoSection`
- **Warunek**: Pole opcjonalne, brak ograniczeń
- **Komunikat błędu**: Brak
- **Wpływ na UI**: Brak

#### Składniki (`ingredients`)
- **Komponent**: `EditableIngredientsList`
- **Warunek**: Każdy składnik musi mieć:
  - `content`: minimum 1 znak
  - `position`: liczba całkowita dodatnia
- **Komunikat błędu**: "Ingredient content cannot be empty"
- **Wpływ na UI**: Komunikat błędu wyświetlany pod polem input składnika

#### Kroki (`steps`)
- **Komponent**: `EditableStepsList`
- **Warunek**: Każdy krok musi mieć:
  - `content`: minimum 1 znak
  - `position`: liczba całkowita dodatnia
- **Komunikat błędu**: "Step content cannot be empty"
- **Wpływ na UI**: Komunikat błędu wyświetlany pod polem textarea kroku

#### Tagi (`tags`)
- **Komponent**: `TagInput`
- **Warunek**: Każdy tag musi być niepustym stringiem (minimum 1 znak)
- **Komunikat błędu**: "Tag name cannot be empty"
- **Wpływ na UI**: Tag nie jest dodawany do listy, brak wizualnego komunikatu (walidacja odbywa się przed dodaniem)

### 9.2. Warunki aktywacji przycisków

#### Przycisk "Zapisz przepis"
- **Warunek aktywacji**: `isDirty === true && !isSubmitting`
- **Warunek dezaktywacji**: `isDirty === false || isSubmitting`
- **Wpływ na UI**:
  - Aktywny: klikanie możliwe, normalny styl
  - Nieaktywny: kolor szary, kursor `not-allowed`, klikanie zablokowane
  - Podczas wysyłania: tekst "Zapisywanie...", spinner (opcjonalnie)

#### Przycisk "Anuluj"
- **Warunek aktywacji**: `!isSubmitting`
- **Warunek dezaktywacji**: `isSubmitting`
- **Wpływ na UI**: Przycisk jest nieaktywny tylko podczas wysyłania formularza

#### Przycisk "Dodaj składnik"
- **Warunek aktywacji**: Zawsze aktywny
- **Wpływ na UI**: Brak

#### Przycisk "Usuń składnik"
- **Warunek aktywacji**: `ingredients.length > 1`
- **Warunek dezaktywacji**: `ingredients.length === 1`
- **Wpływ na UI**: Przycisk jest nieaktywny, gdy lista ma tylko jeden element (nie można usunąć ostatniego)

#### Przycisk "Dodaj krok"
- **Warunek aktywacji**: Zawsze aktywny
- **Wpływ na UI**: Brak

#### Przycisk "Usuń krok"
- **Warunek aktywacji**: `steps.length > 1`
- **Warunek dezaktywacji**: `steps.length === 1`
- **Wpływ na UI**: Przycisk jest nieaktywny, gdy lista ma tylko jeden element (nie można usunąć ostatniego)

#### Przycisk "Dodaj" (tag)
- **Warunek aktywacji**: `newTagValue.trim().length > 0`
- **Warunek dezaktywacji**: `newTagValue.trim().length === 0`
- **Wpływ na UI**: Przycisk jest nieaktywny, gdy pole tagu jest puste

### 9.3. Walidacja po stronie serwera

Endpoint `/api/recipes` (POST) wykonuje następujące walidacje:

1. **Parsowanie JSON**: Sprawdza, czy request body to poprawny JSON
   - Błąd: 400 Bad Request - "Invalid JSON in request body"

2. **Walidacja schematu**: Sprawdza, czy dane spełniają `CreateRecipeSchema`
   - Błąd: 400 Bad Request - "Validation failed" + szczegóły błędów

3. **Autoryzacja**: Sprawdza, czy użytkownik jest zalogowany
   - Błąd: 401 Unauthorized (w produkcji)

4. **Utworzenie przepisu**: Próbuje zapisać przepis w bazie danych
   - Błąd: 500 Internal Server Error - "Failed to create recipe"

### 9.4. Dostępność (a11y)

- Wszystkie pola formularza mają etykiety (`<Label>`)
- Komunikaty błędów są powiązane z polami (`aria-describedby` - obsługiwane przez shadcn/ui `FormMessage`)
- Przyciski mają odpowiednie stany `disabled` i `aria-disabled`
- Nawigacja klawiaturą działa prawidłowo (Tab, Enter, Escape)
- Fokus jest odpowiednio zarządzany (po dodaniu nowego pola, fokus może być przeniesiony do niego)

## 10. Obsługa błędów

### 10.1. Błędy walidacji formularza

**Scenariusz**: Użytkownik próbuje wysłać formularz z nieprawidłowymi danymi (np. pusta nazwa)

**Obsługa**:
1. React-hook-form blokuje wysłanie formularza
2. Zod zwraca błędy walidacji
3. Komunikaty błędów są wyświetlane pod odpowiednimi polami
4. Fokus jest przenoszony do pierwszego pola z błędem (opcjonalnie)
5. Formularz nie jest wysyłany do API

**Wynik**: Użytkownik widzi konkretne komunikaty błędów i może je naprawić

### 10.2. Błąd sieci (network error)

**Scenariusz**: Użytkownik próbuje zapisać przepis, ale serwer jest niedostępny lub nie ma połączenia z internetem

**Obsługa**:
1. Fetch rzuca błąd (np. `TypeError: Failed to fetch`)
2. Hook `useCreateRecipe` wyłapuje błąd w `onError`
3. Wyświetlany jest toast: "Błąd podczas tworzenia przepisu: Failed to fetch"
4. Formularz pozostaje w stanie edycji, dane w localStorage są zachowane
5. Użytkownik może spróbować ponownie

**Wynik**: Użytkownik jest informowany o problemie i może ponowić próbę

### 10.3. Błąd 400 Bad Request (walidacja po stronie serwera)

**Scenariusz**: Dane formularza przeszły walidację klienta, ale serwer wykrył błąd (np. niespójność danych)

**Obsługa**:
1. API zwraca 400 z JSON: `{ "error": "Validation failed", "details": [...] }`
2. Hook `useCreateRecipe` parsuje odpowiedź i rzuca `Error` z komunikatem
3. Wyświetlany jest toast: "Błąd podczas tworzenia przepisu: Validation failed"
4. Formularz pozostaje w stanie edycji

**Wynik**: Użytkownik widzi komunikat o błędzie walidacji

### 10.4. Błąd 401 Unauthorized

**Scenariusz**: Użytkownik nie jest zalogowany (sesja wygasła)

**Obsługa**:
1. API zwraca 401
2. Hook `useCreateRecipe` rzuca `Error`: "Musisz być zalogowany, aby utworzyć przepis"
3. Wyświetlany jest toast z tym komunikatem
4. Opcjonalnie: użytkownik jest przekierowywany do strony logowania

**Wynik**: Użytkownik jest informowany o konieczności zalogowania

### 10.5. Błąd 500 Internal Server Error

**Scenariusz**: Problem po stronie serwera (błąd bazy danych, crash aplikacji)

**Obsługa**:
1. API zwraca 500 z JSON: `{ "error": "Internal server error", "message": "..." }`
2. Hook `useCreateRecipe` rzuca `Error`: "Nie udało się utworzyć przepisu"
3. Wyświetlany jest toast: "Błąd podczas tworzenia przepisu: Nie udało się utworzyć przepisu"
4. Formularz pozostaje w stanie edycji, dane w localStorage są zachowane

**Wynik**: Użytkownik jest informowany o problemie i może spróbować ponownie

### 10.6. Błąd parsowania draftu z localStorage

**Scenariusz**: localStorage zawiera uszkodzone dane (np. niepoprawny JSON)

**Obsługa**:
1. `JSON.parse()` rzuca błąd
2. Błąd jest wyłapywany w `try-catch`
3. localStorage jest czyszczony: `localStorage.removeItem(DRAFT_KEY)`
4. Komunikat błędu jest logowany w konsoli: `console.error("Failed to restore draft:", error)`
5. Formularz ładuje się z pustymi wartościami domyślnymi

**Wynik**: Użytkownik nie widzi błędu, aplikacja działa normalnie z pustym formularzem

### 10.7. Błąd przypadkowego zamknięcia karty

**Scenariusz**: Użytkownik przypadkowo zamyka kartę przeglądarki podczas wypełniania formularza

**Obsługa**:
1. Auto-save zapisał draft do localStorage (przed zamknięciem)
2. Gdy użytkownik ponownie otwiera `/recipes/new`, draft jest automatycznie przywracany
3. Toast informuje: "Przywrócono niezapisany przepis" (opcjonalnie)

**Wynik**: Użytkownik może kontynuować pracę od miejsca, w którym przerwał

### 10.8. Puste składniki lub kroki

**Scenariusz**: Użytkownik zostawia niektóre pola składników lub kroków puste

**Obsługa**:
1. Walidacja Zod wykrywa puste pola (`min(1, "... cannot be empty")`)
2. Komunikaty błędów są wyświetlane pod pustymi polami
3. Formularz nie jest wysyłany
4. Użytkownik musi wypełnić puste pola lub je usunąć

**Wynik**: Użytkownik widzi, które pola wymagają uzupełnienia

## 11. Kroki implementacji

### Krok 1: Utworzenie nowego custom hooka `useCreateRecipe`

**Plik**: `src/components/recipes/hooks/useCreateRecipe.ts`

**Opis**: Stworzyć custom hook oparty na `useMutation` z React Query, który:
- Wykonuje POST request do `/api/recipes`
- Obsługuje odpowiedzi: 201 Created, 400 Bad Request, 401 Unauthorized, 500 Internal Server Error
- Wyświetla toast notifications (sukces/błąd)
- Inwaliduje query cache dla listy przepisów i tagów
- Czyści localStorage po sukcesie
- Przekierowuje do widoku szczegółowego nowo utworzonego przepisu

**Wzór**: `src/components/recipes/hooks/useUpdateRecipe.ts`

**Zależności**:
```typescript
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CreateRecipeCommand, RecipeDetailDto } from "@/types";
import { queryClient } from "@/store/query";
```

### Krok 2: Dodanie nowych typów do `types.ts`

**Plik**: `src/components/recipes/types.ts`

**Opis**: Dodać następujące nowe interfejsy:

```typescript
// 1. Props dla głównego komponentu formularza
export interface ManualRecipeFormProps {
  // Pusty interfejs - komponent nie przyjmuje propsów
}

// 2. Props dla komponentu CreateRecipeBasicInfoSection
export interface CreateRecipeBasicInfoSectionProps {
  control: import("react-hook-form").Control<import("@/types").CreateRecipeCommand>;
}

// 3. Props dla komponentu CreateRecipeIngredientsList
export interface CreateRecipeIngredientsListProps {
  control: import("react-hook-form").Control<import("@/types").CreateRecipeCommand>;
}

// 4. Props dla komponentu CreateRecipeStepsList
export interface CreateRecipeStepsListProps {
  control: import("react-hook-form").Control<import("@/types").CreateRecipeCommand>;
}

// 5. Props dla komponentu CreateRecipeTagInput
export interface CreateRecipeTagInputProps {
  control: import("react-hook-form").Control<import("@/types").CreateRecipeCommand>;
}
```

**Modyfikacja istniejącego interfejsu**:
```typescript
// Zmodyfikować istniejący interfejs FormActionButtonsProps
export interface FormActionButtonsProps {
  onCancel: () => void;
  isSubmitting: boolean;
  isDirty: boolean;
  submitButtonText?: string; // DODAĆ ten opcjonalny props
}
```

### Krok 3: Utworzenie komponentu `CreateRecipeBasicInfoSection`

**Plik**: `src/components/recipes/form/CreateRecipeBasicInfoSection.tsx`

**Opis**: Skopiować implementację z `RecipeBasicInfoSection.tsx` i zmienić:
- Nazwę komponentu na `CreateRecipeBasicInfoSection`
- Import typu z `RecipeBasicInfoSectionProps` na `CreateRecipeBasicInfoSectionProps`
- Wszystkie pozostałe części pozostają identyczne

### Krok 4: Utworzenie komponentu `CreateRecipeIngredientsList`

**Plik**: `src/components/recipes/form/CreateRecipeIngredientsList.tsx`

**Opis**: Skopiować implementację z `EditableIngredientsList.tsx` i zmienić:
- Nazwę komponentu na `CreateRecipeIngredientsList`
- Import typu z `EditableIngredientsListProps` na `CreateRecipeIngredientsListProps`
- Wszystkie pozostałe części pozostają identyczne (w tym `EditableSectionHeader` może być używany bez zmian)

### Krok 5: Utworzenie komponentu `CreateRecipeStepsList`

**Plik**: `src/components/recipes/form/CreateRecipeStepsList.tsx`

**Opis**: Skopiować implementację z `EditableStepsList.tsx` i zmienić:
- Nazwę komponentu na `CreateRecipeStepsList`
- Import typu z `EditableStepsListProps` na `CreateRecipeStepsListProps`
- Wszystkie pozostałe części pozostają identyczne (w tym `EditableSectionHeader` może być używany bez zmian)

### Krok 6: Utworzenie komponentu `CreateRecipeTagInput`

**Plik**: `src/components/recipes/form/CreateRecipeTagInput.tsx`

**Opis**: Skopiować implementację z `TagInput.tsx` i zmienić:
- Nazwę komponentu na `CreateRecipeTagInput`
- Import typu z `TagInputProps` na `CreateRecipeTagInputProps`
- Wszystkie pozostałe części pozostają identyczne (w tym `TagPill` może być używany bez zmian)

### Krok 7: Modyfikacja `FormActionButtons` dla dynamicznego tekstu przycisku

**Plik**: `src/components/recipes/form/FormActionButtons.tsx`

**Opis**: Dodać obsługę opcjonalnego propa `submitButtonText`:

**Zmiana w propsach** (już dodane w Kroku 2):
```typescript
export interface FormActionButtonsProps {
  onCancel: () => void;
  isSubmitting: boolean;
  isDirty: boolean;
  submitButtonText?: string; // Nowy props
}
```

**Zmiana w komponencie**:
```typescript
export function FormActionButtons({
  onCancel,
  isSubmitting,
  isDirty,
  submitButtonText // Dodać ten props
}: FormActionButtonsProps) {
  return (
    <div className="flex items-center justify-end gap-4 pt-6 border-t">
      <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="px-6">
        Anuluj
      </Button>

      <Button type="submit" disabled={!isDirty || isSubmitting} className="px-6">
        {isSubmitting ? "Zapisywanie..." : (submitButtonText || "Zapisz zmiany")}
      </Button>
    </div>
  );
}
```

### Krok 8: Utworzenie komponentu `ManualRecipeForm`

**Plik**: `src/components/recipes/form/ManualRecipeForm.tsx`

**Opis**: Stworzyć główny komponent formularza dla ręcznego tworzenia przepisu:
- Używa `useForm` z `CreateRecipeSchema`
- Definiuje puste wartości początkowe
- Implementuje `onSubmit` z użyciem `useCreateRecipe`
- Implementuje `handleCancel` z logiką dialogu potwierdzenia
- Implementuje auto-save do localStorage (useEffect + debounce)
- Implementuje przywracanie draftu z localStorage (useEffect przy montowaniu)
- Renderuje wszystkie sekcje formularza (**NOWE komponenty**: CreateRecipeBasicInfoSection, CreateRecipeTagInput, CreateRecipeIngredientsList, CreateRecipeStepsList, oraz zmodyfikowany FormActionButtons)
- Renderuje dialog potwierdzenia anulowania (CancelRecipeEditDialog - istniejący)

**Wzór**: `src/components/recipes/form/RecipeEditForm.tsx`

**Główne różnice od RecipeEditForm**:
- Brak propsów `initialData` i `recipeId`
- Używa `CreateRecipeSchema` zamiast `UpdateRecipeSchema`
- Używa `useCreateRecipe` zamiast `useUpdateRecipe`
- Implementuje auto-save i przywracanie draftu
- Przekierowuje do `/recipes/{newId}` zamiast `/recipes/{existingId}`

**Struktura komponentu**:
```typescript
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";

export function ManualRecipeForm() {
  // Stan lokalny
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Formularz
  const form = useForm({
    schema: CreateRecipeSchema,
    defaultValues: { /* puste wartości */ },
  });

  // Mutation hook
  const createMutation = useCreateRecipe();

  // Auto-save do localStorage z useDebouncedCallback
  const saveDraft = useDebouncedCallback((formData) => {
    // Zapisz draft do localStorage
    const draft = { ...formData, timestamp: Date.now() };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, 1000);

  useEffect(() => {
    const subscription = form.watch(saveDraft);
    return () => subscription.unsubscribe();
  }, [form.watch, saveDraft]);

  // Przywracanie draftu
  useEffect(() => { /* ... */ }, []);

  // Handlers
  const onSubmit = (data: CreateRecipeCommand) => { /* ... */ };
  const handleCancel = () => { /* ... */ };
  const handleCancelConfirm = () => { /* ... */ };

  // Render
  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* Sekcje formularza */}
        </form>
      </Form>

      <CancelRecipeEditDialog /* ... */ />
    </>
  );
}
```

### Krok 9: Utworzenie strony Astro `/recipes/new`

**Plik**: `src/pages/recipes/new.astro`

**Opis**: Stworzyć nową stronę Astro dla widoku tworzenia przepisu:
- Ustawić `export const prerender = false` (SSR)
- Zaimportować layout (np. `MainLayout`)
- Zaimportować komponent `ManualRecipeForm` z flagą `client:only="react"`
- Dodać nagłówek strony ("Nowy przepis")
- Stylowanie zgodnie z innymi widokami

**Struktura**:
```astro
---
import MainLayout from "@/layouts/MainLayout.astro";
import { ManualRecipeForm } from "@/components/recipes/form/ManualRecipeForm";

export const prerender = false;
---

<MainLayout title="Nowy przepis">
  <div class="container mx-auto py-8 px-4">
    <header class="mb-8">
      <h1 class="text-3xl font-bold">Utwórz nowy przepis</h1>
      <p class="text-muted-foreground mt-2">
        Wypełnij formularz, aby dodać nowy przepis do swojej kolekcji.
      </p>
    </header>

    <ManualRecipeForm client:only="react" />
  </div>
</MainLayout>
```

### Krok 6: Dodanie przycisku "Ręcznie" na stronie głównej

**Plik**: Strona główna z listą przepisów (prawdopodobnie `src/pages/recipes/index.astro` lub `src/pages/index.astro`)

**Opis**: Dodać przycisk "Ręcznie" obok przycisku "Z AI" (US-006), który przekierowuje do `/recipes/new`:

```astro
<div class="flex gap-4">
  <a href="/recipes/new-ai">
    <Button variant="default">Z AI</Button>
  </a>
  <a href="/recipes/new">
    <Button variant="outline">Ręcznie</Button>
  </a>
</div>
```
---

## Podsumowanie

Plan implementacji obejmuje:
- **1 nowy custom hook**: `useCreateRecipe`
- **1 nowy komponent React**: `ManualRecipeForm`
- **1 nowa strona Astro**: `/recipes/new`
- **Modyfikacja**: Dodanie przycisku "Ręcznie" na stronie głównej
- **Opcjonalna modyfikacja**: `FormActionButtons` dla dynamicznego tekstu przycisku

Wszystkie pozostałe komponenty (`RecipeBasicInfoSection`, `EditableIngredientsList`, `EditableStepsList`, `TagInput`, `FormActionButtons`, `CancelRecipeEditDialog`) są wykorzystywane ponownie bez zmian, co zapewnia spójność interfejsu i minimalizuje duplikację kodu.

Implementacja będzie zgodna z PRD (FR-004, FR-010, US-006), zasadami projektowymi (`form.mdc`, `api-hooks.mdc`) oraz istniejącym stosem technologicznym (Astro, React, Zod, React Query, shadcn/ui).
