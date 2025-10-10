import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { PaginatedRecipesDto, TagDto } from "@/types";
import { useDebounce } from "./useDebounce";
import { queryClient } from "@/store/query";
export type SortBy = "name" | "created_at";
export type SortOrder = "asc" | "desc";

export interface GetRecipesQueryParams {
  page: number;
  pageSize: number;
  sortBy: SortBy;
  order: SortOrder;
  tag?: string;
}

async function fetchRecipes(params: GetRecipesQueryParams): Promise<PaginatedRecipesDto> {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
    sortBy: params.sortBy,
    order: params.order,
  });
  if (params.tag) searchParams.append("tag", params.tag);

  const response = await fetch(`/api/recipes?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error("Nie udało się pobrać przepisów");
  }
  return response.json();
}

async function fetchUserTags(): Promise<TagDto[]> {
  const response = await fetch("/api/tags");
  if (!response.ok) {
    throw new Error("Nie udało się pobrać tagów");
  }
  return response.json();
}

export function useRecipeListState() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [sortBy] = useState<SortBy>("created_at");
  const [order] = useState<SortOrder>("desc");

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const {
    data: recipesData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<PaginatedRecipesDto>(
    {
      queryKey: ["recipes", currentPage, pageSize, sortBy, order, selectedTag],
      queryFn: () =>
        fetchRecipes({
          page: currentPage,
          pageSize: pageSize,
          sortBy,
          order,
          tag: selectedTag ?? undefined,
        }),
    },
    queryClient
  );

  const { data: tagsData } = useQuery<TagDto[]>(
    {
      queryKey: ["tags"],
      queryFn: fetchUserTags,
    },
    queryClient
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  }, []);

  const handleTagSelect = useCallback((tagName: string | null) => {
    console.log("value", tagName);

    setSelectedTag((prev) => (prev === tagName ? null : tagName));
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  const handleRecipeClick = useCallback((recipeId: string) => {
    window.location.href = `/recipes/${recipeId}`;
  }, []);

  const filteredRecipes = useMemo(() => {
    const all = recipesData?.data ?? [];
    if (!debouncedSearchQuery) return all;
    const q = debouncedSearchQuery.toLowerCase();
    return all.filter((r) => r.name.toLowerCase().includes(q));
  }, [recipesData?.data, debouncedSearchQuery]);

  return {
    searchQuery,
    selectedTag,
    currentPage,
    pageSize,
    sortBy,
    order,

    recipes: filteredRecipes,
    pagination: recipesData?.pagination,
    tags: tagsData ?? [],

    isLoading,
    isError,
    error,
    isEmpty: !isLoading && filteredRecipes.length === 0,

    handleSearchChange,
    handleTagSelect,
    handlePageChange,
    handlePageSizeChange,
    handleRecipeClick,
    handleRetry: refetch,
  } as const;
}
