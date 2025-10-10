# Plan implementacji widoku szczegółów przepisu

## 1. Przegląd

Widok szczegółów przepisu umożliwia użytkownikom przeglądanie pełnych informacji o wybranym przepisie, w tym nazwy, opisu, składników, kroków przygotowania oraz tagów. Widok jest zoptymalizowany do czytania z responsywnym layoutem: dwukolumnowym na desktopie (składniki po lewej, kroki po prawej) i jednocolumnowym na urządzeniach mobilnych. Użytkownik ma dostęp do akcji: powrót do listy przepisów, edycja przepisu oraz usunięcie przepisu (z obowiązkowym modalem potwierdzenia).

## 2. Routing widoku

Widok powinien być dostępny pod ścieżką: **`/recipes/[id]`**

Utworzyć plik Astro: `src/pages/recipes/[id].astro`

## 3. Struktura komponentów

```
RecipeDetailPage (src/pages/recipes/[id].astro - Astro page)
└── RecipeDetailView (React - główny kontener)
    ├── RecipeDetailHeader (React)
    │   ├── Button - Wróć
    │   ├── Button - Edytuj
    │   └── Button - Usuń (secondary variant)
    ├── RecipeMetadata (React)
    │   ├── Description (warunkowe renderowanie)
    │   └── TagsList
    ├── RecipeContentLayout (React - responsive container)
    │   ├── RecipeIngredientsSection (React)
    │   │   └── ul > li (składniki jako bullet points)
    │   └── RecipeStepsSection (React)
    │       └── ol > li (kroki ponumerowane)
    ├── DeleteRecipeDialog (React - Shadcn AlertDialog)
    └── ErrorState / LoadingState (React - stany warunkowe)
```

## 4. Szczegóły komponentów

### 4.1. RecipeDetailPage (Astro)

**Opis**: Strona Astro, która wyświetla główny komponent React z przekazaniem `recipeId` z parametrów URL.

**Główne elementy**:

- Layout: `DashboardLayout`
- Komponent React: `<RecipeDetailView client:load recipeId={id} />`

**Obsługiwane zdarzenia**: N/A (deleguje do React)

**Walidacja**: N/A

**Typy**: N/A (Astro)

**Props**: Parametr URL `id` z `Astro.params`

---

### 4.2. RecipeDetailView (React)

**Opis**: Główny kontener widoku, zarządzający pobraniem danych przepisu z API, stanem ładowania, błędami oraz stanem modala usuwania. Renderuje wszystkie podkomponenty warunkowe w zależności od stanu (loading, error, success).

**Główne elementy**:

- Conditional rendering: `LoadingState`, `ErrorState`, lub pełny widok przepisu
- Kontener: `<div className="container mx-auto px-4 py-8 max-w-6xl">`
- Komponenty dzieci: `RecipeDetailHeader`, `RecipeMetadata`, `RecipeContentLayout`, `DeleteRecipeDialog`

**Obsługiwane zdarzenia**:

- Otwarcie/zamknięcie modala usuwania (`handleDeleteClick`, `handleCloseDialog`)
- Potwierdzenie usunięcia przepisu (`handleConfirmDelete`)
- Retry w przypadku błędu (`handleRetry`)

**Walidacja**:

- Sprawdzenie czy `recipeId` jest poprawnym UUID (opcjonalnie)
- Walidacja odpowiedzi API (czy `recipe` nie jest null)
- Obsługa błędów HTTP: 401, 403, 404, 500

**Typy**:

- `RecipeDetailDto` (z API)
- `RecipeDetailViewProps`

**Props**:

```ts
interface RecipeDetailViewProps {
  recipeId: string;
}
```

---

### 4.3. RecipeDetailHeader (React)

**Opis**: Nagłówek widoku wyświetlający nazwę przepisu, datę utworzenia oraz przyciski akcji (Wróć, Edytuj, Usuń).

**Główne elementy**:

- `<header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">`
- Lewa strona:
  - `<h1 className="text-3xl font-bold">{name}</h1>`
  - `<p className="text-sm text-muted-foreground">Utworzono: {formatDate(createdAt)}</p>`
