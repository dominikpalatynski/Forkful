# Podsumowanie Architektury UI - Forkful MVP

## Decisions

### 1. Główna nawigacja i layout

**Decyzja 1.1**: Aplikacja wykorzystuje TopBar jako główny element nawigacyjny z:

- Listą przepisów jako widokiem głównym
- Opcją filtrowania po nazwie i tagach
- Przyciskiem "Dodaj przepis" z dropdown (Generuj z AI / Utwórz manualnie)

**Decyzja 1.2**: Strona główna (`/`) przekierowuje bezpośrednio do `/recipes` (lista przepisów)

### 2. Lista przepisów

**Decyzja 2.1**: Grid layout:

- Desktop: 2-3 kolumny kart
- Mobile: single column kart
- Każda karta zawiera: nazwę przepisu, tagi, datę utworzenia

**Decyzja 2.2**: Paginacja klasyczna z przyciskami Previous/Next + numeracją stron

**Decyzja 2.3**: Filtrowanie tagów przez "pill buttons" nad listą:

- Aktywny filtr podświetlony
- Możliwość wyboru wielu tagów jednocześnie

### 3. Widok szczegółowy przepisu

**Decyzja 3.1**: Layout zoptymalizowany do czytania:

- Desktop: dwukolumnowy (lewa: składniki, prawa: kroki)
- Nad kolumnami: description i tagi
- Mobile: jednocolumnowy
- Przycisk "Edytuj" widoczny w headerze

**Decyzja 3.2**: Metadane - wyświetlana tylko data utworzenia

**Decyzja 3.3**: Przycisk "Usuń" jako secondary button w headerze z obowiązkowym modalem potwierdzenia. Brak usuwania z poziomu listy.

### 4. Formularz generowania AI

**Decyzja 4.1**: Ujednolicony formularz dla AI i manual:

- Tryb AI: dodatkowa TextArea na początku (10k znaków limit)
- Po generacji: wypełniony formularz poniżej
- Tryb określany przez props przekazany do komponentu

**Decyzja 4.2**: Sukces generacji: Toast + wypełniony formularz

**Decyzja 4.3**: Błąd generacji: inline error message z instrukcjami

### 5. Formularz edycji/tworzenia

**Decyzja 5.1**: Single-page formularz ze scrollem (wszystkie pola na jednym ekranie)

**Decyzja 5.2**: Drag & drop **NIE** w MVP (dodane w późniejszej fazie)

**Decyzja 5.3**: Każdy składnik/krok ma hamburger menu z opcjami edytuj/usuń

**Decyzja 5.4**: Przycisk "Dodaj" na końcu listy składników/kroków otwiera modal z formularzem

### 6. System tagów

**Decyzja 6.1-6.2**: Combobox pattern (shadcn/ui Command component):

- Autocomplete z query do `/api/tags?q=...`
- Obsługa strzałek i Enter
- Możliwość utworzenia nowego tagu przez Enter

**Decyzja 6.3**: W formularzu przepisu tylko odłączanie tagu (X na pill). Brak globalnego usuwania tagów w MVP.

### 7. Persystencja stanu (localStorage)

**Decyzja 7.1**: Statyczny klucz `recipe_draft` dla localStorage

**Decyzja 7.2**: Modal przy wejściu na `/recipes/new` jeśli draft istnieje:

- "Znaleziono niezapisany przepis. Czy chcesz kontynuować edycję?"
- Przyciski: "Przywróć" / "Odrzuć i zacznij od nowa"

**Decyzja 7.3**: Debounce 1 sekunda dla zapisów do localStorage (useEffect + use-debounce library)

### 8. Uwierzytelnianie

**Decyzja 8.1**: Osobne strony `/login` i `/register`

**Decyzja 8.2**: Weryfikacja email - do implementacji później

**Decyzja 8.3**: Brak onboardingu w MVP

### 9. Obsługa błędów i loading states

**Decyzja 9.1**: Generowanie AI:

- Spinner z tekstem "Analizuję przepis..."
- Disabled textarea i przycisk "Generuj" podczas ładowania

**Decyzja 9.2**: Obsługa błędów HTTP:

- 401: Auto redirect do `/login`
- 403: Toast "Nie masz uprawnień" + redirect do listy
- 404: Dedykowana error page lub toast + redirect do listy
- 500: Toast z przyciskiem "Spróbuj ponownie"
- Inline error messages w formularzach (Zod validation)

**Decyzja 9.3**: Błędy walidacji inline pod każdym polem (wzorce shadcn/ui)

### 10. Responsywność

**Decyzja 10.1**: Breakpointy Tailwind:

- Mobile: < 640px (sm) - single column, hamburger menu
- Tablet: 640px - 1024px (sm-lg) - 2 kolumny grid
- Desktop: > 1024px (lg+) - pełny layout, 3 kolumny grid

**Decyzja 10.2**: Mobile nawigacja: Hamburger menu w top bar + dropdown z opcjami:

- Przepisy
- Generuj z AI
- Utwórz manualnie

**Decyzja 10.3**: Drag & drop na mobile - pomijany w MVP

### 11. Optymalizacja wydajności

**Decyzja 11.1**: Brak optimistic updates - zawsze loading + czekanie na potwierdzenie

**Decyzja 11.2**: TanStack Query (React Query) do requestów - cache out of the box

**Decyzja 11.3**: Brak lazy loadingu w MVP

### 12. Dostępność (a11y)

**Decyzja**: Pominięte w MVP (można dodać później)

### 13. Analityka

**Decyzja**: Pominięta w MVP (backend tracking w `generation` table wystarczy)

### 14. Routing

**Decyzja 14.1**: Struktura URL:

```
/                   → redirect do /recipes (jeśli zalogowany) else /login
/login              → logowanie
/register           → rejestracja
/recipes            → lista przepisów (główny widok)
/recipes/new        → tworzenie przepisu (tryb manual/ai w state)
/recipes/[id]       → widok szczegółowy
/recipes/[id]/edit  → edycja przepisu
/api/...            → API endpoints
```

**Decyzja 14.2**: Middleware Astro - nie implementowany w MVP

