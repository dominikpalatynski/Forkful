# Plan implementacji widoku Tworzenia Przepisu z AI

## 1. Przegląd

Widok "Tworzenie Przepisu z AI" umożliwia użytkownikom dodawanie nowych przepisów poprzez wykorzystanie sztucznej inteligencji do automatycznego przetwarzania tekstu źródłowego. Widok składa się z dwóch faz:

1. **Faza wprowadzania tekstu**: użytkownik wkleja tekst przepisu (20-10,000 znaków) i wywołuje generowanie AI
2. **Faza edycji**: wyświetlany jest formularz z danymi wygenerowanymi przez AI, które użytkownik może zweryfikować i edytować przed zapisem

Kluczową cechą jest możliwość swobodnego przechodzenia między fazami oraz śledzenie akceptacji wygenerowanych przepisów poprzez `generationId` dla celów analitycznych.

**Zarządzanie stanem**: Stan między fazami jest zarządzany przez **Zustand store** z middleware `persist`, co zapewnia automatyczną synchronizację z localStorage i umożliwia przywracanie stanu po odświeżeniu strony.

## 2. Routing widoku

- **Ścieżka**: `/recipes/new-ai`
- **Plik Astro**: `src/pages/recipes/new-ai.astro`
- **Layout**: `DashboardLayout`
- **Typ renderowania**: Client-side interactive (React component z `client:load`)

## 3. Struktura komponentów

```
AIRecipeForm (główny kontener)
├── AIRecipeTextInput (faza 1: wprowadzanie tekstu)
│   ├── Textarea
│   ├── CharacterCounter
│   └── Button (Generuj przepis)
│
└── AIEditRecipeForm (faza 2: edycja wygenerowanych danych)
    ├── CreateRecipeBasicInfoSection
    ├── CreateRecipeTagInput
    ├── Separator
    ├── CreateRecipeIngredientsList
    ├── Separator
    ├── CreateRecipeStepsList
    └── AIFormActionButtons (rozszerzony FormActionButtons)
        ├── Button (Wstecz do edycji tekstu)
        ├── Button (Anuluj)
        └── Button (Utwórz przepis)
```

## 4. Szczegóły komponentów

### AIRecipeForm

**Opis**: Główny komponent zarządzający przepływem między fazami. Odpowiada za orkiestrację stanu, przechowywanie danych w localStorage oraz decydowanie, który subkomponent wyświetlić.

**Główne elementy**:

- Conditional rendering: `AIRecipeTextInput` lub `AIEditRecipeForm` w zależności od fazy
- Dialog potwierdzenia anulowania (`CancelRecipeEditDialog`)
- Obsługa stanu fazy, generationId i wygenerowanych danych

**Obsługiwane zdarzenia**:

- `onGenerateSuccess(generatedRecipe: GeneratedRecipeDto)` - przejście do fazy edycji
- `onGenerateError(error: Error)` - wyświetlenie toast z błędem
- `onBackToTextEdit()` - powrót do fazy wprowadzania tekstu
- `onCancel()` - anulowanie całego procesu z potwierdzeniem
- `onSubmit(data: CreateRecipeCommand)` - utworzenie przepisu z generationId

**Warunki walidacji**:

- Brak bezpośredniej walidacji - deleguje do subkomponentów

**Typy**:

- `AIRecipeFormPhase` - enum/union type dla faz ('input' | 'edit')
- `AIRecipeFormState` - interfejs stanu komponentu
- `GeneratedRecipeDto` - typ danych zwróconych przez API

**Propsy**:

- Brak - komponent samodzielny (root component)

### AIRecipeTextInput

**Opis**: Komponent fazy wprowadzania tekstu. Wyświetla textarea z licznikiem znaków i przycisk generowania przepisu.

**Główne elementy**:

- `<Textarea>` - pole do wklejania tekstu (min 20, max 10,000 znaków)
- `<CharacterCounter>` - wizualny licznik z informacją o limitach
- `<Button>` - przycisk "Generuj przepis" wywołujący API

**Obsługiwane zdarzenia**:

- `onTextChange(text: string)` - aktualizacja wartości textarea
- `onGenerateClick()` - wywołanie generowania przez AI
- `onBackClick()` - powrót do strony głównej

**Warunki walidacji**:

- Długość tekstu >= 20 znaków (przycisk disabled)
- Długość tekstu <= 10,000 znaków (blokada wprowadzania)
- Brak pustych/whitespace-only wartości

**Typy**:

- `AIRecipeTextInputProps` - interfejs propsów komponentu
- `GenerateRecipeCommand` - typ requestu do API

**Propsy**:

```typescript
interface AIRecipeTextInputProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate: (inputText: string) => void;
  isGenerating: boolean;
  onBack: () => void;
}
```

### CharacterCounter

