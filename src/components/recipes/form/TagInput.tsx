import { useState } from "react";
import { useController } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TagPill } from "./TagPill";
import { Plus } from "lucide-react";
import { useTags } from "../hooks/useTags";
import { useDebounce } from "../hooks/useDebounce";
import type { TagInputProps } from "../types/form.types";

/**
 * TagInput Component
 *
 * Manages recipe tags with add/remove functionality and autocomplete suggestions.
 * Uses useController to manage the tags array in the form and useTags for API-based suggestions.
 * Provides a debounced input field for adding new tags with autocomplete hints.
 *
 * @param control - React Hook Form control object for managing form state
 */
export function TagInput({ control }: TagInputProps) {
  const [newTagValue, setNewTagValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const {
    field: { value: tags, onChange },
  } = useController({
    name: "tags",
    control,
  });

  // Debounce the input value to avoid excessive API calls
  const debouncedQuery = useDebounce(newTagValue.trim(), 500);

  // Fetch tag suggestions based on debounced input
  const { tags: tagSuggestions, isLoading: suggestionsLoading } = useTags(
    debouncedQuery.length > 0 ? debouncedQuery : undefined
  );

  // Filter suggestions to exclude already selected tags
  const filteredSuggestions = tagSuggestions.filter((suggestion) => !tags.includes(suggestion.name));

  const handleAddTag = () => {
    const trimmedValue = newTagValue.trim();
    if (trimmedValue && !tags.includes(trimmedValue)) {
      onChange([...tags, trimmedValue]);
      setNewTagValue("");
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestionName: string) => {
    if (!tags.includes(suggestionName)) {
      onChange([...tags, suggestionName]);
      setNewTagValue("");
      setShowSuggestions(false);
    }
  };

  const handleRemoveTag = (tagName: string) => {
    onChange(tags.filter((tag: string) => tag !== tagName));
  };

  const handleInputChange = (value: string) => {
    setNewTagValue(value);
    setShowSuggestions(value.trim().length > 0);
  };

  const handleInputFocus = () => {
    if (newTagValue.trim().length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => setShowSuggestions(false), 150);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium">Tagi</Label>

      {/* Add new tag input with suggestions */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="Dodaj tag..."
              value={newTagValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyPress}
              className="w-full"
              autoComplete="off"
            />

            {/* Suggestions dropdown */}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-background border border-border rounded-md shadow-lg max-h-40 overflow-y-auto">
                {suggestionsLoading ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">Ładowanie sugestii...</div>
                ) : (
                  filteredSuggestions.slice(0, 5).map((suggestion) => (
                    <button
                      key={suggestion.id}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion.name)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors first:rounded-t-md last:rounded-b-md"
                    >
                      {suggestion.name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddTag}
            disabled={!newTagValue.trim()}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Dodaj
          </Button>
        </div>
      </div>

      {/* Selected tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <TagPill key={tag} name={tag} onRemove={handleRemoveTag} />
          ))}
        </div>
      )}
    </div>
  );
}
