# Architektura UI dla Forkful

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika aplikacji Forkful została zaprojektowana w oparciu o nowoczesny stos technologiczny (Astro + React) w celu zapewnienia responsywności, wydajności i doskonałego doświadczenia użytkownika. Podejście "desktop-first" gwarantuje pełną funkcjonalność na większych ekranach, jednocześnie zapewniając pełne wsparcie dla urządzeń mobilnych dzięki responsywnemu projektowi.

Główne założenia architektury:

- **Struktura oparta na widokach**: Aplikacja jest podzielona na logiczne, łatwe w zarządzaniu widoki (strony), takie jak lista przepisów, szczegóły przepisu czy formularz edycji.
- **Komponentowość**: UI jest zbudowane z reużywalnych komponentów React (z wykorzystaniem biblioteki shadcn/ui), co zapewnia spójność wizualną i przyspiesza rozwój.
- **Zarządzanie stanem serwera**: Biblioteka TanStack Query (React Query) jest używana do zarządzania danymi pochodzącymi z API, co upraszcza pobieranie, buforowanie i aktualizowanie danych.
- **Centralna nawigacja**: Globalny komponent `TopBar` zapewnia stały dostęp do kluczowych funkcji, takich jak wyszukiwanie, dodawanie przepisów i zarządzanie kontem użytkownika.
- **Persystencja stanu formularza**: Stan formularza tworzenia/edycji przepisu jest automatycznie zapisywany w `localStorage`, aby chronić użytkownika przed utratą danych.

## 2. Lista widoków

### Widok 1: Logowanie

- **Nazwa widoku**: Logowanie
- **Ścieżka**: `/login`
- **Główny cel**: Uwierzytelnienie użytkownika i umożliwienie mu dostępu do aplikacji.
- **Kluczowe informacje do wyświetlenia**: Formularz z polami na e-mail i hasło.
- **Kluczowe komponenty**: `LoginForm`, `Input`, `Button`, `Label`.
- **UX, dostępność i bezpieczeństwo**:
  - **UX**: Jasne komunikaty o błędach (np. "Nieprawidłowe dane logowania"). Link do strony rejestracji.
  - **Dostępność**: Poprawne etykiety dla pól formularza, obsługa nawigacji klawiaturą.
  - **Bezpieczeństwo**: Przesyłanie danych formularza za pomocą protokołu HTTPS.

### Widok 2: Rejestracja

- **Nazwa widoku**: Rejestracja
- **Ścieżka**: `/register`
- **Główny cel**: Umożliwienie nowym użytkownikom założenia konta w aplikacji.
- **Kluczowe informacje do wyświetlenia**: Formularz z polami na e-mail i hasło.
- **Kluczowe komponenty**: `RegisterForm`, `Input`, `Button`, `Label`.
- **UX, dostępność i bezpieczeństwo**:
  - **UX**: Walidacja po stronie klienta (np. format e-maila). Jasne komunikaty o błędach (np. "Ten e-mail jest już zajęty").
  - **Dostępność**: Poprawne etykiety dla pól, obsługa nawigacji klawiaturą.
  - **Bezpieczeństwo**: Wymagania dotyczące siły hasła (do rozważenia w przyszłości).

### Widok 3: Lista Przepisów

