import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AIRecipeFormPhase } from "@/components/recipes/types";
import type { GeneratedRecipeDto } from "@/types";

/**
 * Stan formularza AI Recipe przechowywany w Zustand store.
 * Automatycznie synchronizowany z localStorage przez middleware persist.
 */
interface AIRecipeFormState {
  phase: AIRecipeFormPhase;
  inputText: string;
  generationId: string | null;
  generatedData: GeneratedRecipeDto | null;
}

/**
 * Akcje dostępne w Zustand store dla AI Recipe Form.
 */
interface AIRecipeFormActions {
  setPhase: (phase: AIRecipeFormPhase) => void;
  setInputText: (text: string) => void;
  setGeneratedData: (data: GeneratedRecipeDto, generationId: string) => void;
  goBackToInput: () => void;
  reset: () => void;
}

type AIRecipeFormStore = AIRecipeFormState & AIRecipeFormActions;

/**
 * Zwraca domyślny stan dla AI Recipe Form store.
 */
const getDefaultState = (): AIRecipeFormState => ({
  phase: "input",
  inputText: "",
  generationId: null,
  generatedData: null,
});

/**
 * Zustand store dla AI Recipe Form z persistence w localStorage.
 *
 * Store zarządza stanem między fazami tworzenia przepisu z AI:
 * - Faza 'input': wprowadzanie tekstu przez użytkownika
 * - Faza 'edit': edycja wygenerowanych danych przez AI
 *
 * @example
 * ```tsx
 * const phase = useAIRecipeFormStore((state) => state.phase);
 * const setInputText = useAIRecipeFormStore((state) => state.setInputText);
 * ```
 */
export const useAIRecipeFormStore = create<AIRecipeFormStore>()(
  persist(
    (set) => ({
      // Initial state
      ...getDefaultState(),

      // Actions
      setPhase: (phase) => set({ phase }),

      setInputText: (inputText) => set({ inputText }),

      setGeneratedData: (generatedData, generationId) =>
        set({
          phase: "edit",
          generatedData,
          generationId,
        }),

      goBackToInput: () =>
        set({
          phase: "input",
          generatedData: null,
          generationId: null,
          // inputText pozostaje zachowany
        }),

      reset: () => set(getDefaultState()),
    }),
    {
      name: "forkful-ai-recipe-draft", // klucz w localStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
);
