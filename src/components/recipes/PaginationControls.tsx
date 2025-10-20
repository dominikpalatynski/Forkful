import React from "react";
import type { PaginationControlsProps } from "./types/list.types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationControlsProps): React.ReactElement {
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row justify-start items-center gap-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={!canGoPrev} onClick={() => onPageChange(currentPage - 1)}>
          Poprzednia
        </Button>
        <span className="text-sm">
          Strona {currentPage} z {totalPages}
        </span>
        <Button variant="outline" size="sm" disabled={!canGoNext} onClick={() => onPageChange(currentPage + 1)}>
          Następna
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Label>Wyników na stronie:</Label>
        <select
          className="border rounded px-2 py-1 text-sm bg-background"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
        >
          {[10, 20, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
