<conversation_summary>
<decisions>

1.  **Struktura tras (Routing)**: Zostaną zaimplementowane oddzielne trasy dla kluczowych widoków: logowanie/rejestracja, `/dashboard` (lista przepisów), `/recipes/new` (tworzenie przepisu), `/recipes/{id}` (szczegóły przepisu) oraz `/recipes/{id}/edit` (edycja).
2.  **Przekierowanie po utworzeniu**: Po pomyślnym utworzeniu przepisu, użytkownik zostanie przekierowany na stronę szczegółów nowo utworzonego przepisu (`/recipes/{id}`).
3.  **Responsywność (RWD)**: Przyjęta zostanie strategia mobile-first. Interfejs będzie zoptymalizowany pod kątem urządzeń mobilnych, z adaptacyjnymi layoutami (np. wielokolumnowymi) na większych ekranach.
4.  **System projektowy (Design System)**: Interfejs zostanie zbudowany w oparciu o domyślny motyw Shadcn/ui i tokeny projektowe Tailwind CSS, z zdefiniowaną podstawową paletą kolorów i typografią.
5.  **Zarządzanie stanem (State Management)**: Zostanie zastosowany podział:
    - **TanStack Query (React Query)**: Do zarządzania stanem serwera (pobieranie danych, buforowanie, synchronizacja).
    - **React Hook Form + Zod**: Do zarządzania stanem formularzy i walidacji po stronie klienta.
    - **Zustand**: Do przechowywania tymczasowego stanu przepisu generowanego przez AI.
    - **React Context**: Do prostego stanu globalnego (np. dane sesji użytkownika).
6.  **Komunikacja błędów**: Błędy walidacji będą wyświetlane bezpośrednio przy polach formularza (inline). Mniej krytyczne błędy i powiadomienia będą komunikowane za pomocą komponentu "toast".
7.  **Wygląd listy przepisów**: Każdy element na liście będzie wyświetlał nazwę przepisu, przypisane tagi oraz datę ostatniej modyfikacji.
8.  **Paginacja**: Na liście przepisów zostanie zastosowana standardowa, numeryczna paginacja.
9.  **Przepływ generowania przez AI**: Proces będzie inicjowany przez użytkownika poprzez kliknięcie przycisku "Generuj z tekstu". Pola formularza pojawią się dopiero po przetworzeniu danych przez AI. W trybie manualnym będą widoczne od razu.
10. **Dynamiczne listy w formularzu**: Do zarządzania listami składników i kroków zostanie użyty hook `useFieldArray`. Funkcjonalność "przeciągnij i upuść" do zmiany kolejności kroków zostanie zaimplementowana przy użyciu biblioteki `dnd-kit`.
11. **Zarządzanie tagami**: Zostanie zaimplementowany komponent typu "Combobox", który będzie wyszukiwał istniejące tagi poprzez API i oferował opcję tworzenia nowych.
12. **Nawigacja główna**: Aplikacja będzie posiadała boczny panel nawigacyjny (sidebar) w widokach po zalogowaniu, zawierający kluczowe linki i opcję wylogowania.
13. **Stany ładowania i puste**: Aplikacja będzie wykorzystywać komponenty "szkieletowe" (skeleton) podczas ładowania danych. Puste stany (np. brak przepisów) będą jasno komunikowane i będą zawierały wezwanie do działania (CTA).
14. **Porzucenie formularza**: Wdrożony zostanie mechanizm potwierdzenia przed opuszczeniem strony edycji z niezapisanymi zmianami.
    </decisions>
    <matched_recommendations>
15. **Architektura routingu**: Zastosowanie oddzielnych, zagnieżdżonych tras dla zasobów (np. `/recipes/new`, `/recipes/{id}`) jest kluczową decyzją zapewniającą przejrzystość i zgodność z wzorcami REST.
16. **Strategia zarządzania stanem**: Podział odpowiedzialności między TanStack Query (stan serwera), Zustand (stan tymczasowy/specyficzny) i React Hook Form (stan formularzy) jest nowoczesnym i wydajnym podejściem w aplikacjach React.
17. **Komponenty i UI**: Oparcie UI o bibliotekę Shadcn/ui i Tailwind CSS gwarantuje szybki rozwój, spójność wizualną oraz wysoki poziom dostępności od samego początku.
18. **Bezpieczeństwo po stronie klienta**: Wykorzystanie middleware do ochrony tras jest fundamentalnym mechanizmem zapewniającym, że tylko autoryzowani użytkownicy mają dostęp do swoich danych.
19. **Doświadczenie użytkownika (UX)**: Świadome projektowanie przepływów (generowanie AI, edycja list) oraz obsługa stanów (ładowania, puste, błędy, niezapisane zmiany) jest kluczowe dla stworzenia intuicyjnej i przyjaznej aplikacji.
    </matched_recommendations>
    <ui_architecture_planning_summary>

