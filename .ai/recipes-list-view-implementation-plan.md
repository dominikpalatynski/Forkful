# Plan implementacji widoku Lista Przepisów

## 1. Przegląd

Widok Lista Przepisów to główny ekran aplikacji po zalogowaniu, służący do wyświetlania wszystkich przepisów użytkownika. Widok umożliwia przeglądanie przepisów w formie responsywnego gridu z kartami, wyszukiwanie po nazwie, filtrowanie po tagach oraz paginację. Kliknięcie w kartę przepisu przekierowuje do widoku szczegółowego. Widok obsługuje stany: ładowanie (szkielety), pusty stan (brak przepisów), brak wyników wyszukiwania oraz błędy API.

## 2. Routing widoku

**Ścieżka**: `/recipes`

Widok będzie dostępny pod ścieżką `/recipes`. Utworzona zostanie strona Astro `src/pages/recipes.astro`, która zaimportuje główny komponent React `RecipeListView` i osadzi go z dyrektywą `client:load`.

## 3. Struktura komponentów

```
RecipeListView (strona Astro: recipes.astro)
├── RecipeListHeader
│   ├── SearchInput
│   └── NewRecipeButton
├── TagFilter
│   └── TagFilterPill (wiele)
├── RecipeGrid
│   ├── RecipeCard (wiele) | RecipeCardSkeleton (wiele)
│   └── EmptyState (warunkowo)
├── PaginationControls
└── ErrorState (warunkowo)
```

**Dodatkowe komponenty pomocnicze**:

- `RecipeCardSkeleton` - szkielet karty przepisu w stanie ładowania
- `EmptyState` - pusty stan (brak przepisów lub brak wyników)
- `ErrorState` - komponent wyświetlany przy błędzie API

## 4. Szczegóły komponentów

### RecipeListView (główny kontener)

**Opis**: Główny komponent React zarządzający całym widokiem listy przepisów. Odpowiada za pobieranie danych z API, zarządzanie stanem wyszukiwania, filtrów, paginacji oraz renderowanie podkomponentów.

**Główne elementy HTML i komponenty**:

- `<div className="container mx-auto px-4 py-8">` - główny kontener
  - `RecipeListHeader` - nagłówek z wyszukiwarką
  - `TagFilter` - filtry tagów
  - `RecipeGrid` - siatka przepisów
  - `PaginationControls` - kontrolki paginacji
  - `ErrorState` - stan błędu (warunkowo)

**Obsługiwane zdarzenia**:

- Zmiana wartości wyszukiwania (`onSearchChange`)
- Wybór/odznaczenie tagu (`onTagToggle`)
- Zmiana strony paginacji (`onPageChange`)
- Zmiana rozmiaru strony (`onPageSizeChange`)
- Kliknięcie w kartę przepisu (przekierowanie do `/recipes/{id}`)

**Warunki walidacji**:

- wykonaj walidacje za pomocą zoda przy pomocy obiektu `GetRecipesSchema` tak jak to jest zrobione w backendzie

**Typy**:

- `PaginatedRecipesDto` - typ odpowiedzi z API
- `RecipeListItemDto` - typ pojedynczego przepisu w liście
- `RecipeListViewState` - ViewModel stanu komponentu
- `GetRecipesQueryParams` - parametry zapytania do API

**Propsy**: Brak (komponent główny)

---

### RecipeListHeader

**Opis**: Nagłówek widoku zawierający pole wyszukiwania oraz przycisk tworzenia nowego przepisu.

**Główne elementy HTML i komponenty**:

- `<header className="mb-6 flex justify-between items-center gap-4">`
  - `<div className="flex-1">` - kontener wyszukiwarki
    - `SearchInput` - pole wyszukiwania
  - `<div>` - kontener przycisku
    - `NewRecipeButton` - przycisk "Nowy przepis"

**Obsługiwane zdarzenia**:

- `onSearchChange` - zmiana wartości wyszukiwania (przekazywane z SearchInput)
- Kliknięcie w przycisk "Nowy przepis" (przekierowanie do `/recipes/new`)

**Warunki walidacji**:

- Brak walidacji
  **Typy**:
- `RecipeListHeaderProps` - interfejs propsów

**Propsy**:

```typescript
interface RecipeListHeaderProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
}
```

---

### SearchInput

**Opis**: Pole tekstowe do wyszukiwania przepisów po nazwie. Wykorzystuje komponent `Input` z Shadcn/ui. Wyszukiwanie jest debounced (opóźnione o 500ms), aby nie wysyłać zapytania przy każdej literze.

**Główne elementy HTML i komponenty**:

- `<div className="relative">`
  - `<Input>` (z Shadcn/ui) - pole tekstowe
  - `<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />` - ikona lupy

**Obsługiwane zdarzenia**:

- `onChange` - zmiana wartości pola (debounced)
- `onClear` - wyczyszczenie pola (ikona X przy niepustym polu)

**Warunki walidacji**: Brak (każdy tekst jest akceptowalny)

**Typy**:

- `SearchInputProps` - interfejs propsów

**Propsy**:

```typescript
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}
```

---

### NewRecipeButton

**Opis**: Przycisk nawigacyjny przekierowujący do strony tworzenia nowego przepisu (`/recipes/new`).

**Główne elementy HTML i komponenty**:

- `<Button asChild>` (z Shadcn/ui)
  - `<a href="/recipes/new">`
    - `<Plus />` - ikona
    - `"Nowy przepis"` - tekst

**Obsługiwane zdarzenia**:

- `onClick` - kliknięcie (natywna nawigacja `<a>`)

**Warunki walidacji**: Brak

**Typy**: Brak specjalnych typów

**Propsy**: Brak

---

### TagFilter

**Opis**: Komponent wyświetlający listę wszystkich dostępnych tagów użytkownika w formie klikalnych "pigułek". Pozwala na filtrowanie przepisów po **jednym wybranym tagu** (single-select). API obsługuje tylko jeden tag, więc gdy użytkownik klika w tag, poprzednio wybrany tag jest automatycznie odznaczany.

**Główne elementy HTML i komponenty**:

- `<div className="mb-6">`
  - `<h3 className="text-sm font-medium mb-2">Filtruj po tagu:</h3>`
  - `<div className="flex flex-wrap gap-2">`
    - `TagFilterPill` (dla każdego tagu) - pigułka tagu

**Obsługiwane zdarzenia**:

- `onTagSelect(tagName: string | null)` - wybór tagu (null = odznaczenie)

**Warunki walidacji**: Brak

**Typy**:

- `TagFilterProps` - interfejs propsów
- `TagDto` - typ pojedynczego tagu z API

**Propsy**:

```typescript
interface TagFilterProps {
  tags: TagDto[];
  selectedTag: string | null; // tylko jeden tag może być wybrany
  onTagSelect: (tagName: string | null) => void;
}
```

---

### TagFilterPill

**Opis**: Pojedyncza "pigułka" reprezentująca tag. Wyświetla nazwę tagu i jest klikalny. Zmienia wygląd w zależności od tego, czy jest wybrany.

**Główne elementy HTML i komponenty**:

- `<button>` - przycisk z stylami wariantu (wybrany/niewybrany)
  - Nazwa tagu

**Obsługiwane zdarzenia**:

- `onClick` - kliknięcie (wywołuje callback z nazwą tagu)

**Warunki walidacji**: Brak

**Typy**:

- `TagFilterPillProps` - interfejs propsów

**Propsy**:

```typescript
interface TagFilterPillProps {
  name: string;
  isSelected: boolean;
  onClick: (name: string) => void;
}
```

---

### RecipeGrid

**Opis**: Responsywna siatka (CSS Grid) wyświetlająca karty przepisów. W stanie ładowania wyświetla szkielety kart. W przypadku braku przepisów lub braku wyników wyszukiwania wyświetla komponent `EmptyState`.

**Główne elementy HTML i komponenty**:

- `<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">`
  - `RecipeCard` (dla każdego przepisu) - karta przepisu
  - `RecipeCardSkeleton` (w stanie ładowania, 8 sztuk)
  - `EmptyState` (gdy brak przepisów)

**Obsługiwane zdarzenia**:

- `onRecipeClick(recipeId: string)` - kliknięcie w kartę przepisu

**Warunki walidacji**: Brak

**Typy**:

- `RecipeGridProps` - interfejs propsów

**Propsy**:

```typescript
interface RecipeGridProps {
  recipes: RecipeListItemDto[];
  isLoading: boolean;
  isEmpty: boolean;
  onRecipeClick: (recipeId: string) => void;
}
```

---

### RecipeCard

**Opis**: Karta pojedynczego przepisu wyświetlająca jego nazwę, opis (skrócony) oraz tagi. Cała karta jest klikalnym linkiem prowadzącym do widoku szczegółowego przepisu.

**Główne elementy HTML i komponenty**:

- `<a href={`/recipes/${recipe.id}`} className="block">` - link do szczegółów
  - `<Card>` (z Shadcn/ui)
    - `<CardHeader>`
      - `<CardTitle>{recipe.name}</CardTitle>`
    - `<CardContent>`
      - `<p className="text-sm text-muted-foreground line-clamp-2">{recipe.description}</p>` - skrócony opis
      - `<div className="flex flex-wrap gap-1 mt-3">` - tagi
        - `<span className="px-2 py-1 text-xs rounded-full bg-secondary">` (dla każdego tagu)

**Obsługiwane zdarzenia**:

- Kliknięcie w kartę (natywna nawigacja linku)
- `hover` - efekt hover (zmiana stylu karty)