### 15. Design system

**Decyzja**: Pominięte (Tailwind config + shadcn/ui wystarczy)

### 16. Zarządzanie stanem

**Decyzja 16.1**:

- React Query (TanStack Query) → server state
- React Context API → lokalny UI state (np. hamburger open/close)
- Brak Redux/Zustand

**Decyzja 16.2**: Custom hook `useRecipeFormPersistence(generationId)` do obsługi localStorage

---

## Matched Recommendations

### Rekomendacja 1: TopBar jako główny element nawigacji

**Dopasowanie**: Zgodne z decyzją 1.1. TopBar zapewnia szybki dostęp do wszystkich głównych funkcji aplikacji i umożliwia płynne przechodzenie między widokami.

### Rekomendacja 2: Grid layout z kartami

**Dopasowanie**: Zgodne z decyzją 2.1. Responsive grid (3 kolumny desktop → 2 kolumny tablet → 1 kolumna mobile) zapewnia optymalną prezentację przepisów na różnych urządzeniach.

### Rekomendacja 3: Dwukolumnowy layout dla widoku szczegółowego

**Dopasowanie**: Zgodne z decyzją 3.1. Separacja składników i kroków w dwóch kolumnach zwiększa czytelność przepisu podczas gotowania.

### Rekomendacja 4: Ujednolicony formularz dla AI i manual

**Dopasowanie**: Zgodne z decyzją 4.1. Jeden komponent formularza z warunkowym renderowaniem TextArea (tryb AI) redukuje duplikację kodu i zapewnia spójne UX.

### Rekomendacja 5: Modal dla dodawania składników/kroków

**Dopasowanie**: Zgodne z decyzją 5.4. Modal zapewnia fokus na pojedynczej akcji i unika zaśmiecania głównego formularza.

### Rekomendacja 6: Combobox pattern dla tagów

**Dopasowanie**: Zgodne z decyzją 6.1-6.2. Shadcn/ui Command component zapewnia dostępny, keyboard-friendly interfejs do autocomplete z możliwością tworzenia nowych tagów.

### Rekomendacja 7: Statyczny klucz localStorage

**Dopasowanie**: Zgodne z decyzją 7.1. Prostsza implementacja dla MVP, wystarczająca dla przypadku jednego draft'a na raz.

### Rekomendacja 8: Modal przywracania draft'a

**Dopasowanie**: Zgodne z decyzją 7.2. Daje użytkownikowi kontrolę nad decyzją czy kontynuować edycję, unikając przypadkowej utraty danych.

### Rekomendacja 9: Debounce dla localStorage

**Dopasowanie**: Zgodne z decyzją 7.3. Opóźnienie 1 sekundy balansuje między responsywnością a wydajnością (unikanie nadmiernych zapisów).

### Rekomendacja 10: React Query dla server state

**Dopasowanie**: Zgodne z decyzją 11.2 i 16.1. TanStack Query zapewnia cache, refetching, error handling out of the box, redukując boilerplate code.

### Rekomendacja 11: Inline error messages

**Dopasowanie**: Zgodne z decyzją 9.3. Wzorce dostępności wymagają błędów walidacji w bezpośrednim kontekście pola, co poprawia UX i a11y.

### Rekomendacja 12: Brak optimistic updates w MVP

**Dopasowanie**: Zgodne z decyzją 11.1. Upraszcza implementację i zapewnia bardziej przewidywalne zachowanie dla użytkownika (jasny loading state).

### Rekomendacja 13: Responsive breakpointy Tailwind

**Dopasowanie**: Zgodne z decyzją 10.1. Standardowe breakpointy Tailwind zapewniają spójność i wykorzystują best practices.

### Rekomendacja 14: Hamburger menu dla mobile

**Dopasowanie**: Zgodne z decyzją 10.2. Rozpoznawalny pattern nawigacji mobile, który nie zajmuje cennego miejsca na ekranie.

### Rekomendacja 15: Custom hook dla persystencji

**Dopasowanie**: Zgodne z decyzją 16.2. Enkapsulacja logiki localStorage w hook'u zapewnia reusability i separation of concerns.

---

## UI Architecture Planning Summary

### 1. Główne wymagania architektury UI

Aplikacja Forkful MVP jest zbudowana w architekturze **Astro 5 SSR + React 19** z następującymi priorytetami:

#### Podejście desktop-first z pełną responsywnością

- Główny target: użytkownicy desktop (gotowanie przy komputerze/tablecie)
- Pełna funkcjonalność na mobile (< 640px)
- Wykorzystanie Tailwind CSS 4 do responsive design

#### Minimalistyczny, funkcjonalny design

- Shadcn/ui (New York style, neutral base color) jako podstawa komponentów
- Fokus na czytelności i użyteczności (szczególnie widok przepisu)
- Brak ozdobników - priorytet dla funkcjonalności

#### Szybka nawigacja i dostęp do funkcji

- TopBar jako persistent element nawigacyjny
- Maksymalnie 2 kliknięcia do każdej głównej funkcji
- Breadcrumbs nie są wymagane (płaska struktura)

---

### 2. Kluczowe widoki, ekrany i przepływy użytkownika

#### 2.1 Strona główna - Lista przepisów (`/recipes`)

**Layout**:

```
┌─────────────────────────────────────────┐
│ TopBar                                  │
│ [Logo] [Search] [+ Dodaj ▾] [User ▾]  │
├─────────────────────────────────────────┤
│ Filtry tagów (pill buttons)            │
│ [Pasta] [Italian] [Quick] ...          │
├─────────────────────────────────────────┤
│ Grid przepisów (2-3 kolumny)           │
│ ┌────────┐ ┌────────┐ ┌────────┐      │
│ │Recipe 1│ │Recipe 2│ │Recipe 3│      │
│ │[tags]  │ │[tags]  │ │[tags]  │      │
│ │Date    │ │Date    │ │Date    │      │
│ └────────┘ └────────┘ └────────┘      │
│ ...                                     │
├─────────────────────────────────────────┤
│ Pagination [< 1 2 3 >]                 │
└─────────────────────────────────────────┘
```

**Funkcjonalności**:

