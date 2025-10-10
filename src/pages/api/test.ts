import type { APIRoute } from "astro";

// Mock recipe data - replace with actual database queries
interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  createdAt: string;
}

const mockRecipes: Recipe[] = [
  {
    id: "1",
    title: "Classic Chocolate Chip Cookies",
    description: "Delicious homemade chocolate chip cookies that are crispy on the outside and chewy on the inside.",
    ingredients: [
      "2 1/4 cups all-purpose flour",
      "1 tsp baking soda",
      "1 tsp salt",
      "1 cup butter, softened",
      "3/4 cup granulated sugar",
      "3/4 cup brown sugar",
      "2 large eggs",
      "2 tsp vanilla extract",
      "2 cups chocolate chips",
    ],
    instructions: [
      "Preheat oven to 375°F (190°C)",
      "Mix flour, baking soda, and salt in a bowl",
      "Cream butter and sugars until fluffy",
      "Beat in eggs and vanilla",
      "Gradually add flour mixture",
      "Stir in chocolate chips",
      "Drop rounded tablespoons onto ungreased baking sheets",
      "Bake 9-11 minutes until golden brown",
    ],
    prepTime: 15,
    cookTime: 10,
    servings: 24,
    difficulty: "easy",
    tags: ["dessert", "cookies", "chocolate"],
    createdAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "2",
    title: "Spaghetti Carbonara",
    description: "Traditional Italian pasta dish with eggs, cheese, and pancetta.",
    ingredients: [
      "400g spaghetti",
      "200g pancetta or guanciale",
      "4 large eggs",
      "100g Pecorino Romano cheese, grated",
      "50g Parmesan cheese, grated",
      "Black pepper to taste",
      "Salt for pasta water",
    ],
    instructions: [
      "Bring a large pot of salted water to boil",
      "Cook spaghetti according to package directions",
      "Meanwhile, cook pancetta until crispy",
      "Whisk eggs with cheeses and black pepper",
      "Drain pasta, reserving 1 cup pasta water",
      "Add hot pasta to pancetta pan",
      "Remove from heat and quickly stir in egg mixture",
      "Add pasta water as needed for creamy consistency",
    ],
    prepTime: 10,
    cookTime: 15,
    servings: 4,
    difficulty: "medium",
    tags: ["pasta", "italian", "dinner"],
    createdAt: "2024-01-16T14:30:00Z",
  },
];

export const GET: APIRoute = async ({ request, url }) => {
  return new Response(JSON.stringify({ recipes: mockRecipes }), { status: 200 });
};
