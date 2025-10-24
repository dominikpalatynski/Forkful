# HeroSection - Notatki implementacyjne

## Zmiany do wprowadzenia

### 1. Tekst w komponencie
- [x] Zaktualizować badge description (linia 11)
- [x] Zaktualizować główny nagłówek (linia 15-48)
- [x] Dostosować podkreślone słowo w SVG
- [x] Zaktualizować paragraf opisowy (linia 51-55)
- [x] Zaktualizować tekst CTA (linia 58)

### 2. Rozważenia A/B testing
Przygotowano dwie wersje contentu:
- **Primary**: Skupiona na "cyfrowej książce kucharskiej" i eliminacji pracy
- **Alternative**: Skupiona na szybkości i automatyzacji

Rekomendacja: Rozpocząć od wersji primary, która lepiej komunikuje długoterminową wartość produktu.

### 3. Obraz hero
Obecny obraz (dania kulinarne) jest generyczny i nie komunikuje wartości produktu.

**Rekomendowane alternatywy:**
- Screenshot aplikacji pokazujący proces wklejania przepisu i automatycznej generacji
- Osoba używająca aplikacji na tablecie w kuchni
- Split-screen: chaos (wydrukowane przepisy, notatki) vs. porządek (Forkful na ekranie)

### 4. Kolejne kroki
1. ✅ Zaimplementować wersję primary
2. ⏳ Zastąpić placeholder image właściwym zdjęciem/screenshotem
3. ⏳ Rozważyć dodanie social proof (np. "Dołącz do X użytkowników")
4. ⏳ Po zebraniu danych z MS-001 i MS-002, dostosować komunikaty

## Historia wersji

### v1.0 - 2025-10-24
- Utworzenie plików konfiguracyjnych treści marketingowej
- Implementacja wersji primary w komponencie HeroSection
- Aktualizacja wszystkich tekstów zgodnie z dokumentem PRD