- Prawa strona (przyciski):
  - `<Button variant="outline" onClick={handleBackClick}>Wróć</Button>`
  - `<Button variant="default" onClick={handleEditClick}>Edytuj</Button>`
  - `<Button variant="secondary" onClick={onDeleteClick}>Usuń</Button>`

**Obsługiwane zdarzenia**:

- `onClick` przycisku "Wróć" → nawigacja do `/recipes`
- `onClick` przycisku "Edytuj" → nawigacja do `/recipes/${recipeId}/edit`
- `onClick` przycisku "Usuń" → wywołanie `onDeleteClick` (otwiera modal)

**Walidacja**: N/A

**Typy**: `RecipeDetailHeaderProps`

**Props**:

```ts
interface RecipeDetailHeaderProps {
  name: string;
  createdAt: string; // ISO date string
  recipeId: string;
  onDeleteClick: () => void;
}
```

---

### 4.4. RecipeMetadata (React)

**Opis**: Sekcja wyświetlająca opcjonalny opis przepisu oraz listę tagów. Znajduje się nad sekcjami składników i kroków.

**Główne elementy**:

- `<section className="mb-8">`
- Warunkowy opis: `{description && <p className="text-muted-foreground mb-4">{description}</p>}`
- Lista tagów: `<div className="flex flex-wrap gap-2">{tags.map(...)}</div>`
- Tag badge: `<Badge variant="secondary">{tag}</Badge>` (komponent Badge z shadcn/ui)

**Obsługiwane zdarzenia**: N/A

**Walidacja**:

- Warunkowe renderowanie opisu (jeśli `description` istnieje i nie jest null/pusty)
- Warunkowe renderowanie tagów (jeśli `tags.length > 0`)

**Typy**: `RecipeMetadataProps`

**Props**:

```ts
interface RecipeMetadataProps {
  description?: string | null;
  tags: string[];
}
```

---

### 4.5. RecipeContentLayout (React)

**Opis**: Kontener responsywny, który układa sekcje składników i kroków w dwukolumnowy layout na desktopie i jednocolumnowy na mobile.

**Główne elementy**:

- `<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">`
- Komponenty dzieci: `RecipeIngredientsSection`, `RecipeStepsSection`

**Obsługiwane zdarzenia**: N/A

**Walidacja**: N/A

**Typy**: `RecipeContentLayoutProps`

**Props**:

```ts
interface RecipeContentLayoutProps {
  ingredients: RecipeIngredientDto[];
  steps: RecipeStepDto[];
}
```

---

### 4.6. RecipeIngredientsSection (React)

**Opis**: Sekcja wyświetlająca listę składników jako bullet points.

**Główne elementy**:

- `<section>`
- `<h2 className="text-2xl font-semibold mb-4">Składniki</h2>`
- `<ul className="list-disc list-inside space-y-2">`
  - `{ingredients.map(ing => <li key={ing.id} className="text-base">{ing.content}</li>)}`
- Warunkowe: jeśli `ingredients.length === 0`, wyświetl: `<p className="text-muted-foreground">Brak składników</p>`

**Obsługiwane zdarzenia**: N/A

**Walidacja**:

- Sprawdzenie czy `ingredients` nie jest pustą tablicą

**Typy**: `RecipeIngredientsSectionProps`, `RecipeIngredientDto`

**Props**:

```ts
interface RecipeIngredientsSectionProps {
  ingredients: RecipeIngredientDto[];
}
```

---

### 4.7. RecipeStepsSection (React)

**Opis**: Sekcja wyświetlająca ponumerowaną listę kroków przygotowania.

**Główne elementy**:

- `<section>`
- `<h2 className="text-2xl font-semibold mb-4">Kroki przygotowania</h2>`
- `<ol className="list-decimal list-inside space-y-3">`
  - `{steps.map(step => <li key={step.id} className="text-base">{step.content}</li>)}`
- Warunkowe: jeśli `steps.length === 0`, wyświetl: `<p className="text-muted-foreground">Brak kroków</p>`

**Obsługiwane zdarzenia**: N/A

**Walidacja**:

- Sprawdzenie czy `steps` nie jest pustą tablicą

**Typy**: `RecipeStepsSectionProps`, `RecipeStepDto`

**Props**:

```ts
interface RecipeStepsSectionProps {
  steps: RecipeStepDto[];
}
```

