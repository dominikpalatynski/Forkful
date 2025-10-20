# Specyfikacja Techniczna: Moduł Uwierzytelniania Użytkowników

## 1. Wprowadzenie

Niniejszy dokument opisuje architekturę i plan implementacji modułu uwierzytelniania dla aplikacji Forkful. Rozwiązanie bazuje na wymaganiach zdefiniowanych w PRD (US-001) oraz na stosie technologicznym projektu (Astro, React, Supabase). Celem jest wdrożenie bezpiecznego systemu rejestracji, logowania, wylogowywania i odzyskiwania hasła.

## 2. Architektura Interfejsu Użytkownika (Frontend)

### 2.1. Strony i Layouty (Astro)

Aplikacja zostanie rozszerzona o nowe strony i layout dedykowany procesom uwierzytelniania.

- **`src/layouts/AuthLayout.astro` (Nowy)**
  - Prosty layout przeznaczony dla stron logowania, rejestracji i odzyskiwania hasła.
  - Będzie zawierał podstawową strukturę HTML, logo aplikacji i wyśrodkowany kontener na formularze. Nie będzie zawierał nawigacji ani paska bocznego dostępnego dla zalogowanych użytkowników.

- **`src/pages/login.astro` (Nowa)**
  - Strona logowania, dostępna pod ścieżką `/auth/login`.
  - Wykorzysta `AuthLayout.astro`.
  - Będzie renderować komponent React `LoginForm.tsx` z atrybutem `client:load`, aby zapewnić interaktywność.

- **`src/pages/register.astro` (Nowa)**
  - Strona rejestracji, dostępna pod ścieżką `/auth/register`.
  - Wykorzysta `AuthLayout.astro`.
  - Będzie renderować komponent `RegisterForm.tsx`.

- **`src/pages/forgot-password.astro` (Nowa)**
  - Strona do inicjowania procesu odzyskiwania hasła.
  - Wykorzysta `AuthLayout.astro`.
  - Będzie renderować komponent `ForgotPasswordForm.tsx`.

- **`src/pages/reset-password.astro` (Nowa)**
  - Strona, na którą użytkownik trafia po kliknięciu linku z maila resetującego hasło. Supabase domyślnie dodaje token do URL, który musi zostać obsłużony.
  - Wykorzysta `AuthLayout.astro`.
  - Będzie renderować komponent `ResetPasswordForm.tsx`.

### 2.2. Komponenty Interaktywne (React)

Komponenty formularzy będą odpowiedzialne za stan, walidację i komunikację z API.

- **`src/components/auth/LoginForm.tsx` (Nowy)**
  - Formularz logowania zawierający pola na e-mail i hasło.
  - Zarządzanie stanem i walidacją za pomocą `useForm` i Zod (`LoginSchema`).
  - Logikę wysyłania danych i obsługę odpowiedzi serwera (sukces, błąd) obsłuży hook `useLogin`.
  - Będzie zawierał link do strony rejestracji (`/auth/register`) i odzyskiwania hasła (`/auth/forgot-password`).

- **`src/components/auth/RegisterForm.tsx` (Nowy)**
  - Formularz rejestracji z polami na e-mail, hasło i potwierdzenie hasła.
  - Walidacja za pomocą `RegisterSchema`, w tym sprawdzanie zgodności haseł.
  - Logikę biznesową obsłuży hook `useRegister`.
  - Po pomyślnej rejestracji wyświetli komunikat (toast) informujący o konieczności potwierdzenia adresu e-mail.

- **`src/components/auth/ForgotPasswordForm.tsx` (Nowy)**
  - Formularz z polem na e-mail.
  - Po submisji, hook `useForgotPassword` wyśle prośbę do API o wysłanie linku resetującego.

- **`src/components/auth/ResetPasswordForm.tsx` (Nowy)**
  - Formularz do ustawienia nowego hasła. Dostępny z unikalnego linku.
  - Będzie odczytywał token z URL (przekazany z Astro do komponentu React jako `prop`).
  - Hook `useResetPassword` obsłuży logikę zmiany hasła.

- **`src/components/NavUser.tsx` (Modyfikacja)**
  - Komponent w `DashboardLayout.astro`.
  - Po zalogowaniu będzie wyświetlał adres e-mail użytkownika.
  - Będzie zawierał przycisk "Wyloguj", który po kliknięciu wywoła hook `useLogout`.

### 2.3. Scenariusze i Obsługa Błędów

- **Walidacja po stronie klienta:** Każde pole formularza będzie walidowane na bieżąco (on-blur, on-change) zgodnie ze schematem Zod. Komunikaty o błędach będą wyświetlane pod odpowiednimi polami (`<FormMessage />`).
- **Błędy serwera:** Błędy zwrócone z API (np. "Nieprawidłowe dane logowania", "Użytkownik o tym e-mailu już istnieje") będą wyświetlane jako komunikaty typu toast (np. przy użyciu biblioteki `sonner`).
- **Przekierowania:** Po pomyślnym logowaniu użytkownik zostanie przekierowany na stronę główną (`/recipes`). Po wylogowaniu na stronę logowania (`/auth/login`).

## 3. Logika Backendowa

### 3.1. Middleware (Ochrona Tras)

Logika ochrony tras zostanie zaimplementowana w `src/middleware/index.ts`.

