# AI Recipe Generation Component Design

## Overview

This document outlines the design for AI-powered recipe generation components. The flow consists of three main phases:

1. **Text Input Phase**: User pastes recipe text and initiates AI processing
2. **Edit Phase**: User reviews and edits AI-generated recipe data
3. **Accept Phase**: User saves the recipe with generation tracking

## Component Architecture

### Core Components

#### 1. `AIRecipeForm` (Main Component)
**Location**: `src/components/recipes/form/AIRecipeForm.tsx`

**Purpose**: Main orchestrating component that manages the entire AI recipe generation flow.

**States**:
- `input`: Text input phase with textarea
- `editing`: Form editing phase with generated data
- `generating`: Loading state during AI processing

**Key Features**:
- State management between phases
- Form validation using react-hook-form
- Integration with generation and creation hooks
- Cancel confirmation dialog
- Local storage for draft management

**Props**:
```typescript
interface AIRecipeFormProps {
  // No props needed - self-contained component
}
```

**State Structure**:
```typescript
interface AIRecipeFormState {
  phase: 'input' | 'editing' | 'generating';
  inputText: string;
  generatedData: GeneratedRecipeDto | null;
  generationId: string | null;
}
```

#### 2. `AIRecipeTextInput` (Phase 1 Component)
**Location**: `src/components/recipes/form/AIRecipeTextInput.tsx`

**Purpose**: Handles the initial text input phase where users paste recipe text.

**Features**:
- Large textarea with character counter (max 10,000 chars)
- Validation (min 20 chars)
- Generate button with loading state
- Clear error handling

**Props**:
```typescript
interface AIRecipeTextInputProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate: (text: string) => void;
  isGenerating: boolean;
  error?: string;
}
```

#### 3. `AIEditRecipeForm` (Phase 2 Component)
**Location**: `src/components/recipes/form/AIEditRecipeForm.tsx`

**Purpose**: Editable form displaying AI-generated recipe data, similar to ManualRecipeForm but with AI-specific features.

**Key Differences from ManualRecipeForm**:
- Includes `generationId` in form data
- "Back to Edit Text" button to return to input phase
- Pre-populated with AI-generated data
- Enhanced validation for AI-generated content

**Props**:
```typescript
interface AIEditRecipeFormProps {
  initialData: GeneratedRecipeDto;
  onBackToInput: () => void;
  onSubmit: (data: CreateRecipeCommand) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  suggestions?: string[];
}
```

### Supporting Components

#### 4. `CharacterCounter`
**Location**: `src/components/recipes/form/CharacterCounter.tsx`

**Purpose**: Displays character count with visual feedback for textarea limits.

**Props**:
```typescript
interface CharacterCounterProps {
  current: number;
  max: number;
  className?: string;
}
```

#### 5. `AIRecipeFormContainer`
**Location**: `src/components/recipes/form/AIRecipeFormContainer.tsx`

**Purpose**: Container component that manages form state and integrates with hooks.

**Features**:
- Form state management
- Local storage integration
- Error handling
- Navigation logic

### Custom Hooks

#### 6. `useGenerateRecipe`
**Location**: `src/components/recipes/hooks/useGenerateRecipe.ts`

**Purpose**: Handles AI recipe generation API calls.

**Features**:
- Calls `POST /api/recipes/generate`
- Manages loading states
- Error handling with toast notifications
- Returns structured recipe data with generationId

**API**:
```typescript
function useGenerateRecipe() {
  return {
    mutate: (inputText: string) => Promise<GeneratedRecipeDto>,
    isPending: boolean,
    error: Error | null,
    reset: () => void
  };
}
```

#### 7. `useAcceptAIRecipe`
**Location**: `src/components/recipes/hooks/useAcceptAIRecipe.ts`

**Purpose**: Handles acceptance of AI-generated recipes with generation tracking.

**Key Differences from useCreateRecipe**:
- Includes `generationId` in request payload
- Updates generation record with `is_accepted: true`
- Enhanced success messaging

**API**:
```typescript
function useAcceptAIRecipe() {
  return {
    mutate: (data: CreateRecipeCommand) => Promise<RecipeDetailDto>,
    isPending: boolean,
    error: Error | null
  };
}
```

#### 8. `useAIRecipeFormState`
**Location**: `src/components/recipes/hooks/useAIRecipeFormState.ts`

**Purpose**: Manages complex state transitions between AI generation phases.

**Features**:
- Phase management (input → generating → editing)
- Back navigation handling
- State cleanup on completion/cancellation

### Page Component

#### 9. `NewAIRecipePage`
**Location**: `src/pages/recipes/new-ai.astro`

**Purpose**: Astro page component for AI recipe creation.

**Features**:
- Dashboard layout integration
- SEO metadata
- Client-side hydration for interactive components

## Data Flow

### Phase 1: Text Input
```
User Input → AIRecipeTextInput → useGenerateRecipe → GeneratedRecipeDto → Phase Transition
```

### Phase 2: Edit & Accept
```
GeneratedRecipeDto → AIEditRecipeForm → useAcceptAIRecipe → RecipeDetailDto → Navigation
```

### Error Handling
```
API Error → Toast Notification → Stay in Current Phase
```

### Form State Persistence
- Input text persists during generation failures
- Generated data persists during editing
- State cleared on successful creation or explicit cancellation

## Component Relationships

```
AIRecipeForm
├── AIRecipeTextInput (phase: input)
├── LoadingState (phase: generating)
└── AIEditRecipeForm (phase: editing)
    ├── CreateRecipeBasicInfoSection
    ├── CreateRecipeTagInput
    ├── CreateRecipeIngredientsList
    ├── CreateRecipeStepsList
    └── FormActionButtons (enhanced)
```

## Validation Strategy

### Input Phase Validation
- Text length: 20-10,000 characters
- Required field validation

### Edit Phase Validation
- Inherits from CreateRecipeSchema
- Additional validation for AI-generated content quality
- Position recalculation before submission

## Error Handling Patterns

### API Errors
- Network errors: Toast + retry option
- Validation errors: Field-level validation messages
- Authentication errors: Redirect to login

### User Experience
- Loading states with progress indicators
- Clear error messages in Polish
- Recovery options (back to input, manual creation)


## Migration from Manual Form

### Shared Components
- Reuse existing form sections (CreateRecipeBasicInfoSection, etc.)
- Extend FormActionButtons with AI-specific actions
- Maintain consistent styling and behavior

### New Features
- Phase-based rendering
- Generation tracking
- Enhanced navigation (back to input)

## Implementation Phases

### Phase 1: Core Infrastructure
1. Create useGenerateRecipe hook
2. Create AIRecipeTextInput component
3. Basic AIRecipeForm with input phase

### Phase 2: Edit Integration
1. Create AIEditRecipeForm component
2. Implement phase transitions
3. Add useAcceptAIRecipe hook

### Phase 3: Polish & Error Handling
1. Error handling and recovery
2. Local storage persistence
3. Loading states and UX improvements
