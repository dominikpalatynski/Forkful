<conversation_summary>
<decisions>

1. **Śledzenie Odrzuceń Generacji AI**: Odrzucenie przepisu wygenerowanego przez AI (i zapisanie `is_accepted: false`) będzie następować wyłącznie po kliknięciu przez użytkownika przycisku "Anuluj" lub "Odrzuć". Zamknięcie karty przeglądarki nie będzie uznawane za odrzucenie.
2. **Struktura Danych Składników**: Składniki będą przechowywane w osobnej tabeli w bazie danych. Każdy składnik będzie miał pole `value` (np. "2 gramy mąki") oraz pole `position` typu integer, co umożliwi w przyszłości implementację sortowania metodą "przeciągnij i upuść".
3. **Struktura Danych Kroków**: Kroki będą przechowywane w osobnej tabeli w bazie danych. Każdy krok będzie miał pole `description` oraz pole `position` typu integer, co umożliwi w przyszłości implementację sortowania metodą "przeciągnij i upuść".
4. **Podejście do Modelu AI w MVP**: W ramach MVP nie będzie przeprowadzany proces selekcji ani testowania różnych modeli AI. Projekt jest prywatny i pierwsze wrażenie użytkownika związane z jakością generacji nie jest priorytetem.
5. **Obsługa Błędów AI**: W przypadku niepowodzenia generacji AI, użytkownik zostanie poinformowany za pomocą powiadomienia typu "toast", a następnie zostanie mu zaprezentowany pusty formularz do manualnego tworzenia przepisu.
6. **Interfejs Zarządzania Tagami**: Zostanie zaimplementowany komponent UI łączący pole tekstowe z listą dynamicznie dodawanych "pigułek" (tagów). System będzie sugerował istniejące tagi podczas wpisywania, a nowe tagi będą tworzone "w locie" po naciśnięciu "Enter".
7. **Gromadzenie Danych Analitycznych**: Tabela `generation` będzie przechowywać oryginalny tekst wejściowy (`input_text`) wklejony przez użytkownika, co umożliwi przyszłą analizę i debugowanie.
8. **Podejście do Projektowania Interfejsu**: Aplikacja będzie projektowana w podejściu "desktop-first", ale musi być w pełni responsywna (RWD), czytelna i funkcjonalna na urządzeniach mobilnych, bez błędów w układzie.
9. **Walidacja Formularza**: Walidacja danych w formularzu zostanie zaimplementowana przy użyciu biblioteki Zod. Pole wejściowe dla tekstu przepisu do przetworzenia przez AI będzie miało limit 10 000 znaków.
10. **Zarządzanie Stanem Formularza**: Stan formularza będzie automatycznie zapisywany w `localStorage` przeglądarki przy użyciu biblioteki Zustand. Zapis będzie następował po udanej generacji AI oraz po każdej modyfikacji formularza (z opóźnieniem ~1s). Dane będą usuwane po pomyślnym zapisie przepisu lub jawnym porzuceniu przez użytkownika.
    </decisions>

<matched_recommendations>

1. **Definicja "Porzucenia" Przepisu**: Zdefiniowano, że porzucenie jest aktywną czynnością użytkownika (kliknięcie przycisku), co zapobiega gromadzeniu fałszywych negatywnych danych.
2. **Interfejs Użytkownika dla Tagów**: Zaimplementowany zostanie nowoczesny komponent typu "pillbox" z autouzupełnianiem, co jest zgodne z najlepszymi praktykami UX dla zarządzania tagami.
3. **Przechowywanie Danych Wejściowych AI**: Gromadzenie `input_text` w tabeli analitycznej zostało uznane za kluczowe dla przyszłego rozwoju i debugowania funkcji AI.
4. **Responsywność Mobilna**: Pomimo podejścia "desktop-first", zapewnienie podstawowej użyteczności na urządzeniach mobilnych (RWD) jest wymaganiem.
5. **Ochrona Pracy Użytkownika**: Zastosowanie `localStorage` i Zustand do automatycznego zapisywania stanu formularza ochroni użytkowników przed utratą danych i frustracją.
6. **Przepływ Użytkownika po Błędzie AI**: Ustalono jasną ścieżkę postępowania po nieudanej generacji (powiadomienie + przejście do formularza manualnego), co zapewnia ciągłość doświadczenia.
   </matched_recommendations>

<prd_planning_summary>

### Główne Wymagania Funkcjonalne

- **Automatyczne Tworzenie Przepisów**: Użytkownik może wkleić tekst przepisu, który zostanie automatycznie przetworzony przez AI w celu wypełnienia formularza (nazwa, składniki, instrukcje).
- **Manualne Tworzenie Przepisów**: Użytkownik ma możliwość ręcznego wprowadzenia danych do pustego formularza przepisu.
- **System Kont Użytkowników**: Prosty system uwierzytelniania oparty na adresie e-mail i haśle.
- **System Tagów**: Użytkownicy mogą oznaczać przepisy tagami. Tagi są specyficzne dla użytkownika i mogą być tworzone "w locie" podczas edycji przepisu.
- **Struktura Składników**: Składniki są przechowywane jako lista z możliwością przyszłego sortowania.
- **Analityka Jakości AI**: Dedykowana tabela `generation` w bazie danych będzie śledzić każdy przypadek użycia funkcji AI, zapisując tekst wejściowy, wynik i informację o akceptacji przez użytkownika.
- **Trwałość Formularza**: Postęp w wypełnianiu formularza jest automatycznie zapisywany w `localStorage`, aby zapobiec utracie danych.

### Kluczowe Historie Użytkownika i Ścieżki Korzystania

1. **Ścieżka z AI (Happy Path)**: Użytkownik wybiera opcję "Generuj z AI", wkleja tekst przepisu, który jest poprawnie przetwarzany. Następnie weryfikuje i edytuje dane w formularzu, dodaje tagi i zapisuje przepis. Wpis w tabeli `generation` zostaje oznaczony jako `is_accepted: true`.
2. **Ścieżka Manualna**: Użytkownik wybiera opcję "Stwórz manualnie", wypełnia od zera wszystkie pola formularza, dodaje tagi i zapisuje przepis.
3. **Ścieżka Błędu AI**: Użytkownik wkleja tekst, ale generacja AI kończy się niepowodzeniem. Otrzymuje powiadomienie o błędzie i jest płynnie przenoszony do pustego formularza w celu manualnego dodania przepisu.

### Kryteria Sukcesu i Sposoby Mierzenia

- Głównym mierzalnym kryterium sukcesu w MVP jest **wskaźnik akceptacji przepisów generowanych przez AI**.
- Pomiar będzie realizowany poprzez analizę danych w tabeli `generation`, w szczególności kolumny `is_accepted` (boolean).
- `is_accepted: true` jest ustawiane, gdy użytkownik zapisuje przepis zainicjowany przez AI.
- `is_accepted: false` jest ustawiane, gdy użytkownik jawnie anuluje proces po wygenerowaniu danych przez AI.
- Rezygnujemy w MVP z pierwotnych, sztywnych kryteriów (80% / 85%) na rzecz zbierania danych, które posłużą do oceny jakości i dalszych iteracji.

</prd_planning_summary>

<unresolved_issues>

- **Brak Nierozwiązanych Kwestii**: Wszystkie poruszone tematy zostały wyjaśnione i podjęto konkretne decyzje projektowe dla zakresu MVP. Główne ryzyko projektowe, czyli brak wstępnych testów modelu AI, zostało świadomie zaakceptowane.
  </unresolved_issues>
  </conversation_summary>