- **Wyszukiwanie**: Input w TopBar, query do `/api/recipes?q=...`
- **Filtrowanie**: Pill buttons z tagami (multi-select), query do `/api/recipes?tag=...`
- **Sortowanie**: Domyślnie po dacie utworzenia (desc)
- **Karta przepisu**: Kliknięcie → redirect do `/recipes/[id]`

**Stan komponentu**:

```typescript
{
  recipes: Recipe[]
  pagination: { page, pageSize, totalItems, totalPages }
  filters: { tags: string[], searchQuery: string }
  isLoading: boolean
  error: Error | null
}
```

**React Query**:

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ["recipes", page, filters],
  queryFn: () => fetchRecipes(page, filters),
});
```

---

#### 2.2 Widok szczegółowy przepisu (`/recipes/[id]`)

**Layout Desktop**:

```
┌─────────────────────────────────────────┐
│ TopBar                                  │
├─────────────────────────────────────────┤
│ [← Wróć]  Recipe Name  [Edit] [Delete] │
├─────────────────────────────────────────┤
│ Description text                        │
│ Tags: [pasta] [italian] [quick]        │
├─────────────────────────────────────────┤
│ ┌──────────────┬──────────────────────┐ │
│ │ Składniki    │ Kroki                │ │
│ │              │                      │ │
│ │ • 200g pasta │ 1. Boil water       │ │
│ │ • 100g bacon │ 2. Cook pasta       │ │
│ │ • 2 eggs     │ 3. Fry bacon        │ │
│ │              │ 4. Mix everything   │ │
│ └──────────────┴──────────────────────┘ │
├─────────────────────────────────────────┤
│ Utworzono: 2025-01-15                   │
└─────────────────────────────────────────┘
```

**Layout Mobile**: Jednocolumnowy (Description → Tags → Składniki → Kroki)

**Funkcjonalności**:

- **Edycja**: Przycisk "Edit" w headerze → redirect do `/recipes/[id]/edit`
- **Usuwanie**: Przycisk "Delete" secondary → modal potwierdzenia → `DELETE /api/recipes/[id]` → redirect do `/recipes`

**Komponenty**:

- `RecipeDetailPage.astro` (Astro component)
- `RecipeHeader.tsx` (React - przyciski Edit/Delete)
- `RecipeContent.tsx` (React - dwukolumnowy layout)
- `DeleteConfirmModal.tsx` (React - modal potwierdzenia)

---

#### 2.3 Tworzenie przepisu - Tryb AI (`/recipes/new?mode=ai`)

**Layout**:

```
┌─────────────────────────────────────────┐
│ TopBar                                  │
├─────────────────────────────────────────┤
│ Generuj przepis z AI                   │
├─────────────────────────────────────────┤
│ Wklej tekst przepisu (max 10000 znaków)│
│ ┌─────────────────────────────────────┐ │
│ │ [Large Textarea]                    │ │
│ │                                     │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│ 1234/10000 znaków                       │
│ [Generuj przepis] [Anuluj]             │
├─────────────────────────────────────────┤
│ === Po wygenerowaniu ===                │
│ ✓ Przepis wygenerowany pomyślnie!      │
│ (toast notification)                    │
├─────────────────────────────────────────┤
│ [Formularz przepisu - wypełniony]       │
│ (ten sam komponent co w trybie manual) │
└─────────────────────────────────────────┘
```

**Przepływ AI**:

1. User klika "Dodaj przepis" → dropdown → "Generuj z AI"
2. Redirect do `/recipes/new?mode=ai`
3. User wkleja tekst (max 10k znaków, licznik)
4. Kliknięcie "Generuj" → `POST /api/recipes/generate` + loading state
5. **Sukces**: Toast + wypełniony formularz poniżej + scroll do formularza
6. **Błąd**: Inline error message pod textarea + pusty formularz poniżej

**Loading state**:

```typescript
{
  isGenerating: true;
  // Disable textarea, przycisk "Generuj"
  // Pokazać spinner + tekst "Analizuję przepis..."
}
```

**Error handling**:

```typescript
// 422 Unprocessable Entity
<div className="text-destructive">
  Nie udało się przetworzyć tekstu. Upewnij się, że wkleiłeś przepis kulinarny.
  <Button variant="link">Spróbuj ponownie</Button>
</div>

// 500 Internal Server Error
<div className="text-destructive">
  Wystąpił błąd serwera. Spróbuj ponownie później.
  <Button onClick={retryGeneration}>Spróbuj ponownie</Button>
