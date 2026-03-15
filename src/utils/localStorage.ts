export const getStoredJson = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : defaultValue;
  } catch (error) {
    console.error(`localStorage get error for key ${key}:`, error);
    return defaultValue;
  }
};

export const setStoredJson = (key: string, value: unknown): boolean => {
  try {
    const serialized = JSON.stringify(value);
    if (serialized.length > 5 * 1024 * 1024) {
      console.warn(`Data too large for localStorage key ${key}`);
      return false;
    }

    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      console.error("localStorage quota exceeded");
    } else {
      console.error(`localStorage set error for key ${key}:`, error);
    }
    return false;
  }
};

export const getStoredString = (key: string, defaultValue = ""): string => {
  try {
    return localStorage.getItem(key) ?? defaultValue;
  } catch (error) {
    console.error(`localStorage get error for key ${key}:`, error);
    return defaultValue;
  }
};

export const setStoredString = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      console.error("localStorage quota exceeded");
    } else {
      console.error(`localStorage set error for key ${key}:`, error);
    }
    return false;
  }
};
