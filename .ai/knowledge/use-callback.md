# React `useCallback` Hook - Complete Guide

## 1. Core Concept: What is `useCallback`?

`useCallback` is a React Hook that returns a memoized version of a callback function.

### The Problem: Referential Equality

In JavaScript, functions are reference types. Every time a component re-renders, any functions defined inside it are **recreated as new instances**, even if they do the exact same thing:

```jsx
function Component() {
  // This creates a NEW function on every render
  const handleClick = () => {
    console.log("clicked");
  };
  // Render 1: handleClick = function_A
  // Render 2: handleClick = function_B (different reference!)
  // Render 3: handleClick = function_C (different reference!)
}
```

This recreation causes problems when:

- Functions are passed as props to memoized child components (triggering unnecessary re-renders)
- Functions are used as dependencies in `useEffect` or `useMemo` (causing infinite loops)
- You need a stable function reference across renders

**Key Point:** `useCallback` memoizes **the function instance itself**, not its return value. The function is only recreated when its dependencies change.

---

## 2. Syntax and Usage

### Basic Syntax

```jsx
const memoizedCallback = useCallback(fn, deps);
```

### Arguments

1. **`fn`**: The function you want to memoize
2. **`deps`**: An array of dependencies that, when changed, will cause the function to be recreated

### Example Implementation

```jsx
import { useState, useCallback } from "react";

function Component() {
  const [count, setCount] = useState(0);

  // Function is memoized - only recreated when dependencies change
  const handleIncrement = useCallback(() => {
    setCount((c) => c + 1);
  }, []); // Empty deps = created once, never recreated

  return <button onClick={handleIncrement}>Count: {count}</button>;
}
```

---

## 3. The Dependency Array Explained

The dependency array controls **when the memoized function should be recreated**.

### Empty Array `[]`

```jsx
const callback = useCallback(() => {
  doSomething();
}, []); // Created ONCE on initial render, never recreated
```

**Use when:** The function doesn't depend on any values from the component scope, or only uses stable values (like `setState` functions).

### Array with Dependencies `[a, b]`

```jsx
const callback = useCallback(() => {
  console.log(a, b);
}, [a, b]); // Recreated ONLY when 'a' or 'b' changes
```

**Rule:** Any value from the component scope that is used inside the callback **must** be included in the dependency array. This prevents stale closures.

**Example of stale closure bug:**

```jsx
// ❌ BAD: Missing dependency
const [count, setCount] = useState(0);

const logCount = useCallback(() => {
  console.log(count); // Uses 'count'
}, []); // BUG: 'count' not in deps!

// After count changes to 5, logCount still logs 0 (stale!)
```

```jsx
// ✅ GOOD: All dependencies included
const logCount = useCallback(() => {
  console.log(count);
}, [count]); // Function recreated when count changes
```

### Omitting the Array

```jsx
const callback = useCallback(() => {
  doSomething();
}); // No dependency array = recreated on EVERY render
```

**Never do this** - it defeats the entire purpose of `useCallback`. Without dependencies, the function is memoized but recreated on every render anyway.

### Special Case: React's Stable Functions

React **guarantees** that certain functions are stable and never change:

- `setState` from `useState`
- `dispatch` from `useReducer`
- Ref objects from `useRef`

These don't need to be in the dependency array:

```jsx
const [state, setState] = useState(0);

const callback = useCallback(() => {
  setState(1); // setState is stable by React guarantee
}, []); // ✅ No need to include setState in deps
```

**However**, the callback function itself (`callback`) is **not automatically stable** - that's why we use `useCallback` to stabilize it!

---

## 4. When to Use `useCallback` (The Primary Use Cases)

### Use Case 1: Optimizing Memoized Child Components

When passing callbacks to child components wrapped in `React.memo`, use `useCallback` to prevent unnecessary re-renders.

**Without `useCallback` (child re-renders unnecessarily):**