</div>
```

---

#### 2.4 Formularz przepisu (współdzielony komponent)

**Używany w**:

- `/recipes/new?mode=ai` (po generacji)
- `/recipes/new?mode=manual`
- `/recipes/[id]/edit`

**Layout**:

```
┌─────────────────────────────────────────┐
│ [=== Tryb AI: TextArea ===]            │ (conditional)
├─────────────────────────────────────────┤
│ Nazwa przepisu *                        │
│ ┌─────────────────────────────────────┐ │
│ │ [Input]                             │ │
│ └─────────────────────────────────────┘ │
│ {error message}                         │
├─────────────────────────────────────────┤
│ Opis (opcjonalny)                       │
│ ┌─────────────────────────────────────┐ │
│ │ [Textarea]                          │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ Składniki *                             │
│ ┌─────────────────────────────────────┐ │
│ │ [☰] 200g spaghetti      [⋮ Menu]   │ │
│ │ [☰] 100g pancetta       [⋮ Menu]   │ │
│ │ [☰] 2 eggs              [⋮ Menu]   │ │
│ └─────────────────────────────────────┘ │
│ [+ Dodaj składnik]                      │
├─────────────────────────────────────────┤
│ Kroki *                                 │
│ ┌─────────────────────────────────────┐ │
│ │ [☰] 1. Boil water       [⋮ Menu]   │ │
│ │ [☰] 2. Cook pasta       [⋮ Menu]   │ │
│ └─────────────────────────────────────┘ │
│ [+ Dodaj krok]                          │
├─────────────────────────────────────────┤
│ Tagi                                    │
│ ┌─────────────────────────────────────┐ │
│ │ [Combobox: wpisz lub wybierz...]   │ │
│ └─────────────────────────────────────┘ │
│ [pasta ✕] [italian ✕] [quick ✕]       │
├─────────────────────────────────────────┤
│ [Zapisz przepis] [Anuluj]              │
└─────────────────────────────────────────┘
```

**Komponenty szczegółowe**:

##### Składnik/Krok - Hamburger menu (⋮)

Dropdown menu z opcjami:

- **Edytuj**: Zamienia tekst na inline input + przyciski [Save] [Cancel]
- **Usuń**: Usuwa element z listy (bez potwierdzenia)

##### Modal dodawania składnika/kroku

```
┌─────────────────────────┐
│ Dodaj składnik          │
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │ [Input]             │ │
│ └─────────────────────┘ │
│ [Dodaj] [Anuluj]        │
└─────────────────────────┘
```

##### Combobox tagów (shadcn/ui Command)

- Wpisywanie → query do `/api/tags?q=...`
- Lista istniejących tagów (dropdown)
- Obsługa keyboard: Arrows (nawigacja) + Enter (wybór)
- Nowy tag: wpisać tekst + Enter (dodaje pill bez query)
- Pill z przyciskiem ✕ (usunięcie tagu z formularza)

**Walidacja (Zod)**:

```typescript
const recipeFormSchema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana").max(255),
  description: z.string().optional(),
  ingredients: z
    .array(
      z.object({
        content: z.string().min(1, "Składnik nie może być pusty"),
        position: z.number(),
      })
    )
    .min(1, "Dodaj przynajmniej jeden składnik"),
  steps: z
    .array(
      z.object({
        content: z.string().min(1, "Krok nie może być pusty"),
        position: z.number(),
      })
    )
    .min(1, "Dodaj przynajmniej jeden krok"),
  tags: z.array(z.string().max(50)).optional(),
  generationId: z.string().uuid().optional(),
});
```

**Zapisywanie**:

1. Walidacja (Zod) → błędy inline
2. `POST /api/recipes` (lub `PUT /api/recipes/[id]` dla edycji)
3. Loading state (disable form + spinner)
4. **Sukces**: Wyczyść localStorage → Toast → Redirect do `/recipes/[id]`
5. **Błąd**: Toast + możliwość retry

---

#### 2.5 Tworzenie przepisu - Tryb manual (`/recipes/new?mode=manual`)

Identyczny formularz jak w 2.4, ale **bez** TextArea na początku. Użytkownik od razu widzi pusty formularz.

---

### 3. Strategia integracji z API i zarządzania stanem

#### 3.1 TanStack Query (React Query) - Server State

**Konfiguracja**:

```typescript
// src/lib/query-client.ts
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minut
      cacheTime: 10 * 60 * 1000, // 10 minut
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});
```

**Provider** (owinięcie całej aplikacji):

```typescript
// src/components/QueryProvider.tsx
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/query-client'

