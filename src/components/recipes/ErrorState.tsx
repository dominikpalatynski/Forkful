import React from "react";
import type { ErrorStateProps } from "./types/list.types";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorState({ error, onRetry }: ErrorStateProps): React.ReactElement {
  const message = typeof error === "string" ? error : (error?.message ?? "Wystąpił błąd");
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertCircle className="w-16 h-16 text-destructive mb-4" />
      <h3 className="text-lg font-semibold mb-2">Wystąpił błąd</h3>
      <p className="text-sm text-muted-foreground mb-4">{message}</p>
      <Button onClick={onRetry}>Spróbuj ponownie</Button>
    </div>
  );
}
