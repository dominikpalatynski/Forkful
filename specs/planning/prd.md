# Dokument wymagań produktu (PRD) - Forkful

## 1. Przegląd produktu

Forkful to inteligentna aplikacja kulinarna zaprojektowana w celu usprawnienia procesu tworzenia i organizowania cyfrowej bazy przepisów. Główną funkcją aplikacji jest wykorzystanie sztucznej inteligencji do automatycznego analizowania i formatowania surowego tekstu przepisu wklejonego przez użytkownika, eliminując potrzebę ręcznego wprowadzania danych. Aplikacja skierowana jest do pasjonatów gotowania, którzy chcą w łatwy i szybki sposób stworzyć prywatną, uporządkowaną kolekcję przepisów z różnych źródeł tekstowych.

## 2. Problem użytkownika

Głównym problemem, który rozwiązuje Forkful, jest czasochłonność i frustracja związana z ręcznym formatowaniem skopiowanego tekstu przepisu. Użytkownicy często znajdują przepisy w internecie, w wiadomościach e-mail lub w dokumentach tekstowych. Ręczne oddzielanie składników od instrukcji, formatowanie list i dodawanie tagów jest uciążliwe. Ten proces zniechęca do regularnego budowania i utrzymywania cyfrowej książki kucharskiej, prowadząc do chaosu i utraty cennych przepisów.

## 3. Wymagania funkcjonalne

### 3.1. Zarządzanie kontem użytkownika

- Użytkownicy muszą mieć możliwość założenia konta za pomocą adresu e-mail i hasła.
- Proces rejestracji musi obejmować weryfikację adresu e-mail.
- Zalogowani użytkownicy mogą uzyskać dostęp do swojej prywatnej bazy przepisów.
- Użytkownicy muszą mieć możliwość zresetowania zapomnianego hasła.
- System powinien egzekwować zasady dotyczące silnych haseł i stosować mechanizmy ograniczające liczbę prób logowania (rate limiting).

### 3.2. Tworzenie i edycja przepisów

- Aplikacja musi udostępniać jeden, spójny interfejs edytora zarówno do tworzenia przepisów wspomaganego przez AI, jak i manualnego.
- Pola dostępne w edytorze to: nazwa, opis, lista składników, lista kroków, tagi.
- Użytkownik może wkleić surowy tekst przepisu (do 10 000 znaków) w dedykowane pole, aby AI automatycznie wypełniło formularz.
- Użytkownik ma pełną kontrolę nad danymi wygenerowanymi przez AI i może je dowolnie edytować przed zapisaniem.
- Dostępna musi być opcja ponownego uruchomienia analizy AI, która nadpisze aktualne dane w formularzu.
- Użytkownik może od podstaw ręcznie wypełnić formularz przepisu.
- Składniki i kroki muszą być prezentowane jako edytowalne listy, z możliwością dodawania, usuwania i zmiany kolejności poszczególnych pozycji.
- Edytowanie kolejności kroków musi być zaimplementowane w postaci drag and drop

### 3.3. Model danych

- Przepis: Zawiera pola `nazwa` (tekst), `opis` (tekst).
- Składniki: Przechowywane w osobnej tabeli z relacją do przepisu. Każdy składnik ma dwa pola tekstowe: `jednostka` i `wartość`, `nazwa`.
- Kroki: Przechowywane jako tekst w osobnej tabeli, z polem `position` (liczba całkowita) do zachowania deterministycznej kolejności oraz `opis` gdzie znajdziemy opis danege kroku.
- Tagi: Przechowywane w osobnej tabeli `tags` w celu normalizacji i unikania duplikatów. Relacja wiele-do-wielu między przepisami a tagami. Będzie zawierać pole `nazwa`

### 3.4. Przeglądanie przepisów

- Użytkownik musi mieć dostęp do listy wszystkich swoich zapisanych przepisów.
- Lista przepisów powinna oferować prosty mechanizm filtrowania na podstawie tagów lub nazwie przepisu.
- Użytkownik musi mieć możliwość wyświetlenia pełnych szczegółów wybranego przepisu.
- W szczegółach produktu powinny zostać wyświetlone składniki oraz lista kroków danego przepisu.