---

### 4.8. DeleteRecipeDialog (React)

**Opis**: Modal dialog (Shadcn AlertDialog) potwierdzający usunięcie przepisu. Wyświetla komunikat ostrzegawczy oraz przyciski "Anuluj" i "Usuń".

**Główne elementy**:

- `<AlertDialog open={isOpen} onOpenChange={onClose}>`
- `<AlertDialogContent>`
  - `<AlertDialogHeader>`
    - `<AlertDialogTitle>Potwierdź usunięcie</AlertDialogTitle>`
    - `<AlertDialogDescription>Czy na pewno chcesz usunąć przepis "{recipeName}"? Ta akcja jest nieodwracalna.</AlertDialogDescription>`
  - `<AlertDialogFooter>`
    - `<AlertDialogCancel onClick={onClose}>Anuluj</AlertDialogCancel>`
    - `<AlertDialogAction onClick={onConfirm} disabled={isDeleting}>{isDeleting ? "Usuwanie..." : "Usuń"}</AlertDialogAction>`

**Obsługiwane zdarzenia**:

- `onClose` → zamknięcie modala bez akcji
- `onConfirm` → potwierdzenie usunięcia, wywołanie DELETE API

**Walidacja**: N/A

**Typy**: `DeleteRecipeDialogProps`

**Props**:

```ts
interface DeleteRecipeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  recipeName: string;
  isDeleting: boolean;
}
```

---

### 4.9. LoadingState (React)

**Opis**: Komponent wyświetlany podczas ładowania danych przepisu.

**Główne elementy**:

- `<div className="flex items-center justify-center min-h-[50vh]">`
- Skeleton loader z biblioteki shadcn

**Obsługiwane zdarzenia**: N/A

**Walidacja**: N/A

**Typy**: Brak props

---

### 4.10. ErrorState (React)

**Opis**: Komponent wyświetlany w przypadku błędu (404, 403, 500, network error). Wykorzystać istniejący komponent `@/components/recipes/ErrorState`.

**Lokalizacja**: `src/components/recipes/ErrorState.tsx` (istniejący komponent)

**Główne elementy**:

- `<div className="flex flex-col items-center justify-center py-12 text-center">`
- Ikona `AlertCircle` z `lucide-react`
- `<h3>` z tytułem "Wystąpił błąd"
- `<p>` z komunikatem błędu
- `<Button onClick={onRetry}>Spróbuj ponownie</Button>`

**Obsługiwane zdarzenia**:

- `onRetry` → ponowne wywołanie API

**Walidacja**: N/A

**Typy**: `ErrorStateProps` (istniejący)

**Props**:

```ts
interface ErrorStateProps {
  error: string | Error;
  onRetry: () => void;
}
```

**Uwaga**: Komponent już istnieje w projekcie, wystarczy go zaimportować i użyć.

---

## 5. Typy

### Typy z `src/types.ts` (istniejące):

```ts
export type RecipeDetailDto = Pick<Recipe, "id" | "name" | "description"> & {
  ingredients: RecipeIngredientDto[];
  steps: RecipeStepDto[];
  tags: string[];
};

export type RecipeIngredientDto = Pick<Ingredient, "id" | "content" | "position">;

export type RecipeStepDto = Pick<Step, "id" | "content" | "position">;
```

### Nowe typy do dodania w `src/components/recipes/types.ts`:

```ts
// Props dla głównego widoku
export interface RecipeDetailViewProps {
  recipeId: string;
}

// Props dla nagłówka
export interface RecipeDetailHeaderProps {
  name: string;
  createdAt: string; // ISO date string
  recipeId: string;
  onDeleteClick: () => void;
}

// Props dla metadanych
export interface RecipeMetadataProps {
  description?: string | null;
  tags: string[];
}

// Props dla layoutu zawartości
export interface RecipeContentLayoutProps {
  ingredients: RecipeIngredientDto[];
  steps: RecipeStepDto[];
}

// Props dla sekcji składników
export interface RecipeIngredientsSectionProps {
  ingredients: RecipeIngredientDto[];
}

// Props dla sekcji kroków
export interface RecipeStepsSectionProps {
  steps: RecipeStepDto[];
}

// Props dla modala usuwania
export interface DeleteRecipeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  recipeName: string;
  isDeleting: boolean;
}

// Props dla stanu błędu - wykorzystać istniejący ErrorStateProps z src/components/recipes/types.ts
// export interface ErrorStateProps {
//   error: string | Error
//   onRetry: () => void
// }
```