**Warunki walidacji**: Brak

**Typy**:

- `RecipeCardProps` - interfejs propsów
- `RecipeListItemDto` - typ przepisu

**Propsy**:

```typescript
interface RecipeCardProps {
  recipe: RecipeListItemDto;
}
```

---

### RecipeCardSkeleton

**Opis**: Szkielet karty przepisu wyświetlany w stanie ładowania. Wykorzystuje komponent `Skeleton` z Shadcn/ui.

**Główne elementy HTML i komponenty**:

- `<Card>`
  - `<CardHeader>`
    - `<Skeleton className="h-6 w-3/4" />` - szkielet tytułu
  - `<CardContent>`
    - `<Skeleton className="h-4 w-full mb-2" />` - szkielet opisu (linia 1)
    - `<Skeleton className="h-4 w-2/3" />` - szkielet opisu (linia 2)
    - `<div className="flex gap-1 mt-3">`
      - `<Skeleton className="h-6 w-16" />` (3 sztuki) - szkielety tagów

**Obsługiwane zdarzenia**: Brak

**Warunki walidacji**: Brak

**Typy**: Brak

**Propsy**: Brak

---

### EmptyState (komponent oparty na Shadcn/ui Empty)

**Opis**: Komponent wrapper wykorzystujący komponent `Empty` z Shadcn/ui, wyświetlany gdy użytkownik nie ma żadnych przepisów lub gdy wyszukiwanie/filtrowanie nie zwróciło wyników. Wyświetla odpowiedni komunikat i sugestię działania (np. przycisk "Dodaj pierwszy przepis").

**Instalacja**:

```bash
npx shadcn@latest add empty
```

**Główne elementy HTML i komponenty**:

- `<Empty>` (z Shadcn/ui)
  - `<EmptyHeader>` - nagłówek pustego stanu
    - `<EmptyMedia variant="icon">` - kontener na ikonę
      - `<ChefHat className="w-16 h-16" />` - ikona (wariant `no-recipes`)
      - `<Search className="w-16 h-16" />` - ikona (wariant `no-results`)
    - `<EmptyTitle>{title}</EmptyTitle>` - tytuł
    - `<EmptyDescription>{description}</EmptyDescription>` - opis
  - `<EmptyContent>` - zawartość z akcjami (tylko dla wariantu `no-recipes`)
    - `<Button asChild>`
      - `<a href="/recipes/new">Dodaj pierwszy przepis</a>`

**Obsługiwane zdarzenia**: Brak specjalnych (oprócz kliknięcia w przycisk)

**Warunki walidacji**: Brak

**Typy**:

- `EmptyStateProps` - interfejs propsów

**Propsy**:

```typescript
interface EmptyStateProps {
  variant: "no-recipes" | "no-results";
}
```

**Przykładowe teksty**:

- Wariant `no-recipes`:
  - Tytuł: "Brak przepisów"
  - Opis: "Nie masz jeszcze żadnych zapisanych przepisów. Dodaj swój pierwszy przepis, aby rozpocząć."
  - Akcja: Przycisk "Dodaj pierwszy przepis"
- Wariant `no-results`:
  - Tytuł: "Brak wyników"
  - Opis: "Nie znaleziono przepisów pasujących do Twojego wyszukiwania. Spróbuj użyć innych słów kluczowych lub wyczyść filtry."
  - Akcja: Brak

---

### PaginationControls

**Opis**: Kontrolki paginacji umożliwiające nawigację między stronami wyników oraz zmianę liczby elementów na stronie. Wyświetla informacje o aktualnej stronie, liczbie stron i całkowitej liczbie przepisów.

**Główne elementy HTML i komponenty**:

- `<div className="flex flex-col sm:flex-row justify-between items-center gap-4">`
  - `<div className="text-sm text-muted-foreground">` - informacja o wynikach
    - "Wyświetlanie {start}-{end} z {total} przepisów"
  - `<div className="flex items-center gap-2">`
    - `<Button variant="outline" size="sm" disabled={!canGoPrev}>Poprzednia</Button>`
    - `<span className="text-sm">Strona {currentPage} z {totalPages}</span>`
    - `<Button variant="outline" size="sm" disabled={!canGoNext}>Następna</Button>`
  - `<div className="flex items-center gap-2">`
    - `<Label>Wyników na stronie:</Label>`
    - `<Select value={pageSize} onValueChange={onPageSizeChange}>`
      - opcje: 10, 20, 50, 100

**Obsługiwane zdarzenia**:

- `onPageChange(page: number)` - zmiana strony
- `onPageSizeChange(size: number)` - zmiana liczby wyników na stronie

**Warunki walidacji**: Brak (przyciski są disabled gdy nie można przejść dalej/wstecz)

**Typy**:

- `PaginationControlsProps` - interfejs propsów

