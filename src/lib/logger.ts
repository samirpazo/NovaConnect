const isDev = typeof __DEV__ === "boolean" ? __DEV__ : process.env.NODE_ENV !== "production";

export const logger = {
  error: (...args: unknown[]) => {
    if (isDev) console.error(...args);
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn(...args);
  },
  log: (...args: unknown[]) => {
    if (isDev) console.log(...args);
  },
};