### Rozszerzenie `RecipeDetailDto` o `created_at`:

**UWAGA**: Obecny `RecipeDetailDto` nie zawiera pola `created_at`. Należy je dodać w następujący sposób:

W `src/types.ts`:

```ts
export type RecipeDetailDto = Pick<Recipe, "id" | "name" | "description" | "created_at"> & {
  ingredients: RecipeIngredientDto[];
  steps: RecipeStepDto[];
  tags: string[];
};
```

Wymaga to również modyfikacji w API endpoint `/api/recipes/[id]` aby zwracał pole `created_at` z bazy danych.

---

## 6. Zarządzanie stanem

### Stan w komponencie RecipeDetailView:

```ts
const [recipe, setRecipe] = useState<RecipeDetailDto | null>(null);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
const [isDeleting, setIsDeleting] = useState(false);
```

### Custom hook: `useRecipeDetail`

**Lokalizacja**: `src/components/recipes/hooks/useRecipeDetail.ts`

**Cel**: Pobranie danych przepisu z API oraz zarządzanie stanem ładowania i błędów.

**Implementacja**:

```ts
export function useRecipeDetail(recipeId: string) {
  const [recipe, setRecipe] = useState<RecipeDetailDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecipe = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/recipes/${recipeId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Przepis nie został znaleziony");
        }
        if (response.status === 403) {
          throw new Error("Brak dostępu do tego przepisu");
        }
        if (response.status === 401) {
          throw new Error("Musisz być zalogowany");
        }
        throw new Error("Wystąpił błąd podczas pobierania przepisu");
      }

      const data: RecipeDetailDto = await response.json();
      setRecipe(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nieznany błąd");
    } finally {
      setIsLoading(false);
    }
  }, [recipeId]);

  useEffect(() => {
    fetchRecipe();
  }, [fetchRecipe]);

  return { recipe, isLoading, error, refetch: fetchRecipe };
}
```

### Custom hook: `useDeleteRecipe`

**Lokalizacja**: `src/components/recipes/hooks/useDeleteRecipe.ts`

**Cel**: Obsługa usuwania przepisu oraz nawigacja po sukcesie.

**Implementacja**:

```ts
export function useDeleteRecipe() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteRecipe = useCallback(async (recipeId: string) => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Nie udało się usunąć przepisu");
      }

      // Nawigacja do listy przepisów po sukcesie
      window.location.href = "/recipes";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nieznany błąd");
      throw err; // Re-throw aby komponent mógł obsłużyć błąd
    } finally {
      setIsDeleting(false);
    }
  }, []);

  return { deleteRecipe, isDeleting, error };
}
```

---

## 7. Integracja API

### Endpoint: GET `/api/recipes/{id}`

**Kiedy**: Przy montowaniu komponentu `RecipeDetailView` (w `useRecipeDetail` hook)

**Typ żądania**: GET, brak body

**Typ odpowiedzi**: `RecipeDetailDto`

**Odpowiedź sukcesu (200 OK)**:

```json
{
  "id": "uuid-goes-here",
  "name": "Spaghetti Carbonara",
  "description": "A classic Italian pasta dish.",
  "created_at": "2025-10-09T12:34:56Z",
  "ingredients": [
    { "id": "uuid-1", "content": "200g spaghetti", "position": 1 },
    { "id": "uuid-2", "content": "100g pancetta", "position": 2 }
  ],
  "steps": [
    { "id": "uuid-3", "content": "Boil the pasta.", "position": 1 },
    { "id": "uuid-4", "content": "Fry the pancetta.", "position": 2 }
  ],
  "tags": ["pasta", "italian", "quick"]
}
```

**Odpowiedzi błędów**:

- **401 Unauthorized**: Użytkownik niezalogowany → Wyświetl komunikat "Musisz być zalogowany"
- **403 Forbidden**: Użytkownik nie jest właścicielem przepisu → Wyświetl komunikat "Brak dostępu do tego przepisu"
- **404 Not Found**: Przepis nie istnieje → Wyświetl komunikat "Przepis nie został znaleziony"
- **500 Internal Server Error**: Błąd serwera → Wyświetl komunikat "Wystąpił błąd podczas pobierania przepisu"