**Opis**: Wizualny licznik znaków z kolorowym feedbackiem o limitach i warunkach walidacji.

**Główne elementy**:

- `<span>` z dynamiczną klasą CSS zależną od stanu (sukces/ostrzeżenie/błąd)
- Tekst formatowany: `{currentCount} / {maxCount}`

**Obsługiwane zdarzenia**:

- Brak - komponent prezentacyjny

**Warunki walidacji**:

- Wyświetla wizualny stan:
  - Czerwony: `count < 20` lub `count > 10000`
  - Pomarańczowy: `count >= 9500 && count <= 10000`
  - Zielony: `count >= 20 && count < 9500`

**Typy**:

- `CharacterCounterProps` - interfejs propsów

**Propsy**:

```typescript
interface CharacterCounterProps {
  current: number;
  min: number;
  max: number;
}
```

### AIEditRecipeForm

**Opis**: Formularz edycji wygenerowanych przez AI danych przepisu. Reużywa istniejące komponenty formularza z ManualRecipeForm z dodatkowymi przyciskami akcji.

**Główne elementy**:

- `<Form>` wrapper z react-hook-form
- `<CreateRecipeBasicInfoSection>` - nazwa i opis
- `<CreateRecipeTagInput>` - zarządzanie tagami
- `<Separator>` - wizualny separator sekcji
- `<CreateRecipeIngredientsList>` - lista składników
- `<CreateRecipeStepsList>` - lista kroków
- `<AIFormActionButtons>` - przyciski akcji (w tym "Wstecz do edycji tekstu")

**Obsługiwane zdarzenia**:

- `onSubmit(data: CreateRecipeCommand)` - utworzenie przepisu z generationId
- `onBackToTextEdit()` - powrót do fazy wprowadzania tekstu
- `onCancel()` - anulowanie z potwierdzeniem

**Warunki walidacji**:

- Wszystkie warunki z `CreateRecipeSchema`:
  - Nazwa: min 1 znak, max 255 znaków
  - Opis: opcjonalny
  - Składniki: każdy min 1 znak
  - Kroki: każdy min 1 znak
  - Tagi: każdy min 1 znak (opcjonalne)
- Walidacja real-time przez Zod + react-hook-form

**Typy**:

- `AIEditRecipeFormProps` - interfejs propsów
- `CreateRecipeCommand` - typ danych formularza
- `GeneratedRecipeDto` - typ danych początkowych

**Propsy**:

```typescript
interface AIEditRecipeFormProps {
  initialData: GeneratedRecipeDto;
  generationId: string;
  onSubmit: (data: CreateRecipeCommand) => void;
  onBackToTextEdit: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}
```

### AIFormActionButtons

**Opis**: Rozszerzony komponent `FormActionButtons` z dodatkowym przyciskiem "Wstecz do edycji tekstu" specyficznym dla flow AI.

**Główne elementy**:

- `<Button>` - "Wstecz do edycji tekstu" (variant: ghost)
- `<Button>` - "Anuluj" (variant: outline)
- `<Button>` - "Utwórz przepis" (variant: default, type: submit)

**Obsługiwane zdarzenia**:

- `onBackToTextEdit()` - powrót do fazy textarea
- `onCancel()` - anulowanie procesu
- Form submit - obsługiwane przez form wrapper

**Warunki walidacji**:

- "Wstecz do edycji tekstu": zawsze aktywny (chyba że isSubmitting)
- "Anuluj": zawsze aktywny (chyba że isSubmitting)
- "Utwórz przepis": disabled jeśli !isDirty || isSubmitting

**Typy**:

- `AIFormActionButtonsProps` - interfejs propsów

**Propsy**:

```typescript
interface AIFormActionButtonsProps {
  onBackToTextEdit: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
  isDirty: boolean;
}
```

## 5. Typy

### Nowe typy do dodania w `src/types.ts`:

Już istniejące (nie wymagają zmian):

- `GeneratedRecipeDto` - odpowiedź z POST /api/recipes/generate
- `CreateRecipeCommand` - payload do POST /api/recipes
- `GenerateRecipeCommand` - payload do POST /api/recipes/generate

### Nowe typy w `src/components/recipes/types.ts`:

```typescript
// Faza przepływu AI Recipe Form
export type AIRecipeFormPhase = "input" | "edit";

// Stan formularza AI przechowywany w localStorage
export interface AIRecipeFormState {
  phase: AIRecipeFormPhase;
  inputText: string;
  generationId?: string;
  generatedData?: GeneratedRecipeDto;
  editedData?: CreateRecipeCommand;
}

// Props dla AIRecipeTextInput
export interface AIRecipeTextInputProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate: (inputText: string) => void;
  isGenerating: boolean;
  onBack: () => void;
}

// Props dla CharacterCounter
export interface CharacterCounterProps {
  current: number;
  min: number;
  max: number;
}

// Props dla AIEditRecipeForm
export interface AIEditRecipeFormProps {
  initialData: GeneratedRecipeDto;
  generationId: string;
  onSubmit: (data: CreateRecipeCommand) => void;
  onBackToTextEdit: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

// Props dla AIFormActionButtons
export interface AIFormActionButtonsProps {
  onBackToTextEdit: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
  isDirty: boolean;
}
```