### 3.5 Przechowywanie i skalowalność

- Dane o przepisach i uzytkownikach przechowywane w sposób zapewniający skalowalność i bezpieczeństwo

### 3.6 Statystyki generowania przepisów

- Zbieranie informacji o tym ile przepisów zostało całkowicie wygenerowane przez AI i ile z nich ostatecznie zaakceptowano.

### 3.7 Wymagania prawne i ograniczenia:

- Dane osobowe uzytkowników i przepisów przechowywane zgodnie z RODO.
- Prawo do wglądu i usunięcia danych na wniosek uzytkownika

## 4. Granice produktu

### 4.1. Funkcjonalności w zakresie MVP

- Przetwarzanie przez AI wklejonego tekstu w celu automatycznego wypełnienia pól przepisu.
- Ekran weryfikacji i edycji danych wygenerowanych przez AI.
- Manualne tworzenie i edytowanie przepisów.
- Prosty system tagów do kategoryzacji.
- System kont użytkowników (rejestracja, logowanie) do przechowywania prywatnej bazy przepisów.

### 4.2. Funkcjonalności poza zakresem MVP

- Automatyczny import przepisu na podstawie linku (URL).
- Generowanie listy zakupów.
- Interaktywne instrukcje wykonania (np. klikalne timery, odhaczanie kroków).
- Import przepisów z plików wideo lub PDF.
- Planer posiłków.
- Jakiekolwiek funkcje społecznościowe (udostępnianie, komentowanie, ocenianie).

## 5. Historyjki użytkowników

### ID: US-001

- Tytuł: Rejestracja nowego użytkownika
- Opis: Jako nowy użytkownik, chcę móc założyć konto w aplikacji przy użyciu mojego adresu e-mail i hasła, aby móc zapisywać swoje przepisy.
- Kryteria akceptacji:
  1. Formularz rejestracji zawiera pola na adres e-mail, hasło i potwierdzenie hasła.
  2. System waliduje poprawność formatu adresu e-mail.
  3. System sprawdza, czy hasła w obu polach są identyczne.
  4. System wymusza, aby hasło miało co najmniej 8 znaków.
  5. Po pomyślnej rejestracji, na podany adres e-mail wysyłana jest wiadomość z linkiem weryfikacyjnym.
  6. Użytkownik nie może się zalogować, dopóki nie zweryfikuje swojego adresu e-mail.

### ID: US-002

- Tytuł: Logowanie do aplikacji
- Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się na moje konto, aby uzyskać dostęp do moich przepisów.
- Kryteria akceptacji:
  1. Formularz logowania zawiera pola na adres e-mail i hasło.
  2. Użytkownik może zalogować się tylko po podaniu prawidłowych i zweryfikowanych danych.
  3. W przypadku błędnych danych, wyświetlany jest stosowny komunikat.
  4. Po pomyślnym zalogowaniu, użytkownik jest przekierowany do głównego widoku aplikacji (lista przepisów).

### ID: US-003

- Tytuł: Resetowanie hasła
- Opis: Jako zarejestrowany użytkownik, który zapomniał hasła, chcę móc je zresetować, aby odzyskać dostęp do konta.
- Kryteria akceptacji:
  1. Na stronie logowania znajduje się link "Zapomniałem hasła".
  2. Po kliknięciu, użytkownik jest proszony o podanie swojego adresu e-mail.
  3. Jeśli e-mail istnieje w bazie, wysyłana jest na niego wiadomość z linkiem do resetu hasła.
  4. Link do resetu hasła jest unikalny i ma ograniczony czas ważności.
  5. Strona resetowania hasła pozwala na wprowadzenie i potwierdzenie nowego hasła.

### ID: US-004

