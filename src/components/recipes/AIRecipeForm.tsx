import React from "react";
import { AIRecipeTextInput } from "./form/AIRecipeTextInput";
import { AIEditRecipeForm } from "./form/AIEditRecipeForm";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useAIRecipeFormStore } from "@/store/ai-recipe-form.store";
import { useGenerateRecipe } from "./hooks/useGenerateRecipe";
import { useCreateRecipe } from "./hooks/useCreateRecipe";
import type { CreateRecipeCommand } from "@/types";

/**
 * AIRecipeForm Component
 *
 * Główny komponent zarządzający przepływem tworzenia przepisu z AI.
 * Orchestruje dwie fazy procesu:
 *
 * Faza 1 - 'input':
 * - Wyświetla AIRecipeTextInput
 * - Użytkownik wprowadza tekst (100-1000 znaków)
 * - Po kliknięciu "Generuj przepis" wywołuje API /api/recipes/generate
 * - W przypadku sukcesu przechodzi do fazy 'edit'
 *
 * Faza 2 - 'edit':
 * - Wyświetla AIEditRecipeForm
 * - Użytkownik może edytować wygenerowane dane
 * - Trzy akcje:
 *   1. "Zapisz przepis" → POST /api/recipes → redirect do /recipes/:id
 *   2. "Wróć do edycji tekstu" → powrót do fazy 'input' (zachowuje inputText)
 *   3. "Anuluj" → redirect do /
 *
 * Stan zarządzany przez Zustand store z persistence w localStorage.
 *
 * @example
 * ```tsx
 * // W stronie Astro:
 * <AIRecipeForm client:load />
 * ```
 */