### Typy ViewModels:

Nie są potrzebne dodatkowe ViewModels - komponenty wykorzystują istniejące DTO i Command types.

## 6. Zarządzanie stanem

### Zustand Store z Persist Middleware

**Zarządzanie stanem globalnym**: Używamy Zustand store z middleware `persist` do automatycznej synchronizacji z localStorage.

**Lokalizacja**: `src/store/ai-recipe-form.store.ts`

**Stan przechowywany w store**:

- `phase: AIRecipeFormPhase` - aktualny etap ('input' | 'edit')
- `inputText: string` - tekst z textarea
- `generationId: string | null` - ID generacji z API
- `generatedData: GeneratedRecipeDto | null` - dane zwrócone przez AI

**Stan lokalny komponentu (nie persistowany)**:

- `showCancelDialog: boolean` - stan dialogu potwierdzenia (tylko w AIRecipeForm)

**Struktura Zustand store**:

```typescript
// src/store/ai-recipe-form.store.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AIRecipeFormPhase } from "@/components/recipes/types";
import type { GeneratedRecipeDto } from "@/types";

interface AIRecipeFormState {
  phase: AIRecipeFormPhase;
  inputText: string;
  generationId: string | null;
  generatedData: GeneratedRecipeDto | null;
}

interface AIRecipeFormActions {
  setPhase: (phase: AIRecipeFormPhase) => void;
  setInputText: (text: string) => void;
  setGeneratedData: (data: GeneratedRecipeDto, generationId: string) => void;
  goBackToInput: () => void;
  reset: () => void;
}

type AIRecipeFormStore = AIRecipeFormState & AIRecipeFormActions;

const getDefaultState = (): AIRecipeFormState => ({
  phase: "input",
  inputText: "",
  generationId: null,
  generatedData: null,
});

export const useAIRecipeFormStore = create<AIRecipeFormStore>()(
  persist(
    (set) => ({
      // Initial state
      ...getDefaultState(),

      // Actions
      setPhase: (phase) => set({ phase }),

      setInputText: (inputText) => set({ inputText }),

      setGeneratedData: (generatedData, generationId) =>
        set({
          phase: "edit",
          generatedData,
          generationId,
        }),

      goBackToInput: () =>
        set({
          phase: "input",
          generatedData: null,
          generationId: null,
          // inputText pozostaje zachowany
        }),

      reset: () => set(getDefaultState()),
    }),
    {
      name: "forkful-ai-recipe-draft", // klucz w localStorage
      storage: createJSONStorage(() => localStorage),
      // Opcjonalnie: partialize jeśli chcemy persistować tylko część stanu
      // partialize: (state) => ({
      //   phase: state.phase,
      //   inputText: state.inputText,
      //   generationId: state.generationId,
      //   generatedData: state.generatedData
      // }),
    }
  )
);
```

**Użycie w komponencie AIRecipeForm**:

```typescript
import { useAIRecipeFormStore } from "@/store/ai-recipe-form.store";

export function AIRecipeForm() {
  // Dostęp do stanu i akcji z Zustand
  const phase = useAIRecipeFormStore((state) => state.phase);
  const inputText = useAIRecipeFormStore((state) => state.inputText);
  const generatedData = useAIRecipeFormStore((state) => state.generatedData);
  const generationId = useAIRecipeFormStore((state) => state.generationId);

  const setInputText = useAIRecipeFormStore((state) => state.setInputText);
  const setGeneratedData = useAIRecipeFormStore((state) => state.setGeneratedData);
  const goBackToInput = useAIRecipeFormStore((state) => state.goBackToInput);
  const reset = useAIRecipeFormStore((state) => state.reset);

  // Stan lokalny (nie persistowany)
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // ... reszta logiki
}
```

**Zalety użycia Zustand**:

- ✅ Automatyczna persistence z middleware `persist`
- ✅ Lepsze performance - subskrypcja tylko na potrzebne slice'y stanu
- ✅ Możliwość używania stanu w innych komponentach bez prop drilling
- ✅ Łatwe testowanie - możliwość mockowania store
- ✅ DevTools support (opcjonalnie z middleware `devtools`)
- ✅ TypeScript-friendly z pełnym typowaniem

### Zarządzanie formularzem (react-hook-form)

W komponencie **AIEditRecipeForm**:

- Użycie `useForm` z custom hooka `@/hooks/use-form`
- Schema: `CreateRecipeSchema`
- defaultValues: dane z `GeneratedRecipeDto` przekształcone do `CreateRecipeCommand`
- Integracja z `useFieldArray` dla składników i kroków (już zaimplementowana w subkomponentach)

