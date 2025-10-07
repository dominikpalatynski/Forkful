Dynamiczne Zarządzanie Cyklem Życia Tagów
Zasada działania
Logika tworzenia, przypisywania, odpinania i ostatecznego usuwania tagów jest realizowana w czasie rzeczywistym, bezpośrednio w ramach transakcji zapisu przepisu. System aktywnie dba o to, by w bazie danych nie pozostawały nieużywane ("osierocone") tagi, eliminując potrzebę stosowania zadań cyklicznych (cron jobs) lub triggerów.

Procesy kluczowe
Operacja zapisu przepisu (zarówno tworzenia, jak i aktualizacji) obsługuje trzy scenariusze:

Dodawanie Taga: Frontend przesyła finalną listę nazw tagów dla przepisu. Dla każdej nazwy backend wykonuje logikę "znajdź lub stwórz":

Jeśli tag o danej nazwie istnieje dla użytkownika, pobiera jego ID.

Jeśli nie istnieje, tworzy go w tabeli tag.

Na koniec zapewnia, że powiązanie istnieje w tabeli recipe_tag.

Usuwanie Powiązania z Tagem: Przed zapisem zmian backend porównuje nową listę tagów ze starą, zapisaną w bazie. Dla każdego taga, który został usunięty z przepisu, system usuwa odpowiedni wiersz z tabeli recipe_tag.

Automatyczne Czyszczenie Nieużywanego Taga: To kluczowy element. Bezpośrednio po usunięciu powiązania (krok 2), system natychmiast sprawdza, czy usunięty tag ma jeszcze jakiekolwiek inne powiązania w tabeli recipe_tag.

Jeśli tak (tag jest używany w innych przepisach), operacja kończy się.

Jeśli nie (liczba powiązań wynosi zero), tag staje się sierotą i jest natychmiast usuwany z głównej tabeli tag.

Zalety
Pełna spójność danych: Baza danych jest zawsze czysta; nieużywane tagi nie zaśmiecają systemu ani sugestii autouzupełniania.

Brak zewnętrznych zależności: Architektura nie wymaga konfiguracji ani monitorowania dodatkowych procesów, jak cron.

Logika w jednym miejscu: Cały cykl życia taga jest zarządzany w ramach jednej, spójnej operacji biznesowej (zapis przepisu).