**Obsługa**: W custom hook `useRecipeDetail`, ustawienie stanu `recipe`, `isLoading`, `error`

---

### Endpoint: DELETE `/api/recipes/{id}`

**Kiedy**: Po potwierdzeniu usunięcia w `DeleteRecipeDialog`

**Typ żądania**: DELETE, brak body

**Typ odpowiedzi**: 204 No Content (brak body)

**Odpowiedź sukcesu (204 No Content)**:

- Brak body
- Akcja: Nawigacja do `/recipes`

**Odpowiedzi błędów**:

- **401 Unauthorized**: Użytkownik niezalogowany
- **403 Forbidden**: Użytkownik nie jest właścicielem przepisu
- **404 Not Found**: Przepis nie istnieje
- **500 Internal Server Error**: Błąd serwera

**Obsługa**: W custom hook `useDeleteRecipe`, wyświetlenie komunikatu błędu w modalu lub toast

---

## 8. Interakcje użytkownika

### 8.1. Kliknięcie przycisku "Wróć"

- **Akcja**: Nawigacja do `/recipes`
- **Implementacja**: `onClick={() => window.location.href = '/recipes'}`

### 8.2. Kliknięcie przycisku "Edytuj"

- **Akcja**: Nawigacja do `/recipes/${recipeId}/edit`
- **Implementacja**: `onClick={() => window.location.href = \`/recipes/\${recipeId}/edit\`}`

### 8.3. Kliknięcie przycisku "Usuń"

- **Akcja**: Otwarcie modala `DeleteRecipeDialog`
- **Implementacja**: `onClick={() => setIsDeleteDialogOpen(true)}`

### 8.4. Zamknięcie modala usuwania (Anuluj)

- **Akcja**: Zamknięcie modala bez wykonania akcji
- **Implementacja**: `onClose={() => setIsDeleteDialogOpen(false)}`

### 8.5. Potwierdzenie usunięcia w modalu

- **Akcja**:
  1. Wywołanie `deleteRecipe(recipeId)` z `useDeleteRecipe` hook
  2. Wyświetlenie loading state w przycisku ("Usuwanie...")
  3. Po sukcesie: nawigacja do `/recipes`
  4. Po błędzie: wyświetlenie komunikatu błędu (toast lub w modalu)
- **Implementacja**:
  ```ts
  const handleConfirmDelete = async () => {
    try {
      await deleteRecipe(recipeId);
      // Nawigacja wykonywana w hook
    } catch (error) {
      // Wyświetlenie komunikatu błędu
      console.error("Błąd usuwania:", error);
    }
  };
  ```

### 8.6. Retry w przypadku błędu ładowania

- **Akcja**: Ponowne wywołanie `fetchRecipe()` z `useRecipeDetail` hook
- **Implementacja**: `onClick={() => refetch()}`

---

## 9. Warunki i walidacja

### 9.1. Walidacja w RecipeDetailView

- **Warunek**: Czy `isLoading === true`?
  - **Wpływ**: Wyświetlenie `LoadingState` zamiast treści
- **Warunek**: Czy `error !== null`?
  - **Wpływ**: Wyświetlenie `ErrorState` z komunikatem błędu
- **Warunek**: Czy `recipe === null` po zakończeniu ładowania?
  - **Wpływ**: Wyświetlenie `ErrorState` z komunikatem "Przepis nie został znaleziony"

### 9.2. Walidacja w RecipeMetadata

- **Warunek**: Czy `description` istnieje i nie jest null/pusty?
  - **Wpływ**: Warunkowe renderowanie sekcji opisu
  - **Implementacja**: `{description && <p>{description}</p>}`
- **Warunek**: Czy `tags.length > 0`?
  - **Wpływ**: Warunkowe renderowanie sekcji tagów
  - **Implementacja**: `{tags.length > 0 && <div>...</div>}`

### 9.3. Walidacja w RecipeIngredientsSection

