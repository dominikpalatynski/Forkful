Jesteś doświadczonym menedżerem produktu, którego zadaniem jest stworzenie kompleksowego dokumentu wymagań produktu (PRD) w oparciu o poniższe opisy:

<project_description>

### Główny problem

Ręczne formatowanie skopiowanego tekstu przepisu (oddzielanie składników od instrukcji, dodawanie tagów) jest czasochłonne i zniechęca do tworzenia uporządkowanej, cyfrowej bazy kulinarnej.

### Najmniejszy zestaw funkcjonalności

Przetwarzanie przez AI wklejonego przez użytkownika tekstu w celu automatycznego wypełnienia pól przepisu (nazwa, składniki, kroki).

Ekran weryfikacji i edycji, gdzie użytkownik akceptuje i poprawia dane wygenerowane przez AI przed zapisaniem.

Prosty system tagów do oznaczania przepisów (bez podziału na kategorie).

Manualne tworzenie przepisów jako opcja zapasowa.

Prosty system kont użytkowników do przechowywania prywatnej bazy przepisów.

### Co NIE wchodzi w zakres MVP

Automatyczny import przepisu na podstawie linku (URL).

Jakakolwiek funkcjonalność listy zakupów.

Interaktywne instrukcje (np. klikalne timery, odhaczanie kroków).

Import z materiałów wideo (YouTube) lub plików (PDF).

Planer posiłków i funkcje społecznościowe.

### Kryteria sukcesu

80% nowych przepisów jest tworzonych przez wklejenie i przetworzenie tekstu przez AI.

Użytkownik akceptuje (po ewentualnych drobnych poprawkach) 85% przepisów przetworzonych przez AI.
</project_description>

<project_details>
<conversation_summary>
<decisions>

1. Pola przepisu w MVP: nazwa, opis, składniki (osobna tabela), kroki (osobna tabela).
2. Język wejścia: wyłącznie polski (brak wsparcia innych języków w MVP).
3. Składniki: w tabeli dwa pola typu string — „jednostka” i „wartość” (podejście uniwersalne).
4. Kroki: przechowywane jako tekst + pole „position” do kolejności.
5. UI/flow: jeden, wspólny edytor dla tworzenia manualnego i AI; AI tylko inicjalizuje wartości; pełna ręczna edycja, możliwość porzucenia i ponownej pełnej regeneracji.
6. Tagi: tabela „tags”, relacja many-to-many,
7. Autoryzacja: Supabase Auth (email+hasło), weryfikacja e‑mail, rate‑limity, silne hasło, reset hasła.
8. Wejście do AI: surowy tekst z limitem 10 000 znaków; bez zaawansowanego wstępnego parsowania w MVP.
9. Metryki/sukces: brak pomiaru „akceptacji” na poziomie UI; użytkownik po prostu akceptuje lub edytuje sugestie; (wcześniej: analiza logów generowania — bez A/B).
10. Wersjonowanie/historia: brak historii zmian; po utworzeniu przepis widoczny na liście.
    </decisions>
    <matched_recommendations>
11. Ujednolicone doświadczenie edytora (AI/manual) z pełną edycją inline i możliwością pełnej regeneracji.
12. Model tagów: tabela „tags” + relacja many‑to‑many, normalizacja i deduplikacja.
13. Reprezentacja kroków: tekst + „position” do deterministycznego porządku.
14. Bezpieczeństwo logowania: Supabase Auth z weryfikacją e‑mail, rate‑limitami i resetem hasła.
15. Wejście do AI: surowy tekst z ustalonym limitem (10 000 znaków) i proste ścieżki błędów (bez wstępnego parsowania).
16. Lista po utworzeniu: brak draftów/wersjonowania w MVP — prosty przepływ publikacji.
    </matched_recommendations>
    <ui_architecture_planning_summary>
    a. Główne wymagania architektury UI:

- Jeden edytor formularzowy dla obu ścieżek (manual/AI), z polami: nazwa, opis, lista składników, lista kroków, tagi.
- Składniki: edytowalne wiersze z polami „jednostka” (string) i „wartość” (string); możliwość dodawania/usuwania wierszy.
- Kroki: lista kroków (tekst) z deterministycznym „position”; możliwość dodawania/usuwania.
- Tagi: pole wielowartościowe z normalizacją i ostrzeganiem przed duplikatami; potwierdzenie utworzenia nowego taga.
- Flow AI: wklejenie tekstu → żądanie do modelu → wypełnienie formularza → ręczna edycja → zapis lub pełna regeneracja.
- Brak zaawansowanego pre‑parsingu; UI musi jasno komunikować limit 10 000 znaków i stan przetwarzania/ błędów.
- Po zapisie natychmiastowa dostępność na liście (bez statusów draft/published w MVP).

b. Kluczowe widoki, ekrany i przepływy:

- Logowanie/Rejestracja: formularze e‑mail+hasło, weryfikacja e‑mail, reset hasła, komunikaty o limitach i błędach.
- Dodawanie przepisu (AI/manual): jeden ekran edycji; w trybie AI dodatkowy panel „Wklej tekst” i kontrolki start/ponów.
- Edytor przepisu: sekcje nazwa/ opis, składniki (jednostka, wartość), kroki (tekst, position), tagi (z podpowiedzią i deduplikacją).
- Lista przepisów: prosta lista z podstawowym filtrowaniem po tagach (MVP).
- Szczegóły przepisu: prezentacja nazwy, opisu, składników, kroków, tagów (MVP bez interaktywności kroków).

c. Integracja z API i zarządzanie stanem:

- Auth i dane: Supabase (klient po stronie FE + endpointy serwerowe po stronie Astro dla operacji wymagających sekretów).
- AI: dedykowany endpoint serwerowy (np. `pages/api/ai/parse`) przyjmujący tekst; zwraca zmapowany obiekt przepisu do inicjalizacji formularza.
- Formularz: kontrolowany stan (React), walidacja bazowa, obsługa błędów na polach; zapis do bazy przez API/Supabase.
- Tagi: sprawdzanie istnienia, normalizacja na kliencie; ostateczna deduplikacja na serwerze przed zapisem.
- Minimalna telemetria: logi żądań do AI (start, sukces/błąd, czas), bez mierzenia „akceptacji” na UI.

d. Responsywność, dostępność, bezpieczeństwo:

- Responsywność: mobile‑first; układ jednokolumnowy na mobile, wielokolumnowy na desktop.
- Dostępność: semantyczne etykiety, focus states, kontrast, klawiaturowa nawigacja; komunikaty o stanie (ładowanie/błąd) w aria‑live.
- Bezpieczeństwo: ochronione endpointy (sprawdzenie sesji), rate‑limiting dla AI, walidacja/ sanitizacja wejścia (strip HTML), limity rozmiaru payloadu, unikanie wycieku sekretów do klienta.

e. Nierozwiązane kwestie/obszary do doprecyzowania:

- Model składników: przy dwóch polach („jednostka”, „wartość”) — gdzie przechowywana jest nazwa składnika? Czy „wartość” zawiera nazwę i ilość razem? Potrzebne doprecyzowanie formatu wyświetlania i edycji.
- Operacje na sekcjach: czy dopuszczamy częściową regenerację (np. tylko składniki lub tylko kroki) i akcje split/merge linii w edytorze?
- Reorder UI: czy kroki (i ewentualnie składniki) mają mieć przeciąganie do zmiany kolejności, czy tylko edycję „position”?
- Metryki: w PRD są cele (85% akceptacji), ale w MVP brak pomiaru na UI — czy chcemy minimalną instrumentację (czas do zapisu, liczba edycji) dla weryfikacji hipotez?
- Wyszukiwanie/filtrowanie listy: zakres MVP (po tagach? po nazwie?), paginacja vs. „load more”.
- Obsługa błędów AI: polityka retry, komunikaty (timeout, za długi tekst), co dzieje się z wprowadzonymi już zmianami przy ponownej regeneracji.
- Limity i walidacja tagów: maks. liczba tagów na przepis, maks. długość taga, dozwolone znaki.
  </ui_architecture_planning_summary>
  <unresolved_issues>