- **Działanie:** Middleware będzie uruchamiany dla każdego żądania.
- **Logika:**
  1.  Sprawdzi, czy w `Astro.cookies` znajduje się token sesji Supabase.
  2.  Na podstawie tokena zweryfikuje sesję użytkownika po stronie serwera przy użyciu klienta Supabase.
  3.  **Dla tras chronionych** (np. `/`, `/recipes/*`): Jeśli użytkownik nie jest zalogowany, nastąpi przekierowanie do `/auth/login`.
  4.  **Dla tras publicznych/autoryzacyjnych** (np. `/auth/login`, `/auth/register`): Jeśli użytkownik jest zalogowany, nastąpi przekierowanie do strony głównej (`/`).
  5.  Informacje o zalogowanym użytkowniku zostaną umieszczone w `Astro.locals.user` i będą dostępne w komponentach Astro.

### 3.2. Endpointy API (Astro API Routes)

Endpointy będą pośredniczyć między frontendem a Supabase Auth. Zapewnią warstwę bezpieczeństwa i obsługi logiki po stronie serwera.

- **`src/pages/api/auth/login.ts` (POST)**
  - Przyjmuje e-mail i hasło.
  - Wywołuje `supabase.auth.signInWithPassword()`.
  - W przypadku sukcesu, Supabase SDK automatycznie zarządza cookies sesyjnymi. Endpoint zwraca status 200.
  - W przypadku błędu, zwraca odpowiedni status (np. 401) i komunikat błędu.

- **`src/pages/api/auth/register.ts` (POST)**
  - Przyjmuje e-mail i hasło.
  - Wywołuje `supabase.auth.signUp()`. Supabase automatycznie wyśle e-mail weryfikacyjny.
  - Zwraca status 201 w przypadku sukcesu.

- **`src/pages/api/auth/logout.ts` (POST)**
  - Wywołuje `supabase.auth.signOut()`.
  - Usuwa cookies sesyjne.
  - Zwraca status 200.

- **`src/pages/api/auth/forgot-password.ts` (POST)**
  - Przyjmuje e-mail.
  - Wywołuje `supabase.auth.resetPasswordForEmail()`.
  - Zawsze zwraca status 200, aby nie ujawniać, czy dany e-mail istnieje w bazie.

- **`src/pages/api/auth/verify-reset-token.ts` (POST)**
  - Endpoint do weryfikacji tokenu resetowania hasła otrzymanego w linku e-mail.
  - Przyjmuje `token_hash` w ciele żądania i wywołuje `supabase.auth.verifyOtp()` z typem 'recovery'.
  - Zwraca dane użytkownika w przypadku sukcesu, umożliwiając zmianę hasła.

- **`src/pages/api/auth/reset-password.ts` (POST)**
  - Przyjmuje nowe hasło i token dostępowy (uzyskany na kliencie po przejściu przez `callback`).
  - Wywołuje `supabase.auth.updateUser()` z nowym hasłem.
  - Zwraca status 200 w przypadku sukcesu.

## 4. System Autentykacji (Integracja z Supabase)

- **Konfiguracja Klienta Supabase:**
  - W `src/db/supabase.client.ts` należy skonfigurować klienta Supabase. Będą potrzebne dwie instancje:
    1.  **Klient Client-Side:** Działający w przeglądarce, używający `createBrowserClient`.
    2.  **Klient Server-Side:** Używany w middleware i endpointach API Astro, tworzony per żądanie za pomocą `createServerClient` i przekazujący `Astro.cookies` do zarządzania sesją. Jest to kluczowe dla poprawnego działania SSR.
- **Zmienne Środowiskowe:** Klucze Supabase (URL, ANON KEY) będą przechowywane w pliku `.env` i dostępne w aplikacji.
- **Rola Użytkownika:** Po rejestracji użytkownik otrzyma domyślną rolę `authenticated` w Supabase, co umożliwi dalszą konfigurację dostępu do danych (Row Level Security).

## 5. Implementacja Formularzy i Hooków API

Implementacja będzie zgodna z przyjętymi w projekcie zasadami (`form.mdc`, `api-hooks.mdc`).

### 5.1. Schematy Walidacji (Zod)

- **`src/lib/schemas/auth.schema.ts` (Nowy)**
  - `LoginSchema`: `email` (string, email), `password` (string, min 8 znaków).
  - `RegisterSchema`: `email`, `password`, `confirmPassword`. Dodatkowo, `refine` do sprawdzania, czy `password` i `confirmPassword` są identyczne.
  - `ForgotPasswordSchema`: `email` (string, email).
  - `ResetPasswordSchema`: `password`, `confirmPassword`, z `refine` jak w `RegisterSchema`.

### 5.2. Serwis API

- **`src/lib/services/auth.service.ts` (Nowy)**
  - Zestaw asynchronicznych funkcji `fetch` opakowujących zapytania do endpointów `/api/auth/*`.
  - Każda funkcja będzie odpowiedzialna za wykonanie żądania i obsługę odpowiedzi (np. rzucenie wyjątku w przypadku błędu).

### 5.3. Hooki Mutacji (React Query)

- **`src/components/auth/hooks/useLogin.ts` (Nowy)**
  - Wykorzysta `useMutation` z `react-query`.
  - `mutationFn`: wywoła `authService.login`.
  - `onSuccess`: przekieruje na stronę główną (`window.location.href = '/recipes'`).
  - `onError`: wyświetli toast z komunikatem błędu.

- **`src/components/auth/hooks/useRegister.ts` (Nowy)**
  - `mutationFn`: `authService.register`.
  - `onSuccess`: wyświetli toast z informacją o wysłaniu maila weryfikacyjnego.

- **`src/components/auth/hooks/useLogout.ts` (Nowy)**
  - `mutationFn`: `authService.logout`.
  - `onSuccess`: przekieruje na stronę logowania (`window.location.href = '/auth/login'`).

- Analogiczne hooki zostaną stworzone dla `useForgotPassword` i `useResetPassword`.
