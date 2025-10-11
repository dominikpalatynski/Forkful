# Dokument wymagań produktu (PRD) - Forkful

## 1. Przegląd produktu

Forkful to inteligentna aplikacja kulinarna zaprojektowana w celu uproszczenia procesu cyfrowego archiwizowania przepisów. Aplikacja rozwiązuje problem czasochłonnego, ręcznego formatowania przepisów skopiowanych z różnych źródeł. Używając AI, Forkful automatycznie analizuje wklejony tekst, inteligentnie oddzielając składniki od instrukcji i wypełniając odpowiednie pola. Użytkownicy mogą następnie zweryfikować, edytować i otagować przepis przed zapisaniem go w swojej prywatnej, cyfrowej książce kucharskiej. Aplikacja oferuje również opcję manualnego tworzenia przepisów.

## 2. Problem użytkownika

Ręczne przepisywanie i formatowanie skopiowanego z internetu lub notatek tekstu przepisu jest żmudne i czasochłonne. Konieczność manualnego oddzielania składników od instrukcji, dodawania tagów i porządkowania treści zniechęca do regularnego budowania uporządkowanej, cyfrowej bazy ulubionych przepisów. Użytkownicy potrzebują narzędzia, które zautomatyzuje ten proces, oszczędzając ich czas i wysiłek.

## 3. Wymagania funkcjonalne

- FR-001: Uwierzytelnianie użytkowników: System umożliwia rejestrację i logowanie za pomocą adresu e-mail i hasła. Każdy użytkownik ma dostęp wyłącznie do swojej prywatnej bazy przepisów.
- FR-002: Automatyczne tworzenie przepisów z tekstu (AI): Aplikacja udostępnia pole tekstowe, do którego użytkownik może wkleić dowolny tekst przepisu (limit 10 000 znaków). Po przesłaniu, system oparty na AI przetwarza tekst i automatycznie wypełnia formularz przepisu, w tym jego nazwę, listę składników i listę kroków.
- FR-003: Formularz edycji i weryfikacji przepisu: Po przetworzeniu przez AI (lub przy tworzeniu manualnym), użytkownik jest przekierowywany do formularza, gdzie może edytować wszystkie pola: nazwę, składniki i kroki.
- FR-004: Manualne tworzenie przepisów: Aplikacja pozwala na stworzenie przepisu od zera, poprzez ręczne wypełnienie pustego formularza.
- FR-005: Zarządzanie składnikami: Składniki są wyświetlane jako lista. Każdy składnik może być edytowany lub usunięty. System będzie wspierał zmianę kolejności przy wykorzystaniu podejścia drag and drop.
- FR-006: Zarządzanie krokami: Kroki przygotowania są wyświetlane jako lista. Każdy krok może być edytowany lub usunięty. System będzie wspierał zmianę kolejności przy wykorzystaniu podejścia drag and drop.
- FR-007: System tagowania: Użytkownik może dodawać do przepisu tagi. System sugeruje istniejące już tagi podczas wpisywania. Nowe tagi są tworzone "w locie" po zatwierdzeniu.
- FR-008: Obsługa błędów generacji AI: W przypadku, gdy AI nie jest w stanie przetworzyć tekstu, użytkownik otrzymuje stosowne powiadomienie (np. "toast") i pod inputem zamiast danych wygenerowanych przez AI wyświetla się pustyformularz w celu manualnego dodania przepisu.
- FR-009: Walidacja formularza: Formularz jest walidowany po stronie klienta (przy użyciu Zod) w celu zapewnienia integralności danych przed zapisem.
- FR-010: Trwałość stanu formularza: Wprowadzane przez użytkownika dane w formularzu (zarówno po generacji AI, jak i podczas edycji) są automatycznie zapisywane w `localStorage` przeglądarki. Stan jest usuwany po pomyślnym zapisaniu przepisu lub jawnym porzuceniu formularza.
- FR-011: Analityka jakości AI: Każde użycie funkcji generowania przez AI jest zapisywane w dedykowanej tabeli `generation` w bazie danych. Zapisywany jest oryginalny tekst wejściowy, wynik generacji oraz flaga `is_accepted`, która śledzi, czy użytkownik ostatecznie zapisał przepis.
- FR-012: Responsywność interfejsu: Aplikacja jest projektowana w podejściu "desktop-first", ale jest w pełni responsywna i funkcjonalna na urządzeniach mobilnych.