## 7. Integracja API

### Endpoint 1: POST /api/recipes/generate

**Cel**: Generowanie strukturalnego przepisu z tekstu przy użyciu AI.

**Request Type**: `GenerateRecipeCommand`

```typescript
{
  inputText: string; // 20-10,000 znaków
}
```

**Response Type (200 OK)**: `GeneratedRecipeDto`

```typescript
{
  generationId: string; // UUID
  name: string;
  description: string | null;
  ingredients: RecipeIngredientCommand[]; // { content, position }
  steps: RecipeStepCommand[]; // { content, position }
}
```

**Error Responses**:

- `400 Bad Request` - walidacja nie powiodła się (np. > 10,000 znaków)
- `401 Unauthorized` - użytkownik niezalogowany
- `422 Unprocessable Entity` - tekst zbyt krótki lub niezwiązany z przepisami
- `500 Internal Server Error` - błąd AI lub serwera

**Custom Hook: useGenerateRecipe**

```typescript
export function useGenerateRecipe() {
  const mutation = useMutation(
    {
      mutationFn: async (inputText: string) => {
        const response = await fetch("/api/recipes/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inputText }),
        });

        if (!response.ok) {
          if (response.status === 422) {
            throw new Error(
              "Podany tekst nie wygląda na przepis. Upewnij się, że zawiera składniki i kroki przygotowania."
            );
          }
          if (response.status === 400) {
            const data = await response.json();
            throw new Error(data.message || "Nieprawidłowe dane wejściowe");
          }
          throw new Error("Nie udało się wygenerować przepisu. Spróbuj ponownie.");
        }

        return response.json() as Promise<GeneratedRecipeDto>;
      },
      onError: (error: Error) => {
        toast.error(`Błąd generowania: ${error.message}`);
      },
    },
    queryClient
  );

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error as Error | null,
    isSuccess: mutation.isSuccess,
    data: mutation.data,
    reset: mutation.reset,
  } as const;
}
```

### Endpoint 2: POST /api/recipes

**Cel**: Utworzenie przepisu z wygenerowanych i zedytowanych danych.

**Request Type**: `CreateRecipeCommand`

```typescript
{
  name: string;
  description?: string;
  generationId?: string; // KLUCZOWE: ID z etapu generowania
  ingredients?: RecipeIngredientCommand[];
  steps?: RecipeStepCommand[];
  tags?: string[];
}
```

**Response Type (201 Created)**: `RecipeDetailDto`

**Custom Hook**: Reużycie istniejącego `useCreateRecipe` z modyfikacją:

- Hook otrzyma w payloadzie `generationId` z AIRecipeForm
- Backend automatycznie oznaczy `generation.is_accepted = true` przy zapisie

## 8. Interakcje użytkownika

### Scenariusz 1: Happy Path - Generowanie i akceptacja

1. **Start**: Użytkownik klika "Z AI" na stronie głównej → przekierowanie do `/recipes/new-ai`
2. **Wprowadzanie tekstu**:
   - Użytkownik wkleja tekst przepisu do textarea
   - Licznik znaków aktualizuje się w czasie rzeczywistym
   - Przycisk "Generuj przepis" staje się aktywny po osiągnięciu min. 20 znaków
3. **Generowanie**:
   - Kliknięcie "Generuj przepis" → wywołanie `useGenerateRecipe.mutate(inputText)`
   - Wyświetlenie loading state (przycisk disabled, spinner)
   - Po sukcesie: przejście do fazy 'edit' z wypełnionym formularzem
4. **Edycja**:
   - Formularz wypełniony danymi z AI
   - Użytkownik może edytować wszystkie pola
   - Dodawanie/usuwanie składników i kroków
   - Zmiana kolejności przez drag & drop (jeśli zaimplementowane)
   - Dodawanie tagów z autocomplete
5. **Zapis**:
   - Kliknięcie "Utwórz przepis" → wywołanie `useCreateRecipe.mutate(data + generationId)`
   - Toast "Przepis został pomyślnie utworzony!"
   - Czyszczenie localStorage
   - Przekierowanie do `/recipes/{id}`

### Scenariusz 2: Powrót do edycji tekstu

1. **Faza edycji**: Użytkownik jest w formularzu edycji
2. **Trigger**: Kliknięcie "Wstecz do edycji tekstu"
3. **Akcja**:
   - Zapisanie aktualnego stanu formularza do localStorage (opcjonalnie)
   - Zmiana fazy na 'input'
   - Przywrócenie textarea z oryginalnym tekstem
   - Użytkownik może modyfikować tekst i ponownie wygenerować

### Scenariusz 3: Błąd generowania AI