```jsx
const Child = memo(({ onClick }) => {
  console.log("Child rendered");
  return <button onClick={onClick}>Click</button>;
});

function Parent() {
  const [count, setCount] = useState(0);
  const [other, setOther] = useState(0);

  // New function on every render
  const handleClick = () => {
    setCount((c) => c + 1);
  };

  return (
    <>
      <Child onClick={handleClick} /> {/* Re-renders when 'other' changes! */}
      <button onClick={() => setOther((o) => o + 1)}>Other: {other}</button>
    </>
  );
}
```

**With `useCallback` (child only re-renders when needed):**

```jsx
function Parent() {
  const [count, setCount] = useState(0);
  const [other, setOther] = useState(0);

  // Memoized function
  const handleClick = useCallback(() => {
    setCount((c) => c + 1);
  }, []);

  return (
    <>
      <Child onClick={handleClick} /> {/* No re-render when 'other' changes! */}
      <button onClick={() => setOther((o) => o + 1)}>Other: {other}</button>
    </>
  );
}
```

### Use Case 2: Hook Dependencies (Preventing Infinite Loops)

When a function is used as a dependency in `useEffect`, `useMemo`, or other hooks, `useCallback` prevents unnecessary re-executions.

**Without `useCallback` (effect runs on every render):**

```jsx
function SearchComponent() {
  const [query, setQuery] = useState("");

  // New function on every render
  const fetchResults = async () => {
    const response = await fetch(`/api/search?q=${query}`);
    return response.json();
  };

  useEffect(() => {
    fetchResults(); // Runs on EVERY render
  }, [fetchResults]); // fetchResults changes every render

  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
}
```

**With `useCallback` (effect only runs when query changes):**

```jsx
function SearchComponent() {
  const [query, setQuery] = useState("");

  // Memoized function - only recreated when query changes
  const fetchResults = useCallback(async () => {
    const response = await fetch(`/api/search?q=${query}`);
    return response.json();
  }, [query]); // Only changes when query changes

  useEffect(() => {
    fetchResults(); // Only runs when query changes
  }, [fetchResults]); // fetchResults is stable

  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
}
```

### Use Case 3: Custom Hooks Returning Callbacks

Custom hooks should return stable function references so consumers don't have unexpected re-renders:

```jsx
function useDeleteRecipe() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Memoized callbacks for stable references
  const openDialog = useCallback(() => {
    setIsDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setIsDialogOpen(false);
  }, []);

  const handleDelete = useCallback(async (recipeId: string) => {
    await deleteRecipe(recipeId);
    closeDialog();
  }, [closeDialog]);

  // Returned functions are stable
  return { openDialog, closeDialog, handleDelete };
}

// Consumer can safely use these in effects
function Component() {
  const { openDialog } = useDeleteRecipe();

  useEffect(() => {
    // Only runs once - openDialog never changes
    const handler = (e) => {
      if (e.key === 'Delete') openDialog();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [openDialog]);
}
```

### When NOT to Use `useCallback`

❌ **Don't use for simple event handlers that aren't passed to memoized children:**

```jsx
// ❌ Unnecessary
const handleClick = useCallback(() => {
  console.log("clicked");
}, []);

return <button onClick={handleClick}>Click</button>;
```

❌ **Don't use everywhere "just in case"** - it adds complexity and overhead:

```jsx
// ❌ Premature optimization
function Component() {
  const log = useCallback(() => console.log("a"), []);
  const log2 = useCallback(() => console.log("b"), []);
  const log3 = useCallback(() => console.log("c"), []);
  // ... lots of unnecessary useCallbacks
}
```

**Rule of Thumb:** Only use `useCallback` when you have:

1. A measurable performance problem
2. Functions passed to memoized child components
3. Functions used as dependencies in hooks
4. Custom hooks returning callbacks

---

## 5. `useCallback` vs. `useMemo`

Both hooks memoize values, but they serve different purposes:

### `useCallback` - Memoizes Functions

```jsx
// Returns the memoized FUNCTION itself
const memoizedFunction = useCallback(() => {
  return expensiveOperation();
}, [dependency]);
```

