export const getErrorMessage = (errors: any): string | null => {
  for (const key in errors) {
    const error = errors[key];
    if (error?.message) return error.message;
    if (typeof error === "object") {
      const nested = getErrorMessage(error);
      if (nested) return nested;
    }
  }
  return null;
};