## 4. Granice produktu (Co nie wchodzi w zakres MVP)

- Automatyczny import przepisu na podstawie linku (URL).
- Jakakolwiek funkcjonalność listy zakupów.
- Interaktywne instrukcje (np. klikalne timery, odhaczanie kroków).
- Import z materiałów wideo (YouTube) lub plików (PDF).
- Planer posiłków.
- Jakiekolwiek funkcje społecznościowe (udostępnianie, komentowanie, ocenianie).
- Zaawansowane zarządzanie tagami (np. kategorie, kolory).
- Testowanie i wybór różnych modeli AI.

## 5. Historyjki użytkowników

### Uwierzytelnianie i Zarządzanie Kontem

- ID: US-001
- Tytuł: Rejestracja nowego użytkownika
- Opis: Jako nowy użytkownik, chcę móc założyć konto używając mojego adresu e-mail i hasła, aby móc zapisywać swoje prywatne przepisy.
- Kryteria akceptacji:
  - Formularz rejestracji zawiera pola na adres e-mail i hasło.
  - Hasło jest maskowane podczas wpisywania.
  - System waliduje poprawność formatu adresu e-mail.
  - Wysłany zostaje email werycikacyjny.
  - Po pomyśnej weryfikacji maila jestem automatycznie zalogowany i przekierowany do panelu głównego.
  - W przypadku błędu (np. zajęty e-mail) wyświetlany jest czytelny komunikat.

- ID: US-002
- Tytuł: Logowanie użytkownika
- Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się na swoje konto, aby uzyskać dostęp do moich przepisów.
- Kryteria akceptacji:
  - Formularz logowania zawiera pola na adres e-mail i hasło.
  - Po pomyślnym zalogowaniu jestem przekierowany do panelu głównego.
  - W przypadku podania błędnych danych, wyświetlany jest odpowiedni komunikat.

### Tworzenie Przepisu

- ID: US-003
- Tytuł: Inicjowanie tworzenia przepisu za pomocą AI
- Opis: Jako zalogowany użytkownik, chcę mieć możliwość wklejenia tekstu przepisu do przetworzenia przez AI, aby szybko rozpocząć proces dodawania nowego przepisu.
- Kryteria akceptacji:
  - Na stronie głównej znajduje się wyraźnie oznaczony przycisk/opcja "Generuj z AI".
  - Po kliknięciu pojawia się pole tekstowe (`textarea`) na wklejenie tekstu.
  - Pole tekstowe ma limit 10 000 znaków.
  - Po wklejeniu tekstu i kliknięciu "Generuj", aplikacja wysyła tekst do przetworzenia.

- ID: US-004
- Tytuł: Weryfikacja i edycja przepisu wygenerowanego przez AI (Happy Path)
- Opis: Jako użytkownik, po pomyślnym przetworzeniu tekstu przez AI, chcę zobaczyć wypełniony formularz z nazwą, składnikami i krokami, abym mógł je zweryfikować i ewentualnie poprawić.
- Kryteria akceptacji:
  - Po przetworzeniu przez AI, pod polem tekstowym pojawia się widoku formularza edycji.
  - Pola "Nazwa przepisu", "Składniki" i "Kroki" są wypełnione danymi wyodrębnionymi przez AI.
  - Każdy składnik i krok jest osobną, edytowalną pozycją na liście.
  - Mogę dowolnie edytować tekst w każdym polu.
  - Mogę usunąć poszczególne składniki lub kroki.
  - Mogę dodać nowe, puste pola na składniki lub kroki.
  - Mogę przestawiać kolejność kroków i składników.