- Tytuł: Tworzenie przepisu za pomocą AI
- Opis: Jako użytkownik, chcę wkleić tekst przepisu do aplikacji i pozwolić AI automatycznie wypełnić formularz, aby zaoszczędzić czas.
- Kryteria akceptacji:
  1. Na stronie dodawania przepisu znajduje się pole tekstowe na surowy tekst przepisu.
  2. Po wklejeniu tekstu i kliknięciu przycisku "Generuj", aplikacja wysyła zapytanie do AI.
  3. Pola formularza (nazwa, opis, składniki, kroki) są automatycznie wypełniane danymi zwróconymi przez AI.
  4. Składniki i kroki są wyświetlane jako osobne, edytowalne pozycje na liście.
  5. W trakcie przetwarzania przez AI widoczny jest wskaźnik ładowania.
  6. Po pomyślnym zakończeniu generowania przez AI, system odnotowuje to zdarzenie w celach statystycznych, przypisując do sesji unikalny identyfikator generacji.

### ID: US-005

- Tytuł: Ręczna edycja przepisu wygenerowanego przez AI
- Opis: Jako użytkownik, chcę mieć możliwość poprawienia danych wygenerowanych przez AI oraz ręcznego dodania tagów, aby upewnić się, że przepis jest dokładny i kompletny przed zapisaniem.
- Kryteria akceptacji:
  1. Wszystkie pola wypełnione przez AI (nazwa, opis, składniki, kroki) są w pełni edytowalne.
  2. Mogę dodać nowy składnik lub krok do listy.
  3. Mogę usunąć istniejący składnik lub krok z listy.
  4. Mogę zmienić kolejność kroków.
  5. Mogę dodać lub usunąć tagi.
  6. Po dokonaniu edycji mogę zapisać przepis.
  7. W momencie zapisu, jeśli przepis był zainicjowany przez AI (posiada identyfikator generacji), system odnotowuje zdarzenie "akceptacji" w celach statystycznych.

### ID: US-006

- Tytuł: Manualne tworzenie przepisu
- Opis: Jako użytkownik, chcę mieć możliwość ręcznego dodania przepisu od zera, jeśli nie mam gotowego tekstu do wklejenia.
- Kryteria akceptacji:
  1. Użytkownik może otworzyć pusty formularz dodawania przepisu.
  2. Użytkownik może ręcznie wypełnić wszystkie pola: nazwę, opis.
  3. Użytkownik może dodawać, edytować i usuwać składniki oraz kroki.
  4. Użytkownik może dodawać tagi do przepisu.
  5. Przycisk "Zapisz" staje się aktywny dopiero po wypełnieniu wymaganych pól (np. nazwa, co najmniej jeden składnik i jeden krok).

### ID: US-007

- Tytuł: Przeglądanie listy przepisów
- Opis: Jako użytkownik, chcę widzieć listę wszystkich moich zapisanych przepisów, aby móc szybko znaleźć to, czego szukam.
- Kryteria akceptacji:
  1. Po zalogowaniu widzę listę moich przepisów.
  2. Każda pozycja na liście wyświetla nazwę przepisu oraz tagi.
  3. Lista jest posortowana (np. od najnowszego do najstarszego).
  4. Na stronie znajduje się pole do filtrowania przepisów po tagach oraz nazwie.

### ID: US-008

- Tytuł: Wyświetlanie szczegółów przepisu
- Opis: Jako użytkownik, chcę móc kliknąć na przepis z listy, aby zobaczyć jego pełne szczegóły.
- Kryteria akceptacji:
  1. Kliknięcie na pozycję na liście przepisów przenosi mnie do widoku szczegółowego.
  2. Widok szczegółowy wyświetla nazwę, opis, pełną listę składników, ponumerowane kroki oraz przypisane tagi.
  3. Z widoku szczegółowego istnieje możliwość przejścia do trybu edycji przepisu.

### ID: US-009

- Tytuł: Edycja istniejącego przepisu
- Opis: Jako użytkownik, chcę móc edytować wcześniej zapisany przepis, aby wprowadzić poprawki lub modyfikacje.
- Kryteria akceptacji:
  1. W widoku szczegółów przepisu znajduje się przycisk "Edytuj".
  2. Po kliknięciu "Edytuj", otwierany jest ten sam edytor co przy tworzeniu, wypełniony danymi przepisu.
  3. Mogę modyfikować wszystkie pola, dodawać/usuwać składniki, kroki i tagi.
  4. Po zapisaniu zmian, przepis jest zaktualizowany w mojej bazie.

