import React from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import type { SearchInputProps } from "./types/list.types";
import { Button } from "../ui/button";

export function SearchInput({ value, onChange, placeholder }: SearchInputProps): React.ReactElement {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="pl-9" />
      {value && (
        <Button
          variant="ghost"
          aria-label="Wyczyść wyszukiwanie"
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          size="sm"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