1. Doprecyzowanie formatu danych składników: rozdział nazwy, ilości i jednostki vs. „wartość” łączona; wpływ na render i wyszukiwanie.
2. Decyzja o częściowej regeneracji sekcji i narzędziach split/merge w edytorze.
3. Zachowanie przy ponownej pełnej regeneracji: które pola są nadpisywane, a które zachowują ręczne zmiany.
4. Minimalna telemetria w MVP (czas do zapisu, liczba edycji) vs. brak mierzenia „akceptacji”.
5. Zakres filtrowania listy (po nazwie, tagach), paginacja i performance przy rosnącej liczbie przepisów.
6. UI do zmiany kolejności (drag‑and‑drop vs. przyciski) i walidacja spójności „position”.
7. Granice długości pól (nazwa, opis, tagi) i polityka błędów dla limitów.
   </unresolved_issues>
   </conversation_summary>
   </project_details>

Wykonaj następujące kroki, aby stworzyć kompleksowy i dobrze zorganizowany dokument:

1. Podziel PRD na następujące sekcje:
   a. Przegląd projektu
   b. Problem użytkownika
   c. Wymagania funkcjonalne
   d. Granice projektu
   e. Historie użytkownika
   f. Metryki sukcesu

2. W każdej sekcji należy podać szczegółowe i istotne informacje w oparciu o opis projektu i odpowiedzi na pytania wyjaśniające. Upewnij się, że:
   - Używasz jasnego i zwięzłego języka
   - W razie potrzeby podajesz konkretne szczegóły i dane
   - Zachowujesz spójność w całym dokumencie
   - Odnosisz się do wszystkich punktów wymienionych w każdej sekcji

3. Podczas tworzenia historyjek użytkownika i kryteriów akceptacji
   - Wymień WSZYSTKIE niezbędne historyjki użytkownika, w tym scenariusze podstawowe, alternatywne i skrajne.
   - Przypisz unikalny identyfikator wymagań (np. US-001) do każdej historyjki użytkownika w celu bezpośredniej identyfikowalności.
   - Uwzględnij co najmniej jedną historię użytkownika specjalnie dla bezpiecznego dostępu lub uwierzytelniania, jeśli aplikacja wymaga identyfikacji użytkownika lub ograniczeń dostępu.
   - Upewnij się, że żadna potencjalna interakcja użytkownika nie została pominięta.
   - Upewnij się, że każda historia użytkownika jest testowalna.

Użyj następującej struktury dla każdej historii użytkownika:

- ID
- Tytuł
- Opis
- Kryteria akceptacji

4. Po ukończeniu PRD przejrzyj go pod kątem tej listy kontrolnej:
   - Czy każdą historię użytkownika można przetestować?
   - Czy kryteria akceptacji są jasne i konkretne?
   - Czy mamy wystarczająco dużo historyjek użytkownika, aby zbudować w pełni funkcjonalną aplikację?
   - Czy uwzględniliśmy wymagania dotyczące uwierzytelniania i autoryzacji (jeśli dotyczy)?

5. Formatowanie PRD:
   - Zachowaj spójne formatowanie i numerację.
   - Nie używaj pogrubionego formatowania w markdown ( \*\* ).
   - Wymień WSZYSTKIE historyjki użytkownika.
   - Sformatuj PRD w poprawnym markdown.

Przygotuj PRD z następującą strukturą:

```markdown
# Dokument wymagań produktu (PRD) - {{app-name}}

## 1. Przegląd produktu

## 2. Problem użytkownika

## 3. Wymagania funkcjonalne

## 4. Granice produktu

## 5. Historyjki użytkowników

## 6. Metryki sukcesu
```

Pamiętaj, aby wypełnić każdą sekcję szczegółowymi, istotnymi informacjami w oparciu o opis projektu i nasze pytania wyjaśniające. Upewnij się, że PRD jest wyczerpujący, jasny i zawiera wszystkie istotne informacje potrzebne do dalszej pracy nad produktem.

Ostateczny wynik powinien składać się wyłącznie z PRD zgodnego ze wskazanym formatem w markdown, który zapiszesz w pliku specs/planning/prd.md