export function QueryProvider({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

**Przykładowe query**:

```typescript
// src/hooks/useRecipes.ts
import { useQuery } from "@tanstack/react-query";

export function useRecipes(page: number, filters: Filters) {
  return useQuery({
    queryKey: ["recipes", page, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "10",
        ...(filters.tags.length && { tag: filters.tags.join(",") }),
        ...(filters.searchQuery && { q: filters.searchQuery }),
      });

      const res = await fetch(`/api/recipes?${params}`);
      if (!res.ok) throw new Error("Failed to fetch recipes");
      return res.json();
    },
  });
}
```

**Przykładowa mutacja**:

```typescript
// src/hooks/useCreateRecipe.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recipe: RecipeFormData) => {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recipe),
      });
      if (!res.ok) throw new Error("Failed to create recipe");
      return res.json();
    },
    onSuccess: () => {
      // Invalidate recipes list cache
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });
}
```

#### 3.2 React Context API - UI State

**Przykład: Navigation Context**:

```typescript
// src/contexts/NavigationContext.tsx
import { createContext, useContext, useState } from 'react'

type NavigationState = {
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: (open: boolean) => void
}

const NavigationContext = createContext<NavigationState | undefined>(undefined)

export function NavigationProvider({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <NavigationContext.Provider value={{ isMobileMenuOpen, setIsMobileMenuOpen }}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (!context) throw new Error('useNavigation must be used within NavigationProvider')
  return context
}
```

#### 3.3 Custom Hook - localStorage Persistence

```typescript
// src/hooks/useRecipeFormPersistence.ts
import { useEffect } from "react";
import { useDebounce } from "use-debounce";

const STORAGE_KEY = "recipe_draft";

export function useRecipeFormPersistence(formData: RecipeFormData, generationId?: string) {
  const [debouncedData] = useDebounce(formData, 1000);

  // Save to localStorage (debounced)
  useEffect(() => {
    if (debouncedData) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...debouncedData,
          generationId,
          timestamp: Date.now(),
        })
      );
    }
  }, [debouncedData, generationId]);

  // Load from localStorage
  const loadDraft = (): RecipeFormData | null => {
    const draft = localStorage.getItem(STORAGE_KEY);
    if (!draft) return null;

    try {
      return JSON.parse(draft);
    } catch {
      return null;
    }
  };

  // Clear localStorage
  const clearDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  return { loadDraft, clearDraft };
}
```

**Użycie w komponencie**:

```typescript
// src/components/RecipeForm.tsx
function RecipeForm({ mode, generationId }: Props) {
  const [formData, setFormData] = useState<RecipeFormData>(initialData);
  const { loadDraft, clearDraft } = useRecipeFormPersistence(formData, generationId);
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  // Check for draft on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setShowRestoreModal(true);
    }
  }, []);

  const handleRestore = () => {
    const draft = loadDraft();
    if (draft) setFormData(draft);
    setShowRestoreModal(false);
  };

  const handleDiscard = async () => {
    clearDraft();
    setShowRestoreModal(false);

    // Jeśli był generationId, ustaw is_accepted=false
    if (generationId) {
      await fetch(`/api/generation/${generationId}/reject`, { method: "POST" });
    }
  };

  // ... rest of component
}
```

#### 3.4 Mapowanie endpointów → komponenty

| Endpoint                | Metoda | Komponent/Hook        | Opis                                |
| ----------------------- | ------ | --------------------- | ----------------------------------- |
| `/api/recipes`          | GET    | `useRecipes()`        | Lista przepisów (paginacja, filtry) |
| `/api/recipes`          | POST   | `useCreateRecipe()`   | Tworzenie nowego przepisu           |
| `/api/recipes/[id]`     | GET    | `useRecipe(id)`       | Szczegóły pojedynczego przepisu     |
| `/api/recipes/[id]`     | PUT    | `useUpdateRecipe(id)` | Edycja przepisu                     |
| `/api/recipes/[id]`     | DELETE | `useDeleteRecipe(id)` | Usuwanie przepisu                   |
| `/api/tags`             | GET    | `useTags(query?)`     | Autocomplete tagów                  |
| `/api/recipes/generate` | POST   | `useGenerateRecipe()` | Generowanie przepisu AI             |

---

### 4. Responsywność, dostępność i bezpieczeństwo

#### 4.1 Responsywność

**Breakpointy Tailwind CSS**:

```typescript
// tailwind.config.js (default)
{
  screens: {
    sm: '640px',   // Mobile landscape / small tablet
    md: '768px',   // Tablet
    lg: '1024px',  // Desktop
    xl: '1280px',  // Large desktop
    '2xl': '1536px' // Extra large
  }
}
```

**Responsive patterns**:

##### Grid przepisów

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{/* Karty przepisów */}</div>
```

##### Widok szczegółowy (dwukolumnowy → jednocolumnowy)

```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
  <div>{/* Składniki */}</div>
  <div>{/* Kroki */}</div>
</div>
```

##### TopBar (desktop → hamburger mobile)

```tsx
<nav className="flex items-center justify-between">
  {/* Desktop menu */}
  <div className="hidden lg:flex gap-4">
    <Button>Przepisy</Button>
    <DropdownMenu>
      <DropdownMenuTrigger>Dodaj przepis</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Generuj z AI</DropdownMenuItem>
        <DropdownMenuItem>Utwórz manualnie</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>

  {/* Mobile hamburger */}
  <Sheet>
    <SheetTrigger className="lg:hidden">
      <Menu size={24} />
    </SheetTrigger>
    <SheetContent side="left">{/* Mobile menu items */}</SheetContent>
  </Sheet>
</nav>
```

#### 4.2 Dostępność (a11y)

**Poziom docelowy**: WCAG 2.1 Level AA (w przyszłych iteracjach)

**Podstawowe wymagania dla MVP**:

##### Keyboard navigation

- Wszystkie interaktywne elementy dostępne przez Tab
- Focus visible indicators (Tailwind `focus-visible:` variants)
- Skip links (opcjonalnie)

```tsx
<Button className="focus-visible:ring-2 focus-visible:ring-offset-2">Zapisz</Button>
```

##### ARIA labels

```tsx
<button aria-label="Usuń składnik">
  <Trash2 size={16} />
</button>

<input
  type="text"
  aria-label="Nazwa przepisu"
  aria-required="true"
  aria-invalid={!!errors.name}
  aria-describedby={errors.name ? "name-error" : undefined}
/>
{errors.name && (
  <span id="name-error" className="text-destructive text-sm">
    {errors.name}
  </span>
)}
```

##### Semantic HTML

```tsx
<main>
  <h1>Lista przepisów</h1>
  <section aria-label="Filtry">{/* Pill buttons */}</section>
  <section aria-label="Przepisy">
    <ul>
      {recipes.map((recipe) => (
        <li key={recipe.id}>
          <article>
            <h2>{recipe.name}</h2>
            {/* ... */}
          </article>
        </li>
      ))}
    </ul>
  </section>
</main>
```

##### Focus management w modalach

```tsx
import { Dialog, DialogContent } from "@/components/ui/dialog";

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    {/* Focus automatycznie przeniesiony do modalu */}
    {/* Escape zamyka modal */}
    {/* Focus wraca do trigger po zamknięciu */}
  </DialogContent>
</Dialog>;
```

#### 4.3 Bezpieczeństwo

**Uwierzytelnianie** (Supabase Auth):

```typescript
// src/middleware/index.ts (przyszła implementacja)
export async function onRequest(context, next) {
  const { supabase } = context.locals;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const protectedRoutes = ["/recipes", "/recipes/new", "/recipes/[id]/edit"];
  const isProtected = protectedRoutes.some((route) => context.url.pathname.startsWith(route));

  if (isProtected && !user) {
    return context.redirect("/login");
  }

  return next();
}
```

**CSRF protection**:

- Supabase JWT w Authorization header
- SameSite cookies dla sesji

**XSS prevention**:

- React automatyczne escapowanie (JSX)
- Zod validation na inputach
- Sanityzacja HTML jeśli kiedykolwiek używamy `dangerouslySetInnerHTML`

**Input validation**:

```typescript
// Zawsze walidacja po stronie klienta (Zod) + serwera (Zod)
// Przykład:
const sanitizeRecipeName = (name: string) => {
  return name.trim().slice(0, 255); // Max length
};
```

---

### 5. Komponenty i ich hierarchia

#### 5.1 Struktura folderów

```
src/
├── components/
│   ├── ui/                    # Shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── sheet.tsx
│   │   ├── toast.tsx
│   │   └── command.tsx
│   │
│   ├── layout/
│   │   ├── TopBar.tsx         # Główna nawigacja
│   │   ├── MobileNav.tsx      # Hamburger menu
│   │   └── Layout.astro       # Wrapper layout
│   │
│   ├── recipes/
│   │   ├── RecipeCard.tsx     # Karta przepisu (lista)
│   │   ├── RecipeGrid.tsx     # Grid z kartami
│   │   ├── RecipeDetail.tsx   # Widok szczegółowy
│   │   ├── RecipeForm.tsx     # Główny formularz
│   │   ├── IngredientList.tsx # Lista składników
│   │   ├── StepList.tsx       # Lista kroków
│   │   ├── TagCombobox.tsx    # Autocomplete tagów
│   │   └── DeleteRecipeModal.tsx
│   │
│   ├── generation/
│   │   ├── AIGenerationForm.tsx  # TextArea + generuj
│   │   └── GenerationStatus.tsx  # Loading/error states
│   │
│   └── providers/
│       ├── QueryProvider.tsx
│       └── NavigationProvider.tsx
│
├── hooks/
│   ├── useRecipes.ts
│   ├── useRecipe.ts
│   ├── useCreateRecipe.ts
│   ├── useUpdateRecipe.ts
│   ├── useDeleteRecipe.ts
│   ├── useTags.ts
│   ├── useGenerateRecipe.ts
│   └── useRecipeFormPersistence.ts
│
├── pages/
│   ├── index.astro            # Redirect
│   ├── login.astro
│   ├── register.astro
│   ├── recipes/
│   │   ├── index.astro        # Lista
│   │   ├── new.astro          # Tworzenie (AI/manual)
│   │   ├── [id].astro         # Szczegóły
│   │   └── [id]/
│   │       └── edit.astro     # Edycja
│   └── api/
│       ├── recipes/
│       │   ├── index.ts       # GET/POST
│       │   ├── [id].ts        # GET/PUT/DELETE
│       │   └── generate.ts    # POST
│       └── tags/
│           └── index.ts       # GET
│
└── lib/
    ├── supabase.client.ts
    ├── query-client.ts
    └── utils.ts
```

#### 5.2 Kluczowe komponenty

##### TopBar.tsx

```typescript
interface TopBarProps {
  user: User | null
}

export function TopBar({ user }: TopBarProps) {
  return (
    <header className="border-b">
      <nav className="container flex items-center justify-between py-4">
        {/* Logo */}
        <Link to="/recipes" className="text-xl font-bold">
          Forkful
        </Link>

        {/* Search (desktop) */}
        <div className="hidden md:block flex-1 max-w-md mx-8">
          <Input
            type="search"
            placeholder="Szukaj przepisów..."
          />
        </div>

        {/* Desktop menu */}
        <div className="hidden lg:flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus className="mr-2" />
                Dodaj przepis
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem asChild>
                <Link to="/recipes/new?mode=ai">Generuj z AI</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/recipes/new?mode=manual">Utwórz manualnie</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost">
                <User className="mr-2" />
                {user?.email}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Ustawienia</DropdownMenuItem>
              <DropdownMenuItem>Wyloguj</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile hamburger */}
        <MobileNav user={user} />
      </nav>
    </header>
  )
}
```

##### RecipeForm.tsx

```typescript
interface RecipeFormProps {
  mode: 'ai' | 'manual' | 'edit'
  initialData?: Recipe
  generationId?: string
}

export function RecipeForm({ mode, initialData, generationId }: RecipeFormProps) {
  const [formData, setFormData] = useState<RecipeFormData>(
    initialData || emptyForm
  )
  const { loadDraft, clearDraft } = useRecipeFormPersistence(formData, generationId)
  const createRecipe = useCreateRecipe()

  // ... localStorage restore modal logic

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    // Zod validation
    const result = recipeFormSchema.safeParse(formData)
    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors)
      return
    }

    // Submit
    try {
      await createRecipe.mutateAsync({ ...formData, generationId })
      clearDraft()
      toast.success('Przepis zapisany!')
      // Redirect do /recipes/[id]
    } catch (error) {
      toast.error('Nie udało się zapisać przepisu')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Conditional: AI TextArea */}
      {mode === 'ai' && (
        <AIGenerationSection onGenerate={handleGenerate} />
      )}

      {/* Nazwa */}
      <div>
        <Label htmlFor="name">Nazwa przepisu *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          aria-invalid={!!errors.name}
        />
        {errors.name && <ErrorMessage>{errors.name}</ErrorMessage>}
      </div>

      {/* Opis */}
      <div>
        <Label htmlFor="description">Opis</Label>
        <Textarea id="description" {...} />
      </div>

      {/* Składniki */}
      <div>
        <Label>Składniki *</Label>
        <IngredientList
          ingredients={formData.ingredients}
          onChange={updatedIngredients =>
            setFormData({ ...formData, ingredients: updatedIngredients })
          }
        />
        {errors.ingredients && <ErrorMessage>{errors.ingredients}</ErrorMessage>}
      </div>

      {/* Kroki */}
      <div>
        <Label>Kroki *</Label>
        <StepList
          steps={formData.steps}
          onChange={updatedSteps =>
            setFormData({ ...formData, steps: updatedSteps })
          }
        />
        {errors.steps && <ErrorMessage>{errors.steps}</ErrorMessage>}
      </div>

      {/* Tagi */}
      <div>
        <Label>Tagi</Label>
        <TagCombobox
          selectedTags={formData.tags}
          onChange={updatedTags =>
            setFormData({ ...formData, tags: updatedTags })
          }
        />
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Button type="submit" disabled={createRecipe.isPending}>
          {createRecipe.isPending ? 'Zapisywanie...' : 'Zapisz przepis'}
        </Button>
        <Button type="button" variant="outline" onClick={handleCancel}>
          Anuluj
        </Button>
      </div>
    </form>
  )
}
```

##### IngredientList.tsx

```typescript
interface IngredientListProps {
  ingredients: Ingredient[]
  onChange: (ingredients: Ingredient[]) => void
}