- **Nazwa widoku**: Lista Przepisów
- **Ścieżka**: `/recipes`
- **Główny cel**: Wyświetlenie wszystkich przepisów użytkownika z możliwością wyszukiwania i filtrowania. Jest to główny ekran aplikacji po zalogowaniu.
- **Kluczowe informacje do wyświetlenia**: Siatka (grid) z kartami przepisów, pole wyszukiwania, dostępne tagi do filtrowania, paginacja.
- **Kluczowe komponenty**: `RecipeGrid`, `RecipeCard`, `SearchInput`, `TagFilterPills`, `Pagination`, `EmptyState`.
- **UX**:
  - Responsywny grid dostosowujący się do rozmiaru ekranu. Stany ładowania (szkielety) i puste stany (brak przepisów, brak wyników

### Widok 4: Widok Szczegółowy Przepisu

- **Nazwa widoku**: Widok Szczegółowy Przepisu
- **Ścieżka**: `/recipes/[id]`
- **Główny cel**: Prezentacja pełnych informacji o wybranym przepisie w czytelnym formacie oraz umożliwienie wykonania na nim operacji (edycja, usunięcie).
- **Kluczowe informacje do wyświetlenia**: Nazwa, opis, tagi, lista składników, lista kroków.
- **Kluczowe komponenty**: `RecipeHeader`, `RecipeDetail`, `IngredientsListReadOnly`, `StepsListReadOnly`, `DeleteConfirmModal`.
- **UX, dostępność i bezpieczeństwo**:
  - **UX**: Dwukolumnowy layout na desktopie (składniki | kroki) dla lepszej czytelności. Modal potwierdzający usunięcie, aby zapobiec przypadkowym akcjom.
  - **Dostępność**: Semantyczny kod HTML (`article`, `h1`, `ul`, `ol`) dla lepszej interpretacji przez czytniki ekranu.
  - **Bezpieczeństwo**: Użytkownik może wyświetlić tylko własne przepisy (zabezpieczenie na poziomie API).
 
### Widok 5: Tworzenie Przepisu Ręcznie

- **Nazwa widoku**: Tworzenie Przepisu Ręcznie
- **Ścieżka**: `/recipes/new`
- **Główny cel**: Umożliwienie użytkownikowi ręcznego dodania nowego przepisu poprzez wypełnienie wszystkich pól formularza.
- **Kluczowe informacje do wyświetlenia**: Formularz z polami na nazwę, opis, składniki, kroki i tagi.
- **Kluczowe komponenty**: `ManualRecipeForm`, `EditableList` (dla składników i kroków), `TagInput`, `RecipeBasicInfoSection`, `FormActionButtons`.
- **UX, dostępność i bezpieczeństwo**:
  - **UX**: Powiadomienia (toasty) informujące o sukcesie lub błędzie operacji. Walidacja w czasie rzeczywistym. Automatyczne zapisywanie draftu w localStorage.
  - **Dostępność**: Poprawne etykiety dla pól formularza, obsługa nawigacji klawiaturą. Walidacja pól w czasie rzeczywistym.
  - **Bezpieczeństwo**: Walidacja danych wejściowych po stronie klienta (Zod) i serwera.

### Widok 6: Tworzenie Przepisu z AI

- **Nazwa widoku**: Tworzenie Przepisu z AI
- **Ścieżka**: `/recipes/new-ai`
- **Główny cel**: Umożliwienie użytkownikowi dodania nowego przepisu za pomocą sztucznej inteligencji poprzez wklejenie tekstu źródłowego.
- **Kluczowe informacje do wyświetlenia**: Wieloetapowy formularz - najpierw pole na tekst źródłowy, potem edycja wygenerowanego przepisu (nazwa, opis, składniki, kroki, tagi).
- **Kluczowe komponenty**: `AIRecipeForm`, `AIInputStep`, `AIGeneratedPreview`, `EditableList` (dla składników i kroków), `TagInput`, `RecipeBasicInfoSection`, `FormActionButtons`.
- **UX, dostępność i bezpieczeństwo**:
  - **UX**: Wieloetapowy proces z wizualną informacją zwrotną (ładowanie podczas generowania). Możliwość edycji wygenerowanych danych przed zapisem. Powiadomienia o sukcesie/błędzie.
  - **Dostępność**: Jasne wskazówki dla każdego etapu, obsługa nawigacji klawiaturą. Walidacja minimalnej długości tekstu źródłowego.
  - **Bezpieczeństwo**: Walidacja danych wejściowych po stronie klienta (Zod) i serwera. Logowanie błędów generowania dla analizy.

### Widok 7: Edycja Przepisu
 
- **Nazwa widoku**: Edycja Przepisu
- **Ścieżka**: `/recipes/[id]/edit`
- **Główny cel**: Umożliwienie użytkownikowi zaktualizowania istniejącego przepisu.
- **Kluczowe informacje do wyświetlenia**: Wypełniony formularz z istniejącymi danymi przepisu (nazwa, tagi, opis, składniki, kroki).
- **Kluczowe komponenty**: `RecipeForm`, `EditableList` (dla składników i kroków), `TagCombobox`.
- **UX, dostępność i bezpieczeństwo**:
  - **UX**: Powiadomienia (toasty) informujące o sukcesie lub błędzie operacji. Walidacja w czasie rzeczywistym.
  - **Bezpieczeństwo**: Walidacja danych wejściowych po stronie klienta (Zod) i serwera. Użytkownik może edytować tylko własne przepisy (zabezpieczenie na poziomie API).
 
## 3. Mapa podróży użytkownika

### Główny przepływ użytkownika - tworzenie ręczne:

1.  **Logowanie**: Użytkownik wchodzi na `/login`, wprowadza dane i zostaje przekierowany do `/recipes`.
2.  **Inicjacja**: W widoku `/recipes`, użytkownik klika przycisk "Ręcznie".
3.  **Wypełnianie formularza**: Użytkownik jest na stronie `/recipes/new` i wypełnia wszystkie pola formularza (nazwa, opis, składniki, kroki, tagi).
4.  **Zapis**: Użytkownik klika "Zapisz". Dane są wysyłane do API.
5.  **Sukces**: Po pomyślnym zapisie, użytkownik jest przekierowany do widoku szczegółowego nowo utworzonego przepisu (`/recipes/[id]`).

### Główny przepływ użytkownika - generowanie z AI:

1.  **Logowanie**: Użytkownik wchodzi na `/login`, wprowadza dane i zostaje przekierowany do `/recipes`.
2.  **Inicjacja**: W widoku `/recipes`, użytkownik klika przycisk "Z AI".
3.  **Wprowadzanie tekstu**: Użytkownik jest na stronie `/recipes/new-ai`, wkleja tekst przepisu do pola tekstowego i klika "Generuj".
4.  **Weryfikacja i Edycja**: Aplikacja przetwarza tekst i wyświetla wypełniony formularz. Użytkownik weryfikuje dane, dokonuje niezbędnych korekt (np. edytuje składnik, dodaje tag).
5.  **Zapis**: Użytkownik klika "Zapisz". Dane są wysyłane do API.
6.  **Sukces**: Po pomyślnym zapisie, użytkownik jest przekierowany do widoku szczegółowego nowo utworzonego przepisu (`/recipes/[id]`).

### Inne kluczowe przepływy:

- **Przeglądanie**: Użytkownik na `/recipes` używa wyszukiwania i filtrów, aby znaleźć przepis, a następnie klika na jego kartę, aby przejść do `/recipes/[id]`.
- **Edycja**: Z widoku `/recipes/[id]` użytkownik klika "Edytuj", co przenosi go do `/recipes/[id]/edit`, gdzie może zmodyfikować przepis w tym samym formularzu co przy tworzeniu.
- **Usuwanie**: Z widoku `/recipes/[id]` użytkownik klika "Usuń", potwierdza akcję w modalu, po czym przepis jest usuwany, a użytkownik wraca do listy `/recipes`.

## 4. Układ i struktura nawigacji

- **Główny układ**: Aplikacja wykorzystuje stały, globalny `TopBar` widoczny we wszystkich widokach po zalogowaniu. Poniżej `TopBar` renderowana jest treść właściwa dla danego widoku.
- **Nawigacja na desktopie**: `TopBar` zawiera logo, centralne pole wyszukiwania oraz przyciski akcji ("Ręcznie", "Z AI") i menu użytkownika po prawej stronie. Jest to główny hub nawigacyjny.
- **Nawigacja na mobile**: `TopBar` jest uproszczony i zawiera logo oraz ikonę "hamburger menu". Kliknięcie ikony otwiera panel boczny (`Sheet`) z pełną nawigacją (linki do widoków, akcje).
- **Nawigacja kontekstowa**: Przejścia między widokami są logiczne. Z listy przechodzimy do szczegółów, ze szczegółów do edycji. Przycisk "Wróć" w przeglądarce oraz linki "Anuluj" w formularzach pozwalają na cofanie się w hierarchii.

## 5. Kluczowe komponenty

- **`RecipeListHeader`**: Komponent nagłówka listy przepisów zawierający wyszukiwarkę i dwa przyciski tworzenia: "Ręcznie" oraz "Z AI".
- **`RecipeCard`**: Komponent wyświetlający pojedynczy przepis na liście. Zawiera nazwę i tagi. Jest klikalny, prowadzi do widoku szczegółowego.
- **`ManualRecipeForm`**: Komponent formularza do ręcznego tworzenia przepisów. Zarządza stanem nazwy, opisu, składników, kroków i tagów dla nowych przepisów.
- **`AIRecipeForm`**: Wieloetapowy komponent formularza do tworzenia przepisów z AI. Obsługuje wprowadzanie tekstu, generowanie oraz edycję wyników.
- **`RecipeBasicInfoSection`**: Sekcja formularza zawierająca pola na nazwę i opis przepisu.
- **`EditableIngredientsList`** / **`EditableStepsList`**: Reużywalne komponenty do zarządzania listami składników i kroków. Umożliwiają edycję i usuwanie poszczególnych pozycji.
- **`TagInput`**: Zaawansowany komponent do dodawania tagów z funkcją autocomplete i możliwością tworzenia nowych tagów.
- **`FormActionButtons`**: Komponent zawierający przyciski akcji formularza (Zapisz, Anuluj) z obsługą stanów ładowania.
- **`EmptyState`**: Komponent wyświetlany, gdy brakuje danych do pokazania (np. brak przepisów, brak wyników wyszukiwania). Prowadzi użytkownika do następnej możliwej akcji.
- **Modale (`CancelRecipeEditDialog`, `DeleteRecipeDialog`)**: Komponenty modalne używane do potwierdzania krytycznych akcji (anulowanie edycji, usunięcie przepisu).
