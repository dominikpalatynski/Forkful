import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardBreadcrumbsProps {
  currentPath: string;
  recipeTitle?: string;
  isLoadingRecipe?: boolean;
}

export function DashboardBreadcrumbs({
  currentPath,
  recipeTitle,
  isLoadingRecipe = false,
}: DashboardBreadcrumbsProps) {
  // Parse the current path to determine breadcrumb items
  const getBreadcrumbItems = () => {
    const items: Array<{
      label: string;
      href?: string;
      isLast: boolean;
      showSkeleton?: boolean;
    }> = [];

    // Always include "Przepisy" as the first item
    const isOnRecipesIndex = currentPath === "/recipes";
    items.push({
      label: "Przepisy",
      href: isOnRecipesIndex ? undefined : "/recipes",
      isLast: isOnRecipesIndex,
    });

    // Handle different recipe routes
    if (currentPath.startsWith("/recipes/")) {
      if (currentPath === "/recipes/new") {
        items.push({ label: "Nowy przepis", isLast: true });
      } else if (currentPath === "/recipes/new-ai") {
        items.push({ label: "Nowy przepis (AI)", isLast: true });
      } else if (currentPath.match(/^\/recipes\/[^/]+$/)) {
        // Recipe detail page: /recipes/[id]
        items.push({
          label: recipeTitle || "Szczegóły przepisu",
          isLast: true,
          showSkeleton: isLoadingRecipe && !recipeTitle,
        });
      } else if (currentPath.match(/^\/recipes\/[^/]+\/edit$/)) {
        // Recipe edit page: /recipes/[id]/edit
        const recipeId = currentPath.split("/")[2];
        items.push({
          label: recipeTitle || "Przepis",
          href: `/recipes/${recipeId}`,
          isLast: false,
          showSkeleton: isLoadingRecipe && !recipeTitle,
        });
        items.push({ label: "Edytuj", isLast: true });
      }
    }

    return items;
  };

  const breadcrumbItems = getBreadcrumbItems();

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbItems.map((item, index) => (
          <div key={index} style={{ display: "contents" }}>
            <BreadcrumbItem>
              {item.showSkeleton ? (
                <Skeleton className="h-4 w-32" />
              ) : item.isLast ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {!item.isLast && <BreadcrumbSeparator />}
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}