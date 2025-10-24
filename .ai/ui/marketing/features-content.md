# Features Section - Content Plan

## Header Section
- **Main Heading**: Wszystko, czego potrzebujesz do cyfrowej książki kucharskiej
- **Description**: Odkryj funkcje zaprojektowane z myślą o oszczędności Twojego czasu. Inteligentne przetwarzanie AI, łatwa edycja i pełna kontrola nad Twoją kolekcją przepisów.
- **CTA Button**: Zobacz wszystkie funkcje

## Features Grid (6 items)

### 1. AI Generation
- Icon: SwatchBookIcon (rozważyć SparklesIcon)
- Title: Generowanie przepisów z AI
- Description: Wklej tekst przepisu z dowolnego źródła, a AI automatycznie wyodrębni składniki, kroki i nazwę. Zaoszczędź czas na ręcznym formatowaniu i od razu przejdź do gotowania.
- Colors: primary (border-primary/40 hover:border-primary)

### 2. Auto Parsing
- Icon: ListIcon (zmienić z ShieldBanIcon)
- Title: Automatyczne rozdzielenie treści
- Description: System inteligentnie oddziela składniki od instrukcji, rozpoznaje strukturę przepisu i porządkuje dane. Nie musisz niczego formatować ręcznie.
- Colors: green

### 3. Manual Control
- Icon: Edit3Icon (zmienić z SearchIcon)
- Title: Edycja i tworzenie manualne
- Description: Dostosuj każdy przepis do swoich potrzeb lub stwórz nowy od zera. Dodawaj, usuwaj i przestawiaj składniki oraz kroki za pomocą prostego interfejsu drag-and-drop.
- Colors: amber

### 4. Tagging System
- Icon: TagIcon (zmienić z StarIcon)
- Title: System tagów i kategorii
- Description: Organizuj przepisy według własnych kategorii. Dodawaj tagi podczas zapisywania, a system będzie podpowiadał wcześniej użyte, aby zachować spójność Twojej kolekcji.
- Colors: red/destructive

### 5. Private Collection
- Icon: LockKeyholeIcon
- Title: Bezpieczna prywatna kolekcja
- Description: Twoje przepisy są dostępne tylko dla Ciebie. Buduj osobistą cyfrową książkę kucharską bez obaw o prywatność, z pełnym dostępem z każdego urządzenia.
- Colors: violet/purple (zmienić z primary dla lepszej różnorodności)

### 6. Responsive Access
- Icon: SmartphoneIcon
- Title: Responsywny dostęp wszędzie
- Description: Korzystaj z aplikacji na komputerze podczas przygotowań lub na telefonie bezpośrednio w kuchni. Interfejs dostosowuje się do każdego urządzenia.
- Colors: sky/blue

## Implementation Notes
- Dodać importy dla nowych ikon: `ListIcon`, `Edit3Icon`, `TagIcon`
- Zaktualizować tablicę `featuresListPrepared` w komponencie
- Dostosować kolory dla feature #5 na violet/purple dla lepszej różnorodności wizualnej
- Usunąć nieużywane ikony: `SearchIcon`, `ShieldBanIcon`, `StarIcon`