### ID: US-010

- Tytuł: Usuwanie przepisu
- Opis: Jako użytkownik, chcę mieć możliwość usunięcia przepisu, którego już nie potrzebuję.
- Kryteria akceptacji:
  1. W widoku szczegółów lub edycji przepisu znajduje się przycisk "Usuń".
  2. Przed permanentnym usunięciem przepisu, system wyświetla modal z prośbą o potwierdzenie.
  3. Po potwierdzeniu, przepis jest trwale usuwany z mojej bazy danych wraz z powiązanymi składnikami oraz krokami, tagi nie zostają natomiast usunięte.

### ID: US-011

- Tytuł: Obsługa błędów AI
- Opis: Jako użytkownik, w przypadku gdy AI nie jest w stanie przetworzyć wklejonego tekstu, chcę otrzymać jasny komunikat o błędzie.
- Kryteria akceptacji:
  1. Jeśli AI zwróci błąd (np. z powodu nieobsługiwanego formatu tekstu), formularz nie jest wypełniany.
  2. Na ekranie pojawia się czytelny komunikat informujący o niepowodzeniu, np. "Nie udało się przetworzyć przepisu. Spróbuj zmodyfikować tekst lub wprowadź dane ręcznie."
  3. Po kliknięciu wprowadź dane ręczne zostaje włączony ręczny tryb formularza bez text area na wrzucenie contextu do AI

### ID: US-012

- Tytuł: Zarządzanie tagami
- Opis: Jako użytkownik, chcę móc świadomie tworzyć nowe tagi lub wybierać z listy istniejących, aby przypisać je do przepisu i łatwiej go kategoryzować.
- Kryteria akceptacji:
  1. W edytorze przepisu znajduje się pole tekstowe do wyszukiwania i dodawania tagów.
  2. Gdy wpisuję tekst, system filtruje i wyświetla listę istniejących tagów, które mogę wybrać.
  3. Jeśli wpisany tekst nie odpowiada żadnemu istniejącemu tagowi, system oferuje wyraźną opcję stworzenia nowego taga (np. przycisk "Stwórz nowy tag: [nazwa]").
  4. Nowy tag jest tworzony w systemie i przypisywany do przepisu dopiero po jawnym wybraniu opcji jego utworzenia przez użytkownika.
  5. Użytkownik może przypisać wiele tagów do jednego przepisu.
  6. Użytkownik może usunąć przypisany tag z przepisu.
  7. System normalizuje tekst nowego taga przed zapisaniem (np. zmienia na małe litery, usuwa zbędne spacje), aby unikać duplikatów.

### ID: US-013

- Tytuł: Porzucenie formularza przepisu
- Opis: Jako użytkownik, chcę mieć możliwość anulowania tworzenia lub edycji przepisu i powrotu do poprzedniego widoku bez zapisywania zmian.
- Kryteria akceptacji:
  1. W edytorze przepisu znajduje się przycisk "Anuluj" lub "Porzuć zmiany".
  2. Po kliknięciu przycisku system prosi o potwierdzenie, aby zapobiec przypadkowej utracie danych.
  3. Po potwierdzeniu, wszelkie zmiany w formularzu są odrzucane, a użytkownik jest przekierowywany do poprzedniego widoku (np. listy przepisów).
  4. Jeśli porzucony formularz dotyczył przepisu zainicjowanego przez AI (posiada identyfikator generacji), system odnotowuje zdarzenie "porzucenia" w celach statystycznych.

## 6. Metryki sukcesu

- 80% nowo tworzonych przepisów w aplikacji jest inicjowanych przez wklejenie tekstu i przetworzenie go przez AI.
- Wskaźnik akceptacji przepisów wygenerowanych przez AI (stosunek zapisanych przepisów do wygenerowanych) wynosi co najmniej 85%.
