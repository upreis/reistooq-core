export const DEBUG = import.meta.env.MODE !== "production" && !!localStorage.getItem("reistoq.debug");
export const dlog = (...args: any[]) => { if (DEBUG) console.debug(...args); };