1. **Trigger**: API zwraca błąd (422, 500, etc.)
2. **Akcja**:
   - Wyświetlenie toast z komunikatem błędu
   - Pozostanie w fazie 'input'
   - Tekst pozostaje w textarea
   - Użytkownik może:
     - Poprawić tekst i spróbować ponownie
     - Kliknąć "Powrót" i użyć manualnego tworzenia

### Scenariusz 4: Anulowanie procesu

1. **Trigger**: Kliknięcie "Anuluj" w dowolnej fazie
2. **Warunek**: Jeśli `isDirty` (są niezapisane zmiany)
   - Wyświetlenie `CancelRecipeEditDialog` z pytaniem o potwierdzenie
   - Po potwierdzeniu:
     - Czyszczenie localStorage
     - Przekierowanie do `/recipes`
3. **Warunek**: Jeśli `!isDirty`
   - Natychmiastowe przekierowanie do `/recipes`

### Scenariusz 5: Recovery po odświeżeniu strony

1. **Trigger**: Użytkownik odświeża stronę (F5)
2. **Akcja**:
   - `useAIRecipeFormState` odczytuje stan z localStorage
   - Przywrócenie odpowiedniej fazy ('input' lub 'edit')
   - Przywrócenie wszystkich danych (tekst, generationId, wygenerowane dane)
   - Użytkownik kontynuuje od miejsca, w którym przerwał

## 9. Warunki i walidacja

### Walidacja po stronie klienta (AIRecipeTextInput)

**Komponent**: `AIRecipeTextInput`

**Warunki**:

1. **Długość tekstu minimum (20 znaków)**:
   - Sprawdzane: `inputText.trim().length >= 20`
   - Wpływ: Przycisk "Generuj przepis" disabled jeśli false
   - Feedback: Licznik znaków w kolorze czerwonym

2. **Długość tekstu maksimum (10,000 znaków)**:
   - Sprawdzane: `inputText.length <= 10000`
   - Wpływ: Blokada wpisywania dalszych znaków w textarea (`maxLength={10000}`)
   - Feedback: Licznik znaków w kolorze czerwonym

3. **Tekst nie może być pusty/whitespace-only**:
   - Sprawdzane: `inputText.trim().length > 0`
   - Wpływ: Dodatkowa weryfikacja przed wywołaniem API

### Walidacja Zod (GenerateRecipeSchema)

**Schema**: `GenerateRecipeSchema` (już zdefiniowany)

```typescript
z.object({
  inputText: z
    .string()
    .min(20, "Input text must be at least 20 characters long.")
    .max(10000, "Input text cannot exceed 10,000 characters."),
});
```

**Zastosowanie**: Walidacja przed wysłaniem do API w `useGenerateRecipe`

### Walidacja formularza edycji (AIEditRecipeForm)

**Komponent**: `AIEditRecipeForm`

**Schema**: `CreateRecipeSchema` (już zdefiniowany)

```typescript
z.object({
  name: z.string().min(1, "Recipe name is required").max(255, "Recipe name is too long"),
  description: z.string().optional(),
  generationId: z.string().uuid().optional(),
  ingredients: z.array(RecipeIngredientCommandSchema).default([]),
  steps: z.array(RecipeStepCommandSchema).default([]),
  tags: z.array(z.string().min(1)).default([]),
});
```

**Warunki sprawdzane przez formularz**:

1. **Nazwa przepisu**:
   - Min 1 znak, max 255 znaków
   - Wyświetlane: `<FormMessage>` pod polem
   - Wpływ: Blokada submitu jeśli błędne

2. **Składniki** (każdy element):
   - Content min 1 znak
   - Position musi być liczbą dodatnią
   - Wyświetlane: `<FormMessage>` pod każdym polem
   - Wpływ: Blokada submitu jeśli błędne

3. **Kroki** (każdy element):
   - Content min 1 znak
   - Position musi być liczbą dodatnią
   - Wyświetlane: `<FormMessage>` pod każdym polem
   - Wpływ: Blokada submitu jeśli błędne

4. **Tagi** (każdy element):
   - Min 1 znak (jeśli dodany)
   - Wyświetlane: Inline w komponencie tagów
   - Wpływ: Blokada submitu jeśli błędne

### Wpływ warunków na stan UI

| Warunek                    | Komponent         | Stan UI                                       | Akcja blokowana |
| -------------------------- | ----------------- | --------------------------------------------- | --------------- |
| `inputText.length < 20`    | AIRecipeTextInput | Przycisk "Generuj" disabled, licznik czerwony | Generowanie     |
| `inputText.length > 10000` | AIRecipeTextInput | Blokada textarea, licznik czerwony            | Wpisywanie      |
| `isGenerating = true`      | AIRecipeTextInput | Spinner, przyciski disabled                   | Wszystkie       |
| `!isDirty`                 | AIEditRecipeForm  | Przycisk "Utwórz" disabled                    | Submit          |
| `isSubmitting = true`      | AIEditRecipeForm  | Wszystkie przyciski disabled                  | Wszystkie       |
| `form.errors`              | AIEditRecipeForm  | FormMessage widoczne, submit disabled         | Submit          |

