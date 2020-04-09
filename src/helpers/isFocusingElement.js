let isFreeTextEditorFocused = false;

export const setIsFreeTextEditorFocused = focus => (isFreeTextEditorFocused = focus);

export default () => {
  const { activeElement } = document;

  return (
    activeElement instanceof window.HTMLInputElement ||
    activeElement instanceof window.HTMLTextAreaElement ||
    isFreeTextEditorFocused
  );
};