- ID: US-005
- Tytuł: Obsługa błędu generacji AI
- Opis: Jako użytkownik, jeśli AI nie uda się przetworzyć mojego tekstu, chcę otrzymać jasną informację o błędzie i możliwość ręcznego dodania przepisu.
- Kryteria akceptacji:
  - W przypadku niepowodzenia generacji AI, na ekranie pojawia się nietrwałe powiadomienie (toast) z informacją o błędzie.
  - Po wyświetleniu powiadomienia, pod polem tekstowym pojawia się widoku formularza edycji z pustymi polami.

- ID: US-006
- Tytuł: Inicjowanie manualnego tworzenia przepisu
- Opis: Jako zalogowany użytkownik, chcę mieć możliwość ręcznego stworzenia przepisu od zera, jeśli nie mam tekstu do wklejenia lub AI zawiodło.
- Kryteria akceptacji:
  - Na stronie głównej znajduje się przycisk/opcja "Stwórz manualnie".
  - Po kliknięciu jestem przekierowywany do pustego formularza edycji przepisu z polami: "Nazwa przepisu", "Składniki", "Kroki" i "Tagi".

- ID: US-007
- Tytuł: Dodawanie i zarządzanie tagami
- Opis: Jako użytkownik, podczas edycji przepisu chcę móc dodawać tagi, aby kategoryzować i łatwiej odnajdywać moje przepisy w przyszłości.
- Kryteria akceptacji:
  - W formularzu edycji znajduje się pole do wpisywania tagów.
  - Gdy zaczynam pisać, system podpowiada mi tagi, których już wcześniej użyłem.
  - Po wpisaniu nowego tagu i naciśnięciu "Enter", tag zostaje dodany jako "pigułka" (pill) pod polem tekstowym.
  - Mogę usunąć dodany tag, klikając na ikonę "x" na pigułce.

- ID: US-008
- Tytuł: Zapisywanie przepisu
- Opis: Jako użytkownik, po zakończeniu edycji przepisu, chcę móc go zapisać w mojej prywatnej bazie.
- Kryteria akceptacji:
  - Formularz zawiera przycisk "Zapisz".
  - Przed zapisem dane są walidowane (np. nazwa nie może być pusta).
  - Po pomyślnym zapisie jestem przekierowywany do widoku zapisanego przepisu lub listy przepisów.
  - Jeśli przepis był inicjowany przez AI, w tabeli analitycznej `generation` flaga `is_accepted` jest ustawiana na `true`.
  - Zapisany w `localStorage` stan formularza jest czyszczony.

- ID: US-009
- Tytuł: Anulowanie tworzenia przepisu
- Opis: Jako użytkownik, chcę mieć możliwość porzucenia formularza tworzenia/edycji przepisu bez zapisywania zmian.
- Kryteria akceptacji:
  - Formularz zawiera przycisk "Anuluj" lub "Odrzuć".
  - Po kliknięciu jestem pytany o potwierdzenie, aby uniknąć przypadkowej utraty danych.
  - Po potwierdzeniu, jestem przekierowywany do poprzedniego widoku (np. panelu głównego).
  - Jeśli przepis był inicjowany przez AI, w tabeli analitycznej `generation` flaga `is_accepted` jest ustawiana na `false`.
  - Zapisany w `localStorage` stan formularza jest czyszczony.

