export const ROUTES = {
  CONNECT: "/connect",
  DASHBOARD: "/",
  HISTORY: "/history",
  PROJECTS: "/projects",
  USAGE: "/usage",
  MCP: "/mcp",
  SETTINGS: "/settings",
  TRAY: "/tray",
} as const;

declare const __APP_VERSION__: string;
export const APP_VERSION = __APP_VERSION__ ?? "0.0.0";