**What it does:** Saves the function instance so the same function is reused across renders.

### `useMemo` - Memoizes Return Values

```jsx
// Returns the memoized RESULT of calling the function
const memoizedValue = useMemo(() => {
  return expensiveOperation();
}, [dependency]);
```

**What it does:** Saves the result of calling a function, so expensive calculations aren't repeated.

### Key Difference

```jsx
// These are equivalent:
const memoizedCallback = useCallback(fn, deps);
const memoizedCallback = useMemo(() => fn, deps);

// But this is different:
const memoizedValue = useMemo(() => fn(), deps); // Calls fn() and saves result
```

### Analogy

- **`useCallback`**: Like saving the **recipe** (the function)
- **`useMemo`**: Like saving the **finished cake** (the result)

### Example Comparison

```jsx
function Component() {
  const [count, setCount] = useState(0);

  // useCallback: Saves the function
  const increment = useCallback(() => {
    setCount((c) => c + 1);
  }, []);
  // increment is the function itself

  // useMemo: Saves the computed value
  const expensiveValue = useMemo(() => {
    return count * 1000; // Expensive calculation
  }, [count]);
  // expensiveValue is the number (e.g., 5000)
}
```

---

## 6. Key Takeaways & Summary (TL;DR)

✅ **`useCallback` memoizes functions** to preserve referential equality across renders.

✅ **Primary use cases:**

- Passing callbacks to `React.memo` wrapped child components to prevent unnecessary re-renders
- Using functions as dependencies in `useEffect`, `useMemo`, or other hooks
- Returning stable callbacks from custom hooks

✅ **The dependency array is crucial:**

- Include ALL values from component scope that are used inside the function
- React's `setState`, `dispatch`, and refs are stable and don't need to be included
- Use ESLint's `react-hooks/exhaustive-deps` rule to catch missing dependencies

✅ **Don't overuse it:**

- It's an optimization tool, not a default practice
- Only use when you have a performance issue or need stable function references
- Adding `useCallback` everywhere adds complexity without benefit

✅ **`useCallback` vs `useMemo`:**

- `useCallback(fn, deps)` = memoize the function itself
- `useMemo(() => fn(), deps)` = memoize the function's return value

✅ **Common pattern in custom hooks:**

```jsx
function useCustomHook() {
  const stableCallback = useCallback(() => {
    // logic
  }, [dependencies]);

  return { stableCallback }; // Consumers get stable reference
}
```

---

## Real-World Example: Complete Pattern

```jsx
import { useState, useCallback, memo } from 'react';

// Memoized child component
const RecipeCard = memo(({ recipe, onDelete }) => {
  console.log('RecipeCard rendered:', recipe.id);
  return (
    <div>
      <h3>{recipe.name}</h3>
      <button onClick={() => onDelete(recipe.id)}>Delete</button>
    </div>
  );
});

// Custom hook with stable callbacks
function useDeleteRecipe() {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteRecipe = useCallback(async (id: string) => {
    setIsDeleting(true);
    try {
      await fetch(`/api/recipes/${id}`, { method: 'DELETE' });
      // Success handling
    } finally {
      setIsDeleting(false);
    }
  }, []); // Empty deps - only uses stable setState

  return { deleteRecipe, isDeleting };
}

// Parent component
function RecipeList({ recipes }) {
  const [filter, setFilter] = useState('');
  const { deleteRecipe, isDeleting } = useDeleteRecipe();

  // deleteRecipe is stable, so RecipeCard only re-renders
  // when its recipe prop changes, not when filter changes
  return (
    <>
      <input value={filter} onChange={e => setFilter(e.target.value)} />
      {recipes.map(recipe => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          onDelete={deleteRecipe} // Stable reference
        />
      ))}
    </>
  );
}
```

This example shows all the best practices:

- ✅ Custom hook returns stable callback
- ✅ Callback passed to memoized child
- ✅ Child only re-renders when its props actually change
- ✅ Empty dependency array because only uses stable `setState`