## 10. Obsługa błędów

### Błędy API (POST /api/recipes/generate)

**Typ błędu**: `400 Bad Request`

- **Przyczyna**: Walidacja Zod nie powiodła się
- **Obsługa**: Toast z komunikatem z API lub domyślnym "Nieprawidłowe dane wejściowe"
- **UX**: Pozostanie w fazie 'input', tekst zachowany

**Typ błędu**: `401 Unauthorized`

- **Przyczyna**: Użytkownik niezalogowany
- **Obsługa**: Toast "Musisz być zalogowany, aby użyć tej funkcji"
- **UX**: Przekierowanie do strony logowania

**Typ błędu**: `422 Unprocessable Entity`

- **Przyczyna**: AI nie rozpoznało tekstu jako przepisu
- **Obsługa**: Toast "Podany tekst nie wygląda na przepis. Upewnij się, że zawiera składniki i kroki przygotowania."
- **UX**: Pozostanie w fazie 'input', tekst zachowany, możliwość edycji i ponownej próby

**Typ błędu**: `500 Internal Server Error`

- **Przyczyna**: Błąd AI lub serwera
- **Obsługa**: Toast "Nie udało się wygenerować przepisu. Spróbuj ponownie później."
- **UX**: Pozostanie w fazie 'input', tekst zachowany

### Błędy API (POST /api/recipes)

**Obsługa**: Już zaimplementowana w `useCreateRecipe`

- Toast z komunikatem błędu
- Pozostanie w formularzu edycji
- Dane zachowane

### Błędy Zustand persistence

**Scenariusz**: Brak dostępu do localStorage lub quota exceeded

- **Obsługa**: Zustand middleware `persist` automatycznie obsługuje błędy
- **Fallback**: Store działa w trybie in-memory (bez persistence)
- **UX**: Brak wpływu na funkcjonalność, brak recovery po odświeżeniu
- **Implementacja**: Middleware `persist` wbudowane obsługuje błędy storage

**Scenariusz**: Uszkodzone dane w localStorage

- **Obsługa**: Middleware `persist` automatycznie waliduje dane przy deserializacji
- **Fallback**: Jeśli deserializacja się nie powiedzie, użyje stanu początkowego
- **UX**: Start od czystego stanu (faza 'input', pusta textarea)
- **Opcjonalnie**: Możliwość dodania custom deserialize/serialize functions dla dodatkowej walidacji

### Edge cases

**Przypadek**: Użytkownik generuje, następnie wraca do edycji tekstu, zmienia 1 znak i generuje ponownie

- **Obsługa**: Nowe wywołanie API, nowe `generationId`, nadpisanie poprzednich danych
- **Analityka**: Poprzednia generacja pozostaje w bazie z `is_accepted = false`

**Przypadek**: Użytkownik zamyka kartę bez zapisania

- **Obsługa**: Dane pozostają w localStorage (dzięki Zustand persist)
- **UX**: Po powrocie do `/recipes/new-ai` stan zostaje automatycznie przywrócony przez store

**Przypadek**: Sieć offline podczas generowania

- **Obsługa**: Fetch error → catch w `useGenerateRecipe`
- **Toast**: "Brak połączenia z internetem. Sprawdź połączenie i spróbuj ponownie."
- **UX**: Pozostanie w fazie 'input', możliwość ponownej próby

## 11. Kroki implementacji

### Krok 1: Instalacja Zustand

- [ ] Zainstalować Zustand: `npm install zustand`
- [ ] Zweryfikować wersję (zalecana: ≥4.0.0 dla najnowszej składni TypeScript)

### Krok 2: Przygotowanie typów i schematów

- [ ] Dodać nowe typy do `src/components/recipes/types.ts`:
  - `AIRecipeFormPhase`
  - `AIRecipeTextInputProps`
  - `CharacterCounterProps`
  - `AIEditRecipeFormProps`
  - `AIFormActionButtonsProps`
  - **Uwaga**: `AIRecipeFormState` będzie zdefiniowany w Zustand store
- [ ] Zweryfikować, czy `GeneratedRecipeDto` i `GenerateRecipeCommand` są poprawnie zdefiniowane w `src/types.ts`

### Krok 3: Implementacja Zustand store

- [ ] Utworzyć plik `src/store/ai-recipe-form.store.ts`
- [ ] Zaimplementować store według wzorca z sekcji "6. Zarządzanie stanem":
  - Interface `AIRecipeFormState` (state)
  - Interface `AIRecipeFormActions` (actions)
  - Type `AIRecipeFormStore` (union)
  - Funkcja `getDefaultState()`
  - Eksport `useAIRecipeFormStore` z middleware `persist`
  - Akcje: `setPhase`, `setInputText`, `setGeneratedData`, `goBackToInput`, `reset`
