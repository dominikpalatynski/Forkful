1. Gdy błąd jest nie ackeptowalny zapisujemy kod błędu do tabeli generation_error z error message i zwracamy uzytkownik powiadomienie
   ze generowanie się nie udało. Docelowo formularz tworzenie Manualnego i z wykorzystaniem AI będzie taki sam, w przypadku AI przed docelowym formularzem będzie
   input gdzie mozna wkleic opis przepisu. Następnie zostanie wygenerowany formularz z zanicjalizowanymi wartościami przez AI i uzytkownik bedzie mogł albo porzucić tworzenie przepisu albo go stworzyć.
2. Nie będziemy mierzyć takich typów rzeczy. Stworzymy tabelę generation z polami output oraz is_accepted. I w przypadku stworzenie przepisu z wykorzystaniem AI zapiszemy is_accepted na true a gdy porzuci tworzenie ustawimy to na false. W ten sposób będziemy mierzyć ile przepisów tak naprawdę jest wygenerowane przez AI i będziemy mieli wgląd na jakoś odpowiedzi.
3. W Mvp podejście do tagów będzie uproszczone. Kady uytkownik będzie miał swoje tagi. Tagi będę miały relacje wiele do wielu z przepisami. Nie będzie natomiast osobnego interfejsu do zarządzania nimi. W momencie tworzenie przepisu będzie monzna dodać
   istniejący tag lub stworzyć w locie nowy. Będzie mozna tez usuwac tagi z przepisow i całkowite usunięcie tagu będzie polegało na tym ze gdy usuniemy encje tabeli łączącej sprawdzimy czy inny przepis ma ten tag_id jeśli nie to poprostu usuniemy tez tag bo nie jest uzywany
4. Aby uprościć MVP i skrócić czas dewelopmentu postawimy na logowanie tylko za pomocą email i hasło
5. W etapie MVP nie będziemy się skupiać na doborze modelu ani w zaden sposób tego testować
6. W panelu uzytkownik pojawią się dwa przyciski, generowanie za pomocą AI i tworzenie manualne.
   Te dwie opcje będę róznić się tylko tym ze w przypadku generowania z AI na samej gorze ekranu wyswietli się input i po zatwierdzeniu go pod spodem będzie widoczny formularz z zainicjalizowanymi
   polami wygenerowanymy przez AI które będzie mona samodzielnie edytować. W tworzeniu manualnym wszystko pozostanie takie samo tylko na górze ekranu nie będzie
   inputu z textem tylko odrazu mozna będzie przejsc do tworzenia.
   Tworzenie tagów nie będzie zintegorwane z AI po wygenerowaniu przepisu przez AI w widoku tworzenie wyswietli się opcja podpiecia tagów, tak samo widoku manualnym
7. Na ten moment skupiam się na technologi i projekcie samym w sobie więc zastosujmy podejście desktop first
8. Na ten moment nie przewiduje takich funcjonalności jest to MVP