**Propsy**:

```typescript
interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}
```

---

### ErrorState

**Opis**: Komponent wyświetlany w przypadku błędu przy pobieraniu danych z API. Pokazuje komunikat błędu oraz przycisk "Spróbuj ponownie".

**Główne elementy HTML i komponenty**:

- `<div className="flex flex-col items-center justify-center py-12 text-center">`
  - `<AlertCircle className="w-16 h-16 text-destructive mb-4" />` - ikona błędu
  - `<h3 className="text-lg font-semibold mb-2">Wystąpił błąd</h3>`
  - `<p className="text-sm text-muted-foreground mb-4">{errorMessage}</p>`
  - `<Button onClick={onRetry}>Spróbuj ponownie</Button>`

**Obsługiwane zdarzenia**:

- `onRetry()` - ponowienie próby pobrania danych

**Warunki walidacji**: Brak

**Typy**:

- `ErrorStateProps` - interfejs propsów

**Propsy**:

```typescript
interface ErrorStateProps {
  error: Error | string;
  onRetry: () => void;
}
```

## 5. Typy

### Istniejące typy (z `src/types.ts`):

```typescript
// DTO pojedynczego przepisu w liście
export type RecipeListItemDto = Pick<Recipe, "id" | "name" | "description"> & {
  tags: string[];
};

// DTO paginowanej listy przepisów
export type PaginatedRecipesDto = {
  data: RecipeListItemDto[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};

// DTO tagu
export type TagDto = Pick<Tag, "id" | "name">;
```

### Nowe typy ViewModelu (do utworzenia w pliku komponentu lub osobnym pliku typów):

```typescript
// Stan widoku listy przepisów
export interface RecipeListViewState {
  searchQuery: string;
  selectedTag: string | null; // tylko jeden tag
  currentPage: number;
  pageSize: number;
  sortBy: "name" | "created_at";
  order: "asc" | "desc";
}

// Parametry zapytania GET /api/recipes
export interface GetRecipesQueryParams {
  page: number;
  pageSize: number;
  sortBy: "name" | "created_at";
  order: "asc" | "desc";
  tag?: string;
  search?: string; // Uwaga: obecnie API nie obsługuje search, może wymagać rozszerzenia
}

// Propsy komponentów (opisane w sekcji 4)
export interface RecipeListHeaderProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
}

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export interface TagFilterProps {
  tags: TagDto[];
  selectedTag: string | null; // tylko jeden tag może być wybrany
  onTagSelect: (tagName: string | null) => void;
}

export interface TagFilterPillProps {
  name: string;
  isSelected: boolean;
  onClick: (name: string) => void;
}

export interface RecipeGridProps {
  recipes: RecipeListItemDto[];
  isLoading: boolean;
  isEmpty: boolean;
  onRecipeClick: (recipeId: string) => void;
}

export interface RecipeCardProps {
  recipe: RecipeListItemDto;
}

export interface EmptyStateProps {
  variant: "no-recipes" | "no-results";
}

export interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export interface ErrorStateProps {
  error: Error | string;
  onRetry: () => void;
}
```

**Uwaga**: Typ `GetRecipesQueryParams` zawiera pole `search`, którego obecnie API nie obsługuje (endpoint `/api/recipes` nie ma parametru `search`). Wyszukiwanie może być zaimplementowane:

1. Po stronie klienta (filtrowanie po pobraniu wszystkich danych) - dla MVP
2. Wymaga rozszerzenia API o parametr `search` - dla pełnej funkcjonalności

## 6. Zarządzanie stanem

### Hook główny: `useRecipeListState`

Widok będzie wykorzystywał customowy hook `useRecipeListState`, który będzie zarządzał całym stanem widoku, w tym:

```typescript
export function useRecipeListState() {
  // Stan lokalny UI
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null); // tylko jeden tag
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [sortBy, setSortBy] = useState<"name" | "created_at">("created_at");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  // Debounced search query (500ms opóźnienie)
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Pobranie przepisów z API za pomocą React Query
  const {
    data: recipesData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<PaginatedRecipesDto>({
    queryKey: ["recipes", currentPage, pageSize, sortBy, order, selectedTag],
    queryFn: () =>
      fetchRecipes({
        page: currentPage,
        pageSize,
        sortBy,
        order,
        tag: selectedTag || undefined, // wysyłaj tag tylko jeśli jest wybrany
      }),
  });

  // Pobranie wszystkich tagów użytkownika
  const { data: tagsData } = useQuery<TagDto[]>({
    queryKey: ["tags"],
    queryFn: fetchUserTags,
  });

  // Handlery
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset do pierwszej strony przy wyszukiwaniu
  }, []);

  const handleTagSelect = useCallback((tagName: string | null) => {
    // Jeśli kliknięto ten sam tag, odznacz go (null), w przeciwnym razie wybierz nowy
    setSelectedTag((prev) => (prev === tagName ? null : tagName));
    setCurrentPage(1); // Reset do pierwszej strony przy filtrowaniu
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset do pierwszej strony przy zmianie rozmiaru
  }, []);

  const handleRecipeClick = useCallback((recipeId: string) => {
    // Nawigacja do szczegółów przepisu (natywna nawigacja przez <a>)
    window.location.href = `/recipes/${recipeId}`;
  }, []);

  // Filtrowanie po stronie klienta (wyszukiwanie po nazwie)
  const filteredRecipes = useMemo(() => {
    if (!recipesData?.data) return [];
    if (!debouncedSearchQuery) return recipesData.data;

    return recipesData.data.filter((recipe) => recipe.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()));
  }, [recipesData?.data, debouncedSearchQuery]);

  return {
    // Stan
    searchQuery,
    selectedTag,
    currentPage,
    pageSize,
    sortBy,
    order,

    // Dane
    recipes: filteredRecipes,
    pagination: recipesData?.pagination,
    tags: tagsData || [],

    // Flagi stanu
    isLoading,
    isError,
    error,
    isEmpty: !isLoading && filteredRecipes.length === 0,

    // Handlery
    handleSearchChange,
    handleTagSelect,
    handlePageChange,
    handlePageSizeChange,
    handleRecipeClick,
    handleRetry: refetch,
  };
}
```

### Hook pomocniczy: `useDebounce`