- [ ] Skonfigurować persist middleware:
  - Name: `'forkful-ai-recipe-draft'`
  - Storage: `createJSONStorage(() => localStorage)`

### Krok 4: Implementacja custom hooka useGenerateRecipe

- [ ] Utworzyć plik `src/components/recipes/hooks/useGenerateRecipe.ts`
- [ ] Zaimplementować mutation z:
  - Fetch do `/api/recipes/generate`
  - Obsługa błędów (400, 401, 422, 500)
  - Toast notifications dla błędów
  - Zwrot standardowego interface z mutation state

### Krok 5: Implementacja komponentu CharacterCounter

- [ ] Utworzyć plik `src/components/recipes/form/CharacterCounter.tsx`
- [ ] Zaimplementować logikę kolorowania:
  - Czerwony: `current < min` lub `current > max`
  - Pomarańczowy: `current >= max - 500 && current <= max`
  - Zielony: `current >= min && current < max - 500`
- [ ] Dodać odpowiednie klasy Tailwind CSS dla kolorów
- [ ] Dodać atrybuty ARIA dla dostępności (aria-live)

### Krok 6: Implementacja komponentu AIRecipeTextInput

- [ ] Utworzyć plik `src/components/recipes/form/AIRecipeTextInput.tsx`
- [ ] Struktura:
  - `<Textarea>` z `maxLength={10000}`
  - `<CharacterCounter>` poniżej textarea
  - Przyciski: "Powrót" i "Generuj przepis"
- [ ] Logika:
  - Handler `onChange` z propagacją do rodzica
  - Handler `onGenerateClick` z walidacją minimum 20 znaków
  - Disabled state dla przycisku gdy `isGenerating` lub `text.trim().length < 20`
- [ ] Stylowanie: zgodne z istniejącymi formami (card, spacing)

### Krok 7: Implementacja komponentu AIFormActionButtons

- [ ] Utworzyć plik `src/components/recipes/form/AIFormActionButtons.tsx`
- [ ] Struktura (3 przyciski):
  - "Wstecz do edycji tekstu" (variant: ghost, onClick: onBackToTextEdit)
  - "Anuluj" (variant: outline, onClick: onCancel)
  - "Utwórz przepis" (type: submit, disabled: !isDirty || isSubmitting)
- [ ] Layout: flex justify-between (pierwszy przycisk po lewej, reszta po prawej)

### Krok 8: Implementacja komponentu AIEditRecipeForm

- [ ] Utworzyć plik `src/components/recipes/form/AIEditRecipeForm.tsx`
- [ ] Inicjalizacja formularza:
  - `useForm` z `CreateRecipeSchema`
  - defaultValues z `initialData` (GeneratedRecipeDto → CreateRecipeCommand)
  - Dodanie `generationId` do ukrytego pola lub kontekstu
- [ ] Struktura (reużycie istniejących komponentów):
  - `<Form>` wrapper
  - `<CreateRecipeBasicInfoSection control={form.control} />`
  - `<CreateRecipeTagInput control={form.control} suggestions={tagsSuggestions} />`
  - `<Separator />`
  - `<CreateRecipeIngredientsList control={form.control} />`
  - `<Separator />`
  - `<CreateRecipeStepsList control={form.control} />`
  - `<AIFormActionButtons ... />`
- [ ] Logika submit:
  - Recalculate positions (jak w ManualRecipeForm)
  - Dodanie `generationId` do payload
  - Wywołanie `onSubmit` z danymi
- [ ] Integracja z `CancelRecipeEditDialog`

### Krok 9: Implementacja głównego komponentu AIRecipeForm

- [ ] Utworzyć plik `src/components/recipes/form/AIRecipeForm.tsx`
- [ ] Inicjalizacja:
  - Użycie `useAIRecipeFormStore` z Zustand dla globalnego stanu
  - Selektory dla: `phase`, `inputText`, `generatedData`, `generationId`
  - Selektory dla akcji: `setInputText`, `setGeneratedData`, `goBackToInput`, `reset`
  - Użycie `useGenerateRecipe()` dla generowania
  - Użycie `useCreateRecipe()` dla zapisu (reużycie istniejącego)
  - Użycie `useTags()` dla sugestii tagów
- [ ] Stan lokalny (nie persistowany):
  - `showCancelDialog: boolean`
- [ ] Handlers:
  - `handleGenerate(inputText)` - wywołanie mutation, onSuccess → wywołaj `setGeneratedData()`
  - `handleBackToTextEdit()` - wywołaj `goBackToInput()` z store
  - `handleSubmit(data)` - dodanie generationId, wywołanie createMutation
  - `handleCancel()` - sprawdzenie isDirty, pokazanie dialogu lub redirect
  - `handleCancelConfirm()` - wywołaj `reset()` z store, redirect do /recipes
