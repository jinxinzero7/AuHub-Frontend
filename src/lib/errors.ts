export function getApiErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error && "response" in err) {
    const axiosErr = err as {
      response?: {
        data?: {
          detail?: string;
          title?: string;
          errors?: Record<string, string[]> | { generalErrors?: string[] };
        };
      };
    };
    const data = axiosErr.response?.data;
    const errors = data?.errors;

    if (errors) {
      if ("generalErrors" in errors && Array.isArray(errors.generalErrors)) {
        return errors.generalErrors[0] ?? fallback;
      }
      const flattened = Object.values(errors).flat();
      return flattened[0] ?? fallback;
    }

    return data?.detail ?? data?.title ?? fallback;
  }

  return fallback;
}
