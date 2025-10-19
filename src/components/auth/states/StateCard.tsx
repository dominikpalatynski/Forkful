import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReactNode } from "react";

interface StateCardProps {
  children: ReactNode;
  variant?: "default" | "error";
}

/**
 * Base card wrapper component for consistent state UI presentation.
 * Used as a foundation for loading, error, and success states in auth flows.
 *
 * @param children - The content to render inside the card
 * @param variant - Visual variant: "default" for neutral states, "error" for error states
 *
 * @example
 * ```tsx
 * <StateCard variant="error">
 *   <div>Error content here</div>
 * </StateCard>
 * ```
 */
export function StateCard({ children, variant = "default" }: StateCardProps) {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className={variant === "default" ? "pt-6" : ""}>
        {children}
      </CardContent>
    </Card>
  );
}

interface StateCardWithHeaderProps {
  icon: ReactNode;
  title: string;
  description?: string;
  children?: ReactNode;
  variant?: "default" | "error";
}

/**
 * Card component with header section for icons and titles.
 * Provides a consistent layout for error and informational states.
 *
 * @param icon - Icon element to display in the header
 * @param title - Title text
 * @param description - Optional description text
 * @param children - Additional content to render in card body
 * @param variant - Visual variant: "default" or "error"
 *
 * @example
 * ```tsx
 * <StateCardWithHeader
 *   icon={<AlertCircle className="h-6 w-6 text-red-600" />}
 *   title="Error Occurred"
 *   description="Something went wrong"
 *   variant="error"
 * >
 *   <Button>Retry</Button>
 * </StateCardWithHeader>
 * ```
 */
export function StateCardWithHeader({
  icon,
  title,
  description,
  children,
  variant = "default"
}: StateCardWithHeaderProps) {
  const iconBgClass = variant === "error" ? "bg-red-100" : "bg-gray-100";
  const titleClass = variant === "error" ? "text-xl text-red-900" : "text-xl";
  const descriptionClass = variant === "error" ? "text-red-700" : "";

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${iconBgClass}`}>
          {icon}
        </div>
        <CardTitle className={titleClass}>{title}</CardTitle>
        {description && (
          <CardDescription className={descriptionClass}>
            {description}
          </CardDescription>
        )}
      </CardHeader>
      {children && <CardContent>{children}</CardContent>}
    </Card>
  );
}