- [ ] Conditional rendering:
  - `{phase === 'input' && <AIRecipeTextInput ... />}`
  - `{phase === 'edit' && <AIEditRecipeForm ... />}`
  - `<CancelRecipeEditDialog ... />`
- [ ] Integracja onSuccess z useGenerateRecipe:
  - Wywołanie `setGeneratedData(data, generationId)` automatycznie ustawia fazę na 'edit'

### Krok 10: Utworzenie strony Astro

- [ ] Utworzyć plik `src/pages/recipes/new-ai.astro`
- [ ] Struktura:
  - Import `DashboardLayout`
  - Import `AIRecipeForm` z `client:load`
  - Nagłówek strony: "Utwórz przepis z AI"
  - Opis: "Wklej tekst przepisu, a AI automatycznie wyodrębni składniki i kroki przygotowania."
- [ ] Stylowanie: spójne z `recipes/new.astro`

### Krok 11: Dodanie przycisku "Z AI" na stronie głównej

- [ ] Znaleźć komponent/stronę z przyciskiem "Ręcznie" (prawdopodobnie `/recipes` lub dashboard)
- [ ] Dodać przycisk "Z AI" obok przycisku "Ręcznie":
  - Tekst: "Z AI" lub "Z pomocą AI"
  - Wariant: primary lub accent (do uzgodnienia)
  - Href: `/recipes/new-ai`
  - Ikona: Sparkles lub Wand (z lucide-react)
- [ ] Dostępność: aria-label="Utwórz przepis z pomocą sztucznej inteligencji"

### Krok 12: Testy manualne

- [ ] **Test 1: Happy path**
  - Przejście do `/recipes/new-ai`
  - Wklejenie tekstu przepisu (>20 znaków)
  - Kliknięcie "Generuj przepis"
  - Weryfikacja wypełnienia formularza
  - Edycja pól
  - Dodanie tagów
  - Kliknięcie "Utwórz przepis"
  - Weryfikacja zapisu i przekierowania

- [ ] **Test 2: Powrót do edycji tekstu**
  - Wygenerowanie przepisu
  - Kliknięcie "Wstecz do edycji tekstu"
  - Weryfikacja przywrócenia textarea z tekstem
  - Modyfikacja tekstu
  - Ponowne wygenerowanie
  - Weryfikacja nowych danych

- [ ] **Test 3: Obsługa błędów API**
  - Wklejenie tekstu niezwiązanego z przepisami (np. Lorem ipsum)
  - Weryfikacja toast 422
  - Pozostanie w fazie input

- [ ] **Test 4: Walidacja długości**
  - Próba wpisania <20 znaków → przycisk disabled
  - Próba wpisania >10,000 znaków → blokada textarea
  - Weryfikacja kolorów licznika

- [ ] **Test 5: Anulowanie**
  - Wygenerowanie i edycja danych (isDirty = true)
  - Kliknięcie "Anuluj"
  - Weryfikacja dialogu potwierdzenia
  - Potwierdzenie → redirect do /recipes

- [ ] **Test 6: Persistence Zustand**
  - Rozpoczęcie procesu (faza input lub edit)
  - Odświeżenie strony (F5)
  - Weryfikacja przywrócenia stanu przez Zustand store
  - Sprawdzenie localStorage (klucz: `forkful-ai-recipe-draft`)

- [ ] **Test 7: Zapis z generationId**
  - Wygenerowanie przepisu
  - Zapis
  - Weryfikacja w bazie danych:
    - Recipe posiada `generation_id`
    - Tabela `generation` ma wpis z `is_accepted = true`

### Krok 13: Dostępność i UX

- [ ] Sprawdzić nawigację klawiaturą przez cały flow
- [ ] Dodać odpowiednie `aria-label` do przycisków
- [ ] Dodać `aria-live` do licznika znaków
- [ ] Sprawdzić kontrast kolorów w liczniku (WCAG AA)
- [ ] Dodać focus styles zgodne z design system
- [ ] Sprawdzić działanie z czytnikiem ekranu (VoiceOver/NVDA)

### Krok 14: Dokumentacja i finalizacja

- [ ] Dodać komentarze JSDoc do wszystkich komponentów, hooków i store
- [ ] Zaktualizować `src/components/recipes/types.ts` z exportami
- [ ] Sprawdzić czy wszystkie importy są poprawne
- [ ] Sprawdzić czy Zustand store jest poprawnie wyeksportowany i typowany
- [ ] Uruchomić `npm run lint` i naprawić błędy
- [ ] Uruchomić `npm run format` dla formatowania
- [ ] Commit z odpowiednim komunikatem zgodnym z konwencją projektu