export function AIRecipeForm() {
  const {
    phase,
    inputText,
    generationId,
    generatedData,
    setInputText,
    setGeneratedData,
    goBackToInput,
    reset,
  } = useAIRecipeFormStore();

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = React.useState(false);

  const generateMutation = useGenerateRecipe();
  const createMutation = useCreateRecipe({
    onSuccessBeforeRedirect: () => {
      reset();
    },
  });

  /**
   * Sprawdza czy użytkownik ma wprowadzone dane (input text lub generated data).
   */
  const hasData = React.useMemo(() => {
    return inputText.trim().length > 0 || generatedData !== null;
  }, [inputText, generatedData]);

  /**
   * Handler dla generowania przepisu z AI.
   * Wywołuje POST /api/recipes/generate z inputText.
   */
  const handleGenerate = React.useCallback(
    (text: string) => {
      generateMutation.mutate(
        { inputText: text },
        {
          onSuccess: (data) => {
            setGeneratedData(data, data.generationId);
          },
        }
      );
    },
    [generateMutation, setGeneratedData]
  );

  /**
   * Handler dla zmiany tekstu w fazie 'input'.
   */
  const handleInputChange = React.useCallback(
    (text: string) => {
      setInputText(text);
    },
    [setInputText]
  );

  /**
   * Handler dla powrotu do strony głównej.
   * Pokazuje dialog potwierdzenia jeśli użytkownik ma wprowadzone dane.
   */
  const handleBack = React.useCallback(() => {
    if (hasData) {
      setIsConfirmDialogOpen(true);
    } else {
      reset();
      window.location.href = "/";
    }
  }, [hasData, reset]);

  /**
   * Handler dla anulowania w fazie 'edit'.
   * Pokazuje dialog potwierdzenia jeśli użytkownik ma wprowadzone dane.
   */
  const handleCancel = React.useCallback(() => {
    if (hasData) {
      setIsConfirmDialogOpen(true);
    } else {
      reset();
      window.location.href = "/";
    }
  }, [hasData, reset]);

  /**
   * Handler potwierdzenia anulowania z dialogu.
   * Resetuje store i nawiguje do /.
   */
  const handleConfirmCancel = React.useCallback(() => {
    reset();
    window.location.href = "/";
  }, [reset]);

  /**
   * Handler dla powrotu do edycji tekstu z fazy 'edit'.
   * Pokazuje dialog potwierdzenia, bo powrót oznacza porzucenie wygenerowanych danych.
   */
  const [isBackToTextDialogOpen, setIsBackToTextDialogOpen] = React.useState(false);

  const handleBackToTextEdit = React.useCallback(() => {
    setIsBackToTextDialogOpen(true);
  }, []);

  const handleConfirmBackToText = React.useCallback(() => {
    goBackToInput();
    setIsBackToTextDialogOpen(false);
  }, [goBackToInput]);

  /**
   * Handler dla submit formularza w fazie 'edit'.
   * Wywołuje POST /api/recipes z CreateRecipeCommand.
   * Po sukcesie: resetuje AI form store → redirect do /recipes/:id
   */
  const handleSubmit = React.useCallback(
    (data: CreateRecipeCommand) => {
      createMutation.mutate(data);
      // useCreateRecipe automatycznie:
      // 1. Resetuje AI form store (via onSuccessBeforeRedirect callback)
      // 2. Usuwa manual recipe draft z localStorage
      // 3. Wykonuje redirect do /recipes/:id
    },
    [createMutation]
  );

  /**
   * Renderowanie komponentu w zależności od aktualnej fazy.
   */
  if (phase === 'input') {
    return (
      <>
        <AIRecipeTextInput
          value={inputText}
          onChange={handleInputChange}
          onGenerate={handleGenerate}
          isGenerating={generateMutation.isPending}
          onBack={handleBack}
        />

        {/* Dialog potwierdzenia anulowania */}
        <ConfirmationDialog
          isOpen={isConfirmDialogOpen}
          onOpenChange={setIsConfirmDialogOpen}
          title="Odrzucić wprowadzone dane?"
          description="Masz wprowadzony tekst. Czy na pewno chcesz wyjść bez generowania przepisu?"
          cancelButton={{
            text: "Powrót",
          }}
          actionButton={{
            text: "Odrzuć dane",
            onClick: handleConfirmCancel,
          }}
        />
      </>
    );
  }

  /**
   * Faza 'edit' - renderuje formularz edycji.
   * Sprawdza czy generatedData i generationId są dostępne.
   */
  if (phase === 'edit' && generatedData && generationId) {
    return (
      <>
        <AIEditRecipeForm
          initialData={generatedData}
          generationId={generationId}
          onSubmit={handleSubmit}
          onBackToTextEdit={handleBackToTextEdit}
          onCancel={handleCancel}
          isSubmitting={createMutation.isPending}
        />

        {/* Dialog potwierdzenia anulowania (przycisk "Anuluj") */}
        <ConfirmationDialog
          isOpen={isConfirmDialogOpen}
          onOpenChange={setIsConfirmDialogOpen}
          title="Odrzucić wprowadzone dane?"
          description="Masz wygenerowany przepis. Czy na pewno chcesz wyjść bez zapisywania?"
          cancelButton={{
            text: "Powrót",
          }}
          actionButton={{
            text: "Odrzuć dane",
            onClick: handleConfirmCancel,
          }}
        />

        {/* Dialog potwierdzenia powrotu do edycji tekstu (przycisk "Wróć do edycji tekstu") */}
        <ConfirmationDialog
          isOpen={isBackToTextDialogOpen}
          onOpenChange={setIsBackToTextDialogOpen}
          title="Wrócić do edycji tekstu?"
          description="Powrót do edycji tekstu spowoduje porzucenie wygenerowanego przepisu. Będziesz musiał wygenerować przepis ponownie."
          cancelButton={{
            text: "Anuluj",
          }}
          actionButton={{
            text: "Wróć do tekstu",
            onClick: handleConfirmBackToText,
          }}
        />
      </>
    );
  }

  /**
   * Fallback - nie powinno się zdarzyć.
   * W przypadku niespójnego stanu pokazuje komunikat i przycisk do resetu.
   */
  return (
    <>
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Wystąpił błąd w przepływie tworzenia przepisu. Spróbuj ponownie.
        </p>
        <button
          type="button"
          onClick={handleBack}
          className="text-primary hover:underline"
        >
          Wróć do strony głównej
        </button>
      </div>

      {/* Dialog potwierdzenia anulowania */}
      <ConfirmationDialog
        isOpen={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
        title="Odrzucić wprowadzone dane?"
        description="Masz wprowadzony tekst lub wygenerowane dane. Czy na pewno chcesz wyjść bez zapisywania?"
        cancelButton={{
          text: "Powrót",
        }}
        actionButton={{
          text: "Odrzuć dane",
          onClick: handleConfirmCancel,
        }}
      />
    </>
  );
}
