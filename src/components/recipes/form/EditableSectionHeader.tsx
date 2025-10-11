import type { ReactNode } from "react";

interface EditableSectionHeaderProps {
  title: string;
  action?: ReactNode;
}

/**
 * EditableSectionHeader component displays a section title with optional action button.
 * Used for sections that support adding/removing items (like ingredients or steps).
 *
 * @param title - The section title to display
 * @param action - Optional action element (typically a button) to render on the right
 *
 * @example
 * ```tsx
 * <EditableSectionHeader
 *   title="Składniki"
 *   action={
 *     <Button onClick={handleAdd}>
 *       <Plus className="w-4 h-4" />
 *       Dodaj składnik
 *     </Button>
 *   }
 * />
 * ```
 */
export function EditableSectionHeader({ title, action }: EditableSectionHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold">{title}</h3>
      {action && <div>{action}</div>}
    </div>
  );
}
