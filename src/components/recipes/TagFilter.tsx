import React from "react";
import type { TagFilterProps } from "./types/list.types";
import { TagFilterPill } from "./TagFilterPill";

export function TagFilter({ tags, selectedTag, onTagSelect }: TagFilterProps): React.ReactElement | null {
  if (!tags || tags.length === 0) return <></>;

  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium mb-2">Filtruj po tagu:</h3>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <TagFilterPill
            key={tag.id}
            name={tag.name}
            isSelected={selectedTag === tag.name}
            onClick={(name: string) => onTagSelect(selectedTag === name ? null : name)}
          />
        ))}
      </div>
    </div>
  );
}
