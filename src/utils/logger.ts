const formatTime = (): string => {
  return new Date().toLocaleTimeString("en-US", { hour12: false });
};

export const logger = {
  info: (msg: string, ...args: any[]): void => {
    console.log(`[${formatTime()}] [INFO] ${msg}`, ...args);
  },
  success: (msg: string, ...args: any[]): void => {
    console.log(`[${formatTime()}] [SUCCESS] ${msg}`, ...args);
  },
  warn: (msg: string, ...args: any[]): void => {
    console.warn(`[${formatTime()}] [WARN] ${msg}`, ...args);
  },
  error: (msg: string, ...args: any[]): void => {
    console.error(`[${formatTime()}] [ERROR] ${msg}`, ...args);
  },
};