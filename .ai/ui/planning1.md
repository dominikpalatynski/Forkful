1.
    1.1 aplikacja ma się składać z dahboardu w postaci listy przepisów oraz opcją filtrowania po nazwie oraz tagach oraz przycisku dodaj przepis i niech będą dwa przyciki generuj z Ai lub manualnie. Niech wykorzystany zostaie TopBar.
    W taki sposób będzie mozna szybko przemieszczac się pomiędzy widokami.
    1.2 na stronie głównej powinien pojawić się odrazu /recipes jako lista z przepisami

2. 
    2.1 Grid z kartami dla desktop (2-3 kolumny), który zmienia się na listę pojedynczych kart na mobile. Każda karta powinna zawierać: nazwę przepisu tagi oraz datę utworzenia.
    2.2 Klasyczna paginacja z przyciskami Previous/Next + numeracją stro
    2.3 "Pill buttons" z tagami jako filtry nad listą przepisów. Aktywny filtr jest podświetlony, możliwość wyboru wielu tagów jednocześnie

3. 
    3.1 Widok szczegółowy powinien być zoptymalizowany do czytania - dwukolumnowy layout na desktop (lewa: składniki z, prawa: kroki) a nad nimi description oraz tagi.jednocolumnowy na mobile.
    Przycisk "Edytuj" powinien być widoczny w headerze.
    3.2 Wyświetlmy tylko datę utworzenia
    3.3 jako przycisk secondary w headerze, z obowiązkowym modalem potwierdzenia. Nie dodajemy opcjii usuwania przepisu z poziomu listy.

4.
    4.1 Formularz generowania przez AI powinien być taki sam jak jak formularz manualnego tworzenia tylko przy tworzeniu AI będzie TextArea do wklejenia opisu prepisu i na podstawie tego zostaną wygenerowane wartości które zostaną umieszczone w formularzu. Ten tryb będzie odpalany na podstawie propsu przekazanego do componentu i na tej podstawie zdecydujemy który tryb powinien zostać włączony.
    4.2 Wynik generacji powinien być obsłuzony przez success Toast i uzupełnione dane w formularzu.
    4.3 Błąd generacji powinien być zrobiony w postaci inline error message z informacją co robić dalej

5. 
    5.1 Wszystkie pola w jednym ekranie ze scrollem.
    5.2 Narazie nie implementujmy drag and drop zrobimy to w późniejszej fazie i refaktoryzacjii
    5.3 Hmaburger menu z przyciskami edytuj/usuń
    5.4 Na końcu listy składników i kroków umieść przycisk "dodaj" i otworzy się modal z dodaniem tego składnika.

6. 
    6.1 Combobox pattern (shadcn/ui Command component) - pokazuje listę istniejących tagów podczas wpisywania (query do /api/tags?q=...), obsługa strzałek i Enter do wyboru. Możliwość utworzenia nowego tagu przez Enter jeśli nie ma w liście
    6.2 Combobox pattern (shadcn/ui Command component) - pokazuje listę istniejących tagów podczas wpisywania (query do /api/tags?q=...), obsługa strzałek i Enter do wyboru. Możliwość utworzenia nowego tagu przez Enter jeśli nie ma w liście
    6.3 W formularzu przepisu - tylko odłączanie tagu od przepisu (usunięcie X na pilli). Usuwanie tagu globalnie (z całej bazy użytkownika) nie jest w zakresie MVP.

7.
    7.1 uzyj statyczny klucz recipe_draft
    7.2 Modal przy wejściu na stronę /recipes/new z informacją "Znaleziono niezapisany przepis. Czy chcesz kontynuować edycję?" + przyciski "Przywróć" / "Odrzuć i zacznij od nowa"
    7.3 Debounce 1 sekunda po każdej zmianie w formularzach (zgodnie z PRD). Użyć useEffect z zależnościami na stan formularza + debounce (np. use-debounce library).

8. 
    8.1 Osobne strony /login i /register
    8.2 Tym zajmiemy się później
    8.3 Nie pokazuj onboardingu

9. 
    9.1 Spinner z tekstem "Analizuję przepis...". Disable textarea i przycisk "Generuj" podczas ładowania
    9.2 401 (Unauthorized): Automatyczne przekierowanie do /login
    403 (Forbidden): Toast "Nie masz uprawnień" + redirect do listy
    404 (Not Found): Dedykowana error page lub toast + redirect do listy
    500 (Server Error): Toast z możliwością "Spróbuj ponownie"
    Inline error messages w formularzach (walidacja Zod)
    9.3 Inline pod każdym polem (zgodnie z wzorcami shadcn/ui i dostępności

10.
    10.1 Mobile: < 640px (sm) - single column, uproszczona nawigacja (hamburger menu)
    Tablet: 640px - 1024px (sm-lg) - 2 kolumny w grid, uproszczony sidebar
    Desktop: > 1024px (lg+) - pełny layout, sidebar, 3 kolumny w grid
    10.2 Hamburger menu (3 linie) w top bar + drop down z 3 opcjami: przepisy generuj z Ai utwórz manualnie
    10.3. Narazie pomijamy drag and drop

11. 
    11.1 nie dodawaj optimistic update, zawsze pokazjuj loading i czekaj na potwierdzenie.
    11.2 Do wykonywania requestuj uzyj tanstack query. Tam działa cache of the box
    11.3 Nie stosuj zadnego lazy loading

12. Nie implementuj zadnych z tych rozwiązań

13. Nie implementuj zadnych z tych rozwiązań

14
    14.1 /                          → redirect do /recipes jeśli zalogowany, else /login
    /login                     → logowanie
    /register                  → rejestracja
    /recipes                   → lista przepisów (główny widok)
    /recipes/new               → tworzenie nowego przepisu (tryb manual/ai w state)
    /recipes/[id]              → widok szczegółowy przepisu
    /recipes/[id]/edit         → edycja istniejącego przepisu
    /api/...                   → endpointy API
    14.2 Nie implementuj narazie middleware'u
15. Nie implementuj tego

16. 
    16.1 React Query (TanStack Query) do server state + React Context API do lokalnego UI state (np. sidebar open/close, theme). Brak potrzeby Redux/Zustand dla MVP
    16.2 Custom hook useRecipeFormPersistence(generationId) któ
