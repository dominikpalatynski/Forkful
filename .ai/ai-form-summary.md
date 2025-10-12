# AI Recipe Form - Dokumentacja Techniczna

## Spis Treści
1. [Przegląd Architektury](#przegląd-architektury)
2. [Przepływ Danych](#przepływ-danych)
3. [Szczegółowy Opis Komponentów](#szczegółowy-opis-komponentów)
4. [Zarządzanie Stanem](#zarządzanie-stanem)
5. [Hooki i API](#hooki-i-api)
6. [Dialogi Potwierdzenia](#dialogi-potwierdzenia)
7. [Walidacja Formularzy](#walidacja-formularzy)
8. [Persistence i Cache](#persistence-i-cache)
9. [Jak Edytować Kod](#jak-edytować-kod)

---

## Przegląd Architektury

### Struktura Plików

```
src/
├── components/recipes/
│   ├── AIRecipeForm.tsx                    # Główny orchestrator (parent)
│   ├── form/
│   │   ├── AIRecipeTextInput.tsx          # Faza 'input' - wprowadzanie tekstu
│   │   ├── AIEditRecipeForm.tsx           # Faza 'edit' - edycja wygenerowanych danych
│   │   ├── AIFormActionButtons.tsx        # Przyciski akcji w fazie 'edit'
│   │   └── CharacterCounter.tsx           # Licznik znaków
│   ├── hooks/
│   │   ├── useGenerateRecipe.ts           # Hook do generowania przepisu z AI
│   │   └── useCreateRecipe.ts             # Hook do zapisywania przepisu
│   └── types.ts                            # TypeScript interfaces
├── store/
│   └── ai-recipe-form.store.ts            # Zustand store z persistence
└── types.ts                                # Globalne typy (DTOs, Commands)
```

### Główne Fazy Aplikacji

AIRecipeForm ma **dwie fazy** (kontrolowane przez `phase` w Zustand store):

1. **Faza 'input'** - Użytkownik wpisuje tekst opisujący przepis
2. **Faza 'edit'** - Użytkownik edytuje wygenerowany przepis przed zapisem

```
┌─────────────────────────────────────────────────────────────────┐
│                       AIRecipeForm                              │
│                    (Main Orchestrator)                          │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ├─── phase === 'input'
                            │    └─→ AIRecipeTextInput
                            │        └─→ useForm (react-hook-form + zod)
                            │
                            └─── phase === 'edit'
                                 └─→ AIEditRecipeForm
                                     └─→ useForm (react-hook-form + zod)
```

---

## Przepływ Danych

### 1. Faza 'input' - Wprowadzanie Tekstu

```
┌──────────────────┐
│  User wpisuje    │
│  tekst (100-1000 │
│  znaków)         │
└────────┬─────────┘
         │
         ▼
┌────────────────────────────────────────────────────────────────┐
│ AIRecipeTextInput (useForm)                                    │
│ - Walidacja: zod schema (min 100, max 1000)                   │
│ - onChange: sync z AIRecipeForm → setInputText (Zustand)      │
│ - onSubmit: wywołuje handleGenerate                           │
└────────┬───────────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────────────┐
│ handleGenerate w AIRecipeForm                                  │
│ - Wywołuje generateMutation.mutate({ inputText })             │
└────────┬───────────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────────────┐
│ useGenerateRecipe hook                                         │
│ - POST /api/recipes/generate                                   │
│ - Obsługa błędów: 400, 401, 422, 500                          │
│ - Toast notifications                                          │
└────────┬───────────────────────────────────────────────────────┘
         │
         ▼ SUCCESS
┌────────────────────────────────────────────────────────────────┐
│ onSuccess callback                                             │
│ - setGeneratedData(data, generationId) → Zustand store        │
│ - Store automatycznie zmienia phase: 'input' → 'edit'         │
└────────┬───────────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────────────┐
│ Re-render: AIRecipeForm renderuje AIEditRecipeForm            │
└────────────────────────────────────────────────────────────────┘
```

### 2. Faza 'edit' - Edycja Wygenerowanych Danych

```
┌──────────────────┐
│  User edytuje    │
│  wygenerowany    │
│  przepis         │
└────────┬─────────┘
         │
         ▼
┌────────────────────────────────────────────────────────────────┐
│ AIEditRecipeForm (useForm)                                     │
│ - initialData: GeneratedRecipeDto z Zustand                   │
│ - Reużywa komponenty z manual creation:                       │
│   - CreateRecipeBasicInfoSection (name, description)          │
│   - CreateRecipeIngredientsList                               │
│   - CreateRecipeStepsList                                     │
│   - CreateRecipeTagInput                                      │
│ - Walidacja: zod schema (createRecipeSchema)                  │
│ - onSubmit: wywołuje handleSubmit w AIRecipeForm              │
└────────┬───────────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────────────┐
│ handleSubmit w AIRecipeForm                                    │
│ - Wywołuje createMutation.mutate(data)                        │
│ - data zawiera generationId z Zustand                         │
└────────┬───────────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────────────┐
│ useCreateRecipe hook                                           │
│ - POST /api/recipes (z generationId)                          │
│ - Obsługa błędów: 400, 401                                    │
└────────┬───────────────────────────────────────────────────────┘
         │
         ▼ SUCCESS
┌────────────────────────────────────────────────────────────────┐
│ onSuccess callback w useCreateRecipe                           │
│ 1. Invalidate queries (recipes, tags)                         │
│ 2. Remove manual recipe draft z localStorage                  │
│ 3. onSuccessBeforeRedirect() → reset() Zustand store          │
│ 4. Toast success                                               │
│ 5. Redirect do /recipes/:id                                    │
└────────────────────────────────────────────────────────────────┘
```

---

## Szczegółowy Opis Komponentów

### AIRecipeForm.tsx (Parent Component)

**Lokalizacja:** `src/components/recipes/AIRecipeForm.tsx`

**Odpowiedzialności:**
- Orchestracja dwóch faz (input/edit)
- Zarządzanie dialogami potwierdzenia
- Koordynacja komunikacji między child components a Zustand store
- Obsługa mutation hooks (useGenerateRecipe, useCreateRecipe)

**State:**
```typescript
// Z Zustand store
const {
  phase,              // 'input' | 'edit'
  inputText,          // Tekst wprowadzony przez usera
  generationId,       // ID generacji z API
  generatedData,      // Dane wygenerowane przez AI
  setInputText,       // Setter dla inputText
  setGeneratedData,   // Setter + zmiana phase na 'edit'
  goBackToInput,      // Reset do fazy 'input' (zachowuje inputText)
  reset,              // Całkowity reset store
} = useAIRecipeFormStore();

// Local state
const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
const [isBackToTextDialogOpen, setIsBackToTextDialogOpen] = useState(false);
```

**Kluczowe Handlery:**

1. **handleGenerate** (linia 71-83)
   - Wywoływany z AIRecipeTextInput po kliknięciu "Generuj przepis"
   - Wywołuje `generateMutation.mutate({ inputText })`
   - onSuccess: `setGeneratedData(data, generationId)` → przejście do fazy 'edit'

2. **handleInputChange** (linia 88-93)
   - Sync inputText z child component do Zustand store
   - Wywoływany przy każdej zmianie textarea w AIRecipeTextInput

3. **handleBack** (linia 99-106)
   - Przycisk "Wróć" w fazie 'input'
   - Jeśli `hasData === true` → pokazuje dialog
   - Jeśli `hasData === false` → reset + redirect

4. **handleCancel** (linia 112-119)
   - Przycisk "Anuluj" w fazie 'edit'
   - Zawsze pokazuje dialog (bo generatedData != null)

5. **handleBackToTextEdit** (linia 137-139)
   - Przycisk "Wróć do edycji tekstu" w fazie 'edit'
   - Pokazuje dialog z ostrzeżeniem o porzuceniu danych

6. **handleConfirmBackToText** (linia 141-144)
   - Potwierdzenie dialogu "Wróć do edycji tekstu"
   - Wywołuje `goBackToInput()` → phase: 'edit' → 'input'
   - **Zachowuje** inputText, **usuwa** generatedData i generationId

7. **handleSubmit** (linia 151-160)
   - Submit formularza w AIEditRecipeForm
   - Wywołuje `createMutation.mutate(data)`
   - useCreateRecipe automatycznie resetuje store przed redirectem

**Renderowanie Warunkowe:**

```typescript
if (phase === 'input') {
  return <AIRecipeTextInput /> + <ConfirmationDialog />
}

if (phase === 'edit' && generatedData && generationId) {
  return <AIEditRecipeForm /> + 2x <ConfirmationDialog />
}

// Fallback (nie powinien się wydarzyć)
return <ErrorMessage /> + <ConfirmationDialog />
```

---

### AIRecipeTextInput.tsx (Faza 'input')

**Lokalizacja:** `src/components/recipes/form/AIRecipeTextInput.tsx`

**Odpowiedzialności:**
- Wyświetlanie textarea z walidacją (100-1000 znaków)
- Licznik znaków z kolorowym feedbackiem
- Generowanie przepisu z AI
- Nawigacja "Wróć"

**Struktura:**

```typescript
// Zod schema
const inputTextSchema = z.object({
  inputText: z.string()
    .min(100, "Tekst musi mieć minimum 100 znaków")
    .max(1000, "Tekst może mieć maksymalnie 1000 znaków"),
});

// useForm z custom hook
const form = useForm({
  schema: inputTextSchema,
  defaultValues: { inputText: value },  // value z props (Zustand)
  mode: "onChange",                      // Walidacja na każdą zmianę
});
```

**Props Interface:**
```typescript
interface AIRecipeTextInputProps {
  value: string;                           // Z Zustand store
  onChange: (value: string) => void;       // Sync do Zustand
  onGenerate: (inputText: string) => void; // Trigger generowania
  isGenerating: boolean;                   // Loading state
  onBack: () => void;                      // Nawigacja do "/"
}
```

**Kluczowe Funkcje:**

1. **handleSubmit** (linia 67-71)
   - Callback dla `form.handleSubmit()`
   - Wywołuje `onGenerate(data.inputText.trim())`
   - Wywoływany automatycznie po kliknięciu submit (jeśli `isValid === true`)

2. **handleFieldChange** (linia 77-82)
   - Sync wartości formularza z parent component
   - Wywołuje `onChange(value)` → `setInputText` w AIRecipeForm → Zustand store
   - Używany w custom onChange textarea

**Struktura JSX:**

```tsx
<Form {...form}>
  <form onSubmit={form.handleSubmit(handleSubmit)}>
    {/* Header z przyciskiem Wróć */}
    <Button onClick={onBack}>Wróć</Button>

    {/* Instrukcja */}
    <p>Opisz przepis...</p>

    {/* Textarea z FormField */}
    <FormField
      control={form.control}
      name="inputText"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Opis przepisu</FormLabel>
          <FormControl>
            <Textarea
              {...field}
              onChange={(e) => {
                field.onChange(e);           // React Hook Form
                handleFieldChange(e.value);  // Sync z Zustand
              }}
            />
          </FormControl>
          <CharacterCounter current={charCount} />
          <FormMessage />  {/* Automatyczne błędy z zod */}
        </FormItem>
      )}
    />

    {/* Przycisk Submit */}
    <Button type="submit" disabled={!isValid || isGenerating}>
      Generuj przepis
    </Button>
  </form>
</Form>
```

**Walidacja:**
- `form.formState.isValid` - obliczane automatycznie przez react-hook-form
- Przycisk disabled gdy: `!isValid || isGenerating`
- FormMessage pokazuje błędy z zod schema

---

### AIEditRecipeForm.tsx (Faza 'edit')

**Lokalizacja:** `src/components/recipes/form/AIEditRecipeForm.tsx`

**Odpowiedzialności:**
- Wyświetlanie formularza edycji wygenerowanych danych
- Reużywanie komponentów z manual creation
- Walidacja przed zapisem
- Trzy akcje: zapisz, wróć do tekstu, anuluj

**Struktura:**

```typescript
// Zod schema
const createRecipeSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  generationId: z.string().optional(),
  ingredients: z.array(z.object({
    content: z.string().min(1),
    position: z.number(),
  })).optional(),
  steps: z.array(z.object({
    content: z.string().min(1),
    position: z.number(),
  })).optional(),
  tags: z.array(z.string()).optional(),
});

// useForm
const form = useForm<CreateRecipeCommand>({
  resolver: zodResolver(createRecipeSchema),
  defaultValues: getDefaultValues(),  // Transformacja GeneratedRecipeDto
  mode: "onChange",
});
```

**Props Interface:**
```typescript
interface AIEditRecipeFormProps {
  initialData: GeneratedRecipeDto;          // Z Zustand store
  generationId: string;                      // Z Zustand store
  onSubmit: (data: CreateRecipeCommand) => void;
  onBackToTextEdit: () => void;              // Trigger dialogu
  onCancel: () => void;                      // Trigger dialogu
  isSubmitting: boolean;                     // Loading state
}
```

**Transformacja Danych:**

```typescript
// Funkcja getDefaultValues
const getDefaultValues = (): CreateRecipeCommand => {
  return {
    name: initialData.name,
    description: initialData.description ?? undefined,
    generationId,                              // ← Ważne!
    ingredients: initialData.ingredients || [],
    steps: initialData.steps || [],
    tags: [],
  };
};
```

**Struktura JSX:**

```tsx
<Form {...form}>
  <form onSubmit={form.handleSubmit(handleSubmit)}>
    {/* Header */}
    <h1>Edytuj wygenerowany przepis</h1>

    {/* Reużywane komponenty z manual creation */}
    <CreateRecipeBasicInfoSection control={form.control} />
    <CreateRecipeIngredientsList control={form.control} />
    <CreateRecipeStepsList control={form.control} />
    <CreateRecipeTagInput control={form.control} suggestions={tagSuggestions} />

    {/* Custom przyciski akcji */}
    <AIFormActionButtons
      onBackToTextEdit={onBackToTextEdit}
      onCancel={onCancel}
      isSubmitting={isSubmitting}
      isDirty={form.formState.isDirty}
    />
  </form>
</Form>
```

**handleSubmit:**

```typescript
const handleSubmit = (data: CreateRecipeCommand) => {
  const dataWithGenerationId: CreateRecipeCommand = {
    ...data,
    generationId,  // Dodajemy generationId przed wysłaniem
  };
  onSubmit(dataWithGenerationId);
};
```

---

### AIFormActionButtons.tsx

**Lokalizacja:** `src/components/recipes/form/AIFormActionButtons.tsx`

**Odpowiedzialności:**
- Wyświetlanie trzech przycisków akcji w fazie 'edit'
- Obsługa disabled states

**Props Interface:**
```typescript
interface AIFormActionButtonsProps {
  onBackToTextEdit: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
  isDirty: boolean;
}
```

**Layout:**

```
┌─────────────────────────────────────────────────────────────────┐
│  [← Wróć do edycji tekstu]        [Anuluj]  [Zapisz przepis]   │
└─────────────────────────────────────────────────────────────────┘
```

**Logika:**
```tsx
<div className="flex items-center justify-between">
  {/* Lewy przycisk */}
  <Button
    type="button"
    variant="ghost"
    onClick={onBackToTextEdit}
    disabled={isSubmitting}
  >
    ← Wróć do edycji tekstu
  </Button>

  {/* Prawe przyciski */}
  <div className="flex gap-4">
    <Button
      type="button"
      variant="outline"
      onClick={onCancel}
      disabled={isSubmitting}
    >
      Anuluj
    </Button>

    <Button
      type="submit"
      disabled={!isDirty || isSubmitting}  {/* ← Ważne! */}
    >
      {isSubmitting ? "Zapisywanie..." : "Zapisz przepis"}
    </Button>
  </div>
</div>
```

**isDirty Check:**
- `isDirty` = `form.formState.isDirty` z react-hook-form
- Przycisk "Zapisz" disabled gdy użytkownik nie zmienił nic w formularzu
- Chroni przed przypadkowym zapisem bez edycji

---

### CharacterCounter.tsx

**Lokalizacja:** `src/components/recipes/form/CharacterCounter.tsx`

**Odpowiedzialności:**
- Wyświetlanie licznika "current / max"
- Kolorowanie na podstawie liczby znaków
- Dostępność (ARIA attributes)

**Props Interface:**
```typescript
interface CharacterCounterProps {
  current: number;
  min: number;
  max: number;
}
```

**Logika Kolorowania:**

```typescript
const getColorClass = (): string => {
  if (current < min) {
    return "text-red-600";           // < 100: czerwony
  }
  if (current < min + 50) {
    return "text-orange-600";        // 100-149: pomarańczowy
  }
  return "text-green-600";           // 150+: zielony
};
```

**ARIA Attributes:**

```tsx
<div
  role="status"
  aria-live={current > max ? "assertive" : "polite"}
  aria-label={getAriaLabel()}
>
  {current} / {max}
</div>
```

- `aria-live="assertive"` gdy przekroczono max (ważne!)
- `aria-live="polite"` w pozostałych przypadkach
- `aria-label` z opisowym tekstem dla screen readerów

---

## Zarządzanie Stanem

### Zustand Store (ai-recipe-form.store.ts)

**Lokalizacja:** `src/store/ai-recipe-form.store.ts`

**Struktura State:**

```typescript
interface AIRecipeFormState {
  phase: AIRecipeFormPhase;              // 'input' | 'edit'
  inputText: string;                      // Tekst z textarea
  generationId: string | null;            // ID z API
  generatedData: GeneratedRecipeDto | null;
}
```

**Akcje:**

```typescript
interface AIRecipeFormActions {
  setPhase: (phase: AIRecipeFormPhase) => void;
  setInputText: (text: string) => void;
  setGeneratedData: (data: GeneratedRecipeDto, generationId: string) => void;
  goBackToInput: () => void;
  reset: () => void;
}
```

**Implementacja Akcji:**

1. **setPhase**
   ```typescript
   setPhase: (phase) => set({ phase })
   ```
   - Prosty setter dla phase

2. **setInputText**
   ```typescript
   setInputText: (inputText) => set({ inputText })
   ```
   - Aktualizuje inputText (wywołany z AIRecipeTextInput)

3. **setGeneratedData**
   ```typescript
   setGeneratedData: (generatedData, generationId) =>
     set({
       phase: 'edit',           // ← Automatyczna zmiana fazy!
       generatedData,
       generationId,
     })
   ```
   - Zapisuje dane z API
   - **Automatycznie** zmienia phase na 'edit'
   - Trigger re-renderu AIRecipeForm → renderuje AIEditRecipeForm

4. **goBackToInput**
   ```typescript
   goBackToInput: () =>
     set({
       phase: 'input',
       generatedData: null,
       generationId: null,
       // inputText pozostaje zachowany! ← Ważne!
     })
   ```
   - Powrót do fazy 'input'
   - **Usuwa** generatedData i generationId
   - **Zachowuje** inputText (użytkownik może wygenerować ponownie)

5. **reset**
   ```typescript
   reset: () => set(getDefaultState())
   ```
   - Całkowity reset do stanu początkowego
   - Czyści wszystko (inputText, generatedData, phase)

**Persistence (localStorage):**

```typescript
export const useAIRecipeFormStore = create<AIRecipeFormStore>()(
  persist(
    (set) => ({ /* ... */ }),
    {
      name: 'forkful-ai-recipe-draft',  // Klucz w localStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

- **Automatyczny zapis** do localStorage przy każdej zmianie state
- **Automatyczne odczytanie** przy inicjalizacji aplikacji
- **Klucz:** `forkful-ai-recipe-draft`
- **Czyszczenie:** Wywołane w `useCreateRecipe` przed redirectem

**Przykład w localStorage:**

```json
{
  "state": {
    "phase": "edit",
    "inputText": "Makaron carbonara z boczkiem...",
    "generationId": "abc-123",
    "generatedData": {
      "generationId": "abc-123",
      "name": "Makaron Carbonara",
      "description": "Klasyczny włoski przepis",
      "ingredients": [...],
      "steps": [...]
    }
  },
  "version": 0
}
```

---

## Hooki i API

### useGenerateRecipe.ts

**Lokalizacja:** `src/components/recipes/hooks/useGenerateRecipe.ts`

**Odpowiedzialności:**
- Generowanie przepisu z AI przez API
- Obsługa błędów z toast notifications
- React Query mutation

**Funkcja API:**

```typescript
async function generateRecipe(data: GenerateRecipeCommand): Promise<GeneratedRecipeDto> {
  const response = await fetch("/api/recipes/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),  // { inputText: "..." }
  });

  // Obsługa błędów
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Musisz być zalogowany...");
    }
    if (response.status === 400) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Nieprawidłowe dane...");
    }
    if (response.status === 422) {
      throw new Error("Tekst jest zbyt krótki lub niepoprawny");
    }
    if (response.status === 500) {
      throw new Error("Błąd serwera...");
    }
    throw new Error("Nie udało się wygenerować przepisu");
  }

  return response.json();  // GeneratedRecipeDto
}
```

**Hook:**

```typescript
export function useGenerateRecipe() {
  const mutation = useMutation({
    mutationFn: generateRecipe,
    onError: (error: Error) => {
      toast.error(`Błąd podczas generowania przepisu: ${error.message}`);
    },
  }, queryClient);

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error as Error | null,
    isSuccess: mutation.isSuccess,
    data: mutation.data,        // GeneratedRecipeDto
    reset: mutation.reset,
  } as const;
}
```

**Użycie w AIRecipeForm:**

```typescript
const generateMutation = useGenerateRecipe();

const handleGenerate = (text: string) => {
  generateMutation.mutate(
    { inputText: text },
    {
      onSuccess: (data) => {
        setGeneratedData(data, data.generationId);  // Zustand action
      },
    }
  );
};
```

---

### useCreateRecipe.ts

**Lokalizacja:** `src/components/recipes/hooks/useCreateRecipe.ts`

**Odpowiedzialności:**
- Zapisywanie przepisu do bazy danych
- Invalidacja cache React Query
- Czyszczenie localStorage (manual + AI draft)
- Redirect do nowo utworzonego przepisu
- Toast notifications

**Options Interface:**

```typescript
interface UseCreateRecipeOptions {
  onSuccessBeforeRedirect?: () => void;  // Callback przed redirectem
}
```

**Funkcja API:**

```typescript
async function createRecipe(data: CreateRecipeCommand): Promise<RecipeDetailDto> {
  const response = await fetch("/api/recipes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Musisz być zalogowany...");
    }
    if (response.status === 400) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Walidacja nie powiodła się");
    }
    throw new Error("Nie udało się utworzyć przepisu");
  }

  return response.json();  // RecipeDetailDto
}
```

**Hook:**

```typescript
export function useCreateRecipe(options?: UseCreateRecipeOptions) {
  const mutation = useMutation({
    mutationFn: createRecipe,
    onSuccess: (createdRecipe: RecipeDetailDto) => {
      // 1. Invalidacja cache
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });

      // 2. Czyszczenie localStorage (manual draft)
      localStorage.removeItem(DRAFT_KEY);

      // 3. Callback przed redirectem (AI form cleanup)
      if (options?.onSuccessBeforeRedirect) {
        options.onSuccessBeforeRedirect();  // ← reset() z Zustand
      }

      // 4. Toast + redirect
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

  return { /* ... */ };
}
```

**Użycie w AIRecipeForm:**

```typescript
const createMutation = useCreateRecipe({
  onSuccessBeforeRedirect: () => {
    reset();  // Zustand: czyści 'forkful-ai-recipe-draft' z localStorage
  },
});

const handleSubmit = (data: CreateRecipeCommand) => {
  createMutation.mutate(data);
  // Automatyczne:
  // 1. Reset Zustand store
  // 2. Usunięcie manual draft
  // 3. Redirect do /recipes/:id
};
```

**Lifecycle po kliknięciu "Zapisz przepis":**

```
1. createMutation.mutate(data)
   ↓
2. POST /api/recipes (z generationId)
   ↓
3. onSuccess callback:
   ├── Invalidate cache ["recipes", "tags"]
   ├── Remove "forkful_recipe_draft" (manual)
   ├── onSuccessBeforeRedirect() → reset() → Remove "forkful-ai-recipe-draft"
   ├── Toast success (1.5s)
   └── window.location.href = `/recipes/${id}`
```

---

## Dialogi Potwierdzenia

### Typy Dialogów

AIRecipeForm używa **3 dialogi** (ConfirmationDialog):

1. **Dialog "Anuluj"** - Całkowite wyjście z formularza
2. **Dialog "Wróć do edycji tekstu"** - Powrót do fazy 'input'
3. **Dialog w fazie 'input'** - Wyjście z nieukończonym tekstem

### 1. Dialog "Anuluj" (Faza 'edit')

**Trigger:** Przycisk "Anuluj" w AIFormActionButtons

**State:** `isConfirmDialogOpen`

**Logika:**

```typescript
const handleCancel = () => {
  if (hasData) {
    setIsConfirmDialogOpen(true);  // Pokazuje dialog
  } else {
    reset();
    window.location.href = "/";
  }
};

const handleConfirmCancel = () => {
  reset();                           // Zustand: usuwa wszystko
  window.location.href = "/";
};
```

**JSX:**

```tsx
<ConfirmationDialog
  isOpen={isConfirmDialogOpen}
  onOpenChange={setIsConfirmDialogOpen}
  title="Odrzucić wprowadzone dane?"
  description="Masz wygenerowany przepis. Czy na pewno chcesz wyjść bez zapisywania?"
  cancelButton={{ text: "Powrót" }}
  actionButton={{
    text: "Odrzuć dane",
    onClick: handleConfirmCancel,
  }}
/>
```

**Efekt:** Całkowita utrata danych + redirect do `/`

---

### 2. Dialog "Wróć do edycji tekstu" (Faza 'edit')

**Trigger:** Przycisk "Wróć do edycji tekstu" w AIFormActionButtons

**State:** `isBackToTextDialogOpen`

**Logika:**

```typescript
const handleBackToTextEdit = () => {
  setIsBackToTextDialogOpen(true);  // Zawsze pokazuje dialog
};

const handleConfirmBackToText = () => {
  goBackToInput();                   // Zustand: phase → 'input'
  setIsBackToTextDialogOpen(false);
};
```

**JSX:**

```tsx
<ConfirmationDialog
  isOpen={isBackToTextDialogOpen}
  onOpenChange={setIsBackToTextDialogOpen}
  title="Wrócić do edycji tekstu?"
  description="Powrót do edycji tekstu spowoduje porzucenie wygenerowanego przepisu. Będziesz musiał wygenerować przepis ponownie."
  cancelButton={{ text: "Anuluj" }}
  actionButton={{
    text: "Wróć do tekstu",
    onClick: handleConfirmBackToText,
  }}
/>
```

**Efekt:**
- Powrót do fazy 'input'
- **Zachowuje** inputText
- **Usuwa** generatedData i generationId
- Użytkownik może edytować tekst i wygenerować ponownie

---

### 3. Dialog w Fazie 'input'

**Trigger:** Przycisk "Wróć" w AIRecipeTextInput

**State:** `isConfirmDialogOpen` (ten sam co dla "Anuluj")

**Logika:**

```typescript
const hasData = useMemo(() => {
  return inputText.trim().length > 0 || generatedData !== null;
}, [inputText, generatedData]);

const handleBack = () => {
  if (hasData) {
    setIsConfirmDialogOpen(true);  // Dialog gdy są dane
  } else {
    reset();
    window.location.href = "/";    // Bezpośredni redirect
  }
};
```

**JSX:**

```tsx
<ConfirmationDialog
  isOpen={isConfirmDialogOpen}
  onOpenChange={setIsConfirmDialogOpen}
  title="Odrzucić wprowadzone dane?"
  description="Masz wprowadzony tekst. Czy na pewno chcesz wyjść bez generowania przepisu?"
  cancelButton={{ text: "Powrót" }}
  actionButton={{
    text: "Odrzuć dane",
    onClick: handleConfirmCancel,
  }}
/>
```

**Efekt:** Utrata inputText + redirect do `/`

---

### Podsumowanie Dialogów

| Dialog | Faza | Trigger | Warunek | Akcja |
|--------|------|---------|---------|-------|
| "Anuluj" | edit | Przycisk "Anuluj" | generatedData !== null | reset() + redirect |
| "Wróć do tekstu" | edit | Przycisk "Wróć do edycji tekstu" | Zawsze | goBackToInput() |
| "Wróć" (input) | input | Przycisk "Wróć" | inputText.length > 0 | reset() + redirect |

---

## Walidacja Formularzy

### Faza 'input' - inputTextSchema

**Lokalizacja:** `AIRecipeTextInput.tsx` (linia 17-22)

```typescript
const inputTextSchema = z.object({
  inputText: z
    .string()
    .min(MIN_CHARS, `Tekst musi mieć minimum ${MIN_CHARS} znaków`)
    .max(MAX_CHARS, `Tekst może mieć maksymalnie ${MAX_CHARS} znaków`),
});

// MIN_CHARS = 100
// MAX_CHARS = 1000
```

**Walidacja:**
- Minimum 100 znaków (czerwony licznik)
- Maksimum 1000 znaków (validation error)
- Walidacja on change (`mode: "onChange"`)
- Przycisk submit disabled gdy `!isValid`

**Wyświetlanie błędów:**
- `<FormMessage />` automatycznie pokazuje błędy z zod
- CharacterCounter pokazuje kolorowe wskazanie (czerwony/pomarańczowy/zielony)

---

### Faza 'edit' - createRecipeSchema

**Lokalizacja:** `AIEditRecipeForm.tsx` (linia 22-44)

```typescript
const createRecipeSchema = z.object({
  name: z.string()
    .min(1, "Nazwa przepisu jest wymagana")
    .max(255, "Nazwa jest zbyt długa"),
  description: z.string().optional(),
  generationId: z.string().optional(),
  ingredients: z.array(z.object({
    content: z.string().min(1, "Składnik nie może być pusty"),
    position: z.number(),
  })).optional(),
  steps: z.array(z.object({
    content: z.string().min(1, "Krok nie może być pusty"),
    position: z.number(),
  })).optional(),
  tags: z.array(z.string()).optional(),
});
```

**Walidacja:**
- **name:** Required, 1-255 znaków
- **description:** Optional
- **ingredients:** Optional array, content wymagany
- **steps:** Optional array, content wymagany
- **tags:** Optional array
- **generationId:** Optional (ale zawsze dodawany w handleSubmit)

**Walidacja on change:**
```typescript
const form = useForm({
  resolver: zodResolver(createRecipeSchema),
  mode: "onChange",  // Walidacja przy każdej zmianie
});
```

**Disabled state:**
```typescript
<Button
  type="submit"
  disabled={!isDirty || isSubmitting}
>
  Zapisz przepis
</Button>
```

- `!isDirty` - użytkownik nie zmienił nic (chroni przed przypadkowym submit)
- `isSubmitting` - trwa zapisywanie (uniemożliwia double-submit)

---

## Persistence i Cache

### localStorage

Aplikacja używa **2 klucze** w localStorage:

#### 1. `forkful-ai-recipe-draft` (AI Recipe Form)

**Zarządzany przez:** Zustand persist middleware

**Zawiera:**
```json
{
  "state": {
    "phase": "edit",
    "inputText": "...",
    "generationId": "abc-123",
    "generatedData": { /* GeneratedRecipeDto */ }
  },
  "version": 0
}
```

**Cykl życia:**
- **Zapis:** Automatyczny przy każdej zmianie state (Zustand)
- **Odczyt:** Automatyczny przy inicjalizacji aplikacji
- **Usunięcie:** `reset()` w useCreateRecipe.onSuccess

**Cel:** Persistence draft'u między sesjami

**Przykład:** Użytkownik zamyka kartę podczas edycji → po powrocie dane są zachowane

---

#### 2. `forkful_recipe_draft` (Manual Recipe Form)

**Zarządzany przez:** Manual localStorage w komponencie ManualRecipeForm

**Zawiera:** Draft ręcznie tworzonego przepisu

**Cykl życia:**
- **Usunięcie:** W `useCreateRecipe.onSuccess`

**Dlaczego usuwane w useCreateRecipe?**
- useCreateRecipe jest współdzielony między AI i manual form
- Po zapisie przepisu oba drafty są nieaktualne

---

### React Query Cache

**Invalidacja cache:**

```typescript
// W useCreateRecipe.onSuccess
queryClient.invalidateQueries({ queryKey: ["recipes"] });
queryClient.invalidateQueries({ queryKey: ["tags"] });
```

**Efekt:**
- Lista przepisów zostanie automatycznie odświeżona
- Lista tagów zostanie automatycznie odświeżona
- Użytkownik po zapisie zobaczy nowy przepis na liście

**Queries:**
- `["recipes"]` - Lista przepisów (useRecipeListState)
- `["tags"]` - Lista tagów (useTags)

---

## Jak Edytować Kod

### Scenariusze Zmian

#### 1. Zmiana limitu znaków (np. 50-2000)

**Pliki do edycji:**
- `AIRecipeTextInput.tsx` (linia 11-12)

```typescript
// Przed:
const MIN_CHARS = 100;
const MAX_CHARS = 1000;

// Po:
const MIN_CHARS = 50;
const MAX_CHARS = 2000;
```

**Efekt:**
- Automatyczna zmiana walidacji zod
- Automatyczna zmiana w CharacterCounter
- Automatyczna zmiana komunikatów błędów

**Nie musisz zmieniać:**
- inputTextSchema (używa stałych)
- CharacterCounter (otrzymuje props)
- API validation (backend niezależny)

---

#### 2. Dodanie nowego pola do formularza w fazie 'edit'

**Pliki do edycji:**

1. **types.ts** - Dodaj pole do `CreateRecipeCommand`
   ```typescript
   export interface CreateRecipeCommand {
     name: string;
     description?: string;
     cookingTime?: number;  // ← NOWE
     // ...
   }
   ```

2. **AIEditRecipeForm.tsx** - Aktualizuj schema
   ```typescript
   const createRecipeSchema = z.object({
     name: z.string().min(1).max(255),
     description: z.string().optional(),
     cookingTime: z.number().min(1).optional(),  // ← NOWE
     // ...
   });
   ```

3. **AIEditRecipeForm.tsx** - Dodaj do defaultValues
   ```typescript
   const getDefaultValues = (): CreateRecipeCommand => {
     return {
       name: initialData.name,
       description: initialData.description ?? undefined,
       cookingTime: undefined,  // ← NOWE
       // ...
     };
   };
   ```

4. **AIEditRecipeForm.tsx** - Dodaj FormField w JSX
   ```tsx
   <FormField
     control={form.control}
     name="cookingTime"
     render={({ field }) => (
       <FormItem>
         <FormLabel>Czas gotowania (minuty)</FormLabel>
         <FormControl>
           <Input type="number" {...field} />
         </FormControl>
         <FormMessage />
       </FormItem>
     )}
   />
   ```

**Nie musisz zmieniać:**
- AIRecipeForm (przekazuje dane transparentnie)
- useCreateRecipe (generyczny dla CreateRecipeCommand)
- Zustand store (przechowuje GeneratedRecipeDto osobno)

---

#### 3. Zmiana tekstu w dialogach

**Plik do edycji:**
- `AIRecipeForm.tsx`

**Przykład:**

```tsx
// Przed:
<ConfirmationDialog
  title="Odrzucić wprowadzone dane?"
  description="Masz wygenerowany przepis. Czy na pewno chcesz wyjść bez zapisywania?"
/>

// Po:
<ConfirmationDialog
  title="Czy na pewno chcesz anulować?"
  description="Wszystkie wprowadzone zmiany zostaną utracone."
/>
```

---

## Pełny Flow od Początku do Końca

```
1. User otwiera /recipes/new-ai
   ↓
2. Astro renderuje <AIRecipeForm client:load />
   ↓
3. AIRecipeForm czyta Zustand store
   ├─ Jeśli draft w localStorage → przywróć stan
   └─ Jeśli brak → phase = 'input', inputText = ''
   ↓
4. Renderuje AIRecipeTextInput (phase === 'input')
   ↓
5. User wpisuje tekst → onChange → setInputText → Zustand → localStorage
   ↓
6. User klika "Generuj przepis" → form.handleSubmit
   ↓
7. handleSubmit → handleGenerate → generateMutation.mutate
   ↓
8. POST /api/recipes/generate → AI generuje przepis
   ↓
9. onSuccess → setGeneratedData → Zustand → phase = 'edit'
   ↓
10. Re-render: AIRecipeForm renderuje AIEditRecipeForm
   ↓
11. User edytuje dane → form onChange → formState.isDirty = true
   ↓
12. User klika "Zapisz przepis" → form.handleSubmit
   ��
13. handleSubmit → handleSubmit (AIRecipeForm) → createMutation.mutate
   ↓
14. POST /api/recipes (z generationId)
   ↓
15. onSuccess w useCreateRecipe:
    ├─ Invalidate cache
    ├─ Remove drafts (manual + AI)
    ├─ reset() → Zustand clean
    └─ Toast + Redirect → /recipes/:id
   ↓
16. User widzi nowo utworzony przepis ✅
```

---

## Najczęstsze Pytania (FAQ)

### Q1: Dlaczego `phase` jest w Zustand store zamiast local state?

**A:** Dla persistence. Jeśli użytkownik zamknie kartę w fazie 'edit', przy powrocie powinien zobaczyć formularz edycji, a nie input text.

### Q2: Dlaczego AIRecipeTextInput ma props `onChange` skoro używa useForm?

**A:** Dla synchronizacji z Zustand store. React Hook Form zarządza lokalnym state formularza, ale Zustand musi wiedzieć o zmianach dla persistence.

### Q3: Dlaczego `goBackToInput()` zachowuje `inputText`?

**A:** Aby użytkownik mógł edytować tekst i wygenerować przepis ponownie. Gdyby `inputText` został wyczyszczony, użytkownik musiałby pisać od zera.

### Q4: Dlaczego `useCreateRecipe` ma callback `onSuccessBeforeRedirect`?

**A:** Aby umożliwić cleanup przed redirectem. AI form musi wyczyścić Zustand store, a manual form może mieć inne potrzeby. Callback daje elastyczność.

### Q5: Dlaczego `isDirty` check w przycisku "Zapisz"?

**A:** Aby uniemożliwić zapisanie przepisu bez edycji. Jeśli user kliknie "Zapisz" bez zmian, to jest niepotrzebne wywołanie API.

---

**Wersja:** 1.0
**Data:** 2025-01-12
**Autor:** Claude (Anthropic)
