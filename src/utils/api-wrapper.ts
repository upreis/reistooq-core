export const safeApiCall = async <T>(
  apiCall: () => Promise<T>,
  fallback: T,
  errorMessage: string = 'API call failed'
): Promise<T> => {
  try {
    return await apiCall();
  } catch (error) {
    console.error(errorMessage, error);
    return fallback;
  }
};

export const safeApiCallWithRetry = async <T>(
  apiCall: () => Promise<T>,
  fallback: T,
  retries: number = 2,
  errorMessage: string = 'API call failed'
): Promise<T> => {
  for (let i = 0; i <= retries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      if (i === retries) {
        console.error(`${errorMessage} (após ${retries} tentativas):`, error);
        return fallback;
      }
      console.warn(`${errorMessage} - tentativa ${i + 1}/${retries + 1}:`, error);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  return fallback;
};