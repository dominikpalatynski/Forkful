import type { ReactNode } from "react";

interface SectionHeaderProps {
  children: ReactNode;
}

/**
 * SectionHeader component displays a section title with consistent styling.
 *
 * @param children - The section title content to render inside the header.
 *
 * @example
 * ```tsx
 * <SectionHeader>Kroki przygotowania</SectionHeader>
 * ```
 */
export function SectionHeader({ children }: SectionHeaderProps) {
  return <h2 className="text-2xl font-semibold mb-4">{children}</h2>;
}
