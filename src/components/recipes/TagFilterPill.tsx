import React from "react";
import type { TagFilterPillProps } from "./types/list.types";
import { Button } from "@/components/ui/button";

export const TagFilterPill = React.memo(function TagFilterPill({
  name,
  isSelected,
  onClick,
}: TagFilterPillProps): React.ReactElement {
  return (
    <Button
      type="button"
      variant={isSelected ? "default" : "secondary"}
      className={`px-3 py-1 rounded-full text-xs border transition-colors ${
        isSelected
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-secondary text-secondary-foreground border-transparent hover:bg-secondary/80"
      }`}
      onClick={() => onClick(name)}
      size="sm"
    >
      {name}
    </Button>
  );
});