export function IngredientList({ ingredients, onChange }: IngredientListProps) {
  const [showAddModal, setShowAddModal] = useState(false)

  const handleAdd = (content: string) => {
    const newIngredient = {
      content,
      position: ingredients.length + 1
    }
    onChange([...ingredients, newIngredient])
    setShowAddModal(false)
  }

  const handleEdit = (index: number, content: string) => {
    const updated = [...ingredients]
    updated[index] = { ...updated[index], content }
    onChange(updated)
  }

  const handleDelete = (index: number) => {
    const updated = ingredients.filter((_, i) => i !== index)
    // Reindex positions
    onChange(updated.map((ing, i) => ({ ...ing, position: i + 1 })))
  }

  return (
    <div className="space-y-2">
      {ingredients.map((ingredient, index) => (
        <IngredientItem
          key={index}
          ingredient={ingredient}
          onEdit={content => handleEdit(index, content)}
          onDelete={() => handleDelete(index)}
        />
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={() => setShowAddModal(true)}
      >
        <Plus className="mr-2" />
        Dodaj składnik
      </Button>

      <AddItemModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAdd}
        title="Dodaj składnik"
        placeholder="np. 200g mąki"
      />
    </div>
  )
}
```

##### TagCombobox.tsx

```typescript
interface TagComboboxProps {
  selectedTags: string[]
  onChange: (tags: string[]) => void
}

export function TagCombobox({ selectedTags, onChange }: TagComboboxProps) {
  const [query, setQuery] = useState('')
  const { data: suggestions = [] } = useTags(query)

  const handleSelect = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      onChange([...selectedTags, tag])
    }
    setQuery('')
  }

  const handleRemove = (tag: string) => {
    onChange(selectedTags.filter(t => t !== tag))
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      e.preventDefault()
      handleSelect(query.trim())
    }
  }

  return (
    <div className="space-y-2">
      <Command>
        <CommandInput
          placeholder="Wpisz lub wybierz tag..."
          value={query}
          onValueChange={setQuery}
          onKeyDown={handleKeyDown}
        />
        <CommandList>
          <CommandEmpty>
            Naciśnij Enter aby stworzyć tag "{query}"
          </CommandEmpty>
          <CommandGroup>
            {suggestions.map(tag => (
              <CommandItem
                key={tag.id}
                onSelect={() => handleSelect(tag.name)}
              >
                {tag.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>

      {/* Selected tags pills */}
      <div className="flex flex-wrap gap-2">
        {selectedTags.map(tag => (
          <Badge key={tag} variant="secondary">
            {tag}
            <button
              type="button"
              onClick={() => handleRemove(tag)}
              className="ml-2"
              aria-label={`Usuń tag ${tag}`}
            >
              <X size={14} />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  )
}
```

---

### 6. Plan implementacji (kolejność)

#### Faza 1: Fundament (tydzień 1)

1. Setup projektu (Astro + React + Tailwind + shadcn/ui)
2. Instalacja shadcn/ui components (button, input, dialog, dropdown, sheet, command, toast)
3. Konfiguracja Supabase client
4. Konfiguracja TanStack Query + providers
5. Strony auth: `/login`, `/register` (proste formularze)
6. Layout + TopBar (bez funkcjonalności, tylko UI)

#### Faza 2: Lista przepisów (tydzień 2)

1. API endpoint: `GET /api/recipes` (backend)
2. Hook: `useRecipes()`
3. Komponenty: `RecipeCard`, `RecipeGrid`
4. Strona: `/recipes/index.astro` (lista + paginacja)
5. Filtrowanie po tagach (pill buttons)
6. Wyszukiwanie (input w TopBar)

#### Faza 3: Widok szczegółowy (tydzień 2)

1. API endpoint: `GET /api/recipes/[id]` (backend)
2. Hook: `useRecipe(id)`
3. Komponent: `RecipeDetail` (dwukolumnowy layout)
4. Strona: `/recipes/[id].astro`
5. Usuwanie przepisu: `DeleteRecipeModal` + `useDeleteRecipe()`

#### Faza 4: Formularz przepisu (tydzień 3-4)

1. Komponent: `RecipeForm` (podstawowa struktura)
2. Komponenty: `IngredientList`, `StepList` (CRUD inline + modal)
3. Komponenty: `TagCombobox` + API `/api/tags` + `useTags()`
4. Walidacja Zod
5. Hook: `useRecipeFormPersistence()` (localStorage)
6. Modal przywracania draft'a
7. API endpoint: `POST /api/recipes` + `useCreateRecipe()`

#### Faza 5: Generowanie AI (tydzień 4)

1. API endpoint: `POST /api/recipes/generate` (backend + OpenRouter)
2. Hook: `useGenerateRecipe()`
3. Komponent: `AIGenerationForm` (TextArea + licznik)
4. Integracja z `RecipeForm` (conditional TextArea)
5. Loading states + error handling
6. Toast notifications

#### Faza 6: Edycja przepisu (tydzień 5)

1. API endpoint: `PUT /api/recipes/[id]` (backend)
2. Hook: `useUpdateRecipe(id)`
3. Strona: `/recipes/[id]/edit.astro`
4. Reużycie `RecipeForm` z `mode='edit'` + `initialData`

#### Faza 7: Polish i bugfixes (tydzień 5-6)

1. Responsywność mobile (testowanie na różnych urządzeniach)
2. Error handling (wszystkie edge cases)
3. Loading states (skeletons, spinners)
4. Accessibility audit (keyboard navigation, ARIA)
5. Performance optimization (jeśli potrzebne)

---

## Unresolved Issues

### 1. Middleware Astro dla protected routes

**Status**: Odłożone na później (decyzja 14.2)

**Do rozwiązania**:

- Kiedy implementować middleware?
- Czy użyć Astro middleware czy client-side redirects?
- Jak obsłużyć refresh tokeny Supabase?

**Tymczasowe rozwiązanie**: Client-side sprawdzanie w każdym komponencie/stronie:

```typescript
const {
  data: { user },
} = await supabase.auth.getUser();
if (!user) return Astro.redirect("/login");
```

---

### 2. Weryfikacja email po rejestracji

**Status**: Odłożone na później (decyzja 8.2)

**Do rozwiązania**:

- Czy blokować dostęp do aplikacji przed weryfikacją?
- Jak wyświetlić ekran "Sprawdź swoją skrzynkę email"?
- Jak obsłużyć link weryfikacyjny (redirect do aplikacji)?

**Wymagane działania**:

- Konfiguracja Supabase email templates
- Strona `/verify-email` (opcjonalnie)
- Logika sprawdzania `user.email_confirmed_at`

---

### 3. Obsługa conflict'ów przy edycji (race condition)

**Status**: Nie uwzględnione w MVP

**Problem**:
Użytkownik A edytuje przepis w `/recipes/[id]/edit`. Tymczasem użytkownik B (ten sam user, inna karta) również edytuje ten sam przepis. Oba zapisują zmiany → ostatni zapis nadpisuje wszystko.

**Potencjalne rozwiązania**:

- Optimistic locking (timestamp version checking)
- Warning "Przepis został zmodyfikowany. Przeładować?" przed zapisem
- Zabronić wielu jednoczesnych edycji (wykryć multiple tabs)

**Decyzja dla MVP**: Ignorujemy problem. Ostatni zapis wygrywa. Do przemyślenia w przyszłych iteracjach.

---

### 4. Limit długości składników/kroków

**Status**: Nie określone

**Do ustalenia**:

- Maksymalna długość `content` dla składnika? (aktualnie nie ma limitu w schema)
- Maksymalna długość `content` dla kroku?
- Czy validować to po stronie klienta (Zod) czy tylko backend?

**Rekomendacja**:

```typescript
ingredient.content: max 255 znaków
step.content: max 1000 znaków
```

---

### 5. Sortowanie listy przepisów

**Status**: Tylko częściowo określone (decyzja 2.2 nie wspomina sortowania)

**Do ustalenia**:

- Czy użytkownik może zmienić sortowanie (dropdown: data utworzenia / nazwa A-Z / ostatnio edytowane)?
- Domyślne sortowanie: `created_at DESC` (założone w API plan)

**Rekomendacja dla MVP**: Tylko domyślne sortowanie `created_at DESC`. Brak UI do zmiany sortowania.

---

### 6. Empty states (brak przepisów)

**Status**: Nie określone szczegółowo

**Do zaprojektowania**:

- Co pokazać gdy użytkownik nie ma żadnych przepisów?
- Co pokazać gdy filtrowanie/wyszukiwanie nie zwraca wyników?

**Rekomendacja**:

```tsx
// Brak przepisów (nowy użytkownik)
<EmptyState
  icon={<ChefHat />}
  title="Nie masz jeszcze żadnych przepisów"
  description="Zacznij od wklejenia tekstu przepisu lub stwórz go ręcznie."
  actions={
    <>
      <Button asChild>
        <Link to="/recipes/new?mode=ai">Generuj z AI</Link>
      </Button>
      <Button variant="outline" asChild>
        <Link to="/recipes/new?mode=manual">Utwórz manualnie</Link>
      </Button>
    </>
  }
/>

// Brak wyników wyszukiwania
<EmptyState
  icon={<Search />}
  title="Brak wyników"
  description="Nie znaleziono przepisów pasujących do wyszukiwania."
  actions={
    <Button onClick={clearFilters}>Wyczyść filtry</Button>
  }
/>
```

---

### 7. Obsługa długiego czasu generowania AI (timeout)

**Status**: Nie określone

**Do ustalenia**:

- Jaki timeout dla request do `/api/recipes/generate`? (domyślnie 2 minuty w Astro)
- Co pokazać użytkownikowi jeśli generowanie trwa > 30 sekund?
- Czy dodać progress bar / animated placeholder?

**Rekomendacja**:

- Timeout: 60 sekund
- Po 10 sekundach: Dodatkowy tekst "To może potrwać chwilę..."
- Po timeout: Error message + retry button

---

### 8. Maksymalna liczba tagów na przepis

**Status**: Nie określone

**Do ustalenia**:

- Czy limitować liczbę tagów? (np. max 10 tagów na przepis)
- Frontend validation czy tylko backend?

**Rekomendacja**:

```typescript
tags: z.array(z.string().max(50)).max(10, "Maksymalnie 10 tagów");
```

---

### 9. Licznik użycia znaków w formularzu

**Status**: Określone tylko dla AI TextArea (10k znaków)

**Do ustalenia**:

- Czy pokazywać licznik dla innych pól? (opis, nazwa)
- Tylko gdy blisko limitu, czy zawsze?

**Rekomendacja dla MVP**: Licznik tylko dla AI TextArea. Inne pola mają hard limit (Zod) ale bez licznika UI.

---

### 10. Dark mode

**Status**: Nie w zakresie MVP (decyzja 15 pominięta)

**Do przyszłych iteracji**:

- System preference automatic dark mode (`prefers-color-scheme`)
- Toggle w ustawieniach użytkownika
- Persystencja preferencji w Supabase user metadata

---

## Podsumowanie decyzji technicznych

### Stack technologiczny (potwierdzony)

- **Frontend**: Astro 5 (SSR) + React 19 + TypeScript 5
- **Styling**: Tailwind CSS 4 + Shadcn/ui (New York, neutral)
- **Backend**: Astro API routes + Supabase (PostgreSQL + Auth)
- **AI**: OpenRouter.ai (modele do wyboru w backend)
- **State management**: TanStack Query + React Context API
- **Deployment**: Cloudflare Pages + GitHub Actions

### Kluczowe biblioteki

- `@tanstack/react-query` - server state
- `zod` - validation
- `use-debounce` - localStorage debouncing
- `@supabase/supabase-js` - Supabase client
- `lucide-react` - ikony
- Shadcn/ui components (button, input, dialog, dropdown, sheet, command, toast, badge)

### Pliki konfiguracyjne do utworzenia/zmodyfikacji

1. `astro.config.mjs` - dodać output: 'server', adapter: node()
2. `tsconfig.json` - path aliases (`@/*`)
3. `tailwind.config.js` - shadcn/ui theme
4. `components.json` - shadcn/ui config
5. `.env` - Supabase URL, keys, OpenRouter API key

---

## Next Steps (dla implementacji)

1. **Setup projektu**: Inicjalizacja Astro + instalacja zależności
2. **Database schema**: Implementacja tabel PostgreSQL (Supabase)
3. **API endpoints**: Backend implementacja zgodnie z API plan
4. **UI components**: Implementacja zgodnie z planem z Fazy 1-7
5. **Testing**: Manualne testowanie wszystkich przepływów
6. **Deployment**: Deploy do Cloudflare Pages

---

**Dokument wersja**: 1.0
**Data utworzenia**: 2025-01-08
**Status**: Draft - gotowe do implementacji MVP