### Główne wymagania dotyczące architektury UI

Architektura interfejsu użytkownika dla MVP Forkful ma na celu stworzenie responsywnej, dostępnej i bezpiecznej aplikacji internetowej. Zostanie zbudowana przy użyciu **Astro 5** jako frameworka, z **React 19** dla interaktywnych komponentów ("wysp"). Stylizacja zostanie oparta na **Tailwind 4**, a biblioteka komponentów **Shadcn/ui** posłuży jako fundament systemu projektowego, zapewniając spójność i dostępność.

### Kluczowe widoki, ekrany i przepływy użytkownika

Aplikacja zostanie podzielona na logiczne, oparte na trasach widoki:

- **Publiczne**: Strony logowania (`/login`) i rejestracji (`/register`).
- **Chronione**:
  - `/dashboard`: Główny widok po zalogowaniu, prezentujący listę przepisów użytkownika z paginacją i opcjami filtrowania.
  - `/recipes/new`: Formularz tworzenia nowego przepisu, oferujący dwa tryby: manualny oraz wspomagany przez AI (po wklejeniu tekstu).
  - `/recipes/{id}`: Widok szczegółowy pojedynczego przepisu.
  - `/recipes/{id}/edit`: Formularz edycji istniejącego przepisu.

**Podstawowy przepływ użytkownika**: Użytkownik loguje się, przechodzi do pulpitu, gdzie widzi swoje przepisy. Może przejść do tworzenia nowego przepisu, wkleić tekst, pozwolić AI go przetworzyć, a następnie dokonać edycji i zapisać. Po zapisie jest przekierowywany do widoku szczegółowego.

### Strategia integracji z API i zarządzania stanem

- **Komunikacja z API i stan serwera**: **TanStack Query (React Query)** będzie centralnym narzędziem do zarządzania danymi pochodzącymi z API. Będzie odpowiedzialne za pobieranie, buforowanie, automatyczne odświeżanie danych oraz obsługę stanów ładowania i błędów na poziomie zapytań.
- **Stan formularzy**: **React Hook Form** w połączeniu z walidacją **Zod** będzie zarządzać wszystkimi formularzami. Dynamiczne listy (składniki, kroki) będą obsługiwane przez hook `useFieldArray`.
- **Stan generowania AI**: **Zustand** posłuży jako lekki magazyn do przechowywania stanu przepisu zwróconego przez AI, zanim zostanie on wstrzyknięty do formularza zarządzanego przez React Hook Form.
- **Globalny stan klienta**: Proste dane globalne, takie jak informacje o zalogowanym użytkowniku, będą zarządzane przez **React Context**.

### Kwestie dotyczące responsywności, dostępności i bezpieczeństwa

- **Responsywność**: Architektura przyjmuje podejście **mobile-first**. Layouty będą elastyczne, zapewniając optymalne doświadczenie na wszystkich rozmiarach ekranów.
- **Dostępność**: Wysoki priorytet. Wykorzystanie semantycznych komponentów z Shadcn/ui, dbałość o nawigację klawiaturą, stany focus i odpowiednie etykiety ma zapewnić zgodność ze standardami WCAG.
- **Bezpieczeństwo**: **Astro middleware** będzie pełnić rolę strażnika dla chronionych tras. Będzie weryfikować token JWT (z Supabase Auth) przy każdym żądaniu do serwera. Użytkownicy bez ważnej sesji zostaną przekierowani na stronę logowania.

</ui_architecture_planning_summary>
<unresolved_issues>
Wszystkie kluczowe kwestie dotyczące architektury interfejsu użytkownika dla MVP zostały omówione i rozstrzygnięte. Plan jest gotowy do rozpoczęcia implementacji.
</unresolved_issues>
</conversation_summary>
