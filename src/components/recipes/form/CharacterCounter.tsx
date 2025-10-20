import React from "react";
import type { CharacterCounterProps } from "../types/ai.types";
import { cn } from "@/utils/ui";
/**
 * Komponent wyświetlający licznik znaków z kolorowym feedbackiem.
 *
 * Logika kolorowania:
 * - Czerwony (text-red-600): poniżej minimum
 * - Pomarańczowy (text-orange-600): między minimum a minimum + 50
 * - Zielony (text-green-600): powyżej minimum + 50
 *
 * @param props - Props zawierające current, min i max
 * @returns JSX Element z licznikiem znaków
 *
 * @example
 * ```tsx
 * <CharacterCounter current={150} min={100} max={1000} />
 * // Wyświetli: "150 / 1000" w zielonym kolorze
 * ```
 */
export const CharacterCounter = React.memo<CharacterCounterProps>(({ current, min, max }) => {
  /**
   * Określa kolor tekstu na podstawie liczby znaków względem minimum.
   */
  const getColorClass = (): string => {
    if (current < min) {
      return "text-red-600 dark:text-red-400";
    }
    if (current < min + 50) {
      return "text-orange-600 dark:text-orange-400";
    }
    return "text-green-600 dark:text-green-400";
  };

  /**
   * Określa status aria-live dla dostępności.
   * "assertive" gdy przekroczono limit, "polite" w pozostałych przypadkach.
   */
  const getAriaLive = (): "assertive" | "polite" => {
    return current > max ? "assertive" : "polite";
  };

  /**
   * Generuje opisowy tekst dla screen readerów.
   */
  const getAriaLabel = (): string => {
    if (current < min) {
      return `Wprowadzono ${current} znaków. Wymagane minimum to ${min} znaków.`;
    }
    if (current > max) {
      return `Wprowadzono ${current} znaków. Przekroczono maksimum ${max} znaków.`;
    }
    return `Wprowadzono ${current} z maksymalnie ${max} znaków.`;
  };

  return (
    <div
      className={cn(
        "text-sm font-medium transition-colors",
        getColorClass()
      )}
      role="status"
      aria-live={getAriaLive()}
      aria-label={getAriaLabel()}
    >
      {current} / {max}
    </div>
  );
});

CharacterCounter.displayName = "CharacterCounter";
