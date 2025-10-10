1. porzucenie przepisu powinno być oznaczane podczas kliknięcia anuluj oraz odrzuć zamkniećie karty przeglądarki nie powinno tego triggerować
2. Składniki niech będą osobną tabelą w bazie danych z polem "value" i tam zawrzemy informacje np "2 gramy mąki", powinny zawierać takze pole position typu integer
   dzieki ktorym bedziemy mogli sterowac pozycją składnika na liście, Dzięki której wprowadzimy funkcjonalność drag and drop
3. Jest to projekt prywatny i nie interesuje mnie na ten moment pierwsze wrazenie
4. Tak wyświetlimy błąd jako "toast" i wyswietli się formularz z pustymi polami tak jak w przypadku tworzenie przepisu w sposob manualny
5. Proszę o zastosowanie komponentu UI, który łączy w sobie pole tekstowe i listę dynamicznie dodawanych "pigułek" (tagów). Użytkownik wpisuje tekst, a system sugeruje pasujące, istniejące tagi. Naciśnięcie "Enter" lub wybranie sugestii dodaje tag jako pigułkę. Jeśli wpisany tag nie istnieje, zostanie on stworzony i dodany.
6. W tabeli generation będziemy przechowywac input_text
7. wszystkie funkcje MVP były w pełni dostępne i czytelne na urządzeniach mobilnych, nawet jeśli układ nie będzie idealnie zoptymalizowany. Oznacza to zastosowanie podstawowych zasad responsywnego designu (RWD), aby uniknąć np. "rozjeżdżania się" layoutu czy konieczności poziomego przewijania na telefonie.
8. Walidacją będzie się odbywać przez zod, i zastosowany będzie limit znaków 10 000 w inpucie do przepisu
9. Stan formularze powinien byc zapisywany w localStorage z wykorzystaniem zustanda według poniszych kryteriów:
   Kiedy zapisywać?

Natychmiast po udanej generacji AI.

Po każdej zmianie w formularzu, używając debounce (opóźnienie ~1s).

Rekomendacja: Użyj middleware persist z biblioteki Zustand.

Kiedy czyścić?

Po pomyślnym zapisie przepisu do bazy danych.

Po jawnym porzuceniu zmian przez użytkownika.

Kiedy wczytywać?

Po wejściu na stronę formularza, jeśli dane istnieją, zapytaj użytkownika, czy chce przywrócić niezapisaną sesję.