- **Warunek**: Czy `ingredients.length === 0`?
  - **Wpływ**: Wyświetlenie komunikatu "Brak składników" zamiast pustej listy
  - **Implementacja**:
    ```tsx
    {
      ingredients.length === 0 ? <p className="text-muted-foreground">Brak składników</p> : <ul>...</ul>;
    }
    ```

### 9.4. Walidacja w RecipeStepsSection

- **Warunek**: Czy `steps.length === 0`?
  - **Wpływ**: Wyświetlenie komunikatu "Brak kroków" zamiast pustej listy
  - **Implementacja**:
    ```tsx
    {
      steps.length === 0 ? <p className="text-muted-foreground">Brak kroków</p> : <ol>...</ol>;
    }
    ```

### 9.5. Walidacja w DeleteRecipeDialog

- **Warunek**: Czy `isDeleting === true`?
  - **Wpływ**:
    - Przycisk "Usuń" wyświetla "Usuwanie..."
    - Przycisk jest disabled
  - **Implementacja**: `<Button disabled={isDeleting}>{isDeleting ? "Usuwanie..." : "Usuń"}</Button>`

---

## 10. Obsługa błędów

### 10.1. Błąd 404 Not Found

- **Scenariusz**: Przepis o podanym ID nie istnieje
- **Obsługa**:
  - Wyświetlenie `ErrorState` z komunikatem: "Przepis nie został znaleziony"
  - Przycisk "Wróć do listy" → nawigacja do `/recipes`
  - Brak przycisku "Spróbuj ponownie"

### 10.2. Błąd 403 Forbidden

- **Scenariusz**: Użytkownik nie ma dostępu do przepisu (nie jest właścicielem)
- **Obsługa**:
  - Wyświetlenie `ErrorState` z komunikatem: "Brak dostępu do tego przepisu"
  - Przycisk "Wróć do listy" → nawigacja do `/recipes`

### 10.3. Błąd 401 Unauthorized

- **Scenariusz**: Użytkownik niezalogowany
- **Obsługa**:
  - Redirect do `/login` lub wyświetlenie komunikatu "Musisz być zalogowany"
  - Możliwe: automatyczne przekierowanie do strony logowania

### 10.4. Błąd 500 Internal Server Error

- **Scenariusz**: Błąd serwera podczas pobierania przepisu
- **Obsługa**:
  - Wyświetlenie `ErrorState` z komunikatem: "Wystąpił błąd podczas pobierania przepisu"
  - Przycisk "Spróbuj ponownie" → ponowne wywołanie API
  - Przycisk "Wróć do listy" → nawigacja do `/recipes`

### 10.5. Network Error

- **Scenariusz**: Brak połączenia z internetem
- **Obsługa**:
  - Wyświetlenie `ErrorState` z komunikatem: "Brak połączenia z internetem"
  - Przycisk "Spróbuj ponownie" → ponowne wywołanie API

### 10.6. Błąd podczas usuwania przepisu

- **Scenariusz**: DELETE request zwraca błąd (403, 404, 500)
- **Obsługa**:
  - Wyświetlenie komunikatu błędu w toast notification (opcjonalnie)
  - Lub wyświetlenie komunikatu błędu w modalu (dodatkowy paragraph pod opisem)
  - Modal pozostaje otwarty, użytkownik może spróbować ponownie lub anulować
  - Implementacja:
    ```tsx
    {
      deleteError && <p className="text-sm text-destructive mt-2">{deleteError}</p>;
    }
    ```

---

## 11. Kroki implementacji

### Krok 1: Instalacja brakujących zależności

- Zainstalować Shadcn AlertDialog: `npx shadcn@latest add alert-dialog`
- Zainstalować Shadcn Badge: `npx shadcn@latest add badge`
- (Opcjonalnie) Zainstalować toast notification: `npx shadcn@latest add toast` lub `npx shadcn@latest add sonner`

### Krok 2: Rozszerzenie typów

- W `src/types.ts`: Dodać `created_at` do `RecipeDetailDto`:
  ```ts
  export type RecipeDetailDto = Pick<Recipe, "id" | "name" | "description" | "created_at"> & {
    ingredients: RecipeIngredientDto[];
    steps: RecipeStepDto[];
    tags: string[];
  };
  ```