- ID: US-010
- Tytuł: Ochrona przed utratą danych w formularzu
- Opis: Jako użytkownik, chcę aby moje postępy w wypełnianiu formularza były automatycznie zapisywane, abym nie stracił danych w przypadku przypadkowego zamknięcia karty lub awarii przeglądarki.
- Kryteria akceptacji:
  - Po udanej generacji AI, cały stan formularza jest zapisywany w `localStorage`.
  - Po każdej modyfikacji dowolnego pola w formularzu, stan jest aktualizowany w `localStorage` (z niewielkim opóźnieniem, np. 1 sekunda).
  - Gdy ponownie otworzę stronę tworzenia przepisu, aplikacja wykryje niezapisany stan w `localStorage` i zaproponuje mi jego przywrócenie.
  - Jeśli odrzucę przywrócenie `localStorage` ma zostać wyczyszczony oraz Jeśli przepis był inicjowany przez AI, w tabeli analitycznej `generation` flaga `is_accepted` jest ustawiana na `false`.
  - Po odrzuceniu przywrócenie zostaję przekierowany do ekranu tworzenia przepisu.

### Przeglądanie Przepisów

- ID: US-011
- Tytuł: Przeglądanie listy zapisanych przepisów
- Opis: Jako zalogowany użytkownik, chcę widzieć listę wszystkich moich zapisanych przepisów, aby móc szybko je odnaleźć.
- Kryteria akceptacji:
  - W panelu głównym wyświetlana jest lista moich przepisów.
  - Każdy element listy zawiera co najmniej nazwę przepisu.
  - Kliknięcie na element listy przenosi mnie do widoku szczegółowego danego przepisu.
  - W widoku szczegółowyum widzimy wszystkie dane w podobnej formie jak w ekranie edycji.
  - Z widoku sczegółowego mozna przejść do ekranu edycji.

- ID: US-012
- Tytuł: Wyświetlanie szczegółów przepisu
- Opis: Jako zalogowany użytkownik, po wybraniu przepisu z listy chcę zobaczyć jego pełne szczegóły (nazwę, opcjonalny opis, składniki, kroki oraz tagi) w czytelnej formie.
- Kryteria akceptacji:
  - Widok dostępny jest pod ścieżką `/recipes/:id` (lub równoważną) po kliknięciu elementu listy.
  - Wyświetlane elementy: nazwa, opis (jeśli istnieje), lista składników (w kolejności), lista kroków (ponumerowana, w kolejności), sekcja tagów.
  - Kroki są ponumerowane; składniki wyświetlane jako lista punktowana.
  - Dostępne są akcje: „Wróć” (powrót do listy) oraz „Edytuj” (przejście do ekranu edycji przepisu). Oraz przycisk "Usuń" ktore po .

## 6. Metryki sukcesu

Głównym celem MVP jest weryfikacja kluczowej hipotezy: czy automatyczne przetwarzanie tekstu przepisu przez AI jest wartościowe dla użytkowników i ma akceptowalną jakość. W związku z tym, rezygnujemy z pierwotnych, sztywnych kryteriów (80% / 85%) na rzecz zbierania danych, które posłużą do oceny jakości i planowania dalszych iteracji.

- MS-001: Wskaźnik akceptacji generacji AI: Będziemy mierzyć stosunek liczby zapisanych przepisów zainicjowanych przez AI do liczby porzuconych.
  - Sposób pomiaru: Analiza danych w tabeli `generation` w bazie danych, w szczególności kolumny `is_accepted` (boolean).
  - Cel: Zebranie danych do oceny jakości modelu AI i doświadczenia użytkownika. Wysoki wskaźnik akceptacji (np. >70%) będzie sygnałem, że funkcja jest wartościowa.

- MS-002: Wskaźnik adopcji funkcji AI: Będziemy śledzić, jaki procent nowo tworzonych przepisów jest inicjowany za pomocą funkcji AI w porównaniu do tworzenia manualnego.
  - Sposób pomiaru: Porównanie liczby wpisów w tabeli `generation` z całkowitą liczbą nowo utworzonych przepisów w danym okresie.
  - Cel: Zrozumienie, czy funkcja AI jest preferowaną metodą tworzenia przepisów przez użytkowników.