```typescript
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

### React Query

Zarządzanie danymi będzie odbywać się przez **React Query** (TanStack Query), która jest już zainstalowana w projekcie.

**Query keys**:

- `['recipes', page, pageSize, sortBy, order, selectedTag]` - lista przepisów (wyszukiwanie odbywa się po stronie klienta)
- `['tags']` - lista tagów użytkownika

**QueryClientProvider**:

- QueryClient jest już utworzony w [src/store/query/index.ts](src/store/query/index.ts)
- Provider musi być dodany w [src/layouts/DashboardLayout.astro](src/layouts/DashboardLayout.astro) (patrz Krok 8)

## 7. Integracja API

### Endpoint: `GET /api/recipes`

**URL**: `/api/recipes`

**Parametry zapytania** (typu `GetRecipesQueryParams`):

```typescript
{
  page: number;        // default: 1
  pageSize: number;    // default: 10, max: 100
  sortBy: 'name' | 'created_at';  // default: 'created_at'
  order: 'asc' | 'desc';          // default: 'desc'
  tag?: string;        // opcjonalnie, filtr po jednym tagu
}
```

**Typ odpowiedzi** (`PaginatedRecipesDto`):

```typescript
{
  data: RecipeListItemDto[];  // tablica przepisów
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  }
}
```

**Typ żądania**: Query parameters (GET)

**Funkcja fetcher**:

```typescript
async function fetchRecipes(params: GetRecipesQueryParams): Promise<PaginatedRecipesDto> {
  const searchParams = new URLSearchParams({
    page: params.page.toString(),
    pageSize: params.pageSize.toString(),
    sortBy: params.sortBy,
    order: params.order,
  });

  if (params.tag) {
    searchParams.append("tag", params.tag);
  }

  const response = await fetch(`/api/recipes?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error("Nie udało się pobrać przepisów");
  }

  return response.json();
}
```

### Endpoint: `GET /api/tags`

**Status**: ✅ **Endpoint jest już zaimplementowany** w [src/pages/api/tags/index.ts](src/pages/api/tags/index.ts)

**URL**: `/api/tags`

**Parametry zapytania** (opcjonalne):

- `q` (string) - filtrowanie tagów po nazwie (case-insensitive, starts with)

**Typ odpowiedzi**: `TagDto[]`

**Walidacja**: `GetTagsQuerySchema` z [src/lib/schemas/tag.schema.ts](src/lib/schemas/tag.schema.ts)

**Serwis**: `TagService` z [src/lib/services/tag.service.ts](src/lib/services/tag.service.ts)

**Funkcja fetcher**:

```typescript
async function fetchUserTags(): Promise<TagDto[]> {
  const response = await fetch("/api/tags");

  if (!response.ok) {
    throw new Error("Nie udało się pobrać tagów");
  }

  return response.json();
}
```

## 8. Interakcje użytkownika

### 8.1. Wyszukiwanie przepisów

**Akcja**: Użytkownik wpisuje tekst w pole wyszukiwania.

**Obsługa**:

1. Wartość pola jest aktualizowana natychmiast (`searchQuery` state)
2. Po 500ms debounce, wartość jest przekazywana do logiki filtrowania
3. Jeśli API obsługuje parametr `search` - wysyłane jest nowe zapytanie do API
4. Jeśli nie - przepisy są filtrowane po stronie klienta (po nazwie)
5. Paginacja jest resetowana do strony 1
6. Wyświetlany jest stan ładowania (szkielety) podczas pobierania danych
7. Po zakończeniu - wyświetlane są wyniki lub `EmptyState` (wariant `no-results`)

### 8.2. Filtrowanie po tagach (single-select)

**Akcja**: Użytkownik klika w pigułkę tagu.

**Obsługa**:

1. Jeśli kliknięty tag jest już wybrany → odznacz go (ustawienie `selectedTag = null`)
2. Jeśli kliknięty tag nie jest wybrany → wybierz go i odznacz poprzedni (ustawienie `selectedTag = tagName`)
3. Pigułka zmienia wygląd (wybrany/niewybrany)
4. Wysyłane jest nowe zapytanie do API z parametrem `tag` (wybrany tag lub brak parametru)
5. Paginacja jest resetowana do strony 1
6. Wyświetlany jest stan ładowania
7. Po zakończeniu - wyświetlane są wyniki lub `EmptyState`

### 8.3. Paginacja

**Akcja**: Użytkownik klika "Poprzednia" lub "Następna" strona.

**Obsługa**:

1. Aktualizowany jest `currentPage` state
2. Wysyłane jest nowe zapytanie do API z nowym numerem strony
3. Wyświetlany jest stan ładowania
4. Po zakończeniu - wyświetlane są przepisy dla nowej strony
5. Scroll do góry strony (opcjonalnie)

**Akcja**: Użytkownik zmienia liczbę wyników na stronie.

**Obsługa**:

1. Aktualizowany jest `pageSize` state
2. Paginacja jest resetowana do strony 1
3. Wysyłane jest nowe zapytanie do API
4. Wyświetlany jest stan ładowania
5. Po zakończeniu - wyświetlane są przepisy

### 8.4. Kliknięcie w kartę przepisu

**Akcja**: Użytkownik klika w kartę przepisu.

**Obsługa**:

1. Natywna nawigacja przeglądarki (element `<a>`) do `/recipes/{recipeId}`
2. Astro załaduje nową stronę ze szczegółami przepisu (widok nie jest jeszcze zaimplementowany)

### 8.5. Tworzenie nowego przepisu

**Akcja**: Użytkownik klika przycisk "Nowy przepis".

**Obsługa**:

1. Natywna nawigacja przeglądarki do `/recipes/new`
2. Astro załaduje stronę tworzenia przepisu (widok nie jest jeszcze zaimplementowany)

### 8.6. Obsługa błędu

**Akcja**: Użytkownik widzi komponent `ErrorState` i klika "Spróbuj ponownie".

**Obsługa**:

1. Wywołanie `refetch()` z React Query
2. Wyświetlany jest stan ładowania
3. Po zakończeniu - wyświetlane są przepisy lub ponownie błąd

## 9. Warunki i walidacja

### 9.1. Walidacja parametrów zapytania

Walidacja odbywa się **po stronie API** za pomocą schematu `GetRecipesSchema` (Zod). Frontend wysyła parametry, a API zwraca błąd 400 w przypadku nieprawidłowych danych.

**Komponent**: `RecipeListView` (główny)

**Warunki weryfikowane przez UI**:

- Brak (frontend ufamy API, że zwaliduje parametry)

**Wpływ na stan UI**:

- W przypadku błędu walidacji (status 400), React Query traktuje to jako błąd i wyświetlany jest `ErrorState`

### 9.2. Walidacja stanu paginacji

**Komponent**: `PaginationControls`

**Warunki**:

- Przycisk "Poprzednia" jest disabled, gdy `currentPage === 1`
- Przycisk "Następna" jest disabled, gdy `currentPage === totalPages`
- Liczba wyników na stronie nie może przekroczyć 100 (API zwróci błąd)

**Wpływ na stan UI**:

- Przyciski są wizualnie wyłączone (atrybut `disabled`, styl `opacity-50`)

### 9.3. Walidacja pustych stanów

**Komponent**: `RecipeGrid`

**Warunki**:

- `isLoading === true` → wyświetl `RecipeCardSkeleton` (8 sztuk)
- `isLoading === false && recipes.length === 0 && !searchQuery && !selectedTag` → wyświetl `EmptyState` wariant `no-recipes` (użytkownik nie ma żadnych przepisów)
- `isLoading === false && recipes.length === 0 && (searchQuery || selectedTag)` → wyświetl `EmptyState` wariant `no-results` (brak wyników wyszukiwania/filtrowania)
- `isLoading === false && recipes.length > 0` → wyświetl listę przepisów

**Wpływ na stan UI**:

- Odpowiedni komponent jest renderowany warunkowo

### 9.4. Walidacja błędów API

**Komponent**: `RecipeListView`

**Warunki**:

- `isError === true` → wyświetl `ErrorState` z komunikatem błędu

**Wpływ na stan UI**:

- Cały widok jest zastąpiony komponentem `ErrorState`
- Użytkownik może kliknąć "Spróbuj ponownie", aby ponowić zapytanie

## 10. Obsługa błędów

### 10.1. Błąd sieci / błąd API

**Scenariusz**: Zapytanie do `/api/recipes` kończy się błędem (np. 500, timeout, brak połączenia).

**Obsługa**:

- React Query ustawia `isError = true` i `error = Error`
- Renderowany jest komponent `ErrorState` z komunikatem: "Nie udało się pobrać przepisów. Sprawdź połączenie z internetem."
- Przycisk "Spróbuj ponownie" wywołuje `refetch()`, aby ponowić zapytanie

### 10.2. Błąd walidacji (400)

**Scenariusz**: API zwraca błąd 400 z powodu nieprawidłowych parametrów zapytania.

**Obsługa**:

- React Query traktuje to jako błąd
- Renderowany jest komponent `ErrorState` z komunikatem: "Wystąpił błąd podczas pobierania przepisów."
- W konsoli developerskiej logowany jest szczegółowy komunikat błędu walidacji

### 10.3. Błąd autoryzacji (401)

**Scenariusz**: Użytkownik nie jest zalogowany lub sesja wygasła.

**Obsługa**:

- API zwraca status 401
- Frontend przekierowuje użytkownika do strony logowania (`/login`)
- **Uwaga**: Wymaga implementacji middleware Astro lub obsługi w React Query

### 10.4. Brak przepisów (pusty stan)

**Scenariusz**: API zwraca pustą tablicę `data: []`.

**Obsługa**:

- Renderowany jest komponent `EmptyState`:
  - Wariant `no-recipes` - jeśli brak wyszukiwania/filtrowania
  - Wariant `no-results` - jeśli użytkownik wyszukiwał/filtrował

### 10.5. Brak tagów

**Scenariusz**: API `/api/tags` zwraca pustą tablicę.

**Obsługa**:

- Komponent `TagFilter` nie jest renderowany (lub wyświetla komunikat "Brak tagów")

### 10.6. Błąd podczas debounce

**Scenariusz**: Użytkownik bardzo szybko wpisuje tekst w wyszukiwarkę.

**Obsługa**:

- Debounce (500ms) zapobiega nadmiernemu wysyłaniu zapytań do API
- Tylko ostatnia wartość (po 500ms ciszy) wywołuje zapytanie

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury plików

1. Utwórz plik `src/pages/recipes.astro` - strona Astro dla widoku listy
2. Utwórz folder `src/components/recipes/` - komponenty React dla widoku
3. Zainstaluj komponent Empty z Shadcn/ui: `npx shadcn@latest add empty`
4. Utwórz plik `src/components/recipes/RecipeListView.tsx` - główny komponent
5. Utwórz pliki dla podkomponentów:
   - `RecipeListHeader.tsx`
   - `SearchInput.tsx`
   - `TagFilter.tsx`
   - `TagFilterPill.tsx`
   - `RecipeGrid.tsx`
   - `RecipeCard.tsx`
   - `RecipeCardSkeleton.tsx`
   - `EmptyState.tsx` (wrapper dla komponentu Empty z Shadcn/ui)
   - `PaginationControls.tsx`
   - `ErrorState.tsx`
6. Utwórz plik `src/components/recipes/hooks/useRecipeListState.ts` - custom hook
7. Utwórz plik `src/components/recipes/hooks/useDebounce.ts` - helper hook
8. Utwórz plik `src/components/recipes/types.ts` - typy ViewModelu

### Krok 3: Implementacja custom hooków

1. Zaimplementuj `useDebounce` w `src/components/recipes/hooks/useDebounce.ts`
2. Zaimplementuj `useRecipeListState` w `src/components/recipes/hooks/useRecipeListState.ts`:
   - Zdefiniuj wszystkie stany lokalne
   - Zaimplementuj zapytania React Query (`useQuery`)
   - Zaimplementuj wszystkie handlery (search, tag, pagination, itp.)
   - Zaimplementuj filtrowanie po stronie klienta (jeśli API nie obsługuje `search`)

### Krok 4: Implementacja komponentów atomowych

1. Upewnij się, że komponent Empty jest zainstalowany: `npx shadcn@latest add empty`
2. Zaimplementuj `TagFilterPill` - najprostszy komponent (przycisk z nazwą tagu)
3. Zaimplementuj `RecipeCardSkeleton` - szkielet karty (komponenty `Skeleton` z Shadcn/ui)
4. Zaimplementuj `SearchInput` - pole tekstowe z ikoną lupy
5. Zaimplementuj `NewRecipeButton` - przycisk nawigacyjny

### Krok 5: Implementacja komponentów złożonych

1. Zaimplementuj `RecipeCard`:
   - Link `<a>` do szczegółów przepisu
   - Karta z nazwą, opisem i tagami
   - Efekt hover
2. Zaimplementuj `EmptyState` (wrapper dla Shadcn/ui Empty):
   - Import komponentów: `Empty`, `EmptyHeader`, `EmptyMedia`, `EmptyTitle`, `EmptyDescription`, `EmptyContent`
   - Warianty `no-recipes` (z przyciskiem) i `no-results` (bez przycisku)
   - Różne ikony dla różnych wariantów: `ChefHat` (no-recipes), `Search` (no-results)
   - Teksty zgodne ze specyfikacją w sekcji 4
3. Zaimplementuj `ErrorState`:
   - Ikona błędu, komunikat, przycisk "Spróbuj ponownie"

### Krok 6: Implementacja komponentów kontenerowych

1. Zaimplementuj `RecipeListHeader`:
   - Layout flex z `SearchInput` i `NewRecipeButton`
2. Zaimplementuj `TagFilter`:
   - Pobieranie tagów z propsa
   - Renderowanie `TagFilterPill` dla każdego tagu
   - Obsługa single-select (tylko jeden tag może być wybrany na raz)
3. Zaimplementuj `RecipeGrid`:
   - Responsywny CSS Grid
   - Warunki renderowania: loading, empty, success
   - Renderowanie `RecipeCard` lub `RecipeCardSkeleton`
4. Zaimplementuj `PaginationControls`:
   - Przyciski nawigacji z warunkami `disabled`
   - Informacja o wynikach
   - Select rozmiaru strony

### Krok 7: Implementacja głównego komponentu `RecipeListView`

1. Zaimportuj hook `useRecipeListState`
2. Pobierz wszystkie dane i handlery z hooka
3. Renderuj layout z wszystkimi podkomponentami:
   - `RecipeListHeader` z propsami
   - `TagFilter` z propsami
   - Warunek: jeśli `isError` → `ErrorState`, inaczej → `RecipeGrid`
   - `PaginationControls` (jeśli są wyniki)
4. Przekaż wszystkie propsy do podkomponentów

### Krok 8: Integracja z Astro i dodanie QueryClientProvider

1. **Edytuj [src/layouts/DashboardLayout.astro](src/layouts/DashboardLayout.astro)** - dodaj QueryClientProvider:

   ```astro
   ---
   import BaseLayout from "./BaseLayout.astro";
   import { LayoutWrapper } from "@/components/layout-wrapper";
   import { QueryClientProvider } from "@tanstack/react-query";
   import { queryClient } from "@/store/query";

   interface Props {
     title?: string;
   }

   const { title } = Astro.props as Props;
   ---

   <BaseLayout title={title}>
     <QueryClientProvider client={queryClient} client:only="react">
       <LayoutWrapper client:idle>
         <slot />
       </LayoutWrapper>
     </QueryClientProvider>
   </BaseLayout>
   ```

2. **Utwórz plik [src/pages/recipes.astro](src/pages/recipes.astro)**:

   ```astro
   ---
   import DashboardLayout from "../layouts/DashboardLayout.astro";
   import { RecipeListView } from "../components/recipes/RecipeListView";
   ---

   <DashboardLayout title="Moje przepisy">
     <RecipeListView client:load />
   </DashboardLayout>
   ```

### Krok 9: Stylowanie i responsywność

1. Dodaj klasy Tailwind do wszystkich komponentów zgodnie z projektem
2. Przetestuj responsywność na różnych rozmiarach ekranu:
   - Mobile: 1 kolumna w gridzie
   - Tablet: 2 kolumny
   - Desktop: 3-4 kolumny
3. Dodaj efekty hover, focus, active do przycisków i kart

### Krok 10: Testowanie

1. Przetestuj widok z różnymi stanami:
   - Brak przepisów (empty state)
   - Przepisy z danymi
   - Ładowanie (szkielety)
   - Błąd API
   - Wyszukiwanie bez wyników
   - Filtrowanie po tagach
   - Paginacja (różne strony, różne rozmiary)
2. Przetestuj interakcje:
   - Kliknięcie w kartę → przekierowanie do szczegółów
   - Kliknięcie w przycisk "Nowy przepis" → przekierowanie
   - Wyszukiwanie z debounce
   - Toggle tagów
   - Nawigacja paginacji
   - Zmiana rozmiaru strony
   - Przycisk "Spróbuj ponownie" przy błędzie

### Krok 11: Optymalizacja

1. Dodaj memoizację do komponentów (`React.memo`) tam, gdzie to potrzebne:
   - `RecipeCard`
   - `TagFilterPill`
   - `RecipeCardSkeleton`
2. Dodaj `useCallback` do handlerów w hooku
3. Dodaj `useMemo` do filtrowania przepisów po stronie klienta