- W `src/components/recipes/types.ts`: Dodać wszystkie nowe interfejsy props (z sekcji 5)

### Krok 3: Modyfikacja API endpoint

- W `src/pages/api/recipes/[id].ts`: Upewnić się, że GET endpoint zwraca pole `created_at` w odpowiedzi

### Krok 4: Implementacja custom hooks

- Utworzyć `src/components/recipes/hooks/useRecipeDetail.ts` (z sekcji 6)
- Utworzyć `src/components/recipes/hooks/useDeleteRecipe.ts` (z sekcji 6)

### Krok 5: Implementacja komponentów prezentacyjnych

W kolejności od najmniejszych do największych:

1. **RecipeIngredientsSection** (`src/components/recipes/RecipeIngredientsSection.tsx`)
2. **RecipeStepsSection** (`src/components/recipes/RecipeStepsSection.tsx`)
3. **RecipeMetadata** (`src/components/recipes/RecipeMetadata.tsx`) - użyć komponentu Badge z shadcn/ui
4. **RecipeContentLayout** (`src/components/recipes/RecipeContentLayout.tsx`)
5. **DeleteRecipeDialog** (`src/components/recipes/DeleteRecipeDialog.tsx`)
6. **RecipeDetailHeader** (`src/components/recipes/RecipeDetailHeader.tsx`)
7. **RecipeDetailLoadingState** (`src/components/recipes/RecipeDetailLoadingState.tsx`)

**Uwaga**: Komponent `ErrorState` już istnieje w `src/components/recipes/ErrorState.tsx` - nie trzeba go tworzyć, wystarczy zaimportować.

### Krok 6: Implementacja głównego kontenera

- Utworzyć `src/components/recipes/RecipeDetailView.tsx`:
  - Użycie hooków `useRecipeDetail` i `useDeleteRecipe`
  - Zarządzanie stanem modala (`isDeleteDialogOpen`)
  - Warunkowe renderowanie: loading → error → success
  - Składanie wszystkich podkomponentów

### Krok 7: Utworzenie strony Astro

- Utworzyć `src/pages/recipes/[id].astro`:

  ```astro
  ---
  import DashboardLayout from "@/layouts/DashboardLayout.astro";
  import { RecipeDetailView } from "@/components/recipes/RecipeDetailView";

  const { id } = Astro.params;

  if (!id) {
    return Astro.redirect("/recipes");
  }
  ---

  <DashboardLayout title="Szczegóły przepisu">
    <RecipeDetailView client:load recipeId={id} />
  </DashboardLayout>
  ```

### Krok 8: Testowanie

1. Testowanie scenariusza happy path: przepis z pełnymi danymi (nazwa, opis, składniki, kroki, tagi)
2. Testowanie przepisu bez opisu
3. Testowanie przepisu bez tagów
4. Testowanie przepisu bez składników/kroków
5. Testowanie błędów: 404, 403, 500
6. Testowanie responsywności: desktop (dwukolumnowy) vs mobile (jednocolumnowy)
7. Testowanie funkcji usuwania:
   - Otwarcie modala
   - Anulowanie usuwania
   - Potwierdzenie usuwania (sukces)
   - Błąd podczas usuwania

### Krok 9: Integracja z listą przepisów

- Upewnić się, że kliknięcie na `RecipeCard` w `RecipeGrid` nawiguje do `/recipes/${recipeId}`
- Sprawdzić czy nawigacja "Wróć" działa poprawnie

### Krok 10: Optymalizacja

- Dodanie React.memo dla komponentów prezentacyjnych (jeśli potrzebne)
- Sprawdzenie czy sortowanie `ingredients` i `steps` według `position` jest poprawne
- (Opcjonalnie) Dodanie Astro View Transitions dla smooth navigation
- (Opcjonalnie) Dodanie toast notifications dla lepszego UX

### Krok 11: Accessibility

- Sprawdzenie czy wszystkie przyciski mają odpowiednie aria-labels
- Upewnienie się, że modal ma focus trap
- Testowanie nawigacji klawiaturą
- Sprawdzenie hierarchii nagłówków (h1, h2)

### Krok 12: Dokumentacja

- Dodanie komentarzy JSDoc do publicznych interfejsów
- Aktualizacja dokumentacji projektu (jeśli istnieje)
